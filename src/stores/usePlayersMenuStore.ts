import { defineStore } from "pinia";
import type { PlayersMenuState } from "@/types";

export const usePlayersMenuStore = defineStore("playersMenu", {
  state: (): PlayersMenuState => ({
    changePronouns: false,
    changeName: true,
    movePlayer: true,
    swapPlayers: false,
    removePlayer: true,
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
