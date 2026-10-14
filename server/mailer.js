import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Helper to load persisted settings
function loadPersistedSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return data.smtp || {};
    }
  } catch (err) {
    console.warn('⚠️ [Mailer] Could not read settings.json:', err.message);
  }
  return {};
}

// Helper to save settings
function savePersistedSettings(smtpConfig) {
  try {
    let allSettings = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      allSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
    allSettings.smtp = {
      user: smtpConfig.user || '',
      pass: smtpConfig.pass || '',
      host: smtpConfig.host || 'smtp.gmail.com',
      port: smtpConfig.port || 465,
      secure: smtpConfig.secure !== false,
      from: smtpConfig.from || ''
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf-8');

    // Also update server/.env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/^GMAIL_USER=.*$/m, `GMAIL_USER=${smtpConfig.user || ''}`);
      envContent = envContent.replace(/^GMAIL_APP_PASSWORD=.*$/m, `GMAIL_APP_PASSWORD=${smtpConfig.pass || ''}`);
      if (!envContent.includes('GMAIL_USER=')) {
        envContent += `\nGMAIL_USER=${smtpConfig.user || ''}\nGMAIL_APP_PASSWORD=${smtpConfig.pass || ''}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }
  } catch (err) {
    console.warn('⚠️ [Mailer] Failed to save settings to disk:', err.message);
  }
}

const savedSmtp = loadPersistedSettings();

// In-memory SMTP runtime configuration
let runtimeSmtp = {
  host: savedSmtp.host || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(savedSmtp.port || process.env.SMTP_PORT) || 465,
  secure: (savedSmtp.secure !== undefined ? savedSmtp.secure : process.env.SMTP_SECURE) !== 'false',
  user: savedSmtp.user || process.env.GMAIL_USER || process.env.SMTP_USER || '',
  pass: savedSmtp.pass || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
  from: savedSmtp.from || process.env.SMTP_FROM || 'EduTrack Bangladesh <verify@edutrack.com.bd>'
};

let cachedTransporter = null;

/**
 * Creates and returns the active Nodemailer transporter with connection pooling
 */
function createTransporter(customConfig = null) {
  const config = customConfig || runtimeSmtp;

  if (!config.user || !config.pass) {
    return null;
  }

  if (!customConfig && cachedTransporter) {
    return cachedTransporter;
  }

  const isGmail = !config.host || config.host === 'smtp.gmail.com';
  const transportOptions = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: config.user.trim(),
          pass: config.pass.trim().replace(/\s+/g, '')
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    : {
        host: config.host,
        port: Number(config.port) || 465,
        secure: config.secure !== false,
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 25000,
        auth: {
          user: config.user.trim(),
          pass: config.pass.trim().replace(/\s+/g, '')
        },
        tls: {
          rejectUnauthorized: false
        }
      };

  const transporter = nodemailer.createTransport(transportOptions);

  if (!customConfig) {
    cachedTransporter = transporter;
  }

  return transporter;
}

/**
 * Sends a REAL OTP email directly to the user's Gmail account
 */
export async function sendOtpEmail({ email, name, otp }) {
  if (!email) {
    throw new Error('Email address is required to dispatch OTP.');
  }

  const transporter = createTransporter();

  if (!transporter) {
    throw new Error(
      'জিমেইল এসএমটিপি কনফিগার করা নেই। দয়া করে জিমেইল ঠিকানা এবং ১৬-সংখ্যার Google App Password সেট করুন।'
    );
  }

  const fromSender = runtimeSmtp.from?.includes('<')
    ? runtimeSmtp.from
    : `"EduTrack Bangladesh" <${runtimeSmtp.user}>`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>EduTrack OTP Verification</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4338ca 0%, #312e81 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 8px; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 0; font-size: 13px; opacity: 0.9; }
      .content { padding: 32px 28px; }
      .greeting { font-size: 16px; margin-bottom: 14px; font-weight: 700; color: #1e293b; }
      .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
      .otp-box { background: #f8fafc; border: 2px dashed #6366f1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
      .otp-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #4f46e5; font-weight: 800; margin-bottom: 8px; }
      .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #1e1b4b; font-family: 'Courier New', Courier, monospace; margin: 6px 0; }
      .otp-notice { font-size: 12px; color: #64748b; margin-top: 8px; }
      .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
      .details-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
      .details-table td:first-child { color: #64748b; width: 38%; }
      .details-table td:last-child { color: #1e293b; font-weight: 600; }
      .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #991b1b; line-height: 1.5; }
      .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 EduTrack Bangladesh</h1>
        <p>টিউশন ট্র্যাকার ও লার্নিং ম্যানেজমেন্ট প্ল্যাটফর্ম • অ্যাকাউন্ট সিকিউরিটি</p>
      </div>
      <div class="content">
        <div class="greeting">প্রিয় ${name || 'ব্যবহারকারী'},</div>
        <p class="intro">
          EduTrack বাংলাদেশ প্ল্যাটফর্মে আপনার অ্যাকাউন্ট নিবন্ধন/যাচাইকরণের অনুরোধ করা হয়েছে। আপনার জিমেইল অ্যাকাউন্টটি নিশ্চিত করতে নিচের ৬-সংখ্যার গোপন ওয়ান-টাইম পাসওয়ার্ড (OTP) ব্যবহার করুন:
        </p>

        <div class="otp-box">
          <div class="otp-title">আপনার ভেরিফিকেশন ওটিপি কোড (OTP)</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-notice">⏱ কোডটির মেয়াদ আগামী ১০ মিনিট (Expires in 10 minutes)</div>
        </div>

        <table class="details-table">
          <tr>
            <td>প্রাপক জিমেইল</td>
            <td><strong>${email}</strong></td>
          </tr>
          <tr>
            <td>সেবা ধরন</td>
            <td>অ্যাকাউন্ট ভেরিফিকেশন (Account Activation)</td>
          </tr>
          <tr>
            <td>তারিখ ও সময়</td>
            <td>${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</td>
          </tr>
        </table>

        <div class="alert-box">
          ⚠️ <strong>সতর্কতা:</strong> আপনার ওটিপি কোডটি কারো সাথে শেয়ার করবেন না। EduTrack টিম কখনো আপনার কোড বা পাসওয়ার্ড জানতে চাইবে না।
        </div>
      </div>
      <div class="footer">
        © 2026 EduTrack Bangladesh. সর্বস্বত্ব সংরক্ষিত।<br>
        সরাসরি জিমেইল সিকিউরিটি ও SSLCommerz অনুমোদিত পেমেন্ট গেটওয়ে।
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromSender,
      to: email,
      subject: `🔐 ${otp} - আপনার EduTrack অ্যাকাউন্ট ভেরিফিকেশন ওটিপি (Realtime OTP)`,
      text: `আপনার EduTrack একাউন্ট ভেরিফিকেশন কোড: ${otp}। কোডটির মেয়াদ ১০ মিনিট। অনুগ্রহ করে কাউকে এই কোডটি বলবেন না।`,
      html: htmlContent
    });

    console.log(`✅ [Real Gmail OTP] Email delivered to ${email}. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      email,
      deliveryMethod: 'Direct Google Mail (smtp.gmail.com)'
    };
  } catch (err) {
    console.error(`❌ [Real Gmail OTP Error] Failed to deliver email to ${email}:`, err.message);
    throw err;
  }
}

/**
 * Tests connection with Gmail SMTP and sends a test email
 */
export async function testSmtpConnection({ user, pass, host, port, secure, testEmail }) {
  const testConfig = {
    user: (user || runtimeSmtp.user || '').trim(),
    pass: (pass || runtimeSmtp.pass || '').trim().replace(/\s+/g, ''),
    host: host || runtimeSmtp.host || 'smtp.gmail.com',
    port: Number(port) || runtimeSmtp.port || 465,
    secure: secure !== undefined ? secure : runtimeSmtp.secure
  };

  if (!testConfig.user || !testConfig.pass) {
    throw new Error('অনুগ্রহ করে জিমেইল ঠিকানা এবং Google App Password প্রদান করুন।');
  }

  const transporter = createTransporter(testConfig);
  if (!transporter) {
    throw new Error('Transporter initialization failed.');
  }

  // Verify SMTP credentials
  await transporter.verify();

  const recipient = testEmail || testConfig.user;
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  const info = await transporter.sendMail({
    from: `"EduTrack Bangladesh" <${testConfig.user}>`,
    to: recipient,
    subject: `✅ [টেস্ট সফল] EduTrack জিমেইল ওটিপি সেবা সক্রিয় হয়েছে (${testCode})`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #4f46e5;">🎉 EduTrack জিমেইল এসএমটিপি সংযোগ সফল!</h2>
        <p>আপনার জিমেইল অ্যাকাউন্ট (<strong>${testConfig.user}</strong>) এখন সম্পূর্ণভাবে সক্রিয়।</p>
        <p>টেস্ট ভেরিফিকেশন কোড: <strong style="font-size: 20px; font-family: monospace; background: #e0e7ff; padding: 4px 8px; border-radius: 6px;">${testCode}</strong></p>
        <p style="color: #64748b; font-size: 12px;">© 2026 EduTrack Bangladesh</p>
      </div>
    `
  });

  return {
    success: true,
    message: `সংযোগ সফল! টেস্ট ইমেইল পাঠানো হয়েছে: ${recipient}`,
    messageId: info.messageId
  };
}

/**
 * Returns current SMTP configuration status
 */
export function getSmtpConfig() {
  const isConfigured = !!(runtimeSmtp.user && runtimeSmtp.pass);
  return {
    host: runtimeSmtp.host,
    port: runtimeSmtp.port,
    secure: runtimeSmtp.secure,
    user: runtimeSmtp.user || '',
    configured: isConfigured,
    from: runtimeSmtp.from
  };
}

/**
 * Updates SMTP configuration and saves to disk (.env and settings.json)
 */
export function updateSmtpConfig(newConfig) {
  if (newConfig.user !== undefined) runtimeSmtp.user = newConfig.user.trim();
  if (newConfig.pass !== undefined) runtimeSmtp.pass = newConfig.pass.trim().replace(/\s+/g, '');
  if (newConfig.host) runtimeSmtp.host = newConfig.host;
  if (newConfig.port) runtimeSmtp.port = Number(newConfig.port);
  if (newConfig.secure !== undefined) runtimeSmtp.secure = !!newConfig.secure;
  if (newConfig.from) runtimeSmtp.from = newConfig.from;

  cachedTransporter = null;
  savePersistedSettings(runtimeSmtp);

  return getSmtpConfig();
}
