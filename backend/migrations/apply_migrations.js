import pool from '../config/database.js';

async function run() {
  try {
    console.log('Applying migrations...');

    // Create payment_methods table if missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(100),
        code VARCHAR(50),
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log('Ensured payment_methods table exists');

    // Add columns to users if missing
    const [[{ cnt: pmCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'payment_method_id'`
    );
    if (pmCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN payment_method_id INT NULL;");
      console.log('Added column users.payment_method_id');
    } else {
      console.log('Column users.payment_method_id already exists');
    }

    const [[{ cnt: paCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'payment_account'`
    );
    if (paCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN payment_account VARCHAR(255) NULL;");
      console.log('Added column users.payment_account');
    } else {
      console.log('Column users.payment_account already exists');
    }

    // Add email verification columns
    const [[{ cnt: evCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified'`
    );
    if (evCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;");
      console.log('Added column users.email_verified');
    } else {
      console.log('Column users.email_verified already exists');
    }

    const [[{ cnt: vcCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_code'`
    );
    if (vcCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);");
      console.log('Added column users.verification_code');
    } else {
      console.log('Column users.verification_code already exists');
    }

    const [[{ cnt: veCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'verification_expires'`
    );
    if (veCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP NULL;");
      console.log('Added column users.verification_expires');
    } else {
      console.log('Column users.verification_expires already exists');
    }

    // Add password reset columns
    const [[{ cnt: rcCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_code'`
    );
    if (rcCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN reset_code VARCHAR(6) NULL;");
      console.log('Added column users.reset_code');
    } else {
      console.log('Column users.reset_code already exists');
    }

    const [[{ cnt: reCol }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_expires'`
    );
    if (reCol === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN reset_expires TIMESTAMP NULL;");
      console.log('Added column users.reset_expires');
    } else {
      console.log('Column users.reset_expires already exists');
    }

    // Seed default payment methods
    const defaults = [
      { name: 'MTN Mobile Money', provider: 'MTN', code: 'MTN' },
      { name: 'Airtel Money', provider: 'Airtel', code: 'AIRTEL' },
      { name: 'Cash', provider: 'Cash', code: 'CASH' }
    ];

    for (const d of defaults) {
      const [[{ count }]] = await pool.query(
        'SELECT COUNT(*) as count FROM payment_methods WHERE code = ? LIMIT 1',
        [d.code]
      );
      if (count === 0) {
        await pool.query('INSERT INTO payment_methods (name, provider, code, active) VALUES (?, ?, ?, 1)', [d.name, d.provider, d.code]);
        console.log('Seeded payment method:', d.code);
      } else {
        console.log('Payment method already exists:', d.code);
      }
    }

    console.log('Migrations applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
