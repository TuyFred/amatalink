import pool from '../config/database.js';
import { sendPayoutStatusEmail } from './emailUtils.js';

// Public: list available payment methods
export const listPaymentMethods = async (req, res) => {
  try {
    const [methods] = await pool.execute('SELECT id, name, provider, code, active FROM payment_methods WHERE active = 1 ORDER BY id');
    res.json(methods);
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Admin: create a payment method
export const createPaymentMethod = async (req, res) => {
  try {
    const { name, provider, code } = req.body; // code can be identifier like MTN, AIRTEL
    const [result] = await pool.execute(
      'INSERT INTO payment_methods (name, provider, code, active) VALUES (?, ?, ?, 1)',
      [name, provider, code]
    );
    res.status(201).json({ id: result.insertId, name, provider, code, active: 1 });
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Admin: update method
export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, provider, code, active } = req.body;
    await pool.execute('UPDATE payment_methods SET name = ?, provider = ?, code = ?, active = ? WHERE id = ?', [name, provider, code, active ? 1 : 0, id]);
    res.json({ id, name, provider, code, active });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Admin: delete method (soft delete)
export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE payment_methods SET active = 0 WHERE id = ?', [id]);
    res.json({ id });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// User: set their payment method and account
export const setUserPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method_id, account_number } = req.body; // account_number is phone number or bank account
    await pool.execute('UPDATE users SET payment_method_id = ?, payment_account = ? WHERE id = ?', [payment_method_id || null, account_number || null, userId]);
    res.json({ message: 'Payment method updated' });
  } catch (error) {
    console.error('Set user payment error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Farmer: get current month summary
export const getFarmerMonthlySummary = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const userId = req.user.id;
    // Get farmer db id
    const [farmers] = await pool.execute('SELECT id FROM farmers WHERE user_id = ?', [userId]);
    if (farmers.length === 0) return res.status(404).json({ message: 'Farmer not found' });
    const farmerDbId = farmers[0].id;

    const [summary] = await pool.execute(
      `SELECT 
        COALESCE(SUM(liters), 0) as total_liters,
        COALESCE(SUM(total_amount), 0) as total_amount
       FROM milk_records 
       WHERE farmer_id = ? 
       AND MONTH(collection_date) = MONTH(CURRENT_DATE())
       AND YEAR(collection_date) = YEAR(CURRENT_DATE())`,
      [farmerDbId]
    );

    // Also get last pending request if any
    const [pending] = await pool.execute(
      'SELECT status, amount, request_date FROM payout_requests WHERE farmer_id = ? AND status = "pending" LIMIT 1',
      [farmerDbId]
    );

    res.json({
      ...summary[0],
      pendingRequest: pending[0] || null
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Farmer: Request payout
export const initiatePayoutRequest = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const userId = req.user.id;
    const { amount, payment_method_id, account_number } = req.body;

    const [farmers] = await pool.execute('SELECT id FROM farmers WHERE user_id = ?', [userId]);
    if (farmers.length === 0) return res.status(404).json({ message: 'Farmer not found' });
    const farmerDbId = farmers[0].id;

    // Check if there is already a pending request
    const [existing] = await pool.execute(
      'SELECT id FROM payout_requests WHERE farmer_id = ? AND status = "pending"',
      [farmerDbId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Mufite gahunda yo kwishyurwa itararangira. Myuneka muregere umukusanyi.' });
    }

    await pool.execute(
      'INSERT INTO payout_requests (farmer_id, amount, payment_method_id, account_number, status) VALUES (?, ?, ?, ?, ?)',
      [farmerDbId, amount, payment_method_id, account_number, 'pending']
    );

    res.status(201).json({ message: 'Gusaba kwishyurwa byoherejwe neza / Payout request sent successfully' });
  } catch (error) {
    console.error('Initiate payout error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Admin/Collector: List payout requests
export const listPayoutRequests = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const { role, id: userId } = req.user;
    let query = `
      SELECT pr.*, u.full_name as farmer_name, u.phone as farmer_phone, pm.name as method_name
      FROM payout_requests pr
      JOIN farmers f ON pr.farmer_id = f.id
      JOIN users u ON f.user_id = u.id
      LEFT JOIN payment_methods pm ON pr.payment_method_id = pm.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'collector') {
      // Find collector database id
      const [collectors] = await pool.execute('SELECT id FROM collectors WHERE user_id = ?', [userId]);
      if (collectors.length > 0) {
        query += ' AND f.collector_id = ?';
        params.push(collectors[0].id);
      } else {
        return res.status(403).json({ message: 'Collector record not found' });
      }
    }

    const { status } = req.query;
    if (status) {
      query += ' AND pr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY pr.request_date DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('List payout requests error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Admin/Collector: Update payout status (approve/process)
export const updatePayoutStatus = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  try {
    const { id } = req.params;
    const { status } = req.body; // 'processed', 'failed', 'cancelled'

    // 1. Fetch farmer details for the payout request
    const [requestDetails] = await pool.execute(`
      SELECT pr.amount, u.email, u.full_name
      FROM payout_requests pr
      JOIN farmers f ON pr.farmer_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE pr.id = ?
    `, [id]);

    if (requestDetails.length === 0) {
      return res.status(404).json({ message: 'Payout request not found' });
    }

    const { amount, email, full_name } = requestDetails[0];

    // 2. Update status
    await pool.execute(
      'UPDATE payout_requests SET status = ?, processed_date = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // 3. Send notification email if processed
    if (status === 'processed') {
      try {
        await sendPayoutStatusEmail(email, full_name, amount, status);
      } catch (emailError) {
        console.error('Failed to send payout notification email:', emailError);
      }
    }

    res.json({ message: `Payout request ${status} successfully` });
  } catch (error) {
    console.error('Update payout status error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

export default { listPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, setUserPayment, getFarmerMonthlySummary, initiatePayoutRequest, listPayoutRequests, updatePayoutStatus };
