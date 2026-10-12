import { useState, useEffect, useCallback } from 'react';
import { getMyRaffles, getRafflesIParticipateIn } from '../lib/firestore';
import { useAuth } from './useAuth';
import { Raffle } from '../types';

export function useMyRaffles() {
  const { user } = useAuth();
  const [managedRaffles, setManagedRaffles] = useState<Raffle[]>([]);
  const [participatingRaffles, setParticipatingRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffles = useCallback(async () => {
    if (!user) {
      setManagedRaffles([]);
      setParticipatingRaffles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [managed, participating] = await Promise.all([
        getMyRaffles(user.uid),
        getRafflesIParticipateIn(user.uid),
      ]);

      // Filter out managed raffles from participating list if user participates in their own
      const filteredParticipating = participating.filter(
        (r) => r.managerId !== user.uid
      );

      setManagedRaffles(managed);
      setParticipatingRaffles(filteredParticipating);
    } catch (err: unknown) {
      console.error('Error fetching my raffles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch raffles');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRaffles();
  }, [fetchRaffles]);

  return {
    managedRaffles,
    participatingRaffles,
    loading,
    error,
    refetch: fetchRaffles,
  };
}

export default useMyRaffles;
