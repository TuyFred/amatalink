import pool from './config/database.js';

async function diagnose() {
  try {
    const [farmers] = await pool.execute('SELECT COUNT(*) as count FROM farmers');
    const [users] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'");
    const [records] = await pool.execute('SELECT COUNT(*) as count FROM milk_records');
    const [collectors] = await pool.execute('SELECT * FROM collectors');
    
    console.log('--- DATABASE STATUS ---');
    console.log('Farmers in Farmers table:', farmers[0].count);
    console.log('Farmers in Users table:', users[0].count);
    console.log('Total Milk Records:', records[0].count);
    console.log('Total Collectors:', collectors.length);
    
    if (farmers[0].count > 0) {
        const [sample] = await pool.execute(`
            SELECT f.*, u.full_name, f.collector_id 
            FROM farmers f 
            JOIN users u ON f.user_id = u.id 
            LIMIT 5
        `);
        console.log('Sample Farmers:', JSON.stringify(sample, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Diagnosis failed:', err);
    process.exit(1);
  }
}

diagnose();
