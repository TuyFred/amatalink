import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const useSsl = process.env.DB_SSL === '1' || process.env.DB_SSL === 'true';
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amatalink',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Avoid BigInt in row values (breaks res.json on login /me, etc.)
  supportBigNumbers: true,
  bigNumberStrings: true,
};

if (useSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const pool = mysql.createPool(poolConfig);

export default pool;
