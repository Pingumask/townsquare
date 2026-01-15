import { defineStore } from "pinia";
import { usePlayersStore } from "./usePlayersStore";
import { useLocaleStore } from "./useLocaleStore";

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
      global: [],
    },
  }),

  actions: {
    addMessage(tab: "left" | "right" | "global", message: ChatMessage) {
      this.messages[tab]?.push(message);
    },

    clearMessages(tab: "left" | "right" | "global") {
      this.messages[tab] = [];
    },

    receiveMessage(data: { from: string; message: string }, tab: "left" | "right" | "global") {
      const playersStore = usePlayersStore();
      const localeStore = useLocaleStore();

      const player = playersStore.players.find(p => p.id === data.from);
      const fromName = player?.name || (data.from === "host" ? localeStore.t("menu.host") : data.from);

      const message: ChatMessage = {
        from: fromName,
        text: data.message,
        isOwn: false,
      };
      this.addMessage(tab, message);
    },
  },
});
