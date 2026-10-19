import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { generateDrawEmailHtml } from './templates/drawEmail';
import { generateInviteEmailHtml } from './templates/inviteEmail';

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// SMTP transporter
// ---------------------------------------------------------------------------
const SMTP_USER = process.env.SMTP_USER || 'familiabelborja@gmail.com';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify SMTP connection on startup
transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP connection failed:', err.message);
  } else {
    console.log('✅ SMTP ready — connected to', process.env.SMTP_HOST || 'smtp.gmail.com');
  }
});

// ---------------------------------------------------------------------------
// POST /send-invite
// Body: { raffleId, raffleName, inviteCode, topic?, priceLimit, currency,
//         giftDate?, participantEmail, participantName, organizerName, appUrl }
// ---------------------------------------------------------------------------
app.post('/send-invite', async (req: Request, res: Response) => {
  const {
    participantEmail,
    participantName,
    organizerName,
    raffleName,
    inviteCode,
    topic,
    priceLimit,
    currency,
    giftDate,
    appUrl,
  } = req.body;

  if (!participantEmail || !raffleName || !inviteCode) {
    res.status(400).json({ error: 'participantEmail, raffleName and inviteCode are required.' });
    return;
  }

  const giftDateFormatted = giftDate
    ? new Date(giftDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Por confirmar';

  const baseUrl = appUrl || process.env.APP_URL || 'https://secret-santa-2026-4f5f6.web.app';
  const inviteUrl = `${baseUrl}/invite/${inviteCode}`;

  const html = generateInviteEmailHtml({
    inviteeName: participantName || 'Amigo',
    organizerName: organizerName || 'El Organizador',
    raffleName,
    inviteCode,
    topic,
    priceLimit: priceLimit || 0,
    currency: currency || 'EUR',
    giftDateFormatted,
    inviteUrl,
  });

  try {
    await transporter.sendMail({
      from: `"Amigo Invisible" <${SMTP_FROM}>`,
      to: participantEmail,
      subject: `💌 ¡Estás invitado al Amigo Invisible "${raffleName}"!`,
      html,
    });
    console.log(`✅ Invite email sent to ${participantEmail}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Failed to send invite email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /send-draw-emails
// Body: { raffleName, topic?, priceLimit, currency, giftDate?, appUrl,
//         participants: [{ name, email, recipientName }] }
// ---------------------------------------------------------------------------
app.post('/send-draw-emails', async (req: Request, res: Response) => {
  const {
    raffleName,
    topic,
    priceLimit,
    currency,
    giftDate,
    appUrl,
    raffleId,
    participants,
  } = req.body;

  if (!raffleName || !Array.isArray(participants) || participants.length === 0) {
    res.status(400).json({ error: 'raffleName and participants[] are required.' });
    return;
  }

  const giftDateFormatted = giftDate
    ? new Date(giftDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Por confirmar';

  const baseUrl = appUrl || process.env.APP_URL || 'https://secret-santa-2026-4f5f6.web.app';

  const results = await Promise.allSettled(
    participants.map(async (p: { name: string; email: string; recipientName: string }) => {
      if (!p.email || !p.email.includes('@')) {
        console.log(`Skipping "${p.name}" — no valid email`);
        return;
      }

      const html = generateDrawEmailHtml({
        giverName: p.name,
        recipientName: p.recipientName,
        raffleName,
        topic,
        priceLimit: priceLimit || 0,
        currency: currency || 'EUR',
        giftDateFormatted,
        appUrl: raffleId ? `${baseUrl}/raffle/${raffleId}/assignment` : baseUrl,
      });

      await transporter.sendMail({
        from: `"Amigo Invisible" <${SMTP_FROM}>`,
        to: p.email,
        subject: `🎅🎁 ¡Tu Amigo Invisible para "${raffleName}"!`,
        html,
      });
      console.log(`✅ Draw email sent to ${p.email} (${p.name})`);
    })
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`❌ ${failed.length} email(s) failed`);
  }

  res.json({
    success: true,
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: failed.length,
  });
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`🎅 Email server running on port ${PORT}`);
});
