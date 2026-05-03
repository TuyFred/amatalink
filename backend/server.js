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
      await ensureAdminSchema();
    } catch (migrationErr) {
      console.error('Admin schema migration failed:', migrationErr.message || migrationErr);
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
