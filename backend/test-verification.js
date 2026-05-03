import { sendVerificationEmail } from './controllers/emailUtils.js';

(async () => {
  try {
    await sendVerificationEmail('your-gmail@gmail.com', '123456', 'Test User');
    console.log('Test verification email sent!');
  } catch (error) {
    console.error('Test failed:', error);
  }
})();

