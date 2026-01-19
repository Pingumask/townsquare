import type { Player } from "./players";
export interface Role {
  id: string;
  alternates?: string[]; // Alternate ids for roles that used to have a different official name
  name?: string;
  team?: TeamType;
  ability?: string;
  isCustom?: boolean;
  edition?: string;
  firstNight?: number;
  otherNight?: number;
  firstNightEdition?: number;
  otherNightEdition?: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  image?: string|string[];
  imageAlt?: string;
  forbidden?: boolean;
  multiple?: boolean;
}

// Extended role interfaces
export interface NightOrderRole extends Role {
  players: Player[];
  firstNightReminder?: string;
  otherNightReminder?: string;
}

export interface SelectableRole extends Role {
  selected: number;
  multiple?: boolean;
}

export interface ToggleableRole extends Role {
  selected?: boolean;
}

export interface RoleGroup {
  [team: string]: SelectableRole[];
}

export interface ParsedRole {
  id: string;
  edition?: string;
  image?: string|string[];
}

export interface JinxInfo {
  first: Role;
  second: Role;
  reason: string;
}

export type TeamType =
  | "default"
  | "townsfolk"
  | "outsider"
  | "minion"
  | "demon"
  | "traveler"
  | "fabled"
  | "loric";
