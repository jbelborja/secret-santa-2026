const rawBaseUrl =
  process.env.EXPO_PUBLIC_EMAIL_SERVER_URL ||
  'https://secret-santa-2026-email-server.vercel.app';
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

/**
 * Send an invitation email to a participant via the Vercel email server (Gmail SMTP).
 */
export async function sendInviteEmail(params: {
  participantEmail: string;
  participantName: string;
  organizerName: string;
  raffleName: string;
  inviteCode: string;
  topic?: string;
  priceLimit?: number;
  currency?: string;
  giftDate?: string | null;
}): Promise<void> {
  const hostingUrl =
    process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL ||
    'https://jbelborja.github.io/secret-santa-2026';

  const res = await fetch(`${BASE_URL}/api/send-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      appUrl: hostingUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `Email server error ${res.status}`
    );
  }
}

/**
 * Send secret assignment emails to participants via the Vercel email server (Gmail SMTP).
 */
export async function sendDrawEmails(params: {
  raffleId: string;
  raffleName: string;
  topic?: string;
  priceLimit?: number;
  currency?: string;
  giftDate?: string | null;
  participants: Array<{
    name: string;
    email: string;
    recipientName: string;
    recipientSuggestions?: string;
  }>;
}): Promise<{ sent: number; failed: number }> {
  const hostingUrl =
    process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL ||
    'https://jbelborja.github.io/secret-santa-2026';

  const res = await fetch(`${BASE_URL}/api/send-draw-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      appUrl: hostingUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `Email server error ${res.status}`
    );
  }

  return res.json();
}
