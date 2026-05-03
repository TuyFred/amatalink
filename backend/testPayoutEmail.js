import dotenv from 'dotenv';
import { sendPayoutStatusEmail } from './controllers/emailUtils.js';

dotenv.config();

const testEmail = process.env.FROM_EMAIL || 'fredtuyishime87@gmail.com';

(async () => {
    console.log('--- Payout Email Verification Test ---');
    
    try {
        console.log(`Sending Payout Processed Email to ${testEmail}...`);
        await sendPayoutStatusEmail(testEmail, 'Test Farmer', '50,000', 'processed');
        
        console.log('✅ Payout test email sent! Please check the inbox.');
    } catch (error) {
        console.error('❌ Error during payout email verification:', error);
    }
})();
