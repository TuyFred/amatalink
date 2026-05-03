import dotenv from 'dotenv';
import { sendRegistrationStatusEmail, sendRegistrationPendingEmail } from './controllers/emailUtils.js';

dotenv.config();

const testEmail = process.env.FROM_EMAIL || 'fredtuyishime87@gmail.com';

(async () => {
    console.log('--- Email Verification Test ---');
    
    try {
        console.log(`1. Sending Registration Pending Email to ${testEmail}...`);
        await sendRegistrationPendingEmail(testEmail, 'Test Farmer');
        
        console.log(`2. Sending Approval Email (by Admin) to ${testEmail}...`);
        await sendRegistrationStatusEmail(testEmail, 'Test Farmer', 'approved', 'Admin', 'Alex Admin');
        
        console.log(`3. Sending Approval Email (by Collector) to ${testEmail}...`);
        await sendRegistrationStatusEmail(testEmail, 'Test Farmer', 'approved', 'Collector', 'John Collector');
        
        console.log(`4. Sending Rejection Email to ${testEmail}...`);
        await sendRegistrationStatusEmail(testEmail, 'Test Farmer', 'rejected', 'Admin', 'Alex Admin');
        
        console.log('✅ All test emails sent! Please check the inbox.');
    } catch (error) {
        console.error('❌ Error during email verification:', error);
    }
})();
