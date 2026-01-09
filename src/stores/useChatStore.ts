import { defineStore } from "pinia";
import { usePlayersStore } from "./usePlayersStore";

export interface ChatMessage {
  from: string;
  text: string;
  isOwn: boolean;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    messages: {
      left: [],
      right: [],
    },
  }),

  actions: {
    addMessage(tab: "left" | "right", message: ChatMessage) {
      this.messages[tab]?.push(message);
    },

    clearMessages(tab: "left" | "right") {
      this.messages[tab] = [];
    },

    receiveMessage(data: { from: string; message: string }, tab: "left" | "right") {
      const playersStore = usePlayersStore();
      
      const player = playersStore.players.find(p => p.id === data.from);
      const fromName = player?.name || data.from;
      
      const message: ChatMessage = {
        from: fromName,
        text: data.message,
        isOwn: false,
      };
      this.addMessage(tab, message);
    },
  },
});
