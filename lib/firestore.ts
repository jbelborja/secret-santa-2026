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
import { Raffle, Participant, User } from '../types';

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

export async function getMyRaffles(userId: string): Promise<Raffle[]> {
  const q = query(
    rafflesCollection(),
    where('managerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data());
}

export async function getRafflesIParticipateIn(
  userId: string
): Promise<Raffle[]> {
  const participantGroupQuery = query(
    collectionGroup(db, 'participants').withConverter(participantConverter),
    where('userId', '==', userId)
  );

  const participantSnapshots = await getDocs(participantGroupQuery);
  const raffleIds = new Set<string>();

  participantSnapshots.forEach((docSnap) => {
    const participant = docSnap.data();
    if (participant.raffleId) {
      raffleIds.add(participant.raffleId);
    } else if (docSnap.ref.parent.parent?.id) {
      raffleIds.add(docSnap.ref.parent.parent.id);
    }
  });

  if (raffleIds.size === 0) {
    return [];
  }

  const rafflePromises = Array.from(raffleIds).map(async (id) => {
    const raffleSnap = await getDoc(raffleDoc(id));
    return raffleSnap.exists() ? raffleSnap.data() : null;
  });

  const raffles = await Promise.all(rafflePromises);
  return raffles
    .filter((r): r is Raffle => r !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
