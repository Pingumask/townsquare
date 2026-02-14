import { defineStore } from "pinia";
import { useSessionStore } from "@/stores";
import socket from "@/services/socket";
import type { JukeboxSound } from "@/types";

interface SoundboardState {
  ringingTrigger: number;
  roosterTrigger: number;
  gavelTrigger: number;
  deathTrigger: number;
  votingBellTrigger: number;
  riserTrigger: number;
  drumRollTrigger: number;

  ringingVolume: number;
  roosterVolume: number;
  gavelVolume: number;
  deathVolume: number;
  votingBellVolume: number;
  riserVolume: number;
  drumRollVolume: number;
}

export const useSoundboardStore = defineStore("soundboard", {
  state: (): SoundboardState => ({
    ringingTrigger: 0,
    roosterTrigger: 0,
    gavelTrigger: 0,
    deathTrigger: 0,
    votingBellTrigger: 0,
    riserTrigger: 0,
    drumRollTrigger: 0,

    ringingVolume: 1.0,
    roosterVolume: 1.0,
    gavelVolume: 1.0,
    deathVolume: 1.0,
    votingBellVolume: 1.0,
    riserVolume: 1.0,
    drumRollVolume: 1.0,
  }),

  actions: {
    changeVolume({ sound }: { sound: JukeboxSound }, volume: number) {
      switch (sound) {
        case "ringing":
          this.ringingVolume = volume;
          break;
        case "rooster":
          this.roosterVolume = volume;
          break;
        case "gavel":
          this.gavelVolume = volume;
          break;
        case "death":
          this.deathVolume = volume;
          break;
        case "votingBell":
          this.votingBellVolume = volume;
          break;
        case "riser":
          this.riserVolume = volume;
          break;
        case "drumRoll":
          this.drumRollVolume = volume;
          break;
      }
    },

    playSound({ sound }: { sound: JukeboxSound }) {
      switch (sound) {
        case "ringing":
          this.ringingTrigger++;
          break;
        case "rooster":
          this.roosterTrigger++;
          break;
        case "gavel":
          this.gavelTrigger++;
          break;
        case "death":
          this.deathTrigger++;
          break;
        case "votingBell":
          this.votingBellTrigger++;
          break;
        case "riser":
          this.riserTrigger++;
          break;
        case "drumRoll":
          this.drumRollTrigger++;
          break;
      }
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator)
        socket.send("playSound", { sound });
    },
  },
});
