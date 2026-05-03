import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import pool from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import milkRoutes from './routes/milkRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { generateAndSendMonthlyReports } from './controllers/automatedReportController.js';
import { ensureAdminSchema } from './controllers/adminController.js';
import { ensureCoreSchema } from './migrations/ensureCoreSchema.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://amatalink.vercel.app',
];
const corsFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const frontendUrl = process.env.FRONTEND_URL?.trim();
const allowedOrigins = [...new Set([
  ...defaultCorsOrigins,
  ...(frontendUrl ? [frontendUrl] : []),
  ...corsFromEnv,
])];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/messages', messageRoutes);

// Schedule Monthly Reports: Runs at 00:00 on the 1st day of every month
cron.schedule('0 0 1 * *', () => {
  console.log('Running scheduled Monthly Report Generation...');
  generateAndSendMonthlyReports();
}, {
  scheduled: true,
  timezone: "Africa/Kigali"
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AmataLink API irakora neza' });
});

/** Deep check: MySQL + users table + columns required for auth (no secrets). */
app.get('/api/health/db', async (req, res) => {
  const out = {
    ok: false,
    mysql: false,
    usersTable: false,
    allRequiredColumnsPresent: false,
  };
  try {
    await pool.query('SELECT 1 AS ping');
    out.mysql = true;
  } catch (e) {
    out.hint =
      'MySQL unreachable. On Render set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME. Use your provider hostname (not localhost unless it is the same private network).';
    out.errorCode = e.code;
    return res.status(503).json(out);
  }

  try {
    const [[t]] = await pool.query(
      "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );
    out.usersTable = Number(t.c) > 0;
    if (!out.usersTable) {
      out.hint =
        'Database has no `users` table. Deploy the latest backend (ensureCoreSchema runs on startup) or import your schema.';
      return res.status(503).json(out);
    }

    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    const names = new Set(cols.map((c) => c.COLUMN_NAME));
    const required = [
      'id',
      'username',
      'email',
      'password',
      'full_name',
      'phone',
      'role',
      'status',
      'email_verified',
      'verification_code',
      'verification_expires',
      'reset_code',
      'reset_expires',
    ];
    out.columns = {};
    for (const n of required) {
      out.columns[n] = names.has(n);
    }
    out.allRequiredColumnsPresent = required.every((n) => names.has(n));
    out.ok = out.mysql && out.usersTable && out.allRequiredColumnsPresent;
    if (!out.allRequiredColumnsPresent) {
      out.hint =
        'users table is missing columns needed for login / password reset. Redeploy latest backend or run migrations.';
    }
    return res.status(out.ok ? 200 : 503).json(out);
  } catch (e) {
    out.errorCode = e.code;
    out.hint = e.sqlMessage || e.message;
    return res.status(503).json(out);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ibyago mu byakozwe' });
});

// Start server
async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL (amatalink) successfully');
    try {
      await ensureCoreSchema();
      await ensureAdminSchema();
    } catch (migrationErr) {
      console.error('Schema migration failed:', migrationErr.message || migrationErr);
    }
  } catch (err) {
    console.error('Unable to connect to MySQL:', err.message || err);
    console.error(
      'Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Render Environment (use your cloud MySQL hostname, not localhost).'
    );
  }

  app.listen(PORT, () => {
    console.log(`AmataLink server running on port ${PORT}`);
  });
}

start();

export default app;
