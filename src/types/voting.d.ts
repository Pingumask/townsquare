// Special vote data
export interface SpecialVoteData {
  type: string; // The type of special vote (e.g., "bishop", "atheist", "cultleader", "custom")
  timerText?: string; // Text for the special vote timer (e.g., "wants to create a cult")
  debateText?: string; // Text for the debate timer (e.g., "Do you want to join $player's cult?")
  buttonLabel?: string; // Label for the timer button (e.g., "Cult")
}

// Nomination interface
export interface Nomination {
  nominator: number | string | null; // number for seat id, string for special votes, null for votes without nominator
  nominee: number | string | null; // number for seat id, string for special votes, null for votes without nominee
  specialVote?: SpecialVoteData; // additional data for special votes
}

// Vote history entry
export interface VoteHistoryEntry {
  timestamp: Date;
  nominator: string;
  nominee: string;
  type: string;
  majority: number;
  votes: string[] | null;
}
