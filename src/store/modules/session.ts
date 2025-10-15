import type {
  SessionState,
  VoteHistoryEntry,
  Player,
  Nomination,
  GamePhase,
} from "@/types";
import { isActiveNomination, isTravelerExile } from "@/composables";

/**
 * Handle a vote request.
 * If the vote is from a seat that is already locked, ignore it.
 * @param state session state
 * @param index seat of the player in the circle
 * @param vote true or false
 */
const handleVote = (
  state: SessionState,
  [index, vote]: [number, boolean | undefined]
) => {
  if (!state.nomination) return;
  state.votes = [...state.votes];
  state.votes[index] = vote === undefined ? !state.votes[index] : vote;
};

const state = (): SessionState => ({
  sessionId: "",
  isSpectator: false,
  isReconnecting: false,
  playerCount: 0,
  ping: 0,
  playerId: "",
  claimedSeat: -1,
  nomination: null,
  votes: [],
  lockedVote: 0,
  votingSpeed: 1000,
  allowSelfNaming: false,
  isVoteInProgress: false,
  voteHistory: [],
  markedPlayer: -1,
  playerForSpecialVote: -1,
  isVoteHistoryAllowed: false,
  isRolesDistributed: false,
  isSecretVote: false,
  gamePhase: "pregame",
});

const getters = {};

