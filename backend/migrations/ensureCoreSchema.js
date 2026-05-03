import pool from '../config/database.js';

/**
 * Ensures `users` exists and auth-related columns exist (fresh Render / cloud MySQL).
 */
export async function ensureCoreSchema() {
  const [[{ userTable }]] = await pool.query(
    `SELECT COUNT(*) as userTable FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'users'`
  );

  if (userTable === 0) {
    await pool.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        role VARCHAR(50) NOT NULL,
        village VARCHAR(255) NULL,
        sector VARCHAR(255) NULL,
        status VARCHAR(32) DEFAULT 'pending',
        email_verified TINYINT(1) DEFAULT 0,
        verification_code VARCHAR(6) NULL,
        verification_expires TIMESTAMP NULL,
        reset_code VARCHAR(6) NULL,
        reset_expires TIMESTAMP NULL,
        payment_method_id INT NULL,
        payment_account VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_users_username (username),
        KEY idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Schema] Created users table');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(100),
      code VARCHAR(50),
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const addColumn = async (columnName, ddl) => {
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [columnName]
    );
    if (cnt === 0) {
      await pool.query(ddl);
      console.log(`[Schema] Added users.${columnName}`);
    }
  };

  await addColumn('payment_method_id', 'ALTER TABLE users ADD COLUMN payment_method_id INT NULL');
  await addColumn('payment_account', 'ALTER TABLE users ADD COLUMN payment_account VARCHAR(255) NULL');
  await addColumn('email_verified', 'ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0');
  await addColumn('verification_code', 'ALTER TABLE users ADD COLUMN verification_code VARCHAR(6) NULL');
  await addColumn('verification_expires', 'ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP NULL');
  await addColumn('reset_code', 'ALTER TABLE users ADD COLUMN reset_code VARCHAR(6) NULL');
  await addColumn('reset_expires', 'ALTER TABLE users ADD COLUMN reset_expires TIMESTAMP NULL');
  await addColumn('status', "ALTER TABLE users ADD COLUMN status VARCHAR(32) DEFAULT 'pending'");

  const defaults = [
    { name: 'MTN Mobile Money', provider: 'MTN', code: 'MTN' },
    { name: 'Airtel Money', provider: 'Airtel', code: 'AIRTEL' },
    { name: 'Cash', provider: 'Cash', code: 'CASH' },
  ];
  for (const d of defaults) {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM payment_methods WHERE code = ? LIMIT 1',
      [d.code]
    );
    if (count === 0) {
      await pool.query(
        'INSERT INTO payment_methods (name, provider, code, active) VALUES (?, ?, ?, 1)',
        [d.name, d.provider, d.code]
      );
    }
  }
}
