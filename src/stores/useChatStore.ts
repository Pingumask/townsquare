import { defineStore } from "pinia";
import { usePlayersStore } from "./usePlayersStore";
import { useLocaleStore } from "./useLocaleStore";
import { ChatChannel } from "@/types";

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
    addMessage(tab: ChatChannel, message: ChatMessage) {
      this.messages[tab]?.push(message);
    },

    clearMessages(tab: ChatChannel) {
      this.messages[tab] = [];
    },

    receiveMessage(data: { from: string; message: string }, tab: ChatChannel) {
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
