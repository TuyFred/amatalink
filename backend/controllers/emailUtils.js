import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/** helper to send email via Brevo API */
/** helper to send email via Brevo API */
async function sendEmailViaAPI(email, fullName, subject, htmlContent, attachments = [], retries = 3) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  if (!brevoApiKey) {
    console.error('BREVO_API_KEY is not set');
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const emailData = {
        sender: { name: process.env.FROM_NAME || 'AmataLink', email: process.env.FROM_EMAIL },
        to: [{ email, name: fullName }],
        subject,
        htmlContent,
      };

      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments;
      }

      await axios.post(brevoApiUrl, emailData, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': brevoApiKey,
          'User-Agent': 'AmataLink-Backend/1.0',
        },
        timeout: 15000,
      });
      console.log(`✅ Email sent to ${email} (attempt ${attempt})`);
      return;
    } catch (error) {
      const isRetryable = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || (error.response?.status >= 500);
      
      if (attempt < retries && isRetryable) {
        console.warn(`⚠️ Attempt ${attempt} failed to send email to ${email}: ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.error(`❌ Failed to send email to ${email} after ${attempt} attempts:`, error.response?.data || error.message);
      if (!isRetryable) break;
    }
  }
}

export const sendResetPasswordEmail = async (email, code, fullName) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Imibare y\'ibanga yo guhindura ijambo ry\'ibanga / Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <!-- Kinyarwanda -->
        <h2>Muraho, ${fullName}!</h2>
        <p>Wagusabye guhindura ijambo ry'ibanga rya AmataLink. Koresha iyi mibare y'ibanga ikurikira kugira ngo ubashe guhindura ijambo ry'ibanga ryawe:</p>
        
        <div style="background: #10b981; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        
        <p>Iyi mibare irata agaciro mu minota 15. Niba atari wowe wasabye guhindura ijambo ry'ibanga, jya muri sisitemu uhindure ijambo ry'ibanga ryawe vuba bishoboka cyangwa ureke guha uyu murego undi muntu.</p>

        <hr style="border: none; border-top: 2px dashed #eee; margin: 30px 0;">

        <!-- English -->
        <h2>Hello, ${fullName}!</h2>
        <p>You have requested to reset your AmataLink password. Please use the following security code to complete the process:</p>
        <p>This code expires in 15 minutes. If you did not request this, please ignore this email or change your password immediately if you suspect unauthorized access.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p>Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email, code, fullName) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Emeza konti yawe ya AmataLink / Verify Your AmataLink Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <!-- Kinyarwanda -->
        <h2>Murakaza neza kuri AmataLink, ${fullName}!</h2>
        <p>Konti yawe yafunguwe neza. Kugira ngo wemeze ko iyi imeri ari iyawe, koresha iyi mibare y'ibanga:</p>
        
        <div style="background: #10b981; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        
        <p>Iyi mibare irata agaciro mu minota 15.</p>
        <p>Yinjize mu rubuga kugira ngo wuzuze igikorwa cyo kwiyandikisha.</p>

        <hr style="border: none; border-top: 2px dashed #eee; margin: 30px 0;">

        <!-- English -->
        <h2>Welcome to AmataLink, ${fullName}!</h2>
        <p>Your account has been created. Please verify your account using the code below. The code is the same as above.</p>
        <p>This code expires in 15 minutes. Enter it in the app to complete your signup.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p>Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendRegistrationPendingEmail = async (email, fullName) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Twakiriye ubusabe bwawe / Registration Application Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AmataLink</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">Registration Received</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #111; margin-top: 0; font-size: 20px;">Muraho, ${fullName}!</h2>
          
          <p>Twakiriye neza ubusabe bwawe bwo kwiyandikisha kuri AmataLink. Konti yawe irimo gusuzumwa n'itsinda ryacu rigenzura.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #059669; font-weight: 600;">STATUS: PENDING REVIEW / GUSUZUMWA</p>
          </div>

          <p>Ibi bisanzwe bifata amasaha macye kugira ngo konti yawe yemerwe. Uzahita ubona indi imeri n'ubutumwa bugufi (SMS) bikumenyesha ko noneho ushobora kwinjira muri porogaramu.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <h2 style="color: #111; font-size: 20px;">Hello, ${fullName}!</h2>
          <p>We have successfully received your registration application for AmataLink. Your account is currently being reviewed by our administration team.</p>
          <p>This process typically takes less than 24 hours. You will receive another email and an SMS notification once your account has been approved and is ready for use.</p>

          <p style="margin-top: 30px;">Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Automated message from AmataLink Dairy Network.</p>
        </div>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

export const sendRegistrationStatusEmail = async (email, fullName, status, approverRole = 'Admin', approverName = '') => {
  const isApproved = status === 'approved';
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: isApproved 
      ? 'Konti yawe yemejwe kuri AmataLink / Your AmataLink Account Approved'
      : 'Konti yawe ntabwo yemejwe kuri AmataLink / Your AmataLink Registration Status',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: ${isApproved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c)'}; padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">AmataLink</h1>
          <p style="color: ${isApproved ? '#d1fae5' : '#fee2e2'}; margin: 8px 0 0; font-size: 13px;">
            ${isApproved ? 'Account Approved' : 'Registration Status'}
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #111; margin-top: 0; font-size: 22px;">Muraho, ${fullName}!</h2>
          
          ${isApproved ? `
            <p>Twishimiye kukubwira ko konti yawe kuri AmataLink yemejwe neza na <strong>${approverRole}${approverName ? ' (' + approverName + ')' : ''}</strong>.</p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
              <h3 style="color: #059669; margin: 0; font-size: 18px;">KONTI YAWE YEMEJKWE</h3>
              <p style="color: #065f46; font-size: 14px; margin: 5px 0 20px;">Your account has been approved</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">INJIRA MURI SISITEMU / SIGN IN NOW</a>
            </div>

            <hr style="border: none; border-top: 1px dashed #e5e7eb; margin: 30px 0;">

            <h2 style="color: #111; font-size: 20px;">Hello, ${fullName}!</h2>
            <p>We are happy to inform you that your AmataLink account has been approved by the <strong>${approverRole}</strong>. You can now sign in and start using the platform.</p>
          ` : `
            <p>Turicuza kukubwira ko ubusabe bwawe bwo kwiyandikisha kuri AmataLink ntabwo bwemejwe kuri ubu.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
              <h3 style="color: #b91c1c; margin: 0;">NTABWO YEMEJKWE / NOT APPROVED</h3>
            </div>
            <p>Niba utazi impamvu, nyamuneka saba ibisobanuro usubiza iyi imeri.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p>We regret to inform you that your registration request was not approved at this time. If you have any questions, please reply to this email.</p>
          `}

          <p style="margin-top: 35px;">Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">&copy; ${new Date().getFullYear()} AmataLink Dairy Network. This is an automated message.</p>
        </div>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

export const sendMilkProductionFeedbackEmail = async (email, fullName, quantity, level) => {
  const templates = {
    high: {
      subject: 'Umusaruro ushimishije / Excellent Milk Production',
      kinya: `<p>Twishimiye kubabwira ko umusaruro wanyu w'amata (<strong>${quantity}L</strong>) uri mu rwego rwo hejuru kandi ushimishije.</p>
              <p>Turabashishikariza gukomeza kwita ku matungo yanyu neza, muha ibiryo byiza kandi mukurikirana ubuzima bwayo umunsi ku munsi.</p>`,
      english: `<p>We are delighted to inform you that your milk production (<strong>${quantity}L</strong>) is high and stable.</p>
                <p>We encourage you to maintain excellent livestock care, proper feeding, and regular health monitoring.</p>`
    },
    warning: {
      subject: 'Isubira inyuma rito ry\'umusaruro / Slight Decrease in Production',
      kinya: `<p>Twabonye ko umusaruro wanyu w'amata (<strong>${quantity}L</strong>) wagabanutseho gato ugereranyije n'ibisanzwe.</p>
              <p>Ese haba hari ikibazo cy'ubuzima ku matungo cyangwa imirire? Turabagira inama yo kongera imbaraga mu kugaburira amatungo no kuyakurikirana neza.</p>`,
      english: `<p>We noticed a slight decrease in your milk production (<strong>${quantity}L</strong>).</p>
                <p>Are there any issues with animal health or feed quality? We advise you to improve feeding and monitoring to restore production levels.</p>`
    },
    concern: {
      subject: 'Inama ku musaruro uri hasi / Advice on Low Production',
      kinya: `<p>Umusaruro wanyu (<strong>${quantity}L</strong>) uri hasi cyane ugereranyije n'ibisanzwe.</p>
              <p>Ibi bishobora guterwa n'ubugabanuke bw'amatungo cyangwa imirire mibi. Turabasaba gufata ingamba zihuse kugira ngo musubize umusaruro mu buryo bwiza.</p>`,
      english: `<p>Your production (<strong>${quantity}L</strong>) has dropped to a low level, which is below normal.</p>
                <p>This could be caused by reduced livestock numbers or poor nutrition. We recommend taking corrective action to improve production.</p>`
    },
    urgent: {
      subject: 'Ubutumwa bwihutirwa ku musaruro / Urgent Production Alert',
      kinya: `<p>Umusaruro wanyu w'amata (<strong>${quantity}L</strong>) wagabanutse cyane mu buryo buteye inkeke.</p>
              <p>Ibi bishobora kuba biterwa n'indwara zikomeye cyangwa imirire mibi cyane. Turabagira inama yo gushaka umuvuzi w'amatungo (Vet) cyangwa impuguke vuba bishoboka.</p>`,
      english: `<p>Your milk production (<strong>${quantity}L</strong>) is extremely low, which may indicate a serious problem.</p>
                <p>This could be a sign of disease or severe feeding issues. We strongly advise you to seek professional veterinary assistance immediately.</p>`
    }
  };

  const template = templates[level] || templates.concern;

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: template.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Muraho, ${fullName}!</h2>
        ${template.kinya}
        <hr style="border: none; border-top: 2px dashed #eee; margin: 30px 0;">
        <h2>Hello, ${fullName}!</h2>
        ${template.english}
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p>Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

export const sendPayoutStatusEmail = async (email, fullName, amount, status) => {
  const isProcessed = status === 'processed';
  if (!isProcessed) return; // For now only notify on successful processing

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Ubusabe bwawe bwo kwishyurwa bwakiriwe / Payout Request Processed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">AmataLink</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">Payout Processed</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #111; margin-top: 0; font-size: 22px;">Muraho, ${fullName}!</h2>
          
          <p>Twishimiye kukubwira ko ubusabe bwawe bwo kwishyurwa bw'amafaranga <strong>${amount} RWF</strong> bwemejwe kandi yanyuze mu nzira yo kwishyurwa.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
            <h3 style="color: #059669; margin: 0; font-size: 18px;">KWISHYURWA KWAYO KWA KWAYO</h3>
            <p style="color: #065f46; font-size: 14px; margin: 5px 0 0;">Ayatanzwe: ${amount} RWF</p>
          </div>

          <p>Nyamuneka reba niba amafaranga yageze kuri konti yawe cyangwa kuri Mobile Money yawe bitarenze amasaha 24.</p>

          <hr style="border: none; border-top: 1px dashed #e5e7eb; margin: 30px 0;">

          <h2 style="color: #111; font-size: 20px;">Hello, ${fullName}!</h2>
          <p>We are happy to inform you that your payout request of <strong>${amount} RWF</strong> has been approved and processed.</p>
          <p>Please check your bank account or Mobile Money within the next 24 hours to confirm receipt of the funds.</p>

          <p style="margin-top: 35px;">Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">&copy; ${new Date().getFullYear()} AmataLink Dairy Network. This is an automated message.</p>
        </div>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Payout Email send error:', error);
  }
};

