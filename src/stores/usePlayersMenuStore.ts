import { defineStore } from "pinia";

interface PlayersMenuState {
  changePronouns: boolean;
  changeName: boolean;
  movePlayer: boolean;
  swapPlayers: boolean;
  removePlayer: boolean;
  swapAlignment: boolean;
  specialVote: boolean;
}

export const usePlayersMenuStore = defineStore("playersMenu", {
  state: (): PlayersMenuState => ({
    changePronouns: true,
    changeName: true,
    movePlayer: true,
    swapPlayers: true,
    removePlayer: true,
    swapAlignment: true,
    specialVote: true,
  }),
  actions: {
    togglePlayersMenu(name: keyof PlayersMenuState) {
      this[name] = !this[name];
    },
  },
  persist: true,
});
