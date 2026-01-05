// Game composition
export interface GameComposition {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}

// Game phases
export type GamePhase =
  | "offline"
  | "pregame"
  | "day"
  | "firstNight"
  | "otherNight"
  | "postgame";

// Timer
export interface Timer {
  name: string;
  duration: number;
}

interface TimerDurations {
  daytime: number;
  nominations: number;
  dusk: number;
  accusation: number;
  defense: number;
  debate: number;
  custom: number;
  customDebate: number;
}

// Edition
export interface Edition {
  id: string;
  name: string;
  author?: string;
  logo?: string;
  background?: string;
  isOfficial?: boolean;
  roles?: string[];
}

// Gradient for UI
export interface Gradient {
  team: string;
  start: string;
  end: string;
}

// Script metadata
export interface ScriptMeta {
  id?: string;
  name?: string;
  author?: string;
  logo?: string;
}

export type Modals =
  | "edition"
  | "fabled"
  | "gameState"
  | "nightOrder"
  | "reference"
  | "reminder"
  | "role"
  | "roles"
  | "voteHistory"
  | "specialVote"
  | null;
