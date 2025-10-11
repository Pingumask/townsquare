import type { Edition } from './game';
import type { Role } from './roles';

// Locale types
export interface LocaleData {
  [key: string]: unknown;
}

export interface LocaleModule {
  default: Record<string, unknown>;
}

// Shared JSON/module shapes used across store and plugins
export interface EditionsJSON {
  official: Edition[];
  popular: [string, string][];
  teensyville: [string, string][];
}

export interface HatredEntry {
  id: string;
  reason: string;
}

export interface JinxesJSON {
  default: { id: string; hatred: HatredEntry[] }[];
}

export interface RolesJSON {
  default: Role[];
}

export interface FabledJSON {
  default: Role[];
}
