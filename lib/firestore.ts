import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  CollectionReference,
  DocumentReference,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { db } from './firebase';
import { Raffle, Participant, User, DrawResult } from '../types';
import { runDraw } from './draw';

export {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  collectionGroup,
};

// ---------------------------------------------------------
// Converters
// ---------------------------------------------------------

export const raffleConverter: FirestoreDataConverter<Raffle> = {
  toFirestore(raffle: Raffle) {
    return {
      name: raffle.name,
      topic: raffle.topic,
      priceLimit: raffle.priceLimit,
      currency: raffle.currency,
      raffleDate:
        raffle.raffleDate instanceof Date
          ? Timestamp.fromDate(raffle.raffleDate)
          : raffle.raffleDate,
      giftDate:
        raffle.giftDate instanceof Date
          ? Timestamp.fromDate(raffle.giftDate)
          : raffle.giftDate,
      status: raffle.status,
      managerId: raffle.managerId,
      createdAt:
        raffle.createdAt instanceof Date
          ? Timestamp.fromDate(raffle.createdAt)
          : raffle.createdAt || serverTimestamp(),
      inviteCode: raffle.inviteCode,
      coverImageUrl: raffle.coverImageUrl ?? null,
      revealed: raffle.revealed ?? false,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Raffle {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name ?? '',
      topic: data.topic ?? '',
      priceLimit: Number(data.priceLimit ?? 0),
      currency: data.currency ?? 'EUR',
      raffleDate:
        data.raffleDate instanceof Timestamp
          ? data.raffleDate.toDate()
          : data.raffleDate
          ? new Date(data.raffleDate)
          : new Date(),
      giftDate:
        data.giftDate instanceof Timestamp
          ? data.giftDate.toDate()
          : data.giftDate
          ? new Date(data.giftDate)
          : new Date(),
      status: data.status ?? 'draft',
      managerId: data.managerId ?? '',
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt
          ? new Date(data.createdAt)
          : new Date(),
      inviteCode: data.inviteCode ?? '',
      coverImageUrl: data.coverImageUrl ?? undefined,
      revealed: Boolean(data.revealed),
    };
  },
};

export const participantConverter: FirestoreDataConverter<Participant> = {
  toFirestore(participant: Participant) {
    return {
      raffleId: participant.raffleId,
      userId: participant.userId ?? null,
      name: participant.name,
      email: participant.email,
      status: participant.status,
      exclusions: participant.exclusions ?? [],
      assignedTo: participant.assignedTo ?? null,
      giftGiven: participant.giftGiven ?? false,
      expoPushToken: participant.expoPushToken ?? null,
      joinedAt:
        participant.joinedAt instanceof Date
          ? Timestamp.fromDate(participant.joinedAt)
          : participant.joinedAt || serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Participant {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      raffleId: data.raffleId ?? '',
      userId: data.userId ?? undefined,
      name: data.name ?? '',
      email: data.email ?? '',
      status: data.status ?? 'invited',
      exclusions: Array.isArray(data.exclusions) ? data.exclusions : [],
      assignedTo: data.assignedTo ?? undefined,
      giftGiven: Boolean(data.giftGiven),
      expoPushToken: data.expoPushToken ?? undefined,
      joinedAt:
        data.joinedAt instanceof Timestamp
          ? data.joinedAt.toDate()
          : data.joinedAt
          ? new Date(data.joinedAt)
          : undefined,
    };
  },
};

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User) {
    return {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL ?? null,
      expoPushToken: user.expoPushToken ?? null,
      createdAt:
        user.createdAt instanceof Date
          ? Timestamp.fromDate(user.createdAt)
          : user.createdAt || serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): User {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      displayName: data.displayName ?? '',
      email: data.email ?? '',
      photoURL: data.photoURL ?? undefined,
      expoPushToken: data.expoPushToken ?? undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt
          ? new Date(data.createdAt)
          : new Date(),
    };
  },
};

// ---------------------------------------------------------
// Typed Collection and Document References
// ---------------------------------------------------------

export function rafflesCollection(): CollectionReference<Raffle> {
  return collection(db, 'raffles').withConverter(raffleConverter);
}

export function raffleDoc(raffleId: string): DocumentReference<Raffle> {
  return doc(db, 'raffles', raffleId).withConverter(raffleConverter);
}

export function participantsCollection(
  raffleId: string
): CollectionReference<Participant> {
  return collection(db, 'raffles', raffleId, 'participants').withConverter(
    participantConverter
  );
}

export function participantDoc(
  raffleId: string,
  participantId: string
): DocumentReference<Participant> {
  return doc(
    db,
    'raffles',
    raffleId,
    'participants',
    participantId
  ).withConverter(participantConverter);
}

export function usersCollection(): CollectionReference<User> {
  return collection(db, 'users').withConverter(userConverter);
}

