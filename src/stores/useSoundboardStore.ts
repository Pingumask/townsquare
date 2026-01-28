import { defineStore } from "pinia";
import { useSessionStore } from "@/stores";
import socket from "@/services/socket";
import type { JukeboxSound } from "@/types";

interface SoundboardState {
  ringingTrigger: number;
  roosterTrigger: number;
  gavelTrigger: number;
  deathTrigger: number;
}

export const useSoundboardStore = defineStore("soundboard", {
  state: (): SoundboardState => ({
    ringingTrigger: 0,
    roosterTrigger: 0,
    gavelTrigger: 0,
    deathTrigger: 0,
  }),

  actions: {
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
      }
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator)
        socket.send("playSound", { sound });
    },
  },
});
