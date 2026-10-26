import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, updateDoc } from 'firebase/firestore';
import { raffleDoc, deleteRaffle as firestoreDeleteRaffle } from '../lib/firestore';
import { Raffle } from '../types';

export function useRaffle(raffleId?: string) {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!raffleId) {
      setRaffle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = raffleDoc(raffleId);
    const timer = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          setError('Loading timed out. Please check your internet connection or Firestore rules.');
          return false;
        }
        return current;
      });
    }, 12000);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        clearTimeout(timer);
        if (snapshot.exists()) {
          setRaffle(snapshot.data());
        } else {
          setRaffle(null);
          setError('Raffle not found');
        }
        setLoading(false);
      },
      (err) => {
        clearTimeout(timer);
        console.error('Error listening to raffle:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [raffleId, refreshKey]);

  const updateRaffle = useCallback(
    async (data: Partial<Omit<Raffle, 'id'>>) => {
      if (!raffleId) throw new Error('No raffle ID provided');
      const docRef = raffleDoc(raffleId);
      await updateDoc(docRef, data);
    },
    [raffleId]
  );

  const deleteRaffle = useCallback(async () => {
    if (!raffleId) throw new Error('No raffle ID provided');
    await firestoreDeleteRaffle(raffleId);
  }, [raffleId]);

  return {
    raffle,
    loading,
    error,
    refetch,
    updateRaffle,
    deleteRaffle,
  };
}

export default useRaffle;
