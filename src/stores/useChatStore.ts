import { defineStore } from "pinia";
import socket from "@/services/socket";
import { useLocaleStore, usePlayersStore, useSessionStore } from "@/stores";
import type { ChatChannel, ChatMessage } from "@/types";

interface ChatState {
  activeTab: ChatChannel;
  targetPlayer: string; // Player id
  messages: Record<string, ChatMessage[]>;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    activeTab: "global",
    targetPlayer: "",
    messages: {
      left: [] as ChatMessage[],
      right: [] as ChatMessage[],
      global: [] as ChatMessage[],
      whispers: [] as ChatMessage[],
      host: [] as ChatMessage[],
    },
  }),

  actions: {
    addMessage(tab: ChatChannel, message: ChatMessage) {
      this.messages[tab]?.push(message);
    },

    clearMessages(forceClear: boolean = false) {
      const locale = useLocaleStore();
      const t = locale.t;
      this.$reset();
      const session = useSessionStore();
      if (!session.isPlayerOrSpectator) {
        if(forceClear || confirm(t('prompt.clearAllChat'))) {
          socket.send('clearChat');
        }
      }
    },

    receiveMessage(msg: ChatMessage, tab: ChatChannel) {
      const playersStore = usePlayersStore();
      const localeStore = useLocaleStore();

      const fromPlayer = playersStore.getById(msg.fromId);
      msg.fromName = msg.fromId === "host" || msg.fromId === "" ? localeStore.t("chat.host") : fromPlayer?.name || msg.fromId;

      const toPlayer = playersStore.getById(msg.toId);
      msg.toName = msg.toId === "host" || msg.toId === "" ? localeStore.t("chat.host") : toPlayer?.name || msg.toId || "Undefined";

      this.addMessage(tab, msg);
    },
  },
  persist: true,
});
