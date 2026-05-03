import pool from '../config/database.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a number as RWF currency, e.g. 5000 → "5,000 RWF" */
function formatRWF(amount) {
  return `${Number(amount).toLocaleString('en-US')} RWF`;
}

/** Low-level email sender via Brevo */
async function sendEmail(recipient, subject, htmlContent) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  if (!brevoApiKey) {
    console.error('BREVO_API_KEY is not set in .env');
    return;
  }
  if (!recipient?.email) {
    console.error('sendEmail: recipient email is missing', recipient);
    return;
  }

  try {
    const emailData = {
      sender: { name: process.env.FROM_NAME || 'AmataLink', email: process.env.FROM_EMAIL },
      to: [{ email: recipient.email, name: recipient.name || '' }],
      subject,
      htmlContent,
    };

    const response = await axios.post(brevoApiUrl, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
    });
    console.log(`✅ Email sent to ${recipient.name} (${recipient.email}):`, response.data?.messageId || 'ok');
  } catch (error) {
    console.error(`❌ Failed to send email to ${recipient.email}:`, error.response?.data || error.message);
  }
}

// ─── SMS via Brevo Transactional SMS ─────────────────────────────────────────

/**
 * Normalize a phone number to E.164 format for Rwanda (+250...).
 * Handles: 07xxxxxxxx → +25007xxxxxxxx, +250... → unchanged
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+')) return cleaned;           // already E.164
  if (cleaned.startsWith('250')) return '+' + cleaned;   // 250788...
  if (cleaned.startsWith('07') || cleaned.startsWith('07')) return '+250' + cleaned.slice(1); // 0788... → +250788...
  return '+250' + cleaned; // fallback: prepend Rwanda code
}

/**
 * Send an SMS to a phone number using Brevo Transactional SMS API.
 *
 * @param {string} phone        - farmer's phone number (any local format)
 * @param {string} farmerName   - farmer's name (for logging)
 * @param {number} litres       - litres delivered
 * @param {number} earnings     - total amount in RWF
 * @param {string} [date]       - formatted date string
 * @param {string} [time]       - formatted time string
 */
async function sendSMS(phone, farmerName, litres, earnings, date, time) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const smsApiUrl = 'https://api.brevo.com/v3/transactionalSMS/sms';
  const sender = (process.env.BREVO_SMS_SENDER || 'AmataLink').slice(0, 11);

  const to = normalizePhone(phone);
  if (!to) {
    console.error('sendSMS: invalid phone number', phone);
    return;
  }
  if (!brevoApiKey) {
    console.error('sendSMS: BREVO_API_KEY is not set');
    return;
  }

  const displayDate = date || new Date().toLocaleDateString('en-RW');
  const displayTime = time || new Date().toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });
  const formattedEarnings = Number(earnings).toLocaleString('en-US');
  const formattedLitres   = Number(litres).toFixed(1);

  // Bilingual message (Kinyarwanda + English), kept short for SMS
  const content =
    `AmataLink: Amata ${formattedLitres}L yakiriwe itariki ${displayDate} isaha ${displayTime}. ` +
    `Inzahabu: ${formattedEarnings} RWF. ` +
    `Milk ${formattedLitres}L recorded on ${displayDate} at ${displayTime}. ` +
    `Total: ${formattedEarnings} RWF. Murakoze/Thank you!`;

  try {
    const response = await axios.post(
      smsApiUrl,
      { sender, recipient: to, content, type: 'transactional' },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
        },
      }
    );
    console.log(`✅ SMS sent to ${farmerName} (${to}):`, response.data?.messageId || 'ok');
  } catch (error) {
    // Log but never throw — SMS failure must not block the main flow
    console.error(`❌ SMS failed for ${farmerName} (${to}):`, error.response?.data || error.message);
  }
}

/**
 * Send a production feedback SMS to a farmer.
 */
