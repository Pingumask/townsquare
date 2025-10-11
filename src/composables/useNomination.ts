import type { Nomination, SpecialVoteData, Player } from '@/types';

/**
 * Composable for nomination-related utilities and type guards
 */
export function useNomination() {
  /**
   * Type guard to check if a nomination is active (not null)
   */
  const isActiveNomination = (
    nomination: Nomination | null,
  ): nomination is Nomination => {
    return nomination !== null && typeof nomination === "object";
  };

  /**
   * Type guard to check if a nomination is a standard nomination
   * (has numeric nominator and nominee, no special vote data)
   */
  const isStandardNomination = (
    nomination: Nomination | null,
  ): nomination is Nomination & { nominator: number; nominee: number } => {
    return (
      isActiveNomination(nomination) &&
      typeof nomination.nominator === "number" &&
      typeof nomination.nominee === "number" &&
      !nomination.specialVote
    );
  };

  /**
   * Type guard to check if a nomination is a special vote
   */
  const isSpecialVote = (
    nomination: Nomination | null,
  ): nomination is Nomination & { specialVote: SpecialVoteData } => {
    return isActiveNomination(nomination) && !!nomination.specialVote;
  };

  /**
   * Check if a nomination is a traveler exile
   */
  const isTravelerExile = (
    nomination: Nomination | null,
    players: Player[],
  ): boolean => {
    if (!isStandardNomination(nomination)) return false;
    const nominee = players[nomination.nominee];
    return nominee?.role?.team === "traveler";
  };

  /**
   * Helper function to create a standard nomination
   */
  const createStandardNomination = (
    nominator: number,
    nominee: number,
  ): Nomination => {
    return { nominator, nominee };
  };

  /**
   * Helper function to create a special vote nomination
   */
  const createSpecialVote = (
    nominator: number | string | null,
    nominee: number | string | null,
    specialVoteData: SpecialVoteData,
  ): Nomination => {
    return { nominator, nominee, specialVote: specialVoteData };
  };

  return {
    isActiveNomination,
    isStandardNomination,
    isSpecialVote,
    isTravelerExile,
    createStandardNomination,
    createSpecialVote,
  };
}

// Export individual functions for direct import
export const {
  isActiveNomination,
  isStandardNomination,
  isSpecialVote,
  isTravelerExile,
  createStandardNomination,
  createSpecialVote,
} = useNomination();
