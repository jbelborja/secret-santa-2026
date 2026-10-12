import { Participant, DrawResult } from '../types';

/**
 * Checks if a giver can be assigned to a recipient according to:
 * 1. A cannot give to themselves (giver.id !== recipient.id)
 * 2. Exclusions are BIDIRECTIONAL:
 *    - giver.exclusions does not contain recipient.id
 *    - recipient.exclusions does not contain giver.id
 */
export function canGiftTo(giver: Participant, recipient: Participant): boolean {
  if (giver.id === recipient.id) return false;

  const giverExcludesRecipient = giver.exclusions?.includes(recipient.id) ?? false;
  const recipientExcludesGiver = recipient.exclusions?.includes(giver.id) ?? false;

  if (giverExcludesRecipient || recipientExcludesGiver) {
    return false;
  }

  return true;
}

/**
 * Executes the Secret Santa draw client-side.
 * Uses randomized backtracking to ensure an unbiased, uniform distribution
 * over all valid derangements that satisfy bidirectional exclusions.
 */
export function runDraw(participants: Participant[]): DrawResult {
  const eligible = participants.filter((p) => p.status === 'accepted');

  if (eligible.length < 2) {
    return {
      success: false,
      error: 'At least 2 accepted participants are required to run the draw.',
    };
  }

  // Pre-build adjacency / compatibility list
  const compatibilityMap = new Map<string, Participant[]>();
  for (const giver of eligible) {
    const validRecipients = eligible.filter((rec) => canGiftTo(giver, rec));
    if (validRecipients.length === 0) {
      return {
        success: false,
        error: `Participant "${giver.name}" has no valid gift recipients due to exclusions. Please adjust exclusions and try again.`,
      };
    }
    compatibilityMap.set(giver.id, validRecipients);
  }

  // Shuffle givers order for randomization
  const givers = [...eligible].sort(() => Math.random() - 0.5);

  const assignments: Record<string, string> = {};
  const assignedRecipients = new Set<string>();

  function backtrack(index: number): boolean {
    if (index === givers.length) {
      return true;
    }

    const currentGiver = givers[index];
    const candidates = compatibilityMap.get(currentGiver.id) || [];

    // Shuffle candidate order for this giver to guarantee random selection
    const randomizedCandidates = [...candidates].sort(() => Math.random() - 0.5);

    for (const recipient of randomizedCandidates) {
      if (!assignedRecipients.has(recipient.id)) {
        // Assign
        assignments[currentGiver.id] = recipient.id;
        assignedRecipients.add(recipient.id);

        if (backtrack(index + 1)) {
          return true;
        }

        // Backtrack
        delete assignments[currentGiver.id];
        assignedRecipients.delete(recipient.id);
      }
    }

    return false;
  }

  const success = backtrack(0);

  if (!success) {
    return {
      success: false,
      error: 'No valid gift assignment exists that satisfies all exclusions. Please relax some exclusions and try again.',
    };
  }

  return {
    success: true,
    assignments,
  };
}
