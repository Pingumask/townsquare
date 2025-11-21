import { defineStore } from "pinia";
import type {
  SessionState,
  VoteHistoryEntry,
  Player,
  Nomination,
  GamePhase,
} from "@/types";
import { isActiveNomination, isTravelerExile } from "@/composables";
import { usePlayersStore, useGrimoireStore } from "@/stores";

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
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
    isVoteHistoryAllowed: true,
    isRolesDistributed: false,
    isSecretVote: false,
    gamePhase: "pregame",
  }),

  actions: {
    setPlayerId(playerId: string) {
      this.playerId = playerId;
    },
    setSpectator(isSpectator: boolean) {
      this.isSpectator = isSpectator;
    },
    setReconnecting(isReconnecting: boolean) {
      this.isReconnecting = isReconnecting;
    },
    setPlayerCount(playerCount: number) {
      this.playerCount = playerCount;
    },
    setPing(ping: number) {
      this.ping = ping;
    },
    setVotingSpeed(votingSpeed: number) {
      this.votingSpeed = votingSpeed;
    },
    setVoteInProgress(isVoteInProgress: boolean) {
      this.isVoteInProgress = isVoteInProgress;
    },
    setMarkedPlayer(markedPlayer: number) {
      this.markedPlayer = markedPlayer;
    },
    setPlayerForSpecialVote(playerForSpecialVote: number) {
      this.playerForSpecialVote = playerForSpecialVote;
    },
    setNomination(nomination: Nomination | null) {
      this.nomination = nomination;
      this.votes = [];
      this.lockedVote = 0;
      this.isVoteInProgress = false;
    },
    setAllowSelfNaming(allowSelfNaming: boolean) {
      this.allowSelfNaming = allowSelfNaming;
    },
    setVoteHistoryAllowed(isVoteHistoryAllowed: boolean) {
      this.isVoteHistoryAllowed = isVoteHistoryAllowed;
    },
    setSecretVote(isSecretVote: boolean) {
      this.isSecretVote = isSecretVote;
    },
    claimSeat(claimedSeat: number) {
      this.claimedSeat = claimedSeat;
    },
    distributeRoles(isRolesDistributed: boolean) {
      this.isRolesDistributed = isRolesDistributed;
    },
    setGamePhase(gamePhase: GamePhase) {
      this.gamePhase = gamePhase;
    },
    setSessionId(sessionId: string) {
      this.sessionId = sessionId
        .toLocaleLowerCase()
        .replace(/[^0-9a-z]/g, "")
        .substring(0, 10);
    },

    updateNomination({
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
    } = {}) {
      this.nomination = nomination ?? null;
      this.votes = votes || [];
      this.votingSpeed = votingSpeed || this.votingSpeed;
      this.lockedVote = lockedVote || 0;
      this.isVoteInProgress = isVoteInProgress || false;
    },

    addHistory(payload: {
      players: Player[];
      isOrganVoteMode?: boolean;
      localeTexts?: { exile: string; execution: string };
    }) {
      const { players, isOrganVoteMode = false, localeTexts } = payload;

      if (!this.isVoteHistoryAllowed && this.isSpectator) return;
      if (
        !isActiveNomination(this.nomination) ||
        this.lockedVote <= players.length
      )
        return;

      const nomination = this.nomination!;
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
            : texts.execution + (organGrinder && !this.isSpectator ? "*" : "")),
        majority: Math.ceil(
          players.filter((player) => !player.isDead || isExile).length / 2
        ),
        votes:
          organGrinder && this.isSpectator
            ? null
            : players
              .filter((_player, index) => this.votes[index])
              .map(({ name }) => name),
      };

      this.voteHistory = [...this.voteHistory, entry];
    },

    clearVoteHistory() {
      this.voteHistory = [];
    },

    handleVote([index, vote]: [number, boolean | undefined]) {
      if (!this.nomination) return;
      const newVotes = [...this.votes];
      newVotes[index] = vote === undefined ? !newVotes[index] : vote;
      this.votes = newVotes;
    },

    vote(payload: [number, boolean | undefined]) {
      this.handleVote(payload);
    },
    voteSync(payload: [number, boolean | undefined]) {
      this.handleVote(payload);
    },

    lockVote(lock?: number) {
      this.lockedVote = lock !== undefined ? lock : this.lockedVote + 1;
    },

    toggleSecretVote(value?: boolean) {
      this.isSecretVote = value !== undefined ? value : !this.isSecretVote;
    },

    // Session actions
    hostSession() {
      if (this.sessionId) return;
      const grimoireStore = useGrimoireStore();
      const t = grimoireStore.t;
      const sessionId = prompt(
        t("prompt.createSession"),
        String(Math.round(Math.random() * 10000))
      );
      if (sessionId) {
        this.clearVoteHistory();
        this.setSpectator(false);
        this.setSessionId(sessionId);
        grimoireStore.toggleGrimoire(false);
        // Copy session URL to clipboard
        const url = window.location.href.split("#")[0];
        const link = url + "#" + sessionId;
        navigator.clipboard.writeText(link);
      }
    },

    joinSession() {
      if (this.sessionId) return this.leaveSession();
      const grimoireStore = useGrimoireStore();
      const t = grimoireStore.t;
      let sessionId = prompt(t("prompt.joinSession"));
      if (sessionId && sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop() || null;
      }
      if (sessionId) {
        this.clearVoteHistory();
        this.setSpectator(true);
        grimoireStore.toggleGrimoire(false);
        this.setSessionId(sessionId);
      }
    },

    leaveSession() {
      const grimoireStore = useGrimoireStore();
      const t = grimoireStore.t;
      if (confirm(t("prompt.leaveSession"))) {
        this.setSpectator(false);
        this.setGamePhase("pregame");
        this.setSessionId("");
      }
    },

    copySessionUrl() {
      const url = window.location.href.split("#")[0];
      const link = url + "#" + this.sessionId;
      navigator.clipboard.writeText(link);
    },

    distributeRolesAction() {
      if (this.isSpectator) return;
      const grimoireStore = useGrimoireStore();
      const playersStore = usePlayersStore();
      const t = grimoireStore.t;
      const popup = t("prompt.sendRoles");
      if (!confirm(popup)) return;

      // Checking all players to see if one of them has a forbidden role
      let forbiddenRole = "";
      const players = playersStore.players;
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
        this.distributeRoles(true);
        setTimeout(() => {
          this.distributeRoles(false);
        }, 2000);
      }
    },

    toggleNight() {
      if (this.isSpectator) return;
      if (this.gamePhase === "pregame") {
        this.setGamePhase("firstNight");
      } else if (this.gamePhase === "firstNight" || this.gamePhase === "otherNight") {
        this.setGamePhase("day");
      } else if (this.gamePhase === "day") {
        this.setGamePhase("otherNight");
      }
    },
  },
});
