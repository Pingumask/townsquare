import type { Player } from "./players";
export interface Role {
  id: string;
  alternates?: string[]; // Alternate ids for roles that used to have a different official name
  name?: string;
  team?: TeamType;
  ability?: string;
  flavor?: string; // New field from unified data structure
  isCustom?: boolean;
  edition?: string;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  image?: string | string[];
  imageAlt?: string;
  forbidden?: boolean;
  multiple?: boolean;
  jinxes?: JinxEntry[]; // New field for embedded jinxes
}

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

// Role grouping
export interface RoleGroup {
  [team: string]: SelectableRole[];
}

// Script parsing
export interface ParsedRole {
  id: string;
  edition?: string;
  image?: string;
}

// Jinx-related types
export interface JinxEntry {
  id: string;
  reason: string;
}

export interface JinxInfo {
  first: Role;
  second: Role;
  reason: string;
}

// Team type
export type TeamType =
  | "townsfolk"
  | "outsider"
  | "minion"
  | "demon"
  | "traveler"
  | "fabled"
  | "default"
  | "loric";
