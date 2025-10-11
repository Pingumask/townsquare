import type { Role } from "./roles";

// Player reminder interface
export interface Reminder {
  id: string;
  role: Role;
  name: string;
  image?: string;
  imageAlt?: string;
}

// Player interface
export interface Player {
  name: string;
  id: string;
  role: Role;
  alignment?: "good" | "evil" | null;
  reminders: Reminder[];
  voteToken: boolean;
  isDead: boolean;
  pronouns: string;
  isMarked?: boolean;
}

// Players state
export interface PlayersState {
  players: Player[];
  fabled: Role[];
  bluffs: Role[];
}
