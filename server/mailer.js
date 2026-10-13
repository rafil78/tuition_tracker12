import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory SMTP runtime override
let runtimeSmtp = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  user: process.env.GMAIL_USER || process.env.SMTP_USER || '',
  pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'EduTrack Bangladesh <verify@edutrack.com.bd>'
};

// Cached test account for instant delivery
let etherealAccount = null;

async function getTransporter() {
  // If custom SMTP user and password provided, use them
  if (runtimeSmtp.user && runtimeSmtp.pass) {
    return {
      transporter: nodemailer.createTransport({
        host: runtimeSmtp.host,
        port: runtimeSmtp.port,
        secure: runtimeSmtp.secure,
        auth: {
          user: runtimeSmtp.user,
          pass: runtimeSmtp.pass
        },
        tls: { rejectUnauthorized: false }
      }),
      from: runtimeSmtp.from || `"EduTrack Bangladesh" <${runtimeSmtp.user}>`,
      isLiveCustom: true
    };
  }

  // Fallback to real Ethereal SMTP account
  if (!etherealAccount) {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      console.log('✅ [Mailer] Live Ethereal SMTP account initialized:', etherealAccount.user);
    } catch (err) {
      console.warn('⚠️ [Mailer] Failed to create test account, retrying with fallback options...', err.message);
      throw err;
    }
  }

  const transporter = nodemailer.createTransport({
    host: etherealAccount.smtp.host,
    port: etherealAccount.smtp.port,
    secure: etherealAccount.smtp.secure,
    auth: {
      user: etherealAccount.user,
      pass: etherealAccount.pass
    },
    tls: { rejectUnauthorized: false }
  });

  return {
    transporter,
    from: `"EduTrack Bangladesh" <${etherealAccount.user}>`,
    isLiveCustom: false
  };
}

/**
 * Sends a real-time OTP email to the given recipient
 */
export async function sendOtpEmail({ email, name, otp }) {
  try {
    const { transporter, from, isLiveCustom } = await getTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>EduTrack OTP Verification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 15px; margin-bottom: 16px; font-weight: 600; color: #334155; }
        .intro { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .otp-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #4f46e5; font-weight: 700; margin-bottom: 8px; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1e1b4b; font-family: monospace; }
        .otp-notice { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        .details-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .details-table td:first-child { color: #64748b; width: 35%; }
        .details-table td:last-child { color: #1e293b; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EduTrack Bangladesh</h1>
          <p>টিউশন ট্র্যাকার ও পেমেন্ট প্ল্যাটফর্ম • রিয়েল-টাইম জিমেইল ওটিপি নিরাপত্তা</p>
        </div>
        <div class="content">
          <div class="greeting">প্রিয় ${name || 'ব্যবহারকারী'},</div>
          <p class="intro">
            EduTrack প্ল্যাটফর্মে আপনার অ্যাকাউন্ট ভেরিফিকেশনের জন্য অনুরোধ করা হয়েছে। নিচে প্রদত্ত ৬-সংখ্যার ওয়ান-টাইম পাসওয়ার্ড (OTP) কোডটি ব্যবহার করে আপনার অ্যাকাউন্ট সক্রিয় করুন:
          </p>

          <div class="otp-box">
            <div class="otp-title">আপনার গোপনীয় ওটিপি কোড (OTP Code)</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-notice">⏱ কোডটির মেয়াদ আগামী ১০ মিনিট (Expires in 10 minutes)</div>
          </div>

          <table class="details-table">
            <tr>
              <td>প্রাপক ইমেইল</td>
              <td>${email}</td>
            </tr>
            <tr>
              <td>ভেরিফিকেশন ধরন</td>
              <td>অ্যাকাউন্ট নিশ্চিতকরণ (Account Activation)</td>
            </tr>
            <tr>
              <td>প্ল্যাটফর্ম</td>
              <td>EduTrack Bangladesh (Taka Edition)</td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #ef4444; margin: 0; line-height: 1.5;">
            ⚠️ সতর্কবার্তা: আপনার ওটিপি কোডটি কারো সাথে শেয়ার করবেন না। EduTrack টিম কখনো আপনার কোড বা পাসওয়ার্ড জানতে চাইবে না।
          </p>
        </div>
        <div class="footer">
          © 2026 EduTrack Bangladesh. সকল স্বত্ব সংরক্ষিত।<br>
          SSLCommerz ও জিমেইল নিরাপত্তা দ্বারা চালিত।
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `🔐 ${otp} - আপনার EduTrack অ্যাকাউন্ট ভেরিফিকেশন ওটিপি (Realtime OTP)`,
      text: `আপনার EduTrack একাউন্ট ভেরিফিকেশন কোড: ${otp}। মেয়াদ ১০ মিনিট।`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log(`📨 [Mailer] Realtime email dispatched to ${email}. MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`🔗 [Mailer] Live web preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      deliveryMethod: isLiveCustom ? 'Direct Gmail/Custom SMTP' : 'Live Realtime SMTP (Ethereal)',
      isLiveCustom
    };
  } catch (err) {
    console.error('❌ [Mailer Error] Failed to send real-time email:', err);
    throw err;
  }
}

export function getSmtpConfig() {
  return {
    host: runtimeSmtp.host,
    port: runtimeSmtp.port,
    secure: runtimeSmtp.secure,
    user: runtimeSmtp.user ? `${runtimeSmtp.user.substring(0, 3)}•••@${runtimeSmtp.user.split('@')[1] || 'domain'}` : '',
    configured: !!(runtimeSmtp.user && runtimeSmtp.pass),
    from: runtimeSmtp.from
  };
}

export function updateSmtpConfig(newConfig) {
  if (newConfig.user !== undefined) runtimeSmtp.user = newConfig.user;
  if (newConfig.pass !== undefined) runtimeSmtp.pass = newConfig.pass;
  if (newConfig.host) runtimeSmtp.host = newConfig.host;
  if (newConfig.port) runtimeSmtp.port = Number(newConfig.port);
  if (newConfig.secure !== undefined) runtimeSmtp.secure = !!newConfig.secure;
  if (newConfig.from) runtimeSmtp.from = newConfig.from;
  return getSmtpConfig();
}
