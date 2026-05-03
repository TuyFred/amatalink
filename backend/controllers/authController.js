import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { sendVerificationEmail, sendResetPasswordEmail, sendRegistrationPendingEmail } from './emailUtils.js';
import { asInt, rowText, storedPasswordHash, loginUserPayload, meUserPayload } from '../utils/dbRow.js';

const JWT_SECRET = (process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim()) || 'amatalink_secret_key_2024';

// Register new user (user selects role, admin/collector approves later)
export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, village, sector, role } = req.body;
    let { username } = req.body;

    // If username is not provided, use email
    if (!username) username = email;

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
      [username, email, phone]
    );

    if (existingUser.length > 0) {
      const [userByUsername] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
      if (userByUsername.length > 0) return res.status(400).json({ message: 'Izina ukoresha rimaze gukoreshwa' });

      const [userByEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (userByEmail.length > 0) return res.status(400).json({ message: 'Imeri imaze gukoreshwa' });

      const [userByPhone] = await pool.execute('SELECT id FROM users WHERE phone = ?', [phone]);
      if (userByPhone.length > 0) return res.status(400).json({ message: 'Telefoni imaze gukoreshwa' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user with status=pending and the selected role
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, full_name, phone, role, village, sector, status, email_verified, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [username, email, hashedPassword, fullName, phone, role, village || null, sector || null, 'pending', code]
    );

    const userId = asInt(result.insertId);

    // Send registration pending email
    await sendRegistrationPendingEmail(email, fullName);

    const response = {
      message: 'Your registration request has been submitted. Please wait for admin approval.',
      userId,
      ...(process.env.NODE_ENV !== 'production' ? { verificationCode: code } : {}),
    };
    console.log('New pending user:', email);
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: error.message || String(error) });
    }
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Login user (check verification for first login)
export const login = async (req, res) => {
  try {
    const { username, email, password, verificationCode } = req.body;
    const identifier = username || email;

    if (!identifier) {
      return res.status(400).json({ message: 'Izina ukoresha cg imeri bikenewe' });
    }
    if (password == null || password === '') {
      return res.status(400).json({ message: 'Ijambo ry\'ibanga rirakenewe' });
    }

    const [users] = await pool.execute(
      `SELECT id, username, email, password, full_name, phone, role, village, sector, status
       FROM users WHERE username = ? OR email = ?`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Izina ukoresha cg password ntabwo bihuye' });
    }

    const user = users[0];

    const hash = storedPasswordHash(user.password);
    if (!hash || !hash.startsWith('$2')) {
      console.error('Login: user id %s has missing or non-bcrypt password hash', user.id);
      return res.status(401).json({ message: 'Izina ukoresha cg password ntabwo bihuye' });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(String(password), hash);
    } catch (bcryptErr) {
      console.error('Login bcrypt error:', bcryptErr.message || bcryptErr);
      return res.status(401).json({ message: 'Izina ukoresha cg password ntabwo bihuye' });
    }
    if (!isMatch) {
      return res.status(401).json({ message: 'Izina ukoresha cg password ntabwo bihuye' });
    }

    // Block login if account is pending approval
    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for admin to review your registration.', status: 'pending' });
    }

    // Block login if account was rejected
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account registration was rejected. Please contact the administrator.', status: 'rejected' });
    }

    let token;
    try {
      token = jwt.sign(
        { id: asInt(user.id), username: rowText(user.username), role: rowText(user.role) },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (jwtErr) {
      console.error('Login JWT error:', jwtErr.message || jwtErr);
      return res.status(500).json({ message: 'Ibyago mu byakozwe' });
    }

    res.json({
      message: 'Login successful.',
      token,
      user: loginUserPayload(user),
    });
  } catch (error) {
    console.error('Login error:', error.code || '', error.sqlMessage || error.message || error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Verify email with code
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code required' });
    }

    // Find user with pending verification
    const [users] = await pool.execute(
      `SELECT * FROM users 
       WHERE email = ? AND email_verified = 0 AND verification_code = ? AND verification_expires > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const user = users[0];

    // Mark as verified
    await pool.execute(
      'UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?',
      [asInt(user.id)]
    );

    const token = jwt.sign(
      { id: asInt(user.id), username: rowText(user.username), role: rowText(user.role) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Your account has been verified successfully.',
      token,
      user: loginUserPayload(user),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone, role, village, sector, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Umushinga wifashisho ntaraboneka' }); // User not found
    }

    res.json(meUserPayload(users[0]));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Find unverified user
    const [users] = await pool.execute(
      `SELECT * FROM users 
       WHERE email = ? AND email_verified = 0 AND verification_expires > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'No pending verification found for this email' });
    }

    const user = users[0];

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Update DB
    await pool.execute(
      'UPDATE users SET verification_code = ?, verification_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
      [code, user.id]
    );

    // Send email
    await sendVerificationEmail(email, code, user.full_name);

    const response = {
      message: 'Verification code resent! Check your email.',
      ...(process.env.NODE_ENV !== 'production' ? { verificationCode: code } : {})
    };
    console.log('Resend code:', code, 'to:', email);

    res.status(200).json(response);
  } catch (error) {
    console.error('Resend verification error:', error);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password - Send Code
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Imeri irakenewe' }); // Email required
    }

    const [users] = await pool.execute(
      'SELECT id, email, full_name FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Nta konti yabonetse kuri iyi imeri' }); // No account found
    }

    const user = users[0];

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.execute(
      'UPDATE users SET reset_code = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
      [code, asInt(user.id)]
    );

    try {
      await sendResetPasswordEmail(email, code, rowText(user.full_name));
    } catch (emailErr) {
      console.error('Forgot password email error:', emailErr.message || emailErr);
      return res.status(503).json({
        message:
          'Database updated but email could not be sent. Set BREVO_API_KEY / FROM_EMAIL on Render or try again later.',
      });
    }

    res.json({
      message: 'Imibare y\'ibanga yo guhindura ijambo ry\'ibanga yoherejwe kuri imeri yawe.',
      ...(process.env.NODE_ENV !== 'production' ? { resetCode: code } : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error.code || '', error.sqlMessage || error.message || error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Reset Password - Verify Code & Update
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Imeri, imibare y\'ibanga, n\'ijambo ry\'ibanga rishya birakenewe' });
    }

    // Find user with valid reset code
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND reset_code = ? AND reset_expires > NOW()',
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Imibare y\'ibanga ntabwo ihuye cyangwa yaraye' }); // Invalid or expired
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset fields
    await pool.execute(
      'UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Ijambo ry\'ibanga ryahinduwe neza. Shaka kwinjira ukoresheje ijambo ry\'ibanga rishya.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

export default { register, login, verifyEmail, getCurrentUser, resendVerificationCode, forgotPassword, resetPassword };
