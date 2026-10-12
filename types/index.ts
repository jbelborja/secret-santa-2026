export type RaffleStatus = 'draft' | 'inviting' | 'drawn' | 'completed';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined';

export interface Raffle {
  id: string;
  name: string;
  topic: string;        // e.g. "Books", "Electronics", "Surprise"
  priceLimit: number;
  currency: string;     // e.g. "EUR", "USD"
  raffleDate: Date;
  giftDate: Date;
  status: RaffleStatus;
  managerId: string;    // Firebase Auth UID
  createdAt: Date;
  inviteCode: string;   // short alphanumeric code for shareable link
  coverImageUrl?: string;
  revealed: boolean;    // true after gift date passes, reveals all assignments
}

export interface Participant {
  id: string;           // Firestore doc ID (often == userId after acceptance)
  raffleId: string;
  userId?: string;      // Firebase Auth UID (set when they accept)
  name: string;
  email: string;        // stored for reference, no emails sent
  status: ParticipantStatus;
  exclusions: string[]; // participantIds they cannot be assigned to (enforced bidirectionally)
  assignedTo?: string;  // participantId of who they gift to (secret)
  giftGiven: boolean;
  expoPushToken?: string;
  joinedAt?: Date;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  expoPushToken?: string;
  createdAt: Date;
}

export interface DrawResult {
  success: boolean;
  assignments?: Record<string, string>; // giverParticipantId -> recipientParticipantId
  error?: string; // e.g. "No valid assignment exists - adjust exclusions"
}

export interface RaffleWithParticipants extends Raffle {
  participants: Participant[];
  myParticipant?: Participant; // the current user's participant record
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}
