import type { SessionState, VoteHistoryEntry, Player, Nomination } from "../../types";
import { isActiveNomination, istravellerExile } from "../../types";

/**
 * Handle a vote request.
 * If the vote is from a seat that is already locked, ignore it.
 * @param state session state
 * @param index seat of the player in the circle
 * @param vote true or false
 */
const handleVote = (state: SessionState, [index, vote]: [number, boolean | undefined]) => {
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
  isVoteInProgress: false,
  voteHistory: [],
  markedPlayer: -1,
  playerForSpecialVote: -1,
  isVoteHistoryAllowed: true,
  isRolesDistributed: false,
});

const getters = {};

const actions = {};

// mutations helper functions
const set = <K extends keyof SessionState>(key: K) => (state: SessionState, val: SessionState[K]) => {
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
  setVoteHistoryAllowed: set("isVoteHistoryAllowed"),
  claimSeat: set("claimedSeat"),
  distributeRoles: set("isRolesDistributed"),
  setSessionId(state: SessionState, sessionId: string) {
    state.sessionId = sessionId
      .toLocaleLowerCase()
      .replace(/[^0-9a-z]/g, "")
      .substring(0, 10);
  },
  nomination(
    state: SessionState,
    { nomination, votes, votingSpeed, lockedVote, isVoteInProgress }: {
      nomination?: Nomination | null;
      votes?: boolean[];
      votingSpeed?: number;
      lockedVote?: number;
      isVoteInProgress?: boolean;
    } = {},
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
  addHistory(state: SessionState, payload: {
    players: Player[];
    isOrganVoteMode?: boolean;
    localeTexts?: { exile: string; execution: string }
  }) {
    const { players, isOrganVoteMode = false, localeTexts } = payload;

    if (!state.isVoteHistoryAllowed && state.isSpectator) return;
    if (!isActiveNomination(state.nomination) || state.lockedVote <= players.length) return;

    const nomination = state.nomination;
    const isExile = istravellerExile(nomination, players);
    const organGrinder = isOrganVoteMode && !isExile;

    // Default locale texts if not provided
    const defaultTexts = { exile: 'Exile', execution: 'Execution' };
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
        nomination.specialVote?.type ||
        (isExile
          ? texts.exile
          : texts.execution + (organGrinder && !state.isSpectator ? "*" : "")),
      majority: Math.ceil(
        players.filter((player) => !player.isDead || isExile).length / 2,
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
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
