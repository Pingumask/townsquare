import { defineStore } from "pinia";
import type { TimerDurations } from "@/types";

interface UserPreferencesState {
  orderBubblesAsPlayer: boolean;
  orderBubblesAsHost: boolean;
  hideGrim: boolean;
  isMenuOpen: boolean;
  isStatic: boolean;
  isMuted: boolean;
  isImageOptIn: boolean;
  isStreamerMode: boolean;
  zoom: number;
  background: string;
  notes: {
    content: string;
    opened: boolean;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  };
  timerDurations: TimerDurations;
}

export const useUserPreferencesStore = defineStore("userPreferences", {
  state: (): UserPreferencesState => ({
    orderBubblesAsPlayer: false,
    orderBubblesAsHost: true,
    hideGrim: false,
    isMenuOpen: false,
    isStatic: false,
    isMuted: false,
    isImageOptIn: false,
    isStreamerMode: false,
    zoom: 0,
    background: "",
    notes: {
      content: "",
      opened: false,
      position: {
        x: 10,
        y: 100,
        width: 400,
        height: 300
      }
    },
    timerDurations: {
      daytime: 6,
      nominations: 2,
      dusk: 1,
      accusation: 0.5,
      defense: 0.5,
      debate: 1,
      custom: 1,
      customDebate: 1,
    },
  }),
  persist: true,
});
