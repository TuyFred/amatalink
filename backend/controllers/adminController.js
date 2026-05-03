import pool from '../config/database.js';
import { sendRegistrationStatusEmail, sendPriceChangeEmail } from './emailUtils.js';

// Persistent settings table (single row config)
await pool.execute(`
  CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY,
    milkPricePerLiter DECIMAL(10,2) DEFAULT 500.00,
    siteName VARCHAR(255) DEFAULT 'AmataLink',
    defaultCurrency VARCHAR(10) DEFAULT 'RWF',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);
await pool.execute('INSERT IGNORE INTO settings (id) VALUES (1)');

// Auto-migrate: add collector_id to farmers table (ownership link)
const [[{ cnt: collectorIdCol }]] = await pool.query(
  `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'farmers' AND COLUMN_NAME = 'collector_id'`
);
if (collectorIdCol === 0) {
  await pool.execute('ALTER TABLE farmers ADD COLUMN collector_id INT NULL');
  console.log('[Migration] Added farmers.collector_id column');
}

// Ensure existing farmers have a collector_id (backfill via sector match)
const [[{ nullCount }]] = await pool.query('SELECT COUNT(*) as nullCount FROM farmers WHERE collector_id IS NULL');
if (nullCount > 0) {
  await pool.execute(`
    UPDATE farmers f
    JOIN users u_f ON f.user_id = u_f.id
    JOIN users u_c ON u_f.sector <=> u_c.sector AND u_c.role = 'collector'
    JOIN collectors c ON u_c.id = c.user_id
    SET f.collector_id = c.id
    WHERE f.collector_id IS NULL
  `);
  console.log(`[Migration] Backfilled ${nullCount} farmers via sector match`);
}

// Get settings from DB
export const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT milkPricePerLiter, siteName, defaultCurrency FROM settings WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.json({ milkPricePerLiter: 500, siteName: 'AmataLink', defaultCurrency: 'RWF' });
    }
    const row = rows[0];
    res.json({
      milkPricePerLiter: row.milkPricePerLiter ? Number(row.milkPricePerLiter) : 500,
      siteName: row.siteName || 'AmataLink',
      defaultCurrency: row.defaultCurrency || 'RWF'
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update settings in DB
export const updateSettings = async (req, res) => {
  try {
    const { milkPricePerLiter, siteName, defaultCurrency } = req.body;

    // 1. Get current settings to check if price changed
    const [current] = await pool.execute('SELECT milkPricePerLiter FROM settings WHERE id = 1');
    const oldPrice = current.length > 0 ? Number(current[0].milkPricePerLiter) : null;
    const newPrice = milkPricePerLiter ? Number(milkPricePerLiter) : oldPrice;

    // 2. Perform the update
    await pool.execute(
      `INSERT INTO settings (id, milkPricePerLiter, siteName, defaultCurrency) 
       VALUES (1, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         milkPricePerLiter = COALESCE(?, milkPricePerLiter),
         siteName = COALESCE(?, siteName),
         defaultCurrency = COALESCE(?, defaultCurrency)`,
      [
        milkPricePerLiter || null, siteName || null, defaultCurrency || null,
        milkPricePerLiter || null, siteName || null, defaultCurrency || null
      ]
    );

    // 3. Notify farmers if price changed
    if (milkPricePerLiter && oldPrice !== null && Number(milkPricePerLiter) !== oldPrice) {
      try {
        // Get all farmers
        const [farmers] = await pool.execute(
          "SELECT id, email, full_name FROM users WHERE role = 'farmer'"
        );

        for (const farmer of farmers) {
          // Send Email
          await sendPriceChangeEmail(farmer.email, farmer.full_name, oldPrice, milkPricePerLiter);

          // Add to internal notifications
          await pool.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [
              farmer.id,
              'Igiciro cyahindutse / Price Changed',
              `Igiciro cy'amata cyahindutse kiva kuri ${oldPrice} RWF kijya kuri ${milkPricePerLiter} RWF kuri litiro.`,
              'alert'
            ]
          );
        }
        console.log(`✅ Price change notifications sent to ${farmers.length} farmers`);
      } catch (notifyError) {
        console.error('Error sending price change notifications:', notifyError);
      }
    }

    res.json({ message: 'Settings updated successfully and notifications sent if applicable' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all farmers
export const getAllFarmers = async (req, res) => {
  try {
    const [farmers] = await pool.execute(
      `SELECT f.*, u.username, u.email, u.full_name, u.phone, u.village, u.sector, u.created_at,
              cu.full_name as collector_name
       FROM farmers f 
       JOIN users u ON f.user_id = u.id 
       LEFT JOIN collectors c ON f.collector_id = c.id
       LEFT JOIN users cu ON c.user_id = cu.id
       ORDER BY u.created_at DESC`
    );
    res.json(farmers);
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all collectors
export const getAllCollectors = async (req, res) => {
  try {
    const [collectors] = await pool.execute(
      `SELECT c.*, u.username, u.email, u.full_name, u.phone, u.village, u.sector, u.created_at 
       FROM collectors c 
       JOIN users u ON c.user_id = u.id 
       ORDER BY u.created_at DESC`
    );
    res.json(collectors);
  } catch (error) {
    console.error('Get collectors error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get all milk records (for admin)
export const getAllMilkRecords = async (req, res) => {
  try {
    const { date, status } = req.query;

    let query = `
      SELECT mr.*, u.full_name as collector_name, u.phone as collector_phone,
             f.user_id as farmer_user_id, fu.full_name as farmer_name, fu.phone as farmer_phone
      FROM milk_records mr
      JOIN collectors c ON mr.collector_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE 1=1
    `;

    const params = [];

    if (date) {
      query += ' AND mr.collection_date = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY mr.collection_date DESC, mr.collection_time DESC';

    const [records] = await pool.execute(query, params);
    res.json(records);
  } catch (error) {
    console.error('Get all milk records error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get milk records by farmer ID
export const getRecordsByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT mr.*, u.full_name as collector_name, u.phone as collector_phone,
             fu.full_name as farmer_name, fu.phone as farmer_phone
      FROM milk_records mr
      JOIN collectors c ON mr.collector_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE f.user_id = ?
    `;

    const params = [farmerId];

    if (startDate) {
      query += ' AND mr.collection_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND mr.collection_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY mr.collection_date DESC, mr.collection_time DESC';

    const [records] = await pool.execute(query, params);

    // Calculate totals
    const totals = records.reduce((acc, r) => ({
      liters: acc.liters + Number(r.liters || 0),
      amount: acc.amount + Number(r.total_amount || 0)
    }), { liters: 0, amount: 0 });

    res.json({ records, totals });
  } catch (error) {
    console.error('Get records by farmer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm or reject milk record
export const confirmMilkRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { status } = req.body;

    // Get the current record first
    const [rows] = await pool.execute('SELECT * FROM milk_records WHERE id = ?', [recordId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    const record = rows[0];

    // If rejecting a record that was pending, reverse the farmer totals
    if (status === 'rejected' && record.status !== 'rejected') {
      await pool.execute(
        'UPDATE farmers SET total_liters_delivered = GREATEST(0, total_liters_delivered - ?), total_earnings = GREATEST(0, total_earnings - ?) WHERE id = ?',
        [record.liters, record.total_amount, record.farmer_id]
      );
    }

    // If confirming a previously-rejected record, restore farmer totals
    if (status === 'confirmed' && record.status === 'rejected') {
      await pool.execute(
        'UPDATE farmers SET total_liters_delivered = total_liters_delivered + ?, total_earnings = total_earnings + ? WHERE id = ?',
        [record.liters, record.total_amount, record.farmer_id]
      );
    }

    await pool.execute(
      'UPDATE milk_records SET status = ? WHERE id = ?',
      [status, recordId]
    );

    res.json({ message: 'Record status updated successfully' });
  } catch (error) {
    console.error('Confirm milk record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'farmer') as total_farmers,
        (SELECT COUNT(*) FROM users WHERE role = 'collector') as total_collectors,
        (SELECT COALESCE(SUM(liters), 0) FROM milk_records WHERE collection_date = CURDATE()) as today_liters,
        (SELECT COALESCE(SUM(total_amount), 0) FROM milk_records WHERE collection_date = CURDATE()) as today_earnings,
        (SELECT COALESCE(SUM(liters), 0) FROM milk_records) as total_liters_all_time,
        (SELECT COALESCE(SUM(total_amount), 0) FROM milk_records) as total_earnings_all_time,
        (SELECT COUNT(*) FROM notifications WHERE is_read = 0) as notification_count
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get monthly report
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.params;

    const [report] = await pool.execute(`
      SELECT 
        mr.collection_date,
        COUNT(*) as total_deliveries,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      WHERE MONTH(mr.collection_date) = ? AND YEAR(mr.collection_date) = ?
      GROUP BY mr.collection_date
      ORDER BY mr.collection_date DESC
    `, [month, year]);

    const [farmerSummary] = await pool.execute(`
      SELECT 
        fu.full_name as farmer_name,
        fu.email as farmer_email,
        fu.phone as farmer_phone,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE MONTH(mr.collection_date) = ? AND YEAR(mr.collection_date) = ?
      GROUP BY fu.id
      ORDER BY total_amount DESC
    `, [month, year]);

    res.json({
      dailyReport: report,
      farmerSummary: farmerSummary,
      month,
      year
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone, role, village, sector, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Update milk record (admin)
export const updateMilkRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { liters, rate_per_liter, status } = req.body;

    const [rows] = await pool.execute('SELECT * FROM milk_records WHERE id = ?', [recordId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    const old = rows[0];

    const newLiters = typeof liters !== 'undefined' ? Number(liters) : Number(old.liters);
    const newRate = typeof rate_per_liter !== 'undefined' ? Number(rate_per_liter) : Number(old.rate_per_liter);
    const newAmount = newLiters * newRate;

    await pool.execute(
      'UPDATE milk_records SET liters = ?, rate_per_liter = ?, total_amount = ?, status = ? WHERE id = ?',
      [newLiters, newRate, newAmount, status || old.status, recordId]
    );

    const diffLiters = newLiters - Number(old.liters);
    const diffAmount = newAmount - Number(old.total_amount);
    if (diffLiters !== 0 || diffAmount !== 0) {
      const farmerDbId = old.farmer_id;
      await pool.execute(
        'UPDATE farmers SET total_liters_delivered = total_liters_delivered + ?, total_earnings = total_earnings + ? WHERE id = ?',
        [diffLiters, diffAmount, farmerDbId]
      );
    }

    res.json({ message: 'Record updated' });
  } catch (error) {
    console.error('Update milk record error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Delete milk record (admin)
export const deleteMilkRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const [rows] = await pool.execute('SELECT * FROM milk_records WHERE id = ?', [recordId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found' });
    const rec = rows[0];

    await pool.execute('DELETE FROM milk_records WHERE id = ?', [recordId]);

    const farmerDbId = rec.farmer_id;
    await pool.execute(
      'UPDATE farmers SET total_liters_delivered = total_liters_delivered - ?, total_earnings = total_earnings - ? WHERE id = ?',
      [rec.liters, rec.total_amount, farmerDbId]
    );

    res.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Delete milk record error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Create new user (admin can create admin or collector)
export const createUser = async (req, res) => {
  try {
    const { email, password, fullName, phone, role, village, sector, collector_id } = req.body;
    let { username } = req.body;

    if (!role || !['admin', 'collector', 'farmer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, collector, or farmer' });
    }

    // Role-based authorization: Collectors can ONLY create farmers
    if (req.user.role === 'collector' && role !== 'farmer') {
      return res.status(403).json({ message: 'Collectors can only create farmer accounts' });
    }

    if (!username) username = email;

    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
      [username, email, phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name, phone, role, village, sector, email_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, "approved")',
      [username, email, hashedPassword, fullName, phone, role, village || null, sector || null]
    );

    const userId = result.insertId;

    if (role === 'collector') {
      await pool.execute('INSERT INTO collectors (user_id) VALUES (?)', [userId]);
    } else if (role === 'farmer') {
      // If creator is a collector, link the farmer to them.
      // If creator is admin, use provided collector_id if any.
      let collectorDbId = collector_id || null;
      if (req.user && req.user.role === 'collector') {
        const [collectorRows] = await pool.execute(
          'SELECT id FROM collectors WHERE user_id = ?', [req.user.id]
        );
        if (collectorRows.length > 0) collectorDbId = collectorRows[0].id;

        // Create notification for the collector
        await pool.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [
            req.user.id,
            'Farmer Added',
            `New farmer ${fullName} has been added and assigned to you.`,
            'system'
          ]
        );
      }
      await pool.execute(
        'INSERT INTO farmers (user_id, collector_id) VALUES (?, ?)',
        [userId, collectorDbId]
      );
    }

    // Send notification email
    const creatorRole = req.user.role === 'admin' ? 'Admin' : 'Collector';
    try {
      await sendRegistrationStatusEmail(email, fullName, 'approved', creatorRole, req.user.full_name);
    } catch (emailError) {
      console.error('Failed to send approval email during user creation:', emailError);
      // We don't fail the whole request if only the email fails, but we log it
    }

    res.status(201).json({ message: 'User created successfully and notification email sent', userId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, full_name, email, phone, role, village, sector, collector_id } = req.body;
    const nameToUpdate = fullName || full_name;

    // Fetch current user data to avoid overwriting fields with null
    const [currentUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (currentUser.length === 0) return res.status(404).json({ message: 'User not found' });
    const existing = currentUser[0];

    // Check if the requesting user is a collector
    if (req.user.role === 'collector') {
      if (existing.role !== 'farmer') {
        return res.status(403).json({ message: 'Collectors can only update farmer accounts' });
      }
    }

    await pool.execute(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, village = ?, sector = ? WHERE id = ?',
      [
        nameToUpdate || existing.full_name,
        email || existing.email,
        phone || existing.phone,
        village !== undefined ? village : existing.village,
        sector !== undefined ? sector : existing.sector,
        id
      ]
    );

    // If admin is updating a farmer, allow changing their collector
    if (req.user.role === 'admin' && typeof collector_id !== 'undefined') {
      await pool.execute('UPDATE farmers SET collector_id = ? WHERE user_id = ?', [collector_id, id]);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check user exists
    const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    // Role-based authorization
    if (req.user.role === 'collector') {
      if (users[0].role !== 'farmer') {
        return res.status(403).json({ message: 'Collectors can only delete farmer accounts' });
      }
    } else if (req.user.role === 'admin') {
      if (users[0].role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    // Delete associated records
    if (users[0].role === 'farmer') {
      const [farmerRows] = await pool.execute('SELECT id FROM farmers WHERE user_id = ?', [id]);
      if (farmerRows.length > 0) {
        await pool.execute('DELETE FROM milk_records WHERE farmer_id = ?', [farmerRows[0].id]);
        await pool.execute('DELETE FROM farmers WHERE user_id = ?', [id]);
      }
    } else if (users[0].role === 'collector') {
      const [collectorRows] = await pool.execute('SELECT id FROM collectors WHERE user_id = ?', [id]);
      if (collectorRows.length > 0) {
        await pool.execute('DELETE FROM milk_records WHERE collector_id = ?', [collectorRows[0].id]);
        await pool.execute('DELETE FROM collectors WHERE user_id = ?', [id]);
      }
    }

    // Delete notifications
    await pool.execute('DELETE FROM notifications WHERE user_id = ?', [id]);

    // Delete user
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly report
export const getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;

    const [report] = await pool.execute(`
      SELECT 
        mr.collection_date,
        COUNT(*) as total_deliveries,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      WHERE mr.collection_date BETWEEN ? AND ?
      GROUP BY mr.collection_date
      ORDER BY mr.collection_date DESC
    `, [startDate, endDate]);

    const [farmerSummary] = await pool.execute(`
      SELECT 
        fu.full_name as farmer_name,
        fu.email as farmer_email,
        fu.phone as farmer_phone,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE mr.collection_date BETWEEN ? AND ?
      GROUP BY fu.id
      ORDER BY total_amount DESC
    `, [startDate, endDate]);

    res.json({
      dailyReport: report,
      farmerSummary: farmerSummary,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get yearly report
export const getYearlyReport = async (req, res) => {
  try {
    const { year } = req.params;

    const [monthlyReport] = await pool.execute(`
      SELECT 
        MONTH(mr.collection_date) as month,
        COUNT(*) as total_deliveries,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      WHERE YEAR(mr.collection_date) = ?
      GROUP BY MONTH(mr.collection_date)
      ORDER BY month DESC
    `, [year]);

    const [farmerSummary] = await pool.execute(`
      SELECT 
        fu.full_name as farmer_name,
        fu.email as farmer_email,
        fu.phone as farmer_phone,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE YEAR(mr.collection_date) = ?
      GROUP BY fu.id
      ORDER BY total_amount DESC
    `, [year]);

    res.json({
      monthlyReport,
      farmerSummary: farmerSummary,
      year
    });
  } catch (error) {
    console.error('Get yearly report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get custom date range report
export const getCustomDateRangeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const [report] = await pool.execute(`
      SELECT 
        mr.collection_date,
        COUNT(*) as total_deliveries,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      WHERE mr.collection_date BETWEEN ? AND ?
      GROUP BY mr.collection_date
      ORDER BY mr.collection_date DESC
    `, [startDate, endDate]);

    const [farmerSummary] = await pool.execute(`
      SELECT 
        fu.full_name as farmer_name,
        fu.email as farmer_email,
        fu.phone as farmer_phone,
        SUM(mr.liters) as total_liters,
        SUM(mr.total_amount) as total_amount
      FROM milk_records mr
      JOIN farmers f ON mr.farmer_id = f.id
      JOIN users fu ON f.user_id = fu.id
      WHERE mr.collection_date BETWEEN ? AND ?
      GROUP BY fu.id
      ORDER BY total_amount DESC
    `, [startDate, endDate]);

    res.json({
      dailyReport: report,
      farmerSummary: farmerSummary,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Get custom date range report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get paginated milk records
export const getPaginatedMilkRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'collection_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') {
      whereClause += ' AND mr.status = ?';
      params.push(status);
    }

    if (startDate) {
      whereClause += ' AND mr.collection_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND mr.collection_date <= ?';
      params.push(endDate);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM milk_records mr WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated data
    const allowedSortFields = ['collection_date', 'liters', 'total_amount', 'status', 'farmer_name', 'collector_name'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'collection_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let orderClause = `ORDER BY mr.${safeSortBy} ${safeSortOrder}`;
    if (sortBy === 'farmer_name') {
      orderClause = `ORDER BY fu.full_name ${safeSortOrder}`;
    } else if (sortBy === 'collector_name') {
      orderClause = `ORDER BY u.full_name ${safeSortOrder}`;
    }

    const [records] = await pool.execute(
      `SELECT mr.*, u.full_name as collector_name, u.phone as collector_phone,
              f.user_id as farmer_user_id, fu.full_name as farmer_name, fu.phone as farmer_phone
       FROM milk_records mr
       JOIN collectors c ON mr.collector_id = c.id
       JOIN users u ON c.user_id = u.id
       JOIN farmers f ON mr.farmer_id = f.id
       JOIN users fu ON f.user_id = fu.id
       WHERE ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json({
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get paginated milk records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove duplicate records (keep the one with highest liters)
export const removeDuplicates = async (req, res) => {
  try {
    // Find duplicates based on farmer_id, collector_id, and collection_date
    const [duplicates] = await pool.execute(`
      SELECT farmer_id, collector_id, collection_date, COUNT(*) as cnt, MAX(id) as keep_id
      FROM milk_records
      GROUP BY farmer_id, collector_id, collection_date
      HAVING cnt > 1
    `);

    let removedCount = 0;
    for (const dup of duplicates) {
      // Delete all records except the one with highest liters (or highest ID)
      const [toDelete] = await pool.execute(
        `SELECT id FROM milk_records 
         WHERE farmer_id = ? AND collector_id = ? AND collection_date = ? 
         AND id != (SELECT id FROM milk_records WHERE farmer_id = ? AND collector_id = ? AND collection_date = ? ORDER BY liters DESC, id DESC LIMIT 1)`,
        [dup.farmer_id, dup.collector_id, dup.collection_date, dup.farmer_id, dup.collector_id, dup.collection_date]
      );

      for (const rec of toDelete) {
        await pool.execute('DELETE FROM milk_records WHERE id = ?', [rec.id]);
        removedCount++;
      }
    }

    res.json({
      message: 'Duplicates removed successfully',
      removedCount
    });
  } catch (error) {
    console.error('Remove duplicates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export data
export const exportData = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    let whereClause = '1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND mr.collection_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND mr.collection_date <= ?';
      params.push(endDate);
    }

    const [records] = await pool.execute(
      `SELECT mr.*, u.full_name as collector_name, u.phone as collector_phone,
              fu.full_name as farmer_name, fu.phone as farmer_phone
       FROM milk_records mr
       JOIN collectors c ON mr.collector_id = c.id
       JOIN users u ON c.user_id = u.id
       JOIN farmers f ON mr.farmer_id = f.id
       JOIN users fu ON f.user_id = fu.id
       WHERE ${whereClause}
       ORDER BY mr.collection_date DESC`,
      params
    );

    if (format === 'csv') {
      const headers = ['ID', 'Date', 'Farmer', 'Collector', 'Liters', 'Rate', 'Total Amount', 'Status'];
      const csvRows = [headers.join(',')];

      for (const r of records) {
        const row = [
          r.id,
          r.collection_date,
          `"${r.farmer_name}"`,
          `"${r.collector_name}"`,
          r.liters,
          r.rate_per_liter,
          r.total_amount,
          r.status
        ];
        csvRows.push(row.join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=milk_records.csv');
      return res.send(csvRows.join('\n'));
    }

    res.json(records);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Endpoint to fetch all users and send emails based on their roles
export const fetchUsersAndSendEmails = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone, role, village, sector, created_at FROM users ORDER BY created_at DESC'
    );

    // Send emails to all users based on their roles
    await sendEmailsToAllUsers(users);

    res.json({ message: 'Emails sent successfully to all users based on their roles.' });
  } catch (error) {
    console.error('Error fetching users or sending emails:', error);
    res.status(500).json({ message: 'Failed to fetch users or send emails.' });
  }
};

// Get pending users based on role
export const getPendingUsers = async (req, res) => {
  try {
    const { role } = req.query; // 'farmer' or 'collector'
    
    let query = 'SELECT id, username, email, full_name, phone, role, village, sector, created_at FROM users WHERE status = "pending"';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve a pending user
export const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Get user details
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'User is not in pending status' });
    }

    // Authorization checks
    if (req.user.role === 'collector' && user.role !== 'farmer') {
      return res.status(403).json({ message: 'Collectors can only approve farmers' });
    }

    // 2. Create role-specific record if not exists
    if (user.role === 'farmer') {
      // Check if already in farmers table
      const [existing] = await pool.execute('SELECT id FROM farmers WHERE user_id = ?', [id]);
      if (existing.length === 0) {
        // Find collector ID if approver is a collector
        let collectorId = null;
        if (req.user.role === 'collector') {
          const [collectors] = await pool.execute('SELECT id FROM collectors WHERE user_id = ?', [req.user.id]);
          if (collectors.length > 0) collectorId = collectors[0].id;
        }
        await pool.execute('INSERT INTO farmers (user_id, collector_id) VALUES (?, ?)', [id, collectorId]);
      }
    } else if (user.role === 'collector') {
      const [existing] = await pool.execute('SELECT id FROM collectors WHERE user_id = ?', [id]);
      if (existing.length === 0) {
        await pool.execute('INSERT INTO collectors (user_id) VALUES (?)', [id]);
      }
    }

    // 3. Update status to approved
    await pool.execute('UPDATE users SET status = "approved" WHERE id = ?', [id]);

    // 4. Send notification email
    const approverRole = req.user.role === 'admin' ? 'Admin' : 'Collector';
    await sendRegistrationStatusEmail(user.email, user.full_name, 'approved', approverRole, req.user.full_name);

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject a pending user
export const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute('SELECT email, full_name, role, status FROM users WHERE id = ?', [id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    if (req.user.role === 'collector' && user.role !== 'farmer') {
      return res.status(403).json({ message: 'Collectors can only reject farmers' });
    }

    await pool.execute('UPDATE users SET status = "rejected" WHERE id = ?', [id]);
    
    // Send notification email
    const approverRole = req.user.role === 'admin' ? 'Admin' : 'Collector';
    await sendRegistrationStatusEmail(user.email, user.full_name, 'rejected', approverRole, req.user.full_name);

    res.json({ message: 'User registration rejected' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  getSettings,
  updateSettings,
  getAllFarmers,
  getAllCollectors,
  getAllMilkRecords,
  confirmMilkRecord,
  getDashboardStats,
  getMonthlyReport,
  getWeeklyReport,
  getYearlyReport,
  getCustomDateRangeReport,
  getPaginatedMilkRecords,
  removeDuplicates,
  exportData,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchUsersAndSendEmails,
  getPendingUsers,
  approveUser,
  rejectUser
};
