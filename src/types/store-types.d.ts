import type { RootState } from './store';

// Minimal interfaces for typing Pinia store subscriptions
export type Commit = (type: string, payload?: unknown) => void;

export interface MutationPayload {
  type: string;
  payload?: unknown;
}

export type SubscribeHandler = (
  mutation: MutationPayload,
  state: RootState,
) => void;

export interface StoreLike<State> {
  state: State;
  commit: Commit;
  getters: Record<string, unknown>;
  subscribe: (handler: SubscribeHandler) => void;
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

export interface PlayersMenuState {
  changePronouns: boolean;
  changeName: boolean;
  movePlayer: boolean;
  swapPlayers: boolean;
  removePlayer: boolean;
  swapAlignment: boolean;
  specialVote: boolean;
}

export interface TimerDurations {
  daytime: number;
  nominations: number;
  dusk: number;
  accusation: number;
  defense: number;
  debate: number;
  custom: number;
  customDebate: number;
}

import type { Timer, Edition } from './game';
import type { LocaleModule, EditionsJSON } from './data';
import type { Role } from './roles';
import type { Nomination, VoteHistoryEntry } from './players';

export interface GrimoireState {
  disableHotkeys: boolean;
  isNightOrder: boolean;
  isRinging: boolean;
  isRooster: boolean;
  isGavel: boolean;
  isPublic: boolean;
  isMenuOpen: boolean;
  isStatic: boolean;
  isMuted: boolean;
  isImageOptIn: boolean;
  isStreamerMode: boolean;
  zoom: number;
  background: string;
  timer: Timer;
  timerDurations: TimerDurations;
  // Properties that were previously in root state but now likely in Grimoire or handled otherwise
  // We include them here as they are used in useGrimoireStore state definition
  edition: Edition | undefined;
  editions: EditionsJSON;
  roles: Map<string, Role>;
  othertravelers: Map<string, Role>;
  fabled: Map<string, Role>;
  jinxes: Map<string, Map<string, string>>;
  rolesJSONbyId: Map<string, Role>;
  modals: Modals;
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
  allowSelfNaming: boolean;
  isVoteInProgress: boolean;
  voteHistory: VoteHistoryEntry[];
  markedPlayer: number;
  playerForSpecialVote: number;
  isVoteHistoryAllowed: boolean;
  isRolesDistributed: boolean;
  isSecretVote: boolean;
  gamePhase: "pregame" | "day" | "firstNight" | "otherNight" | "postgame";
}