async function sendProductionFeedbackSMS(phone, farmerName, quantity, level) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const smsApiUrl = 'https://api.brevo.com/v3/transactionalSMS/sms';
  const sender = (process.env.BREVO_SMS_SENDER || 'AmataLink').slice(0, 11);

  const to = normalizePhone(phone);
  if (!to || !brevoApiKey) return;

  const messages = {
    high: {
      kinya: `AmataLink: Umusaruro (${quantity}L) ni mwiza! Komereza aho kwita ku matungo neza.`,
      english: `AmataLink: Production (${quantity}L) is excellent! Keep up the good work.`
    },
    warning: {
      kinya: `AmataLink: Umusaruro (${quantity}L) wagabanutseho gato. Genzura imirire n'ubuzima bwayo.`,
      english: `AmataLink: Production (${quantity}L) dropped slightly. Monitor feed and health.`
    },
    concern: {
      kinya: `AmataLink: Umusaruro (${quantity}L) uri hasi cyane. Fata ingamba zihuse kugira ngo ube mwiza.`,
      english: `AmataLink: Production (${quantity}L) is low. Take action to improve quality.`
    },
    urgent: {
      kinya: `AmataLink: Umusaruro (${quantity}L) ni muke cyane mu buryo buteye inkeke. Shaka VET vuba!`,
      english: `AmataLink: Production (${quantity}L) is critical/very low. Seek VET assistance immediately!`
    }
  };

  const msg = messages[level] || messages.concern;
  const content = `${msg.kinya} ${msg.english}`;

  try {
    await axios.post(
      smsApiUrl,
      { sender, recipient: to, content, type: 'transactional' },
      { headers: { 'Content-Type': 'application/json', 'api-key': brevoApiKey } }
    );
    console.log(`✅ Production SMS (${level}) sent to ${farmerName}`);
  } catch (error) {
    console.error(`❌ Production SMS failed for ${farmerName}:`, error.response?.data || error.message);
  }
}

// ─── CRUD Notification Endpoints ─────────────────────────────────────────────

// Get user notifications
export const getNotifications = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const userId = req.user.id;
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const userId = req.user.id;
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Ibyago mu byakozwe' });
  }
};

// Send notification (for system use)
export const sendNotification = async (userId, title, message, type = 'system') => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
    return true;
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
};

// ─── Milk Delivery Email to Farmer ───────────────────────────────────────────

/**
 * Send a milk delivery confirmation email directly to a farmer.
 *
 * @param {string} farmerEmail   - farmer's email address
 * @param {string} farmerFullName - farmer's full name
 * @param {number} litres        - litres delivered
 * @param {number} earnings      - total amount in RWF
 * @param {string} [date]        - formatted date string (optional, defaults to today)
 * @param {string} [time]        - formatted time string (optional, defaults to now)
 */
