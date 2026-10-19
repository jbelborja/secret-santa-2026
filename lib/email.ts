const BASE_URL =
  process.env.EXPO_PUBLIC_EMAIL_SERVER_URL || 'http://localhost:3001';

/**
 * Send an invitation email to a participant via the standalone SMTP server.
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
  const res = await fetch(`${BASE_URL}/send-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      appUrl: process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Email server error: ${res.status}`);
  }
}

/**
 * Send the secret-assignment emails to all participants after the draw.
 * Call this from the app right after running the draw logic.
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
  }>;
}): Promise<{ sent: number; failed: number }> {
  const res = await fetch(`${BASE_URL}/send-draw-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      appUrl: process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Email server error: ${res.status}`);
  }

  return res.json();
}
