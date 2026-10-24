import { useState, useEffect, useCallback } from 'react';
import { getMyRaffles, getRafflesIParticipateIn } from '../lib/firestore';
import { useAuth } from './useAuth';
import { Raffle } from '../types';

export function useMyRaffles() {
  const { user } = useAuth();
  const [managedRaffles, setManagedRaffles] = useState<Raffle[]>([]);
  const [participatingRaffles, setParticipatingRaffles] = useState<Raffle[]>([]);
  const [pendingRaffles, setPendingRaffles] = useState<Raffle[]>([]);
  const [pastRaffles, setPastRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaffles = useCallback(async () => {
    if (!user) {
      setManagedRaffles([]);
      setParticipatingRaffles([]);
      setPendingRaffles([]);
      setPastRaffles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [managed, participatingData] = await Promise.all([
        getMyRaffles(user.uid),
        getRafflesIParticipateIn(user.uid, user.email || undefined),
      ]);

      const now = Date.now();
      const isPast = (r: Raffle) =>
        r.status === 'completed' ||
        (r.status === 'drawn' && new Date(r.giftDate).getTime() < now);

      const pastMap = new Map<string, Raffle>();
      const activeManaged: Raffle[] = [];
      const activeParticipating: Raffle[] = [];
      const pendingMap = new Map<string, Raffle>();

      // 1. Process managed raffles
      for (const r of managed) {
        if (isPast(r)) {
          pastMap.set(r.id, r);
        } else {
          activeManaged.push(r);
        }
      }

      // 2. Process participating and pending raffles
      for (const { raffle: r, participant: p } of participatingData) {
        // If managed by current user, it was already handled above
        if (r.managerId === user.uid) {
          continue;
        }

        if (isPast(r)) {
          pastMap.set(r.id, r);
        } else if (p.status === 'invited') {
          pendingMap.set(r.id, r);
        } else if (p.status === 'accepted') {
          activeParticipating.push(r);
        }
      }

      setManagedRaffles(activeManaged);
      setParticipatingRaffles(activeParticipating);
      setPendingRaffles(Array.from(pendingMap.values()));
      setPastRaffles(Array.from(pastMap.values()));
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
    pendingRaffles,
    pastRaffles,
    loading,
    error,
    refetch: fetchRaffles,
  };
}

export default useMyRaffles;
