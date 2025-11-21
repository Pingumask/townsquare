import { defineStore } from "pinia";
import type { Player, Role, PlayersState } from "@/types";
import { useGrimoireStore, useSessionStore } from "@/stores";

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

export const usePlayersStore = defineStore("players", {
  state: (): PlayersState => ({
    players: [],
    fabled: [],
    bluffs: [],
  }),

  getters: {
    alive(state): number {
      return state.players.filter((player) => !player.isDead).length;
    },
    nontravelers(state): number {
      const nontravelers = state.players.filter(
        (player) => player.role.team !== "traveler"
      );
      return Math.min(nontravelers.length, 15);
    },
    nightOrder(state) {
      const grimoireStore = useGrimoireStore();
      const edition = grimoireStore.edition;

      if (!edition) return new Map();

      // gives the index of the first night for a player. This function supposes that, if they are called, "player" has an attribute "role".
      function getFirstNight(player: Player, officialEdition: boolean): number {
        if (officialEdition && player.role.firstNightEdition) {
          return player.role.firstNightEdition;
        }
        return player.role.firstNight || 0;
      }

      // gives the index of the other nights (not the first one) for a player. This function supposes that, if they are called, "player" has an attribute "role".
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
      // If x has an attribute 'role' (meaning x is a player), then, to know their night order, we use the getter functions above.
      // Else, (meaning x is instead a Fabled), to know their night order we look at x.firstNight or x.otherNight
      firstNight.sort(
        (a, b) =>
          ((a as Player).role
            ? getFirstNight(a as Player, edition!.isOfficial || false)
            : (a as Role).firstNight || 0) -
          ((b as Player).role
            ? getFirstNight(b as Player, edition!.isOfficial || false)
            : (b as Role).firstNight || 0)
      );
      otherNight.sort(
        (a, b) =>
          ((a as Player).role
            ? getOtherNight(a as Player, edition!.isOfficial || false)
            : (a as Role).otherNight || 0) -
          ((b as Player).role
            ? getOtherNight(b as Player, edition!.isOfficial || false)
            : (b as Role).otherNight || 0)
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
  },

  actions: {
    clear() {
      this.players = [];
      this.bluffs = [];
      this.fabled = [];
    },
    set(players: Player[] = []) {
      this.players = players;
    },
    update({
      player,
      property,
      value,
    }: {
      player: Player;
      property: keyof Player;
      value: unknown;
      isFromSocket?: boolean;
    }) {
      const index = this.players.indexOf(player);
      if (index >= 0) {
        (this.players[index] as unknown as Record<string, unknown>)[property] =
          value;
      }
    },
    add(name: string) {
      this.players.push({
        ...NEWPLAYER,
        name,
      });
    },
    remove(index: number) {
      this.players.splice(index, 1);
    },
    swap([from, to]: [number, number]) {
      if (this.players[from] && this.players[to]) {
        [this.players[from], this.players[to]] = [
          this.players[to],
          this.players[from],
        ];
      }
    },
    move([from, to]: [number, number]) {
      this.players.splice(to, 0, this.players.splice(from, 1)[0]!);
    },
    setBluff({ index, role }: { index?: number; role?: Role } = {}) {
      if (index !== undefined) {
        this.bluffs.splice(index, 1, role!);
      } else {
        this.bluffs = [];
      }
    },
    setFabled({
      index,
      fabled,
    }: { index?: number; fabled?: Role | Role[] } = {}) {
      if (index !== undefined) {
        this.fabled.splice(index, 1);
      } else if (fabled) {
        if (!Array.isArray(fabled)) {
          this.fabled.push(fabled);
        } else {
          this.fabled = fabled;
        }
      }
    },

    // Player actions
    addPlayerAction() {
      const sessionStore = useSessionStore();
      const grimoireStore = useGrimoireStore();
      if (sessionStore.isSpectator) return;
      if (this.players.length >= 20) return;
      const t = grimoireStore.t;
      const name = prompt(t("prompt.addPlayer"), "");
      if (name) {
        this.add(name);
      }
    },

    addPlayersAction() {
      const sessionStore = useSessionStore();
      const grimoireStore = useGrimoireStore();
      if (sessionStore.isSpectator) return;
      if (this.players.length >= 20) return;
      const t = grimoireStore.t;
      const nb = Number(prompt(t("prompt.addPlayers")));
      if (isNaN(nb)) {
        alert("Please enter a number");
        return;
      }
      for (let i = 0; i < nb; i++) {
        this.add("");
        if (this.players.length >= 20) return;
      }
    },

    randomize() {
      const players = this.players
        .map((a: Player) => [Math.random(), a] as [number, Player])
        .sort((a, b) => a[0] - b[0])
        .map((a) => a[1]);
      this.set(players);
    },

    clearPlayersAction() {
      const sessionStore = useSessionStore();
      const grimoireStore = useGrimoireStore();
      if (sessionStore.isSpectator) return;
      const t = grimoireStore.t;
      if (confirm(t("prompt.clearPlayers"))) {
        if (sessionStore.nomination) {
          sessionStore.setNomination(null);
        }
        this.clear();
      }
    },

    clearRolesAction() {
      const sessionStore = useSessionStore();
      let players: Player[];
      if (sessionStore.isSpectator) {
        players = this.players.map((player: Player) => {
          if (player.role.team !== "traveler") {
            player.role = {} as Role;
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
    },
  },
});
