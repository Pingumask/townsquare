// Player types
export interface Reminder {
  id: string;
  role: string;
  name: string;
  image?: string;
  imageAlt?: string;
}

// Store-related types
export interface Player {
  name: string;
  id: string;
  role: Role;
  reminders: Reminder[];
  voteToken: boolean;
  isDead: boolean;
  pronouns: string;
  isMarked?: boolean;
}

export interface GameComposition {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
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
  outOfDate?: boolean;
}

export interface RoleGroup {
  [team: string]: SelectableRole[];
}

// Store state types
export interface Timer {
  name: string;
  duration: number;
}

export interface GrimoireState {
  isNight: boolean;
  isNightOrder: boolean;
  isRinging: boolean;
  isRooster: boolean;
  isPublic: boolean;
  isMenuOpen: boolean;
  isStatic: boolean;
  isMuted: boolean;
  isImageOptIn: boolean;
  isStreamerMode: boolean;
  isOrganVoteMode: boolean;
  zoom: number;
  background: string;
  timer: Timer;
}

export interface Modals {
  edition: boolean;
  fabled: boolean;
  gameState: boolean;
  nightOrder: boolean;
  reference: boolean;
  reminder: boolean;
  role: boolean;
  roles: boolean;
  voteHistory: boolean;
  specialVote: boolean;
}

export interface Edition {
  id: string;
  name: string;
  author?: string;
  logo?: string;
  background?: string;
  isOfficial?: boolean;
  roles?: string[];
}

export interface VoteHistoryEntry {
  timestamp: Date;
  nominator: string;
  nominee: string;
  type: string;
  majority: number;
  votes: string[] | null;
}

export interface SessionState {
  sessionId: string;
  isSpectator: boolean;
  isReconnecting: boolean;
  playerCount: number;
  ping: number;
  playerId: string;
  claimedSeat: number;
  nomination: Nomination | null;
  votes: boolean[];
  lockedVote: number;
  votingSpeed: number;
  isVoteInProgress: boolean;
  voteHistory: VoteHistoryEntry[];
  markedPlayer: number;
  playerForSpecialVote: number;
  isVoteHistoryAllowed: boolean;
  isRolesDistributed: boolean;
}

export interface PlayersState {
  players: Player[];
  fabled: Role[];
  bluffs: Role[];
}

export interface Role {
  id: string;
  name?: string;
  team?: 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'default';
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
  image?: string;
  imageAlt?: string;
  forbidden?: boolean;
  multiple?: boolean;
}

// Duplicate interfaces removed - already defined above

// Locale types
export interface LocaleData {
  [key: string]: unknown;
}

// Socket message types
export interface SocketMessage {
  command: string;
  params: unknown;
}

// Game info types
export interface GameInfo {
  townsfolk: number;
  outsider: number;
  minion: number;
  demon: number;
}

// Event interfaces (reusable across components)
export interface PlayerUpdateEvent {
  property: string;
  value: unknown;
}

export interface TriggerEvent {
  action: string;
  params?: unknown;
}

// Gradient interface
export interface Gradient {
  team: string;
  start: string;
  end: string;
}

// Jinx-related types
export interface JinxInfo {
  first: Role;
  second: Role;
  reason: string;
}

// Script parsing types
export interface ParsedRole {
  id: string;
  edition?: string;
  image?: string;
}

export interface ScriptMeta {
  id?: string;
  name?: string;
  author?: string;
  logo?: string;
}

export interface Nomination {
  nominator: number | string | null; // number for seat id, string for special votes, null for votes without nominator
  nominee: number | string | null;   // number for seat id, string for special votes, null for votes without nominee
  specialVote?: SpecialVoteData;      // additional data for special votes
}

export interface SpecialVoteData {
  type: string;                // The type of special vote (e.g., "bishop", "atheist", "cultleader", "custom")
  timerText?: string;          // Text for the special vote timer (e.g., "wants to create a cult")
  debateText?: string;         // Text for the debate timer (e.g., "Do you want to join $player's cult?")
  buttonLabel?: string;        // Label for the timer button (e.g., "Cult")
}

// Type guards for nomination data
export function isActiveNomination(nomination: Nomination | null): nomination is Nomination {
  return nomination !== null && typeof nomination === 'object';
}

export function isStandardNomination(nomination: Nomination | null): nomination is Nomination & { nominator: number; nominee: number } {
  return isActiveNomination(nomination) &&
    typeof nomination.nominator === 'number' &&
    typeof nomination.nominee === 'number' &&
    !nomination.specialVote;
}

export function isSpecialVote(nomination: Nomination | null): nomination is Nomination & { specialVote: SpecialVoteData } {
  return isActiveNomination(nomination) && !!nomination.specialVote;
}

export function istravellerExile(nomination: Nomination | null, players: Player[]): boolean {
  if (!isStandardNomination(nomination)) return false;
  const nominee = players[nomination.nominee];
  return nominee?.role?.team === 'traveller';
}

// Helper functions to create nominations
export function createStandardNomination(nominator: number, nominee: number): Nomination {
  return { nominator, nominee };
}

export function createSpecialVote(
  nominator: number | string | null,
  nominee: number | string | null,
  specialVoteData: SpecialVoteData
): Nomination {
  return { nominator, nominee, specialVote: specialVoteData };
}

// Utility types
export type TeamType = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled';
export type GamePhase = 'setup' | 'firstNight' | 'day' | 'otherNight' | 'ended';


// Shared JSON/module shapes used across store and plugins
export interface EditionsJSON {
  official: Edition[];
  popular: [string, string][];
  teensyville: [string, string][];
}
export interface HatredEntry { id: string; reason: string }
export interface JinxesJSON { default: { id: string; hatred: HatredEntry[] }[] }
export interface RolesJSON { default: Role[] }
export interface FabledJSON { default: Role[] }
export interface LocaleModule { default: Record<string, unknown> }

// RootState used by Vuex store and socket/persistence plugins
export interface RootState {
  grimoire: GrimoireState;
  modals: Modals;
  edition?: Edition; // optional — may be undefined initially
  editions: EditionsJSON;
  roles: Map<string, Role>;
  othertravellers: Map<string, Role>;
  fabled: Map<string, Role>;
  jinxes: Map<string, Map<string, string>>;
  locale: LocaleModule;
  players: PlayersState;
  session: SessionState;
}

// Minimal Vuex-like interfaces used to type JS plugins without explicit any
export type Commit = (type: string, payload?: unknown) => void;
export interface MutationPayload { type: string; payload?: unknown }
export type SubscribeHandler = (mutation: MutationPayload, state: RootState) => void;
export interface StoreLike<State> {
  state: State;
  commit: Commit;
  getters: Record<string, unknown>;
  subscribe: (handler: SubscribeHandler) => void;
}
