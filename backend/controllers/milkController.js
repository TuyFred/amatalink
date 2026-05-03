import pool from '../config/database.js';
import { sendDailyMilkSummary, sendAdminMilkAlert, sendSMS, sendProductionFeedbackSMS } from './notificationController.js';
import { sendMilkProductionFeedbackEmail } from './emailUtils.js';

// Add milk record (Village Collector records milk from farmer)
// If a record already exists for the same farmer + collector on the same date,
// the liters are ADDED to the existing record (no duplicates).
export const addMilkRecord = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const { farmerId, liters, ratePerLiter = 500 } = req.body;
    const collectorId = req.user.id;

    if (!farmerId || !liters || Number(liters) <= 0) {
      return res.status(400).json({ message: 'Invalid farmer or liters' });
    }

    // Get current milk price from settings
    const [settingsRows] = await pool.execute('SELECT milkPricePerLiter FROM settings WHERE id = 1');
    const systemPrice = settingsRows[0]?.milkPricePerLiter ? Number(settingsRows[0].milkPricePerLiter) : 500;
    
    // Use system price unless one is explicitly provided (admin override)
    const effectiveRate = ratePerLiter && ratePerLiter !== 500 ? ratePerLiter : systemPrice;

    // Get collector's DB id
    const [collectors] = await pool.execute(
      'SELECT id FROM collectors WHERE user_id = ?',
      [collectorId]
    );

    if (collectors.length === 0) {
      return res.status(403).json({ message: 'Collector not found' });
    }

    const collectorDbId = collectors[0].id;

    // Resolve farmer's DB id from supplied farmer USER id
    const [farmerRows] = await pool.execute('SELECT id, user_id FROM farmers WHERE user_id = ?', [farmerId]);
    if (farmerRows.length === 0) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const farmerDbId = farmerRows[0].id;
    const addedLiters = Number(liters);
    const addedAmount = addedLiters * Number(effectiveRate);

    // Check if a record already exists for same farmer + collector + today
    const [existing] = await pool.execute(
      'SELECT id, liters, total_amount FROM milk_records WHERE collector_id = ? AND farmer_id = ? AND collection_date = CURDATE()',
      [collectorDbId, farmerDbId]
    );

    let recordId;

    if (existing.length > 0) {
      // Record exists for today — aggregate by adding liters
      const existingRecord = existing[0];
      const newLiters = Number(existingRecord.liters) + addedLiters;
      const newAmount = Number(existingRecord.total_amount) + addedAmount;

      await pool.execute(
        'UPDATE milk_records SET liters = ?, total_amount = ?, rate_per_liter = ? WHERE id = ?',
        [newLiters, newAmount, effectiveRate, existingRecord.id]
      );
      recordId = existingRecord.id;
    } else {
      // No record for today — create new (auto-confirmed)
      const [result] = await pool.execute(
        'INSERT INTO milk_records (collector_id, farmer_id, liters, rate_per_liter, total_amount, collection_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
        [collectorDbId, farmerDbId, addedLiters, effectiveRate, addedAmount, 'confirmed']
      );
      recordId = result.insertId;
    }

    // Update farmer's running totals
    await pool.execute(
      'UPDATE farmers SET total_liters_delivered = total_liters_delivered + ?, total_earnings = total_earnings + ? WHERE id = ?',
      [addedLiters, addedAmount, farmerDbId]
    );

    // Create notification for farmer
    const [farmerUser] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [farmerId]);
    if (farmerUser.length > 0) {
      const farmerName = farmerUser[0].full_name;
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          farmerId,
          'Milk Collected',
          `${addedLiters}L recorded. Amount: ${addedAmount} RWF`,
          'daily'
        ]
      );

      // --- PRODUCTION FEEDBACK LOGIC ---
      let feedbackLevel = 'high';
      let feedbackSubjectKinya = 'Umusaruro ushimishije';
      let feedbackMessageKinya = `Umusaruro wanyu (${addedLiters}L) uri mu rwego rwo hejuru. Kobomeza kwita ku matungo neza.`;
      let feedbackMessageEng = `Your production (${addedLiters}L) is high and stable. Maintain good livestock care.`;

      if (addedLiters < 10) {
        feedbackLevel = 'urgent';
        feedbackSubjectKinya = 'Ubutumwa bwihutirwa';
        feedbackMessageKinya = `Umusaruro wanyu (${addedLiters}L) wagabanutse cyane. Shaka umuvuzi w'amatungo (Vet) vuba.`;
        feedbackMessageEng = `Production (${addedLiters}L) is extremely low. Seek professional veterinary assistance immediately.`;
      } else if (addedLiters < 30) {
        feedbackLevel = 'concern';
        feedbackSubjectKinya = 'Inama ku musaruro uri hasi';
        feedbackMessageKinya = `Umusaruro (${addedLiters}L) uri hasi ugereranyije n'ibisanzwe. Reba niba imirire ari myiza.`;
        feedbackMessageEng = `Production (${addedLiters}L) is below normal. Check for poor nutrition or other issues.`;
      } else if (addedLiters < 50) {
        feedbackLevel = 'warning';
        feedbackSubjectKinya = 'Isubira inyuma ry\'umusaruro';
        feedbackMessageKinya = `Umusaruro (${addedLiters}L) wagabanutseho gato. Genzura imirire n'ubuzima bw'amatungo.`;
        feedbackMessageEng = `Slight decrease in production (${addedLiters}L). Monitor feed quality and health.`;
      }

      // Add feedback notification for farmer
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          farmerId,
          feedbackSubjectKinya,
          `${feedbackMessageKinya} / ${feedbackMessageEng}`,
          feedbackLevel
        ]
      );

      // ALSO create standard collection notification for the collector
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [
          req.user.id,
          'Record Added',
          `You recorded ${addedLiters}L for ${farmerName}.`,
          'system'
        ]
      );
    }

    // Send confirmation email + SMS to the farmer
    const [farmerData] = await pool.execute('SELECT email, full_name, phone FROM users WHERE id = ?', [farmerId]);
    if (farmerData.length > 0) {
        const now = new Date();
        const displayDate = now.toLocaleDateString('en-RW');
        const displayTime = now.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });

        // Send email and SMS in parallel — neither blocks the response
        await Promise.allSettled([
            sendDailyMilkSummary(
                farmerData[0].email,
                farmerData[0].full_name,
                addedLiters,
                addedAmount,
                displayDate,
                displayTime
            ),
            sendSMS(
                farmerData[0].phone,
                farmerData[0].full_name,
                addedLiters,
                addedAmount,
                displayDate,
                displayTime
            ),
            sendMilkProductionFeedbackEmail(
                farmerData[0].email,
                farmerData[0].full_name,
                addedLiters,
                // We need to re-calculate level or use a variable
                addedLiters < 10 ? 'urgent' : addedLiters < 30 ? 'concern' : addedLiters < 50 ? 'warning' : 'high'
            ),
            sendProductionFeedbackSMS(
                farmerData[0].phone,
                farmerData[0].full_name,
                addedLiters,
                addedLiters < 10 ? 'urgent' : addedLiters < 30 ? 'concern' : addedLiters < 50 ? 'warning' : 'high'
            )
        ]);
    }

    // Send alert email to all admins
    const [adminUsers] = await pool.execute(
        'SELECT email, full_name FROM users WHERE role = ?', ['admin']
    );
    if (adminUsers.length > 0) {
        const now = new Date();
        const displayDate = now.toLocaleDateString('en-RW');
        const displayTime = now.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });
        const farmerName = farmerData?.[0]?.full_name || 'Unknown Farmer';

        for (const admin of adminUsers) {
            await sendAdminMilkAlert(
                admin.email,
                admin.full_name,
                farmerName,
                addedLiters,
                addedAmount,
                displayDate,
                displayTime
            );
        }
    }

    res.status(201).json({
      message: 'Milk record saved successfully',
      recordId,
      aggregated: existing.length > 0
    });
  } catch (error) {
    console.error('Add milk record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get milk records for collector
export const getCollectorRecords = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const collectorId = req.user.id;

    const [collectors] = await pool.execute(
      'SELECT id FROM collectors WHERE user_id = ?',
      [collectorId]
    );

    if (collectors.length === 0) {
      return res.status(403).json({ message: 'Umukusanyi ntaraboneka' });
    }

    const collectorDbId = collectors[0].id;

    const [records] = await pool.execute(
      `SELECT mr.*, u.full_name as farmer_name, u.phone as farmer_phone 
       FROM milk_records mr 
       JOIN farmers f ON mr.farmer_id = f.id 
       JOIN users u ON f.user_id = u.id 
       WHERE mr.collector_id = ? 
       ORDER BY mr.collection_date DESC, mr.collection_time DESC`,
      [collectorDbId]
    );

    res.json(records);
  } catch (error) {
    console.error('Get collector records error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get farmer's milk records
export const getFarmerRecords = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const farmerId = req.user.id;

    const [farmers] = await pool.execute(
      'SELECT id FROM farmers WHERE user_id = ?',
      [farmerId]
    );

    if (farmers.length === 0) {
      return res.status(403).json({ message: 'Umuhinzi ntaraboneka' }); // Farmer not found
    }

    const farmerDbId = farmers[0].id;

    const [records] = await pool.execute(
      `SELECT mr.*, u.full_name as collector_name 
       FROM milk_records mr 
       JOIN collectors c ON mr.collector_id = c.id 
       JOIN users u ON c.user_id = u.id 
       WHERE mr.farmer_id = ? 
       ORDER BY mr.collection_date DESC, mr.collection_time DESC`,
      [farmerDbId]
    );

    res.json(records);
  } catch (error) {
    console.error('Get farmer records error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get today's summary for collector
export const getCollectorTodaySummary = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const collectorId = req.user.id;

    const [collectors] = await pool.execute(
      'SELECT id FROM collectors WHERE user_id = ?',
      [collectorId]
    );

    if (collectors.length === 0) {
      return res.status(403).json({ message: 'Umukusanyi ntaraboneka' });
    }

    const collectorDbId = collectors[0].id;

    const [summary] = await pool.execute(
      `SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(liters), 0) as total_liters,
        COALESCE(SUM(total_amount), 0) as total_amount
       FROM milk_records 
       WHERE collector_id = ? AND collection_date = CURDATE()`,
      [collectorDbId]
    );

    res.json(summary[0]);
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get farmers list for collectors (limited info)
export const getFarmersForCollector = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const collectorId = req.user.id;
    const [collectorRows] = await pool.execute(
      'SELECT id FROM collectors WHERE user_id = ?',
      [collectorId]
    );
    
    if (collectorRows.length === 0) {
      return res.status(403).json({ message: 'Collector not found' });
    }
    
    const collectorDbId = collectorRows[0].id;
    
    // Filter farmers by collector_id (ownership)
    const [farmers] = await pool.execute(
      `SELECT f.id as farmer_id, u.id as user_id, u.full_name, u.phone, u.village, u.sector, 
              f.total_liters_delivered, f.total_earnings, u.created_at
       FROM farmers f
       JOIN users u ON f.user_id = u.id
       WHERE f.collector_id = ?
       ORDER BY u.created_at DESC`,
      [collectorDbId]
    );
    
    res.json(farmers);
  } catch (error) {
    console.error('Get assigned farmers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { addMilkRecord, getCollectorRecords, getFarmerRecords, getCollectorTodaySummary };
