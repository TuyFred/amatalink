import dotenv from 'dotenv';
import { sendPriceChangeEmail } from './controllers/emailUtils.js';

dotenv.config();

const testEmail = process.env.FROM_EMAIL || 'fredtuyishime87@gmail.com';

(async () => {
    console.log('--- Price Change Email Verification Test ---');
    
    try {
        console.log(`Sending Price Change Email to ${testEmail}...`);
        await sendPriceChangeEmail(testEmail, 'Test Farmer', 500, 600);
        
        console.log('✅ Price change test email sent! Please check the inbox.');
    } catch (error) {
        console.error('❌ Error during price change email verification:', error);
    }
})();