async function sendDailyMilkSummary(farmerEmail, farmerFullName, litres, earnings, date, time) {
  if (!farmerEmail) {
    console.error('sendDailyMilkSummary: farmerEmail is required');
    return;
  }

  const displayDate = date || new Date().toLocaleDateString('en-RW');
  const displayTime = time || new Date().toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });
  const formattedEarnings = formatRWF(earnings);
  const formattedLitres = Number(litres).toFixed(1);

  const subject = "Emeza Itangwa ry'Amata / Milk Delivery Confirmation";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AmataLink</h1>
        <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">Milk Delivery Confirmation</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">

        <!-- Kinyarwanda -->
        <h3 style="color: #111; margin-top: 0;">Kuri ${farmerFullName},</h3>
        <p>Amata mwatanze yakiriwe neza kandi yandikwa mu buryo bukwiye.</p>
        <p>Mwatanze litiro <strong>${formattedLitres}</strong> z'amata ku itariki ya <strong>${displayDate}</strong> isaha ya <strong>${displayTime}</strong>, akaba afite agaciro ka <strong>${formattedEarnings}</strong> yose hamwe.</p>
        <p>Turashimira imbaraga n'ubwitange bwanyu. Umusanzu wanyu ufasha gutuma habaho amata ahagije kandi ugashyigikira ubu buryo mu buryo bwiza.</p>
        <p>Murakoze ku bufatanye bwanyu buhoraho.</p>

        <hr style="border: none; border-top: 2px dashed #e5e7eb; margin: 28px 0;">

        <!-- English -->
        <h3 style="color: #111;">Dear ${farmerFullName},</h3>
        <p>Your milk delivery has been successfully received and recorded.</p>

        <!-- Summary Card -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📅 Date</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${displayDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🕐 Time</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${displayTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🥛 Milk Delivered</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${formattedLitres} Litres</td>
            </tr>
            <tr style="border-top: 1px solid #bbf7d0;">
              <td style="padding: 12px 0 8px; color: #059669; font-weight: 700;">💰 Total Amount</td>
              <td style="padding: 12px 0 8px; font-weight: 800; font-size: 18px; color: #059669; text-align: right;">${formattedEarnings}</td>
            </tr>
          </table>
        </div>

        <p>We appreciate your effort and commitment. Your contribution helps ensure a reliable milk supply and supports the system effectively.</p>
        <p>Thank you for your continued partnership.</p>

        <br>
        <p style="color: #374151;">Best regards / Murakoze cyane,<br><strong>AmataLink Team</strong></p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is an automated message from AmataLink. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmail({ email: farmerEmail, name: farmerFullName }, subject, htmlContent);
}

// ─── Admin Alert Email ────────────────────────────────────────────────────────

/**
 * Send a milk collection alert email to an admin.
 *
 * @param {string} adminEmail     - admin's email
 * @param {string} adminName      - admin's full name
 * @param {string} farmerName     - name of the farmer who delivered
 * @param {number} litres         - litres delivered
 * @param {number} totalAmount    - total amount in RWF
 * @param {string} [date]
 * @param {string} [time]
 */
async function sendAdminMilkAlert(adminEmail, adminName, farmerName, litres, totalAmount, date, time) {
  if (!adminEmail) {
    console.error('sendAdminMilkAlert: adminEmail is required');
    return;
  }

  const displayDate = date || new Date().toLocaleDateString('en-RW');
  const displayTime = time || new Date().toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' });
  const formattedAmount = formatRWF(totalAmount);
  const formattedLitres = Number(litres).toFixed(1);

  const subject = 'AmataLink — New Milk Collection Recorded';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">

      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">AmataLink Admin</h1>
        <p style="color: #c7d2fe; margin: 8px 0 0; font-size: 13px;">New Collection Alert</p>
      </div>

      <div style="padding: 32px;">
        <h3 style="color: #111; margin-top: 0;">Dear ${adminName},</h3>
        <p>A new milk collection has been recorded and requires your awareness:</p>

        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">👤 Farmer</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${farmerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">📅 Date</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${displayDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🕐 Time</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${displayTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🥛 Milk Collected</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${formattedLitres} Litres</td>
            </tr>
            <tr style="border-top: 1px solid #c7d2fe;">
              <td style="padding: 12px 0 8px; color: #4f46e5; font-weight: 700;">💰 Total Value</td>
              <td style="padding: 12px 0 8px; font-weight: 800; font-size: 18px; color: #4f46e5; text-align: right;">${formattedAmount}</td>
            </tr>
          </table>
        </div>

        <p>Please log in to the dashboard to review the record.</p>
        <br>
        <p style="color: #374151;">AmataLink System</p>
      </div>

      <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 11px; color: #9ca3af;">Automated alert from AmataLink. Do not reply.</p>
      </div>
    </div>
  `;

  await sendEmail({ email: adminEmail, name: adminName }, subject, htmlContent);
}

// ─── Bulk Functions ───────────────────────────────────────────────────────────

/** Send delivery confirmation to ALL farmers in the DB (generic broadcast) */
async function sendDailyMilkSummariesToAllFarmers(litres, earnings) {
  try {
    console.log('Fetching all farmers from the database...');
    const [farmers] = await pool.execute(
      'SELECT id, email, full_name FROM users WHERE role = ?',
      ['farmer']
    );

    if (farmers.length === 0) {
      console.warn('No farmers found in the database.');
      return;
    }

    for (const farmer of farmers) {
      await sendDailyMilkSummary(farmer.email, farmer.full_name, litres, earnings);
    }
  } catch (error) {
    console.error('Error in sendDailyMilkSummariesToAllFarmers:', error);
  }
}

/** Send role-specific emails to an array of user objects */
async function sendEmailsToAllUsers(users) {
  for (const user of users) {
    let subject = '';
    let htmlContent = '';

    switch (user.role) {
      case 'farmer':
        subject = 'Delivery Confirmation';
        htmlContent = `<p>Dear ${user.full_name},</p><p>Your milk was collected successfully. Thank you for working with AmataLink.</p>`;
        break;
      case 'collector':
        subject = 'Daily Summary';
        htmlContent = `<p>Dear ${user.full_name},</p><p>You collected milk today. Keep up the good work!</p>`;
        break;
      case 'admin':
        subject = 'Daily Report';
        htmlContent = `<p>Dear Admin,</p><p>Today's milk collection report is ready for review.</p>`;
        break;
      default:
        console.warn(`Unknown role for user ${user.id}: ${user.role}`);
        continue;
    }

    await sendEmail({ email: user.email, name: user.full_name }, subject, htmlContent);
  }
}

/** Generic improved-message sender (kept for compatibility) */
async function sendImprovedMessage(type, data) {
  let subject = '';
  let htmlContent = '';

  switch (type) {
    case 'farmer':
      subject = 'Delivery Confirmation';
      htmlContent = `
        <p>Dear ${data.farmerName},</p>
        <p>Your milk was collected by ${data.collectorName}.</p>
        <p>Quantity: <strong>${Number(data.litres).toFixed(1)} litres</strong></p>
        <p>Total Earnings: <strong>${formatRWF(data.amount)}</strong></p>
        <p>Thank you for working with AmataLink.</p>
      `;
      break;
    case 'collector':
      subject = 'Daily Summary';
      htmlContent = `
        <p>Dear ${data.collectorName},</p>
        <p>You collected milk from <strong>${data.farmerCount} farmers</strong> today.</p>
        <p>Total Quantity: <strong>${Number(data.totalLitres).toFixed(1)} litres</strong></p>
        <p>Total Value: <strong>${formatRWF(data.totalAmount)}</strong></p>
        <p>Good job!</p>
      `;
      break;
    case 'admin':
      subject = 'Daily Report/Alert';
      htmlContent = `
        <p>Dear Admin,</p>
        <p>Today's collection was recorded by ${data.collectorName}.</p>
        <p>Total Milk: <strong>${Number(data.totalLitres).toFixed(1)} litres</strong></p>
        <p>Total Value: <strong>${formatRWF(data.totalAmount)}</strong></p>
        <p>Please review the system report.</p>
      `;
      break;
    default:
      console.error('sendImprovedMessage: invalid type', type);
      return;
  }

  if (!data.recipient?.email) {
    console.error('sendImprovedMessage: recipient email is missing', data);
    return;
  }

  await sendEmail(data.recipient, subject, htmlContent);
}

export {
  sendEmail,
  sendSMS,
  sendProductionFeedbackSMS,
  sendImprovedMessage,
  sendDailyMilkSummary,
  sendAdminMilkAlert,
  sendDailyMilkSummariesToAllFarmers,
  sendEmailsToAllUsers,
};

export default { getNotifications, markAsRead, getUnreadCount, sendNotification };
