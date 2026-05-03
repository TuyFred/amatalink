import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.FROM_EMAIL,
    pass: process.env.BREVO_API_KEY
  }
});

(async () => {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully!');
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: process.env.FROM_EMAIL,
      subject: 'SMTP Test',
      text: 'If you see this, SMTP is working.'
    };
    
    console.log('Sending test mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('SMTP Error:', error);
  }
})();
