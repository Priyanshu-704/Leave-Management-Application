const Setting = require("../models/Setting");

const getBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
};

const getEmailConfig = async () => {
  let settingsEmailConfig = null;
  try {
    const settings = await Setting.getSettings();
    settingsEmailConfig = settings?.emailSettings || null;
  } catch (error) {
    settingsEmailConfig = null;
  }

  const host = settingsEmailConfig?.smtpHost || process.env.SMTP_HOST;
  const port = Number(settingsEmailConfig?.smtpPort || process.env.SMTP_PORT || 587);
  const secure = getBool(
    settingsEmailConfig?.smtpSecure ?? process.env.SMTP_SECURE,
    port === 465,
  );
  const user = settingsEmailConfig?.smtpUser || process.env.SMTP_USER;
  const pass = settingsEmailConfig?.smtpPassword || process.env.SMTP_PASS;
  const fromEmail =
    settingsEmailConfig?.fromEmail || process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromName = settingsEmailConfig?.fromName || "LeaveFlow";

  if (!host || !port || !user || !pass || !fromEmail) {
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
  };
};

const sendEmail = async ({ to, subject, text, html }) => {
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    throw new Error("Email service unavailable. Please install nodemailer.");
  }

  const config = await getEmailConfig();
  if (!config) {
    throw new Error(
      "Email configuration is incomplete. Configure SMTP in settings or environment.",
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = "Reset Your LeaveFlow Password";
  const text = `Hello ${name},\n\nReset your password using this link: ${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your LeaveFlow password.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
      </p>
      <p style="word-break: break-all;">If the button does not work, use this link: ${resetUrl}</p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

const sendAccountCredentialsEmail = async ({
  to,
  name,
  email,
  password,
  loginUrl,
}) => {
  const subject = "Your LeaveFlow Account Credentials";
  const text = `Hello ${name},\n\nYour LeaveFlow account has been created.\n\nEmail: ${email}\nPassword: ${password}\nLogin: ${loginUrl}\n\nPlease sign in and change your password immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Welcome to LeaveFlow</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created. Use these credentials to sign in:</p>
      <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
      <p>
        <a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          Open Login
        </a>
      </p>
      <p>For security, please change your password after login.</p>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

const sendTwoFactorCodeEmail = async ({ to, name, code, deviceName }) => {
  const subject = "Your LeaveFlow verification code";
  const text = `Hello ${name},\n\nYour verification code is: ${code}\n\nDevice: ${deviceName}\nThis code expires in 10 minutes.\n\nIf this was not you, please reset your password immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>Two-Factor Verification Code</h2>
      <p>Hello ${name},</p>
      <p>Use this code to complete your sign in:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p><strong>Device:</strong> ${deviceName}</p>
      <p>This code will expire in 10 minutes.</p>
      <p>If this was not you, reset your password immediately.</p>
    </div>
  `;
  await sendEmail({ to, subject, text, html });
};

const sendNewDeviceLoginAlertEmail = async ({ to, name, deviceName, ipAddress, loginAt }) => {
  const subject = "New device sign-in alert";
  const when = loginAt ? new Date(loginAt).toISOString() : new Date().toISOString();
  const text = `Hello ${name},\n\nA new device signed in to your LeaveFlow account.\n\nDevice: ${deviceName}\nIP: ${ipAddress || "N/A"}\nTime: ${when}\n\nIf this was not you, reset your password immediately.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>New Device Sign-In Alert</h2>
      <p>Hello ${name},</p>
      <p>A new device signed in to your LeaveFlow account.</p>
      <p><strong>Device:</strong> ${deviceName}<br/><strong>IP:</strong> ${ipAddress || "N/A"}<br/><strong>Time:</strong> ${when}</p>
      <p>If this was not you, reset your password immediately.</p>
    </div>
  `;
  await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendAccountCredentialsEmail,
  sendTwoFactorCodeEmail,
  sendNewDeviceLoginAlertEmail,
};
