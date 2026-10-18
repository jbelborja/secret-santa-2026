import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { generateDrawEmailHtml } from './templates/drawEmail';
import { generateInviteEmailHtml } from './templates/inviteEmail';

admin.initializeApp();
const db = admin.firestore();

/**
 * Configure Nodemailer transport with Gmail SMTP
 */
function createMailTransporter() {
  const user = process.env.SMTP_USER || 'familiabelborja@gmail.com';
  const pass = process.env.SMTP_PASSWORD;

  if (!pass) {
    console.warn('⚠️ SMTP_PASSWORD is not set. Emails cannot be delivered.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Triggered when a Raffle document is updated in Firestore.
 * When status changes to 'drawn', sends secret match emails to all participants.
 */
export const onRaffleDrawn = onDocumentUpdated(
  'raffles/{raffleId}',
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const raffleId = event.params.raffleId;

    if (!beforeData || !afterData) {
      return;
    }

    // Only execute if status just changed to 'drawn'
    if (beforeData.status === 'drawn' || afterData.status !== 'drawn') {
      return;
    }

    console.log(`🎁 Raffle ${raffleId} ("${afterData.name}") status changed to 'drawn'. Preparing emails...`);

    const transporter = createMailTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'familiabelborja@gmail.com';

    // Fetch participants
    const partsSnap = await db
      .collection('raffles')
      .doc(raffleId)
      .collection('participants')
      .get();

    if (partsSnap.empty) {
      console.warn(`No participants found in raffle ${raffleId}`);
      return;
    }

    // Build participant lookup map: id -> name
    const participantMap = new Map<string, string>();
    const participantsList: Array<{
      id: string;
      name: string;
      email: string;
      assignedTo?: string;
    }> = [];

    partsSnap.forEach((doc) => {
      const data = doc.data();
      participantMap.set(doc.id, data.name || 'Amigo Invisible');
      participantsList.push({
        id: doc.id,
        name: data.name || 'Participante',
        email: data.email || '',
        assignedTo: data.assignedTo,
      });
    });

    // Format gift date
    let giftDateFormatted = 'Por confirmar';
    if (afterData.giftDate) {
      const d = afterData.giftDate.toDate ? afterData.giftDate.toDate() : new Date(afterData.giftDate);
      giftDateFormatted = d.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const appUrl =
      process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL ||
      'https://secret-santa-2026-4f5f6.web.app';

    // Send emails in parallel
    const emailPromises = participantsList.map(async (giver) => {
      if (!giver.email || !giver.email.includes('@')) {
        console.log(`Skipping participant "${giver.name}" (no valid email: "${giver.email}")`);
        return;
      }

      if (!giver.assignedTo || !participantMap.has(giver.assignedTo)) {
        console.warn(`Participant "${giver.name}" has no valid assigned recipient`);
        return;
      }

      const recipientName = participantMap.get(giver.assignedTo)!;

      const html = generateDrawEmailHtml({
        giverName: giver.name,
        recipientName,
        raffleName: afterData.name,
        topic: afterData.topic,
        priceLimit: afterData.priceLimit || 0,
        currency: afterData.currency || 'EUR',
        giftDateFormatted,
        appUrl: `${appUrl}/raffle/${raffleId}/assignment`,
      });

      try {
        await transporter.sendMail({
          from: `"Amigo Invisible" <${fromAddress}>`,
          to: giver.email,
          subject: `🎅🎁 ¡Tu Amigo Invisible para "${afterData.name}"!`,
          html,
        });
        console.log(`✅ Secret Santa email sent to ${giver.email} (${giver.name})`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${giver.email}:`, err);
      }
    });

    await Promise.allSettled(emailPromises);
    console.log(`✨ Finished processing draw emails for raffle ${raffleId}`);
  }
);

/**
 * Callable function to send an invitation email to a participant
 */
export const sendInviteEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be signed in to send invitations.');
  }

  const { raffleId, participantEmail, participantName } = request.data;
  if (!raffleId || !participantEmail) {
    throw new HttpsError('invalid-argument', 'raffleId and participantEmail are required.');
  }

  const raffleSnap = await db.collection('raffles').doc(raffleId).get();
  if (!raffleSnap.exists) {
    throw new HttpsError('not-found', 'Raffle does not exist.');
  }

  const raffleData = raffleSnap.data()!;
  const transporter = createMailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'familiabelborja@gmail.com';

  let giftDateFormatted = 'Por confirmar';
  if (raffleData.giftDate) {
    const d = raffleData.giftDate.toDate ? raffleData.giftDate.toDate() : new Date(raffleData.giftDate);
    giftDateFormatted = d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const appUrl =
    process.env.EXPO_PUBLIC_FIREBASE_HOSTING_URL ||
    'https://secret-santa-2026-4f5f6.web.app';

  const inviteUrl = `${appUrl}/invite/${raffleData.inviteCode}`;

  const html = generateInviteEmailHtml({
    inviteeName: participantName || 'Amigo',
    organizerName: request.auth.token.name || 'El Organizador',
    raffleName: raffleData.name,
    inviteCode: raffleData.inviteCode,
    topic: raffleData.topic,
    priceLimit: raffleData.priceLimit || 0,
    currency: raffleData.currency || 'EUR',
    giftDateFormatted,
    inviteUrl,
  });

  try {
    await transporter.sendMail({
      from: `"Amigo Invisible" <${fromAddress}>`,
      to: participantEmail,
      subject: `💌 ¡Estás invitado al Amigo Invisible "${raffleData.name}"!`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to send invite email:', err);
    throw new HttpsError('internal', err?.message || 'Could not send invitation email.');
  }
});
