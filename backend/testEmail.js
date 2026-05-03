import { sendDailyMilkSummariesToAllFarmers } from './controllers/notificationController.js';

(async () => {
    try {
        const litres = 50; // Example litres value
        const earnings = 25000; // Example earnings value

        console.log('Sending daily milk summaries to all farmers...');
        await sendDailyMilkSummariesToAllFarmers(litres, earnings);

        console.log('Emails sent successfully to all farmers.');
    } catch (error) {
        console.error('Error sending emails:', error);
    }
})();