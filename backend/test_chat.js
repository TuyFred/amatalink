import pool from './config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function test() {
    console.log('Testing chat backend...');
    try {
        // Find a farmer and a collector to test with
        const [farmers] = await pool.execute('SELECT user_id FROM farmers LIMIT 1');
        const [collectors] = await pool.execute('SELECT user_id FROM collectors LIMIT 1');

        if (farmers.length === 0 || collectors.length === 0) {
            console.log('Not enough users to test chat.');
            return;
        }

        const farmerId = farmers[0].user_id;
        const collectorId = collectors[0].user_id;

        console.log(`Simulating message from Farmer (${farmerId}) to Collector (${collectorId})...`);
        const [res] = await pool.execute('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [farmerId, collectorId, 'Hello Collector!']);
        console.log('✅ Message inserted:', res.insertId);

        console.log('Fetching messages for Collector...');
        const [msgs] = await pool.execute('SELECT * FROM messages WHERE receiver_id = ?', [collectorId]);
        console.log('✅ Messages found:', msgs.length);

        console.log('Test completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
