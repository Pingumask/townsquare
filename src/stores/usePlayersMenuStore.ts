import { defineStore } from "pinia";

interface PlayersMenuState {
  changePronouns: boolean;
  changeName: boolean;
  movePlayer: boolean;
  swapPlayers: boolean;
  removePlayer: boolean;
  emptySeat: boolean;
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
    emptySeat: true,
    swapAlignment: false,
    specialVote: false,
  }),
  actions: {
    togglePlayersMenu(name: keyof PlayersMenuState) {
      this[name] = !this[name];
    },
  },
  persist: true,
});
