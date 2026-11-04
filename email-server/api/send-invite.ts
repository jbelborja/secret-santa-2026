import type { VercelRequest, VercelResponse } from '@vercel/node';
import transporter, { SMTP_FROM } from '../lib/mailer';
import { generateInviteEmailHtml } from '../lib/templates/inviteEmail';
import { cors } from '../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    return res
      .status(400)
      .json({ error: 'participantEmail, raffleName and inviteCode are required.' });
  }

  const giftDateFormatted = giftDate
    ? new Date(giftDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Por confirmar';

  const baseUrl =
    appUrl || process.env.APP_URL || 'https://jbelborja.github.io/secret-santa-2026';
  const inviteUrl = `${baseUrl.replace(/\/+$/, '')}/invite/${inviteCode}`;

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
    return res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Failed to send invite email:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
