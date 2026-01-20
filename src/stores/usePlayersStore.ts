import { defineStore } from "pinia";
import type { Persist, Player, Role } from "@/types";
import {
  useGrimoireStore,
  useLocaleStore,
  useSessionStore,
  useVotingStore,
} from "@/stores";
import socket from "@/services/socket";

export const SPECIAL_REMINDER_ROLES = {
  good: {
    id: "good",
    name: "Good",
    team: "townsfolk",
  } as Role,

  evil: {
    id: "evil",
    name: "Evil",
    team: "minion",
  } as Role,

  townsfolk: {
    id: "townsfolk",
    name: "Townsfolk",
    team: "townsfolk",
    image: new URL("@/assets/icons/townsfolk.png", import.meta.url).href,
  } as Role,

  outsider: {
    id: "outsider",
    name: "Outsider",
    team: "outsider",
    image: new URL("@/assets/icons/outsider.png", import.meta.url).href,
  } as Role,

  minion: {
    id: "minion",
    name: "Minion",
    team: "minion",
    image: new URL("@/assets/icons/minion.png", import.meta.url).href,
  } as Role,

  demon: {
    id: "demon",
    name: "Demon",
    team: "demon",
    image: new URL("@/assets/icons/demon.png", import.meta.url).href,
  } as Role,

  custom: {
    id: "custom",
    name: "Custom",
    team: "default",
    image: new URL("@/assets/icons/custom.png", import.meta.url).href,
  } as Role,
};

const NEWPLAYER: Player = {
  name: "",
  id: "",
  role: {} as Role,
  reminders: [],
  voteToken: false,
  isDead: false,
  pronouns: "",
};

interface PlayersState {
  players: Player[];
  fabled: Role[];
  bluffs: Role[];
}

