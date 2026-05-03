import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amatalink',
});

async function migrate() {
  const conn = await pool.getConnection();
  try {
    // Add status column if not exists
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'`
    );

    if (cols.length === 0) {
      await conn.execute(`ALTER TABLE users ADD COLUMN status ENUM('pending','approved','rejected') DEFAULT 'pending'`);
      console.log('✅ Added status column to users table');

      // Set all existing users to approved
      await conn.execute(`UPDATE users SET status = 'approved' WHERE status = 'pending'`);
      console.log('✅ Set existing users to approved');
    } else {
      console.log('ℹ️  status column already exists');
    }

    console.log('🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
