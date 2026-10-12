import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { participantsCollection, participantDoc } from '../lib/firestore';
import { Participant } from '../types';

export function useParticipants(raffleId?: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raffleId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const coll = participantsCollection(raffleId);
    const q = query(coll, orderBy('joinedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Participant[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        setParticipants(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching participants:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [raffleId]);

  const addParticipant = useCallback(
    async (name: string, email: string): Promise<string> => {
      if (!raffleId) throw new Error('No raffle ID provided');

      const coll = participantsCollection(raffleId);
      const docRef = await addDoc(coll, {
        id: '',
        raffleId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        status: 'invited',
        exclusions: [],
        giftGiven: false,
        joinedAt: new Date(),
      });

      return docRef.id;
    },
    [raffleId]
  );

  const removeParticipant = useCallback(
    async (participantId: string): Promise<void> => {
      if (!raffleId) throw new Error('No raffle ID provided');

      const batch = writeBatch(db);
      const targetDoc = participantDoc(raffleId, participantId);
      batch.delete(targetDoc);

      // Clean up exclusions referencing this participant in other documents
      for (const p of participants) {
        if (p.id !== participantId && p.exclusions?.includes(participantId)) {
          const pDoc = participantDoc(raffleId, p.id);
          const newExclusions = p.exclusions.filter((id) => id !== participantId);
          batch.update(pDoc, { exclusions: newExclusions });
        }
      }

      await batch.commit();
    },
    [raffleId, participants]
  );

  const toggleExclusion = useCallback(
    async (participantId: string, targetId: string): Promise<void> => {
      if (!raffleId) throw new Error('No raffle ID provided');
      if (participantId === targetId) return;

      const p1 = participants.find((p) => p.id === participantId);
      const p2 = participants.find((p) => p.id === targetId);
      if (!p1 || !p2) return;

      const isCurrentlyExcluded =
        p1.exclusions?.includes(targetId) || p2.exclusions?.includes(participantId);

      const batch = writeBatch(db);
      const doc1 = participantDoc(raffleId, participantId);
      const doc2 = participantDoc(raffleId, targetId);

      if (isCurrentlyExcluded) {
        // Remove bidirectional exclusion
        const newExcl1 = (p1.exclusions || []).filter((id) => id !== targetId);
        const newExcl2 = (p2.exclusions || []).filter((id) => id !== participantId);
        batch.update(doc1, { exclusions: newExcl1 });
        batch.update(doc2, { exclusions: newExcl2 });
      } else {
        // Add bidirectional exclusion
        const newExcl1 = Array.from(new Set([...(p1.exclusions || []), targetId]));
        const newExcl2 = Array.from(new Set([...(p2.exclusions || []), participantId]));
        batch.update(doc1, { exclusions: newExcl1 });
        batch.update(doc2, { exclusions: newExcl2 });
      }

      await batch.commit();
    },
    [raffleId, participants]
  );

  const markGiftGiven = useCallback(
    async (participantId: string, giftGiven: boolean): Promise<void> => {
      if (!raffleId) throw new Error('No raffle ID provided');
      const docRef = participantDoc(raffleId, participantId);
      await updateDoc(docRef, { giftGiven });
    },
    [raffleId]
  );

  return {
    participants,
    loading,
    error,
    addParticipant,
    removeParticipant,
    toggleExclusion,
    markGiftGiven,
  };
}

export default useParticipants;