const actions = {
  /**
   * Host a new session
   */
  hostSession({
    commit,
    state,
    rootGetters,
  }: {
    commit: (mutation: string, payload?: unknown) => void;
    state: SessionState;
    rootGetters: { t: (key: string) => string };
  }) {
    if (state.sessionId) return;
    const t = rootGetters.t;
    const sessionId = prompt(
      t("prompt.createSession"),
      String(Math.round(Math.random() * 10000))
    );
    if (sessionId) {
      commit("clearVoteHistory");
      commit("setSpectator", false);
      commit("setSessionId", sessionId);
      commit("toggleGrimoire", false);
      // Copy session URL to clipboard
      const url = window.location.href.split("#")[0];
      const link = url + "#" + sessionId;
      navigator.clipboard.writeText(link);
    }
  },

  /**
   * Join an existing session
   */
  joinSession({
    commit,
    state,
    dispatch,
    rootGetters,
  }: {
    commit: (mutation: string, payload?: unknown) => void;
    state: SessionState;
    dispatch: (action: string) => void;
    rootGetters: { t: (key: string) => string };
  }) {
    if (state.sessionId) return dispatch("leaveSession");
    const t = rootGetters.t;
    let sessionId = prompt(t("prompt.joinSession"));
    if (sessionId && sessionId.match(/^https?:\/\//i)) {
      sessionId = sessionId.split("#").pop() || null;
    }
    if (sessionId) {
      commit("clearVoteHistory");
      commit("setSpectator", true);
      commit("toggleGrimoire", false);
      commit("setSessionId", sessionId);
    }
  },

  /**
   * Leave the current session
   */
  leaveSession({
    commit,
    rootGetters,
  }: {
    commit: (mutation: string, payload?: unknown) => void;
    rootGetters: { t: (key: string) => string };
  }) {
    const t = rootGetters.t;
    if (confirm(t("prompt.leaveSession"))) {
      commit("setSpectator", false);
      commit("setGamePhase", "pregame");
      commit("setSessionId", "");
    }
  },

  /**
   * Copy the session URL to clipboard
   */
  copySessionUrl({ state }: { state: SessionState }) {
    const url = window.location.href.split("#")[0];
    const link = url + "#" + state.sessionId;
    navigator.clipboard.writeText(link);
  },

  /**
   * Distribute roles to players
   */
  distributeRoles({
    state,
    commit,
    rootState,
    rootGetters,
  }: {
    state: SessionState;
    commit: (mutation: string, payload?: unknown) => void;
    rootState: { players: { players: Player[] } };
    rootGetters: { t: (key: string) => string };
  }) {
    if (state.isSpectator) return;
    const t = rootGetters.t;
    const popup = t("prompt.sendRoles");
    if (!confirm(popup)) return;

    // Checking all players to see if one of them has a forbidden role
    let forbiddenRole = "";
    const players = rootState.players.players;
    for (let i = 0; i < players.length && !forbiddenRole; i++) {
      const player = players[i];
      if (player?.role?.forbidden) {
        forbiddenRole = player.role.name || "";
      }
    }
    let confirmedDistribution = forbiddenRole === "";
    if (!confirmedDistribution) {
      const forbiddenPopup =
        t("prompt.sendRolesWithForbidden1") +
        forbiddenRole +
        t("prompt.sendRolesWithForbidden2");
      confirmedDistribution = confirm(forbiddenPopup);
    }
    if (confirmedDistribution) {
      commit("distributeRoles", true);
      setTimeout(() => {
        commit("distributeRoles", false);
      }, 2000);
    }
  },
};

// mutations helper functions
const set =
  <K extends keyof SessionState>(key: K) =>
  (state: SessionState, val: SessionState[K]) => {
    state[key] = val;
  };

const mutations = {
  setPlayerId: set("playerId"),
  setSpectator: set("isSpectator"),
  setReconnecting: set("isReconnecting"),
  setPlayerCount: set("playerCount"),
  setPing: set("ping"),
  setVotingSpeed: set("votingSpeed"),
  setVoteInProgress: set("isVoteInProgress"),
  setMarkedPlayer: set("markedPlayer"),
  setPlayerForSpecialVote: set("playerForSpecialVote"),
  setNomination: set("nomination"),
  setAllowSelfNaming: set("allowSelfNaming"),
  setVoteHistoryAllowed: set("isVoteHistoryAllowed"),
  setSecretVote: set("isSecretVote"),
  claimSeat: set("claimedSeat"),
  distributeRoles: set("isRolesDistributed"),
  setGamePhase(state: SessionState, gamePhase: GamePhase) {
    state.gamePhase = gamePhase;
  },
  setSessionId(state: SessionState, sessionId: string) {
    state.sessionId = sessionId
      .toLocaleLowerCase()
      .replace(/[^0-9a-z]/g, "")
      .substring(0, 10);
  },
  nomination(
    state: SessionState,
    {
      nomination,
      votes,
      votingSpeed,
      lockedVote,
      isVoteInProgress,
    }: {
      nomination?: Nomination | null;
      votes?: boolean[];
      votingSpeed?: number;
      lockedVote?: number;
      isVoteInProgress?: boolean;
    } = {}
  ) {
    state.nomination = nomination ?? null;
    state.votes = votes || [];
    state.votingSpeed = votingSpeed || state.votingSpeed;
    state.lockedVote = lockedVote || 0;
    state.isVoteInProgress = isVoteInProgress || false;
  },
  /**
   * Create an entry in the vote history log. Requires current player array because it might change later in the game.
   * Only stores votes that were completed.
   * If the Organ Grinder is active, save the votes only for the Story Teller
   */
  addHistory(
    state: SessionState,
    payload: {
      players: Player[];
      isOrganVoteMode?: boolean;
      localeTexts?: { exile: string; execution: string };
    }
  ) {
    const { players, isOrganVoteMode = false, localeTexts } = payload;

    if (
      !isActiveNomination(state.nomination) ||
      state.lockedVote <= players.length
    )
      return;

    const nomination = state.nomination;
    const isExile = isTravelerExile(nomination, players);
    const organGrinder = isOrganVoteMode && !isExile;

    // Default locale texts if not provided
    const defaultTexts = { exile: "Exile", execution: "Execution" };
    const texts = localeTexts || defaultTexts;

    const entry: VoteHistoryEntry = {
      timestamp: new Date(),
      nominator:
        typeof nomination.nominator === "number"
          ? players[nomination.nominator]?.name || ""
          : nomination.nominator || "",
      nominee:
        typeof nomination.nominee === "number"
          ? players[nomination.nominee]?.name || ""
          : nomination.nominee || "",
      type:
        nomination.specialVote?.buttonLabel ||
        (isExile
          ? texts.exile
          : texts.execution + (organGrinder && !state.isSpectator ? "*" : "")),
      majority: Math.ceil(
        players.filter((player) => !player.isDead || isExile).length / 2
      ),
      votes:
        organGrinder && state.isSpectator
          ? null
          : players
              .filter((_player, index) => state.votes[index])
              .map(({ name }) => name),
    };

    state.voteHistory = [...state.voteHistory, entry];
  },
  clearVoteHistory(state: SessionState) {
    state.voteHistory = [];
  },
  /**
   * Store a vote with and without syncing it to the live session.
   * This is necessary in order to prevent infinite voting loops.
   * @param state
   * @param vote
   */
  vote: handleVote,
  voteSync: handleVote,
  lockVote(state: SessionState, lock?: number) {
    state.lockedVote = lock !== undefined ? lock : state.lockedVote + 1;
  },
  toggleSecretVote(state: SessionState, value?: boolean) {
    state.isSecretVote = value !== undefined ? value : !state.isSecretVote;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
