import type { Timer, Edition } from "./game";
import type { Nomination, VoteHistoryEntry } from "./voting";
import type { PlayersState } from "./players";
import type { EditionsJSON, LocaleModule } from "./data";
import type { Role } from "./roles";

// Timer durations for different timer types
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

// Grimoire state
export interface GrimoireState {
  disableHotkeys: boolean;
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
  timerDurations: TimerDurations;
}

// Modals state
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

// Session state
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

// Players menu state
export interface PlayersMenuState {
  changePronouns: boolean;
  changeName: boolean;
  movePlayer: boolean;
  swapPlayers: boolean;
  removePlayer: boolean;
  swapAlignment: boolean;
  specialVote: boolean;
}

// Root state used by Vuex store and socket/persistence plugins
export interface RootState {
  grimoire: GrimoireState;
  playersMenu: PlayersMenuState;
  modals: Modals;
  edition?: Edition; // optional — may be undefined initially
  editions: EditionsJSON;
  roles: Map<string, Role>;
  othertravelers: Map<string, Role>;
  fabled: Map<string, Role>;
  jinxes: Map<string, Map<string, string>>;
  locale: LocaleModule;
  players: PlayersState;
  session: SessionState;
}
