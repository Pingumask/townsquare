import type { Player, Role, PlayersState, Edition } from "../../types";

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

const state = (): PlayersState => ({
  players: [],
  fabled: [],
  bluffs: [],
});

const getters = {
  alive({ players }: PlayersState): number {
    return players.filter((player) => !player.isDead).length;
  },
  nontravelers({ players }: PlayersState): number {
    const nontravelers = players.filter(
      (player) => player.role.team !== "traveler",
    );
    return Math.min(nontravelers.length, 15);
  },
  // calculate a Map of player => night order
  nightOrder(
    { players, fabled }: PlayersState,
    _getters: unknown,
    { edition }: { edition: Edition },
  ) {
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
    fabled.forEach((role: Role) => {
      if (role.firstNight) {
        firstNight.push(role);
      }
      if (role.otherNight) {
        otherNight.push(role);
      }
    });
    players.forEach((player: Player) => {
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
    players.forEach((player: Player) => {
      const first = Math.max(firstNight.indexOf(player), 0);
      const other = Math.max(otherNight.indexOf(player), 0);
      nightOrder.set(player, { first, other });
    });
    fabled.forEach((role: Role) => {
      const first = Math.max(firstNight.indexOf(role), 0);
      const other = Math.max(otherNight.indexOf(role), 0);
      nightOrder.set(role, { first, other });
    });
    return nightOrder;
  },
};

const actions = {
  randomize({
    state,
    commit,
  }: {
    state: PlayersState;
    commit: (mutation: string, payload?: unknown) => void;
  }) {
    const players = state.players
      .map((a: Player) => [Math.random(), a] as [number, Player])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
    commit("set", players);
  },

  clearRoles({
    state,
    commit,
    rootState,
  }: {
    state: PlayersState;
    commit: (mutation: string, payload?: unknown) => void;
    rootState: { session: { isSpectator: boolean } };
  }) {
    let players: Player[];
    if (rootState.session.isSpectator) {
      players = state.players.map((player: Player) => {
        if (player.role.team !== "traveler") {
          player.role = {} as Role;
        }
        player.reminders = [];
        return player;
      });
    } else {
      players = state.players.map(({ name, id, pronouns }: Player) => ({
        ...NEWPLAYER,
        name,
        id,
        pronouns,
      }));
    }
    commit("set", players);
    commit("setBluff");
  },
};

const mutations = {
  clear(state: PlayersState) {
    state.players = [];
    state.bluffs = [];
    state.fabled = [];
  },
  set(state: PlayersState, players: Player[] = []) {
    state.players = players;
  },
  /**
  The update mutation also has a property for isFromSockets
  this property can be addded to payload object for any mutations
  then can be used to prevent infinite loops when a property is
  able to be set from multiple different session on websockets.
  An example of this is in the sendPlayerPronouns and _updatePlayerPronouns
  in socket.js.
   */

  update(
    state: PlayersState,
    {
      player,
      property,
      value,
    }: { player: Player; property: keyof Player; value: unknown },
  ) {
    const index = state.players.indexOf(player);
    if (index >= 0) {
      (state.players[index] as unknown as Record<string, unknown>)[property] =
        value;
    }
  },
  add(state: PlayersState, name: string) {
    state.players.push({
      ...NEWPLAYER,
      name,
    });
  },
  remove(state: PlayersState, index: number) {
    state.players.splice(index, 1);
  },
  swap(state: PlayersState, [from, to]: [number, number]) {
    if (state.players[from] && state.players[to]) {
      [state.players[from], state.players[to]] = [
        state.players[to],
        state.players[from],
      ];
      // hack: "modify" the array so that Vue notices something changed
      state.players.splice(0, 0);
    }
  },
  move(state: PlayersState, [from, to]: [number, number]) {
    state.players.splice(to, 0, state.players.splice(from, 1)[0]!);
  },
  setBluff(
    state: PlayersState,
    { index, role }: { index?: number; role?: Role } = {},
  ) {
    if (index !== undefined) {
      state.bluffs.splice(index, 1, role!);
    } else {
      state.bluffs = [];
    }
  },
  setFabled(
    state: PlayersState,
    { index, fabled }: { index?: number; fabled?: Role | Role[] } = {},
  ) {
    if (index !== undefined) {
      state.fabled.splice(index, 1);
    } else if (fabled) {
      if (!Array.isArray(fabled)) {
        state.fabled.push(fabled);
      } else {
        state.fabled = fabled;
      }
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
