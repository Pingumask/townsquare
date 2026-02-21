import type { Role } from "./roles";

export interface Reminder {
  id: string;
  role: Role;
  name: string;
  image?: string;
  imageAlt?: string;
}

export interface Player {
  name: string;
  id: string;
  role: Role;
  alignment?: Alignment;
  reminders: Reminder[];
  voteToken: boolean;
  isDead: boolean;
  pronouns: string;
  isMarked?: boolean;
  handRaised: boolean;
}

export type Alignment = "good" | "evil" | null | undefined;
