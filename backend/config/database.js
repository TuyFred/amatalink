import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { resolveMysqlHost } from './resolveMysqlHost.js';

dotenv.config();

const useSsl = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true';
const { host: resolvedHost, port: resolvedPort } = resolveMysqlHost();

const poolConfig = {
  host: resolvedHost,
  ...(resolvedPort ? { port: resolvedPort } : {}),
  // Trim: leading/trailing spaces in Render/cPanel env vars break login (ER_ACCESS_DENIED_ERROR).
  user: (process.env.DB_USER || 'root').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  database: (process.env.DB_NAME || 'amatalink').trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Avoid BigInt in row values (breaks res.json on login /me, etc.)
  supportBigNumbers: true,
  bigNumberStrings: true,
};

if (process.env.NODE_ENV === 'production' && resolvedHost && resolvedHost !== 'localhost') {
  console.log('[MySQL] Using host:', resolvedHost, resolvedPort ? `port ${resolvedPort}` : 'port 3306 (default)');
}

if (useSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const pool = mysql.createPool(poolConfig);

export default pool;
