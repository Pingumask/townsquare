// Game composition
export interface GameComposition {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}

// Game info (similar to GameComposition but separate interface)
export interface GameInfo {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}

// Game phases
export type GamePhase = "pregame" | "day" | "firstNight" | "otherNight" | "postgame";

// Timer
export interface Timer {
  name: string;
  duration: number;
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
