import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, updateDoc } from 'firebase/firestore';
import { raffleDoc } from '../lib/firestore';
import { Raffle } from '../types';

export function useRaffle(raffleId?: string) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raffleId) {
      setRaffle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = raffleDoc(raffleId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRaffle(snapshot.data());
        } else {
          setRaffle(null);
          setError('Raffle not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to raffle:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [raffleId]);

  const updateRaffle = useCallback(
    async (data: Partial<Omit<Raffle, 'id'>>) => {
      if (!raffleId) throw new Error('No raffle ID provided');
      const docRef = raffleDoc(raffleId);
      await updateDoc(docRef, data);
    },
    [raffleId]
  );

  return {
    raffle,
    loading,
    error,
    updateRaffle,
  };
}

export default useRaffle;
