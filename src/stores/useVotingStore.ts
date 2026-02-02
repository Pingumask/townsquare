import { defineStore } from "pinia";
import { isActiveNomination, isTravelerExile } from "@/services/nomination";
import socket from "@/services/socket";
import {
  useLocaleStore,
  useSessionStore,
  usePlayersStore,
  useGrimoireStore,
} from "@/stores";

import type { Nomination, Persist, Player, VoteHistoryEntry } from "@/types";

interface VotingState {
  nomination: Nomination | null;
  votes: boolean[];
  lockedVote: number;
  votingSpeed: number;
  isVoteInProgress: boolean;
  voteHistory: VoteHistoryEntry[];
  markedPlayer: number;
  playerForSpecialVote: number;
}

export const useVotingStore = defineStore("voting", {
  state: (): VotingState => ({
    nomination: null,
    votes: [],
    lockedVote: 0,
    votingSpeed: 1000,
    isVoteInProgress: false,
    voteHistory: [],
    markedPlayer: -1,
    playerForSpecialVote: -1,
  }),
  actions: {
    setVotingSpeed(votingSpeed: number) {
      const session = useSessionStore();
      this.votingSpeed = votingSpeed;
      if (!session.isPlayerOrSpectator) socket.send("votingSpeed", votingSpeed);
    },
    setVoteInProgress(isVoteInProgress: boolean) {
      const session = useSessionStore();
      this.isVoteInProgress = isVoteInProgress;
      if (!session.isPlayerOrSpectator)
        socket.send("isVoteInProgress", isVoteInProgress);
    },
    setMarkedPlayer(markedPlayer: number) {
      const session = useSessionStore();
      this.markedPlayer = markedPlayer;
      if (!session.isPlayerOrSpectator) socket.send("marked", markedPlayer);
    },
    setPlayerForSpecialVote(playerForSpecialVote: number) {
      this.playerForSpecialVote = playerForSpecialVote;
    },
    setNomination(nomination: Nomination | null) {
      const session = useSessionStore();
      this.nomination = nomination;
      this.votes = [];
      this.lockedVote = 0;
      this.isVoteInProgress = false;
      if (!session.isPlayerOrSpectator) {
        const playersStore = usePlayersStore();
        if (
          !nomination ||
          ((typeof nomination.nominator !== "number" ||
            playersStore.players.length > nomination.nominator) &&
            (typeof nomination.nominee !== "number" ||
              playersStore.players.length > nomination.nominee))
        ) {
          if (this.votingSpeed) {
            socket.send("votingSpeed", this.votingSpeed);
          }
          socket.send("nomination", nomination);
        }
      }
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
    setVoteHistory(history: VoteHistoryEntry[]) {
      // Deserialize timestamps from JSON (when received via socket)
      this.voteHistory = history.map((entry) => ({
        ...entry,
        timestamp:
          entry.timestamp instanceof Date
            ? entry.timestamp
            : new Date(entry.timestamp),
      }));
    },

    addHistory(payload: {
      day: number;
      players: Player[];
      isSecretVoteMode?: boolean;
      localeTexts?: { exile: string; execution: string };
    }) {
      const localeStore = useLocaleStore();
      const session = useSessionStore();
      const t = localeStore.t;
      const { players, isSecretVoteMode = false, localeTexts } = payload;

      // Only host adds history locally (and then broadcasts it)
      if (session.isPlayerOrSpectator) return;

      if (
        !isActiveNomination(this.nomination) ||
        this.lockedVote <= players.length
      )
        return;

      const nomination = this.nomination;
      const isExile = isTravelerExile(nomination, players);
      const votesHidden = isSecretVoteMode && !isExile;

      const defaultTexts = {
        exile: t("modal.voteHistory.exile"),
        execution: t("modal.voteHistory.execution"),
      };
      const texts = localeTexts || defaultTexts;

      // Determine vote type based on nomination context
      let voteType: string;
      if (nomination.specialVote?.buttonLabel) {
        voteType = nomination.specialVote.buttonLabel;
      } else if (isExile) {
        voteType = texts.exile;
      } else {
        voteType = texts.execution;
      }

      const entry: VoteHistoryEntry = {
        day: payload.day,
        timestamp: new Date(),
        nominator:
          typeof nomination.nominator === "number"
            ? players[nomination.nominator]?.name || ""
            : nomination.nominator || "",
        nominee:
          typeof nomination.nominee === "number"
            ? players[nomination.nominee]?.name || ""
            : nomination.nominee || "",
        type: voteType,
        majority: Math.ceil(
          players.filter((player) => !player.isDead || isExile).length / 2,
        ),
        votes:
          votesHidden && session.isPlayerOrSpectator
            ? []
            : players
                .filter((_player, index) => this.votes[index])
                .map(({ name }) => name),
        anonymous: votesHidden,
      };

      this.voteHistory = [...this.voteHistory, entry];
      this.syncVoteHistory();
    },

    syncVoteHistory() {
      const session = useSessionStore();
      const grimoireStore = useGrimoireStore();
      if (session.isPlayerOrSpectator) return;
      const voteHistory = [...this.voteHistory];

      if (grimoireStore.isVoteHistoryAllowed) {
        voteHistory.forEach((entry, i) => {
          if (entry.anonymous) {
            voteHistory[i] = { ...entry, votes: [] };
          }
        });
        socket.send("voteHistory", voteHistory);
      } else {
        socket.send("voteHistory", []);
      }
    },

    clearVoteHistory() {
      const session = useSessionStore();
      this.voteHistory = [];
      if (!session.isPlayerOrSpectator) socket.send("clearVoteHistory", null);
    },

    handleVote([index, vote]: [number, boolean | undefined]) {
      if (!this.nomination) return;
      const newVotes = [...this.votes];
      newVotes[index] = vote ?? !newVotes[index];
      this.votes = newVotes;
    },

    vote(payload: [number, boolean | undefined]) {
      this.handleVote(payload);
    },
    voteSync(payload: [number, boolean | undefined]) {
      this.handleVote(payload);
      const session = useSessionStore();
      const players = usePlayersStore().players;
      const player = players[payload[0]];
      // send vote only if it is your own vote or you are the storyteller
      if (session.playerId === player?.id || !session.isPlayerOrSpectator) {
        socket.send("vote", [
          payload[0],
          this.votes[payload[0]], // Use current vote state
          !session.isPlayerOrSpectator,
        ]);
      }
    },

    lockVote(lock?: number) {
      const session = useSessionStore();
      this.lockedVote = lock ?? this.lockedVote + 1;
      if (!session.isPlayerOrSpectator) {
        const players = usePlayersStore().players;
        const index =
          ((typeof this.nomination?.nominee === "number"
            ? this.nomination.nominee
            : (this.nomination?.nominator as number) || 0) +
            this.lockedVote -
            1) %
          players.length;
        socket.send("lock", [this.lockedVote, this.votes[index]]);
      }
    },
  },
  persist: {
    serializer: {
      serialize: (state: VotingState): string => {
        return JSON.stringify(state);
      },
      deserialize: (value: string): VotingState => {
        const state = JSON.parse(value);
        if (state.voteHistory) {
          state.voteHistory.forEach((entry: VoteHistoryEntry) => {
            entry.timestamp = new Date(entry.timestamp);
          });
        }
        return state;
      },
    },
  } as Persist<VotingState>,
});
