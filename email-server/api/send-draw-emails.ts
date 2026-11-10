import type { VercelRequest, VercelResponse } from '@vercel/node';
import transporter, { SMTP_FROM } from '../lib/mailer';
import { generateDrawEmailHtml } from '../lib/templates/drawEmail';
import { cors } from '../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    return res
      .status(400)
      .json({ error: 'raffleName and participants[] are required.' });
  }

  const giftDateFormatted = giftDate
    ? new Date(giftDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Por confirmar';

  const baseUrl =
    appUrl || process.env.APP_URL || 'https://jbelborja.github.io/secret-santa-2026';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  const results = await Promise.allSettled(
    participants.map(
      async (p: {
        name: string;
        email: string;
        recipientName: string;
        recipientSuggestions?: string;
      }) => {
        if (!p.email || !p.email.includes('@')) {
          console.log(`Skipping "${p.name}" — no valid email`);
          return;
        }

        const html = generateDrawEmailHtml({
          giverName: p.name,
          recipientName: p.recipientName,
          recipientSuggestions: p.recipientSuggestions,
          raffleName,
          topic,
          priceLimit: priceLimit || 0,
          currency: currency || 'EUR',
          giftDateFormatted,
          appUrl: raffleId
            ? `${cleanBaseUrl}/raffle/${raffleId}/assignment`
            : cleanBaseUrl,
        });

        await transporter.sendMail({
          from: `"Amigo Invisible" <${SMTP_FROM}>`,
          to: p.email,
          subject: `🎅🎁 ¡Tu Amigo Invisible para "${raffleName}"!`,
          html,
        });
        console.log(`✅ Draw email sent to ${p.email} (${p.name})`);
      }
    )
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`❌ ${failed.length} email(s) failed`);
  }

  return res.json({
    success: true,
    sent: results.filter((r) => r.status === 'fulfilled').length,
    failed: failed.length,
  });
}