export function userDoc(userId: string): DocumentReference<User> {
  return doc(db, 'users', userId).withConverter(userConverter);
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

export function generateInviteCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omitted easily confused chars (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

export async function getRaffleByInviteCode(
  code: string
): Promise<Raffle | null> {
  const q = query(
    rafflesCollection(),
    where('inviteCode', '==', code.toUpperCase().trim())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data();
}

export async function deleteRaffle(raffleId: string): Promise<void> {
  const partsColl = participantsCollection(raffleId);
  const partsSnap = await getDocs(partsColl);

  const BATCH_SIZE = 400;
  if (!partsSnap.empty) {
    for (let i = 0; i < partsSnap.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = partsSnap.docs.slice(i, i + BATCH_SIZE);
      chunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      if (i + BATCH_SIZE >= partsSnap.docs.length) {
        batch.delete(raffleDoc(raffleId));
      }
      await batch.commit();
    }
  } else {
    await deleteDoc(raffleDoc(raffleId));
  }
}

export async function executeRaffleDraw(
  raffleId: string,
  participants: Participant[]
): Promise<DrawResult> {
  const result = runDraw(participants);
  if (!result.success || !result.assignments) {
    return result;
  }

  const batch = writeBatch(db);

  // 1. Assign each giver their recipient
  for (const [giverId, recipientId] of Object.entries(result.assignments)) {
    const pDoc = participantDoc(raffleId, giverId);
    batch.update(pDoc, { assignedTo: recipientId });
  }

  // 2. Mark any remaining unresponded 'invited' participants as 'declined'
  participants
    .filter((p) => p.status === 'invited')
    .forEach((p) => {
      const pDoc = participantDoc(raffleId, p.id);
      batch.update(pDoc, { status: 'declined' });
    });

  // 3. Update raffle status to 'drawn'
  const rDoc = raffleDoc(raffleId);
  batch.update(rDoc, { status: 'drawn' });

  await batch.commit();

  return result;
}

export async function completeRaffleExchange(raffleId: string): Promise<void> {
  const partsColl = participantsCollection(raffleId);
  const partsSnap = await getDocs(partsColl);

  const batch = writeBatch(db);
  batch.update(raffleDoc(raffleId), {
    status: 'completed',
    revealed: true,
  });

  partsSnap.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      giftGiven: true,
    });
  });

  await batch.commit();
}

export async function getMyRaffles(userId: string): Promise<Raffle[]> {
  const q = query(
    rafflesCollection(),
    where('managerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data());
}

export interface ParticipantRaffleItem {
  raffle: Raffle;
  participant: Participant;
}

export async function getRafflesIParticipateIn(
  userId: string,
  userEmail?: string
): Promise<ParticipantRaffleItem[]> {
  try {
    const participantDocsMap = new Map<string, Participant>();

    // 1. Query collectionGroup participants by userId
    const qUserId = query(
      collectionGroup(db, 'participants').withConverter(participantConverter),
      where('userId', '==', userId)
    );
    const snapUserId = await getDocs(qUserId);
    snapUserId.forEach((docSnap) => {
      const p = docSnap.data();
      const rId = p.raffleId || docSnap.ref.parent.parent?.id;
      if (rId) {
        participantDocsMap.set(rId, { ...p, raffleId: rId, id: docSnap.id });
      }
    });

    // 2. Query collectionGroup participants by email (for invited users who haven't claimed yet)
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (cleanEmail) {
      try {
        const qEmail = query(
          collectionGroup(db, 'participants').withConverter(participantConverter),
          where('email', '==', cleanEmail)
        );
        const snapEmail = await getDocs(qEmail);
        snapEmail.forEach((docSnap) => {
          const p = docSnap.data();
          const rId = p.raffleId || docSnap.ref.parent.parent?.id;
          if (rId && !participantDocsMap.has(rId)) {
            participantDocsMap.set(rId, { ...p, raffleId: rId, id: docSnap.id });
          }
        });
      } catch (emailErr) {
        console.warn('Collection group query on email notice:', emailErr);
      }
    }

    if (participantDocsMap.size === 0) {
      return [];
    }

    const rafflePromises = Array.from(participantDocsMap.entries()).map(
      async ([raffleId, participant]) => {
        const raffleSnap = await getDoc(raffleDoc(raffleId));
        if (raffleSnap.exists()) {
          return {
            raffle: raffleSnap.data(),
            participant,
          };
        }
        return null;
      }
    );

    const items = await Promise.all(rafflePromises);
    return items
      .filter((item): item is ParticipantRaffleItem => item !== null)
      .sort((a, b) => b.raffle.createdAt.getTime() - a.raffle.createdAt.getTime());
  } catch (err) {
    console.warn('getRafflesIParticipateIn notice:', err);
    return [];
  }
}
