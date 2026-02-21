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
  votingClockTrigger: number;
  riserTrigger: number;
  drumRollTrigger: number;

  ringingVolume: number;
  roosterVolume: number;
  gavelVolume: number;
  deathVolume: number;
  votingBellVolume: number;
  votingClockVolume: number;
  riserVolume: number;
  drumRollVolume: number;

  votingClockType: number;
}

export const useSoundboardStore = defineStore("soundboard", {
  state: (): SoundboardState => ({
    ringingTrigger: 0,
    roosterTrigger: 0,
    gavelTrigger: 0,
    deathTrigger: 0,
    votingBellTrigger: 0,
    votingClockTrigger: 0,
    riserTrigger: 0,
    drumRollTrigger: 0,

    ringingVolume: 0.5,
    roosterVolume: 1,
    gavelVolume: 1,
    deathVolume: 0.5,
    votingBellVolume: 0.5,
    votingClockVolume: 0.5, // Overwritten by useVotingStore const clockStartVolume & clockEndVolume
    riserVolume: 0.3,
    drumRollVolume: 1,

    votingClockType: 0,
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
        case "votingClock":
          this.votingClockVolume = volume;
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
        case "votingClock":
          this.votingClockTrigger++;
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
