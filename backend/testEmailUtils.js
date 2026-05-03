import dotenv from 'dotenv';
import { sendRegistrationPendingEmail } from './controllers/emailUtils.js';

dotenv.config();

const testEmail = process.env.FROM_EMAIL || 'fredtuyishime87@gmail.com';

(async () => {
    console.log('--- EmailUtils Verification Test ---');
    try {
        console.log(`Sending test email to ${testEmail} using emailUtils...`);
        await sendRegistrationPendingEmail(testEmail, 'Test User');
        console.log('✅ Test complete.');
    } catch (error) {
        console.error('❌ Error in test:', error);
    }
})();
