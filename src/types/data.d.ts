import type { Edition } from './game';
import type { Role } from './roles';

// Locale types
export interface LocaleData {
  [key: string]: unknown;
}

export interface LocaleModule {
  default: Record<string, unknown>;
}

// New unified data structure
export interface UnifiedDataJSON {
  editions: Edition[];
  nightOrder: {
    firstNight: string[];
    otherNight: string[];
  };
}

export interface ServerConfig {
  host: string;
  name: string;
}

// Legacy JSON/module shapes (kept for backward compatibility during migration)
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