export const usePlayersStore = defineStore("players", {
  state: (): PlayersState => ({
    players: [] as Player[],
    fabled: [] as Role[],
    bluffs: [] as Role[],
  }),

  getters: {
    alive(state: PlayersState): number {
      return state.players.filter((player) => !player.isDead).length;
    },
    nontravelers(state: PlayersState): number {
      const nontravelers = state.players.filter(
        (player) => player.role.team !== "traveler",
      );
      return Math.min(nontravelers.length, 15);
    },
    nightOrder(state: PlayersState) {
      const grimoireStore = useGrimoireStore();
      const edition = grimoireStore.edition;

      if (!edition) return new Map();

      function getFirstNight(player: Player, officialEdition: boolean): number {
        if (officialEdition && player.role.firstNightEdition) {
          return player.role.firstNightEdition;
        }
        return player.role.firstNight || 0;
      }

      function getOtherNight(player: Player, officialEdition: boolean): number {
        if (officialEdition && player.role.otherNightEdition) {
          return player.role.otherNightEdition;
        }
        return player.role.otherNight || 0;
      }

      const firstNight: (Player | Role | number)[] = [0];
      const otherNight: (Player | Role | number)[] = [0];
      state.fabled.forEach((role: Role) => {
        if (role.firstNight) {
          firstNight.push(role);
        }
        if (role.otherNight) {
          otherNight.push(role);
        }
      });
      state.players.forEach((player: Player) => {
        if (player.role.firstNight) {
          firstNight.push(player);
        }
        if (player.role.otherNight) {
          otherNight.push(player);
        }
      });
      firstNight.sort(
        (a, b) =>
          ((a as Player).role
            ? getFirstNight(a as Player, edition.isOfficial || false)
            : (a as Role).firstNight || 0) -
          ((b as Player).role
            ? getFirstNight(b as Player, edition.isOfficial || false)
            : (b as Role).firstNight || 0),
      );
      otherNight.sort(
        (a, b) =>
          ((a as Player).role
            ? getOtherNight(a as Player, edition.isOfficial || false)
            : (a as Role).otherNight || 0) -
          ((b as Player).role
            ? getOtherNight(b as Player, edition.isOfficial || false)
            : (b as Role).otherNight || 0),
      );
      const nightOrder = new Map<
        Player | Role,
        { first: number; other: number }
      >();
      state.players.forEach((player: Player) => {
        const first = Math.max(firstNight.indexOf(player), 0);
        const other = Math.max(otherNight.indexOf(player), 0);
        nightOrder.set(player, { first, other });
      });
      state.fabled.forEach((role: Role) => {
        const first = Math.max(firstNight.indexOf(role), 0);
        const other = Math.max(otherNight.indexOf(role), 0);
        nightOrder.set(role, { first, other });
      });
      return nightOrder;
    },

    currentPlayerIndex(): number {
      const sessionStore = useSessionStore();
      return this.players.findIndex(p => p.id === sessionStore.playerId);
    },

    // Left & right are defined looking towards the center of the table, so left neighbor is clockwise
    leftNeighbor(): Player | undefined {
      const idx = this.currentPlayerIndex;
      if (idx === -1) return undefined;
      const len = this.players.length;
      return this.players[(idx + 1) % len];
    },

    rightNeighbor(): Player | undefined {
      const idx = this.currentPlayerIndex;
      if (idx === -1) return undefined;
      const len = this.players.length;
      return this.players[(idx - 1 + len) % len];
    },
  },

  actions: {
    set(players: Player[] = []) {
      this.players = players;
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", true);
    },
    update({
      player,
      property,
      value,
      isFromSocket = false,
    }: {
      player: Player;
      property: keyof Player;
      value: unknown;
      isFromSocket?: boolean;
    }) {
      const index = this.players.indexOf(player);
      let oldRole = {} as Role;
      if (this.players[index]) {
        if (property === "role") {
          oldRole = { ...this.players[index].role };
          if (
            (value as Role).team === "townsfolk" ||
            (value as Role).team === "outsider"
          ) {
            this.players[index].alignment = "good";
          } else if (
            (value as Role).team === "minion" ||
            (value as Role).team === "demon"
          ) {
            this.players[index].alignment = "evil";
          } else {
            this.players[index].alignment = null;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.players[index] as any)[property] = value;
      }

      // Propagation
      if (isFromSocket) return;
      const sessionStore = useSessionStore();
      switch (property) {
        case "id":
          socket.send("player", {
            index,
            property,
            value,
          });
          break;
        case "name":
          socket.send("name", [index, value]);
          break;
        case "pronouns":
          socket.send("pronouns", [index, value]);
          break;
        case "role":
          if (sessionStore.isPlayerOrSpectator) return;
          if (
            oldRole.team === "traveler" &&
            (value as Role).team !== "traveler"
          ) {
            socket.send("player", {
              index,
              property: "role",
              value: { id: "" },
            });
          } else if ((value as Role).team === "traveler") {
            socket.send("player", {
              index,
              property: "role",
              value,
            });
          }
          break;
        case "alignment":
        case "voteToken":
        case "isDead":
        case "isMarked":
          if (sessionStore.isPlayerOrSpectator) return;
          socket.send("player", {
            index,
            property,
            value,
          });
          break;
      }
    },
    add(name: string) {
      this.players.push({
        ...NEWPLAYER,
        name,
      });
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", true);
    },
    remove(index: number) {
      this.players.splice(index, 1);
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.send("remove", index);
    },
    swap([from, to]: [number, number]) {
      if (this.players[from] && this.players[to]) {
        [this.players[from], this.players[to]] = [
          this.players[to],
          this.players[from],
        ];
      }
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.send("swap", [from, to]);
    },
    move([from, to]: [number, number]) {
      const movedPlayer = this.players.splice(from, 1)[0];
      if (movedPlayer) {
        this.players.splice(to, 0, movedPlayer);
      }
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.send("move", [from, to]);
    },
    setBluff({ index, role }: { index?: number; role?: Role } = {}) {
      if (index === undefined) {
        this.bluffs = [];
      } else {
        this.bluffs.splice(index, 1, role!);
      }
    },
    setFabled({
      index,
      fabled,
    }: { index?: number; fabled?: Role | Role[] } = {}) {
      if (index !== undefined) {
        this.fabled.splice(index, 1);
      } else if (fabled) {
        if (Array.isArray(fabled)) {
          this.fabled = fabled;
        } else {
          this.fabled.push(fabled);
        }
      }
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.send("fabled", this.fabled);
    },
    addPlayer() {
      const sessionStore = useSessionStore();
      const localeStore = useLocaleStore();
      const t = localeStore.t;
      if (sessionStore.isPlayerOrSpectator) return;
      if (this.players.length >= 20) return;
      const name = prompt(t("prompt.addPlayer"), "");
      if (name !== null) {
        this.add(name);
      }
      if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", false);
    },
    addPlayers() {
      const sessionStore = useSessionStore();
      const localeStore = useLocaleStore();
      const t = localeStore.t;
      if (sessionStore.isPlayerOrSpectator) return;
      if (this.players.length >= 20) return;
      const nb = Number(prompt(t("prompt.addPlayers")));
      if (Number.isNaN(nb)) {
        alert("Please enter a number");
        return;
      }
      for (let i = 0; i < nb; i++) {
        this.add("");
        if (this.players.length >= 20) return;
      }
      if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", false);
    },

    randomize() {
      const sessionStore = useSessionStore();
      if (sessionStore.isPlayerOrSpectator) return;
      const players = this.players
        .map((a: Player) => [Math.random(), a] as [number, Player])
        .sort((a: [number, Player], b: [number, Player]) => a[0] - b[0])
        .map((a: [number, Player]) => a[1]);
      this.set(players);
      if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", false);
    },

    clearPlayers() {
      const localeStore = useLocaleStore();
      const sessionStore = useSessionStore();
      const votingStore = useVotingStore();
      const t = localeStore.t;
      if (sessionStore.isPlayerOrSpectator) return;
      if (confirm(t("prompt.clearPlayers"))) {
        this.$reset();
        votingStore.$reset();
        if (!sessionStore.isPlayerOrSpectator) socket.sendGamestate("", true);
      }
    },

    clearRoles(autoConfirm: boolean = false) {
      const localeStore = useLocaleStore();
      const t = localeStore.t;

      if (!autoConfirm) {
        if (!confirm(t("prompt.clearRoles"))) return;
      }

      const sessionStore = useSessionStore();
      let players: Player[];
      if (sessionStore.isPlayerOrSpectator && !autoConfirm) {
        players = this.players.map((player: Player) => {
          if (player.role.team !== "traveler") {
            player.role = {} as Role;
            delete player.alignment;
          }
          player.reminders = [];
          return player;
        });
      } else {
        players = this.players.map(({ name, id, pronouns }: Player) => ({
          ...NEWPLAYER,
          name,
          id,
          pronouns,
        }));
      }
      this.set(players);
      this.setBluff();
      if (!sessionStore.isPlayerOrSpectator) {
        socket.send("clearRoles", true);
      }
    },
    distributeRoles(isRolesDistributed: boolean) {
      const session = useSessionStore();
      session.isRolesDistributed = isRolesDistributed;
      if (!session.isPlayerOrSpectator && isRolesDistributed) {
        const messageRole: Record<string, unknown[]> = {};
        const messageAlignment: Record<string, unknown[]> = {};
        this.players.forEach((player: Player, index: number) => {
          if (player.id && player.role) {
            messageRole[player.id] = [
              "player",
              { index, property: "role", value: player.role },
            ];
            messageAlignment[player.id] = [
              "player",
              { index, property: "alignment", value: player.alignment },
            ];
          }
        });
        if (Object.keys(messageRole).length) {
          socket.send("direct", messageRole);
          setTimeout(() => {
            socket.send("direct", messageAlignment);
          }, 100);
        }
      }
    },
    distributeRolesAction() {
      const session = useSessionStore();
      if (session.isPlayerOrSpectator) return;
      const localeStore = useLocaleStore();
      const t = localeStore.t;
      const popup = t("prompt.sendRoles");
      if (!confirm(popup)) return;

      // Checking all players to see if one of them has a forbidden role
      let forbiddenRole = "";
      const players = this.players;
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
  },
  persist: {
    paths: ["players", "bluffs", "fabled"],
    serializer: {
      serialize: (state: PlayersState): string => {
        const s = state;
        return JSON.stringify({
          ...s,
          players: s.players.map((player) => ({
            ...player,
            role: player.role.id || {},
          })),
          bluffs: s.bluffs.map((role) => role.id),
          fabled: s.fabled.map((role) =>
            role.isCustom ? role : { id: role.id },
          ),
        });
      },
      deserialize: (value: string): PlayersState => {
        const state = JSON.parse(value);
        const grimoireStore = useGrimoireStore();
        const rolesJSONbyId = grimoireStore.rolesJSONbyId;

        return {
          ...state,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          players: state.players.map((player: any) => ({
            ...player,
            role:
              grimoireStore.roles.get(player.role) ||
              rolesJSONbyId.get(player.role) ||
              ({ id: "" } as Role),
          })),
          bluffs: state.bluffs.map(
            (id: string) => grimoireStore.roles.get(id) || ({ id } as Role),
          ),
          fabled: state.fabled.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) => grimoireStore.fabled.get(f.id) || f,
          ),
        };
      },
    },
  } as Persist<PlayersState>,
});
