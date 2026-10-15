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
      port: Number(smtpConfig.port) || 465,
      secure: smtpConfig.secure !== false,
      from: smtpConfig.from || `EduTrack Bangladesh <${smtpConfig.user || ''}>`
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(allSettings, null, 2), 'utf-8');

    // Also update server/.env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/^GMAIL_USER=.*$/m, `GMAIL_USER=${smtpConfig.user || ''}`);
      envContent = envContent.replace(/^GMAIL_APP_PASSWORD=.*$/m, `GMAIL_APP_PASSWORD=${smtpConfig.pass || ''}`);
      envContent = envContent.replace(/^SMTP_PORT=.*$/m, `SMTP_PORT=${smtpConfig.port || 465}`);
      envContent = envContent.replace(/^SMTP_SECURE=.*$/m, `SMTP_SECURE=${smtpConfig.secure !== false}`);
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
  pass: (savedSmtp.pass || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim().replace(/\s+/g, ''),
  from: savedSmtp.from || process.env.SMTP_FROM || ''
};

// Cached transporters
let cachedTransporters = new Map();

function getTransporterKey(config) {
  return `${config.host}:${config.port}:${config.secure}:${config.user}`;
}

/**
 * Creates and returns an optimized Nodemailer transporter
 */
function createTransporter(customConfig = null, overridePort = null, overrideSecure = null) {
  const base = customConfig || runtimeSmtp;
  const user = (base.user || '').trim();
  const pass = (base.pass || '').trim().replace(/\s+/g, '');
  const host = (base.host || 'smtp.gmail.com').trim();
  const port = overridePort !== null ? Number(overridePort) : (Number(base.port) || 465);
  const secure = overrideSecure !== null ? Boolean(overrideSecure) : (port === 465);

  if (!user || !pass) {
    return null;
  }

  const cacheKey = `${host}:${port}:${secure}:${user}`;
  if (!customConfig && cachedTransporters.has(cacheKey)) {
    return cachedTransporters.get(cacheKey);
  }

  const transportOptions = {
    host,
    port,
    secure,
    requireTLS: !secure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    connectionTimeout: 12000, // 12 seconds connection timeout
    greetingTimeout: 8000,
    socketTimeout: 20000,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  };

  const transporter = nodemailer.createTransport(transportOptions);

  if (!customConfig) {
    cachedTransporters.set(cacheKey, transporter);
  }

  return transporter;
}

/**
 * Clean sender email matching authenticated account
 */
function buildFromAddress(user) {
  return `"EduTrack Bangladesh" <${user}>`;
}

/**
 * Formats user-friendly error messages for Gmail SMTP errors
 */
function formatSmtpError(err) {
  const msg = err.message || '';
  if (msg.includes('535') || msg.includes('BadCredentials') || msg.includes('Username and Password not accepted') || err.code === 'EAUTH') {
    return 'গুগল এসএমটিপি অথেনটিকেশন ব্যর্থ হয়েছে: ১৬-সংখ্যার সঠিক Google App Password ব্যবহার করুন (myaccount.google.com/apppasswords)। সাধারণ জিমেইল পাসওয়ার্ড কাজ করবে না।';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('Connection timeout') || err.code === 'ETIMEDOUT') {
    return 'জিমেইল সার্ভারে সংযোগ সময়সীমা পার হয়েছে (Connection Timeout)। আপনার ইন্টারনেট সংযোগ অথবা পোর্ট ৪৫৫/৫৮৭ ব্লক রয়েছে কি না পরীক্ষা করুন।';
  }
  if (msg.includes('ECONNREFUSED') || err.code === 'ECONNREFUSED') {
    return 'জিমেইল এসএমটিপি পোর্টে সংযোগ প্রত্যাখ্যাত হয়েছে (Connection Refused)। ফায়ারওয়াল বা অ্যান্টিভাইরাস চেক করুন।';
  }
  if (msg.includes('550') || msg.includes('553') || msg.includes('Sender address rejected')) {
    return 'প্রেরক ইমেইল অ্যাড্রেসটি গুগল এসএমটিপি কর্তৃক প্রত্যাখ্যাত হয়েছে। নিশ্চিত করুন প্রেরক অ্যাড্রেস আপনার আসল জিমেইল।';
  }
  return msg;
}

/**
 * Sends an OTP email directly to the user's Gmail account with automatic port fallback (465 SSL -> 587 STARTTLS)
 */