export const sendPriceChangeEmail = async (email, fullName, oldPrice, newPrice) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Guhinduka kw\'igiciro cy\'amata / Update on Milk Price',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">AmataLink</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">Price Update Notification</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #111; margin-top: 0; font-size: 20px;">Muraho, ${fullName}!</h2>
          
          <p>Turakumenyesha ko igiciro cy'amata kuri litiro cyahindutse. Kuva ubu igiciro gishya kigiye gukoreshwa kuri AmataLink.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">IGICIRO CYASHYIZWEHO / NEW PRICE</p>
            <h3 style="margin: 10px 0 0; color: #059669; font-size: 28px; font-weight: 800;">${newPrice} RWF / L</h3>
            <p style="margin: 5px 0 0; color: #94a3b8; font-size: 12px; text-decoration: line-through;">Cyari: ${oldPrice} RWF</p>
          </div>

          <p>Komeza ukore neza umusaruro ukiyongera. Turabashimiye ubufatanye mwerekana.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <h2 style="color: #111; font-size: 20px;">Hello, ${fullName}!</h2>
          <p>We would like to inform you that the milk price per liter has been updated. The new price is now effective on AmataLink.</p>
          <p>The price has changed from <span style="text-decoration: line-through; color: #ef4444;">${oldPrice} RWF</span> to <strong>${newPrice} RWF</strong> per liter.</p>

          <p style="margin-top: 30px;">Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Automated message from AmataLink Dairy Network.</p>
        </div>
      </div>
    `
  };

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html);
  } catch (error) {
    console.error('Price Change Email send error:', error);
  }
};

export const sendMonthlyReportEmail = async (email, fullName, monthName, pdfBuffer, fileName) => {
  const mailOptions = {
    subject: `AmataLink: Raporo y'ukwezi kwa ${monthName} / Monthly Report for ${monthName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">AmataLink</h1>
          <p style="color: #d1fae5; margin: 8px 0 0; font-size: 13px;">Automated Monthly Report</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #111; margin-top: 0; font-size: 20px;">Muraho, ${fullName}!</h2>
          <p>Twishimiye kukoherereza raporo y'uburyo wagurishije amata mu kwezi kwa <strong>${monthName}</strong>. Raporo irambuye wayisanga mu mugereka (attachment) w'iyi imeri.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <h2 style="color: #111; font-size: 20px;">Hello, ${fullName}!</h2>
          <p>Please find attached your comprehensive milk collection report for the month of <strong>${monthName}</strong>.</p>
          <p>The PDF includes a daily breakdown of your deliveries, rates, and total earnings for the period.</p>

          <p style="margin-top: 30px;">Murakoze / Best regards,<br><strong>AmataLink Team</strong></p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">This is an automated system generated report.</p>
        </div>
      </div>
    `
  };

  const attachments = [
    {
      content: pdfBuffer.toString('base64'),
      name: fileName
    }
  ];

  try {
    await sendEmailViaAPI(email, fullName, mailOptions.subject, mailOptions.html, attachments);
  } catch (error) {
    console.error('Monthly Report Email error:', error);
  }
};

export default { sendVerificationEmail, sendResetPasswordEmail, sendRegistrationStatusEmail, sendMilkProductionFeedbackEmail, sendRegistrationPendingEmail, sendPayoutStatusEmail, sendPriceChangeEmail, sendMonthlyReportEmail };
