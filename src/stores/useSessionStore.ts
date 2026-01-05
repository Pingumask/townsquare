import { defineStore } from "pinia";
import {
  useLocaleStore,
  usePlayersStore,
  useUserPreferencesStore,
  useVotingStore,
  useGrimoireStore,
} from "@/stores";
import socket from "@/services/socket";
import type { Persist } from "@/types";

interface SessionState {
  sessionId: string;
  isPlayerOrSpectator: boolean;
  isReconnecting: boolean;
  playerCount: number;
  ping: number;
  playerId: string;
  claimedSeat: number;
  isRolesDistributed: boolean;
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    sessionId: "",
    isPlayerOrSpectator: false,
    isReconnecting: false,
    playerCount: 0,
    ping: 0,
    playerId: "",
    claimedSeat: -1,
    isRolesDistributed: false,
  }),
  actions: {
    setPlayerId(playerId: string) {
      this.playerId = playerId;
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
    claimSeat(claimedSeat: number) {
      this.claimedSeat = claimedSeat;
      const playersStore = usePlayersStore();
      if (
        this.isPlayerOrSpectator &&
        playersStore.players.length > claimedSeat &&
        (claimedSeat < 0 || !playersStore.players[claimedSeat]?.id)
      ) {
        socket.send("claim", [claimedSeat, this.playerId]);
      }
    },

    setSessionId(sessionId: string) {
      this.sessionId = sessionId
        .toLocaleLowerCase()
        .replaceAll(/[^0-9a-z]/g, "")
        .substring(0, 10);
    },

    // Session actions
    hostSession() {
      if (this.sessionId) return;
      const grimoire = useGrimoireStore();
      const localeStore = useLocaleStore();
      const userPreferences = useUserPreferencesStore();
      const t = localeStore.t;
      const sessionId = prompt(
        t("prompt.createSession"),
        String(Math.round(Math.random() * 10000)),
      );
      if (sessionId) {
        const votingStore = useVotingStore();
        votingStore.clearVoteHistory();
        this.isPlayerOrSpectator = false;
        this.setSessionId(sessionId);
        grimoire.setGamePhase("pregame");
        grimoire.setDayCount(0);
        userPreferences.hideGrim = false;
        const link = globalThis.location.href + sessionId;
        navigator.clipboard.writeText(link);
        document
          .querySelector('meta[property="og:url"]')
          ?.setAttribute("content", link);
      }
    },

    joinSession() {
      if (this.sessionId) return this.leaveSession();
      const localeStore = useLocaleStore();
      const userPreferences = useUserPreferencesStore();
      const t = localeStore.t;
      let sessionId = prompt(t("prompt.joinSession"));
      if (sessionId?.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("/").pop() || null;
      }
      if (sessionId) {
        const votingStore = useVotingStore();
        votingStore.clearVoteHistory();
        this.isPlayerOrSpectator = true;
        userPreferences.hideGrim = false;
        this.setSessionId(sessionId);
        document
          .querySelector('meta[property="og:url"]')
          ?.setAttribute("content", globalThis.location.href);
      }
    },

    leaveSession() {
      const localeStore = useLocaleStore();
      const grimoireStore = useGrimoireStore();
      const t = localeStore.t;
      if (confirm(t("prompt.leaveSession"))) {
        this.isPlayerOrSpectator = false;
        grimoireStore.setGamePhase("offline");
        this.setSessionId("");
        globalThis.location.replace("/");
      }
    },

    copySessionUrl() {
      const link = globalThis.location.href + this.sessionId;
      navigator.clipboard.writeText(link);
    },
    initializeFromUrl() {
      const hashSessionId = globalThis.location.href.split("/").pop();
      if (
        hashSessionId &&
        hashSessionId !== this.sessionId &&
        hashSessionId !== "townsquare.online"
      ) {
        this.setSessionId(hashSessionId);
        this.isPlayerOrSpectator = true;
      }
    },
  },
  persist: [
    {
      key: "playerId",
      paths: ["playerId"],
    },
    {
      key: "session",
      paths: ["isPlayerOrSpectator", "sessionId"],
      serializer: {
        serialize: (state: SessionState) => {
          return JSON.stringify([state.isPlayerOrSpectator, state.sessionId]);
        },
        deserialize: (value: string) => {
          const data = JSON.parse(value);
          if (Array.isArray(data) && data.length === 2) {
            return {
              isPlayerOrSpectator: data[0],
              sessionId: data[1],
            };
          }
          return {
            isPlayerOrSpectator: false,
            sessionId: "",
          };
        },
      },
    },
  ] as Persist<SessionState>,
});