export async function sendOtpEmail({ email, name, otp }) {
  if (!email) {
    throw new Error('Email address is required to dispatch OTP.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = runtimeSmtp.user?.trim();
  const pass = runtimeSmtp.pass?.trim();

  if (!user || !pass) {
    throw new Error(
      'জিমেইল এসএমটিপি কনফিগার করা নেই। দয়া করে জিমেইল ঠিকানা এবং ১৬-সংখ্যার Google App Password সেট করুন।'
    );
  }

  const fromSender = buildFromAddress(user);
  const nowDhaka = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduTrack OTP Verification</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4338ca 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 0; font-size: 13px; opacity: 0.9; }
      .content { padding: 32px 24px; }
      .greeting { font-size: 16px; margin-bottom: 12px; font-weight: 700; color: #1e293b; }
      .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
      .otp-box { background: #f8fafc; border: 2px dashed #6366f1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
      .otp-title { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #4f46e5; font-weight: 800; margin-bottom: 8px; }
      .otp-code { font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #1e1b4b; font-family: 'Courier New', Courier, monospace; margin: 6px 0; }
      .otp-notice { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
      .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
      .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
      .details-table td:first-child { color: #64748b; width: 38%; }
      .details-table td:last-child { color: #1e293b; font-weight: 600; }
      .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #991b1b; line-height: 1.5; }
      .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.6; }
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
          EduTrack বাংলাদেশ প্ল্যাটফর্মে আপনার অ্যাকাউন্ট নিবন্ধন/যাচাইকরণের অনুরোধ করা হয়েছে। আপনার জিমেইল অ্যাকাউন্টটি নিশ্চিত করতে নিচের ৬-সংখ্যার গোপন ওটিপি (OTP) ব্যবহার করুন:
        </p>

        <div class="otp-box">
          <div class="otp-title">আপনার ভেরিফিকেশন ওটিপি কোড (OTP)</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-notice">⏱ কোডটির মেয়াদ আগামী ১০ মিনিট (Expires in 10 minutes)</div>
        </div>

        <table class="details-table">
          <tr>
            <td>প্রাপক জিমেইল</td>
            <td><strong>${cleanEmail}</strong></td>
          </tr>
          <tr>
            <td>সেবার বিবরণ</td>
            <td>অ্যাকাউন্ট ভেরিফিকেশন (Account Activation)</td>
          </tr>
          <tr>
            <td>ইস্যুর সময়</td>
            <td>${nowDhaka} (BD Time)</td>
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

  const mailOptions = {
    from: fromSender,
    to: cleanEmail,
    replyTo: user,
    subject: `[EduTrack] ${otp} is your verification code (আপনার ওটিপি কোড)`,
    text: `আপনার EduTrack একাউন্ট ভেরিফিকেশন কোড: ${otp}\nYour EduTrack verification code is: ${otp}\n\nকোডটির মেয়াদ ১০ মিনিট। অনুগ্রহ করে কাউকে এই কোডটি বলবেন না।\nValid for 10 minutes. Please do not share this code.`,
    html: htmlContent,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'Priority': 'Urgent',
      'Importance': 'high',
      'X-MSMail-Priority': 'High',
      'X-Mailer': 'EduTrack Platform Mailer v2.0'
    }
  };

  // Primary attempt: default configured port (typically 465 SSL)
  let lastError = null;
  const primaryPort = Number(runtimeSmtp.port) || 465;
  const fallbackPort = primaryPort === 465 ? 587 : 465;

  try {
    const primaryTransporter = createTransporter(null, primaryPort, primaryPort === 465);
    if (!primaryTransporter) throw new Error('Primary transporter initialization failed.');

    const info = await primaryTransporter.sendMail(mailOptions);
    console.log(`✅ [Gmail OTP Delivered] To: ${cleanEmail} via port ${primaryPort}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      email: cleanEmail,
      deliveryMethod: `Google Mail (smtp.gmail.com:${primaryPort})`
    };
  } catch (err) {
    lastError = err;
    console.warn(`⚠️ [Gmail OTP Primary Port ${primaryPort} Failed]: ${err.message}. Attempting fallback port ${fallbackPort}...`);
  }

  // Automatic Fallback: Try alternate port (e.g. 587 STARTTLS)
  try {
    const fallbackTransporter = createTransporter(null, fallbackPort, fallbackPort === 465);
    if (!fallbackTransporter) throw lastError || new Error('Fallback transporter initialization failed.');

    const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
    console.log(`✅ [Gmail OTP Fallback Delivered] To: ${cleanEmail} via fallback port ${fallbackPort}. MessageId: ${fallbackInfo.messageId}`);
    return {
      success: true,
      messageId: fallbackInfo.messageId,
      email: cleanEmail,
      deliveryMethod: `Google Mail Fallback (smtp.gmail.com:${fallbackPort})`
    };
  } catch (fallbackErr) {
    console.error(`❌ [Real Gmail OTP All Ports Failed] for ${cleanEmail}:`, fallbackErr.message);
    const formatted = formatSmtpError(fallbackErr);
    throw new Error(formatted);
  }
}

/**
 * Tests connection with Gmail SMTP and sends a test verification email
 */
export async function testSmtpConnection({ user, pass, host, port, secure, testEmail }) {
  const cleanUser = (user || runtimeSmtp.user || '').trim();
  const cleanPass = (pass || runtimeSmtp.pass || '').trim().replace(/\s+/g, '');
  const cleanHost = (host || runtimeSmtp.host || 'smtp.gmail.com').trim();
  const cleanPort = Number(port) || Number(runtimeSmtp.port) || 465;
  const isSecure = secure !== undefined ? Boolean(secure) : (cleanPort === 465);

  if (!cleanUser || !cleanPass) {
    throw new Error('অনুগ্রহ করে জিমেইল ঠিকানা এবং Google App Password প্রদান করুন।');
  }

  const testConfig = {
    user: cleanUser,
    pass: cleanPass,
    host: cleanHost,
    port: cleanPort,
    secure: isSecure
  };

  const recipient = (testEmail || cleanUser).toLowerCase().trim();
  const testCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Try primary test config
  let activeTransporter = createTransporter(testConfig, cleanPort, isSecure);
  let usedPort = cleanPort;

  try {
    await activeTransporter.verify();
  } catch (err) {
    // If 465 failed, try 587
    const fallbackPort = cleanPort === 465 ? 587 : 465;
    console.warn(`⚠️ [SMTP Test] Port ${cleanPort} verify failed. Trying fallback port ${fallbackPort}...`);
    try {
      const fallbackTransporter = createTransporter(testConfig, fallbackPort, fallbackPort === 465);
      await fallbackTransporter.verify();
      activeTransporter = fallbackTransporter;
      usedPort = fallbackPort;
    } catch (fallbackErr) {
      const formatted = formatSmtpError(fallbackErr);
      throw new Error(`এসএমটিপি সংযোগ ব্যর্থ (${cleanHost}:${cleanPort}): ${formatted}`);
    }
  }

  const info = await activeTransporter.sendMail({
    from: buildFromAddress(cleanUser),
    to: recipient,
    replyTo: cleanUser,
    subject: `✅ [টেস্ট সফল] EduTrack জিমেইল ওটিপি সেবা সক্রিয় হয়েছে (${testCode})`,
    html: `
      <div style="font-family: sans-serif; padding: 24px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #4f46e5; margin-top: 0;">🎉 EduTrack জিমেইল এসএমটিপি সংযোগ সফল!</h2>
        <p>আপনার জিমেইল অ্যাকাউন্ট (<strong>${cleanUser}</strong>) এখন সম্পূর্ণভাবে সক্রিয়।</p>
        <p>পোর্ট: <strong>${usedPort}</strong> ${usedPort === 465 ? '(SSL)' : '(STARTTLS)'}</p>
        <div style="background: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
          <div style="font-size: 11px; color: #4338ca; font-weight: 700; text-transform: uppercase;">টেস্ট ভেরিফিকেশন কোড</div>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e1b4b; font-family: monospace;">${testCode}</div>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">© 2026 EduTrack Bangladesh</p>
      </div>
    `
  });

  return {
    success: true,
    message: `সংযোগ সফল! টেস্ট ইমেইল পৌঁছেছে: ${recipient} (পোর্ট: ${usedPort})`,
    messageId: info.messageId,
    usedPort
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
    from: runtimeSmtp.from || (runtimeSmtp.user ? buildFromAddress(runtimeSmtp.user) : '')
  };
}

/**
 * Updates SMTP configuration and saves to disk (.env and settings.json)
 */
export function updateSmtpConfig(newConfig) {
  if (newConfig.user !== undefined) runtimeSmtp.user = newConfig.user.trim();
  if (newConfig.pass !== undefined) runtimeSmtp.pass = newConfig.pass.trim().replace(/\s+/g, '');
  if (newConfig.host) runtimeSmtp.host = newConfig.host.trim();
  if (newConfig.port) runtimeSmtp.port = Number(newConfig.port);
  if (newConfig.secure !== undefined) runtimeSmtp.secure = !!newConfig.secure;
  if (newConfig.from) runtimeSmtp.from = newConfig.from.trim();

  // Invalidate cached transporters
  cachedTransporters.clear();
  savePersistedSettings(runtimeSmtp);

  return getSmtpConfig();
}
