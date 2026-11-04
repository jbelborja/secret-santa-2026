import nodemailer from 'nodemailer';

/**
 * Shared nodemailer transporter for Gmail SMTP.
 * Created once per cold start and reused across invocations
 * within the same serverless instance.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER || 'familiabelborja@gmail.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

export const SMTP_FROM =
  process.env.SMTP_FROM || process.env.SMTP_USER || 'familiabelborja@gmail.com';

export default transporter;
