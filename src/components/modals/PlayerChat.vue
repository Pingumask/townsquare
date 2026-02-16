<template>
  <MovableDialog v-if="canShowChat" class="player-chat" :position="userPreferences.chat.position" :isOpen="isChatOpen"
    :title="t('chat.title')" @toggle="handleToggle">
    <div v-if="!sessionStore.isPlayerOrSpectator">
      <em role="button" @click="grimoire.setAllowWhisper(!grimoire.isWhisperAllowed)">
        <font-awesome-icon :icon="[
          'fas',
          grimoire.isWhisperAllowed ? 'check-square' : 'square',
        ]" />
        {{ t('menu.allowWhisper') }}
      </em>
    </div>
    <div class="chat-container">
      <ul class="tabs">
        <li v-if="sessionStore.isPlayerOrSpectator && grimoire.isWhisperAllowed" aria-role="tab" class="tab"
          :class="{ active: chatStore.activeTab === 'left' }" @click="chatStore.activeTab = 'left'">
          {{ leftNeighbor?.name }}
        </li>
        <li aria-role="tab" class="tab" :class="{ active: chatStore.activeTab === 'global' }"
          @click="chatStore.activeTab = 'global'">
          {{ t("chat.global") }}
        </li>
        <li aria-role="tab" class="tab" :class="{ active: chatStore.activeTab === 'host' }"
          @click="chatStore.activeTab = 'host'">
          {{ sessionStore.isPlayerOrSpectator ? t('chat.host') : t('chat.players') }}
        </li>
        <li v-if="!sessionStore.isPlayerOrSpectator && grimoire.isWhisperAllowed" aria-role="tab" class="tab"
          :class="{ active: chatStore.activeTab === 'whispers' }" @click="chatStore.activeTab = 'whispers'">
          {{ t('chat.whispers') }}
        </li>
        <li v-if="sessionStore.isPlayerOrSpectator && grimoire.isWhisperAllowed" aria-role="tab" class="tab"
          :class="{ active: chatStore.activeTab === 'right' }" @click="chatStore.activeTab = 'right'">
          {{ rightNeighbor?.name }}
        </li>
      </ul>

      <div ref="messagesContainer" class="messages">
        <div v-for="(msg, index) in activeMessages" :key="index"
          :class="{ message: true, own: msg.fromName === sessionStore.currentPlayerName, other: msg.fromName !== sessionStore.currentPlayerName, host: msg.fromId === 'host' }">
          <strong v-if="msg.fromName !== sessionStore.currentPlayerName"
            :role="chatStore.activeTab === 'host' && !sessionStore.isPlayerOrSpectator ? 'button' : ''"
            @click="chatStore.targetPlayer = msg.fromId">{{
              msg.fromName }}</strong>
          <em
            v-if="chatStore.activeTab === 'host' && !sessionStore.isPlayerOrSpectator && msg.fromName === sessionStore.currentPlayerName || chatStore.activeTab === 'whispers'">{{
              ` ${t('chat.to')}
            ${msg.toName}` }}</em>
          <template
            v-if="msg.fromName !== sessionStore.currentPlayerName || chatStore.activeTab === 'host' && !sessionStore.isPlayerOrSpectator">:
          </template>
          {{ msg.text }}
        </div>
      </div>

      <div v-if="chatStore.activeTab !== 'whispers'" class="input-area">
        <input v-model="messageInput" type="text" :placeholder="t('chat.type_message')" :disabled="isInputDisabled"
          @keyup.enter="sendMessage" />

        <button :disabled="isSendDisabled" @click="sendMessage">
          <font-awesome-icon :icon="['fas', 'paper-plane']" :title="getTooltipTitle()" />
        </button>
      </div>
    </div>
    <select v-if="!sessionStore.isPlayerOrSpectator && chatStore.activeTab === 'host'" v-model="chatStore.targetPlayer">
      <option v-for="player in playersStore.players" :key="`${player.name}-${player.id}`" :value="player.id">
        {{ player.name }}
      </option>
    </select>
  </MovableDialog>
</template>

<script setup lang="ts">
import { MovableDialog } from "@/components";
import { ref, computed, watch, nextTick } from "vue";
import {
  useAnimationStore,
  useChatStore,
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
  useUserPreferencesStore,
} from "@/stores";
import socket from "@/services/socket";
import { ChatMessage } from "@/types";

const animationStore = useAnimationStore();
const chatStore = useChatStore();
const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const userPreferences = useUserPreferencesStore();
const t = locale.t;

const isChatOpen = ref(true);
const messageInput = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const players = computed(() => playersStore.players);
const currentPlayerIndex = computed(() => playersStore.currentPlayerIndex);

const canShowChat = computed(() => {
  if (!grimoire.isTextChatAllowed) return false;
  if (!sessionStore.sessionId) return false;
  return !sessionStore.isPlayerOrSpectator || isSeated.value;
});

const isSeated = computed(() => {
  return sessionStore.isPlayerOrSpectator && currentPlayerIndex.value !== -1;
});

const leftNeighbor = computed(() => playersStore.leftNeighbor);

const rightNeighbor = computed(() => playersStore.rightNeighbor);

const activeMessages = computed(() => {
  return chatStore.messages[chatStore.activeTab] || [];
});

const activeNeighbor = computed(() => {
  if (chatStore.activeTab === "left") return leftNeighbor.value;
  if (chatStore.activeTab === "right") return rightNeighbor.value;
  return null;
});

const isInputDisabled = computed(() => {
  if (chatStore.activeTab === "global" || chatStore.activeTab === "host") return false;
  return !activeNeighbor.value || activeNeighbor.value.id === "";
});

const isSendDisabled = computed(() => {
  return isCooldown.value || isInputDisabled.value;
});

const getTooltipTitle = () => {
  if (chatStore.activeTab === "global") return t("chat.send");
  return activeNeighbor.value && activeNeighbor.value.id !== ""
    ? t("chat.send")
    : t("chat.cannotSend");
};

watch(
  [activeMessages, isChatOpen, chatStore.activeTab],
  () => {
    if (isChatOpen.value) {
      scrollToBottom();
    }
  },
  { deep: true }
);

const animateMessageSent = () => {
  const neighbor = activeNeighbor.value;
  if (!neighbor) return;
  const fromIndex = currentPlayerIndex.value;
  const toIndex = playersStore.players.indexOf(neighbor);
  animationStore.addAnimation({ from: fromIndex, to: toIndex, emoji: "✉️" });
};

const isCooldown = ref(false);

const startCooldown = (duration: number) => {
  isCooldown.value = true;
  setTimeout(() => {
    isCooldown.value = false;
  }, duration);
};

const buildRecipients = <T>(command: string, data: T): Record<string, [string, T]> => {
  const recipients: Record<string, [string, T]> = {};
  players.value
    .filter((p) => p.id !== sessionStore.playerId && p.id !== "")
    .forEach((p) => {
      recipients[p.id] = [command, data];
    });
  recipients["host"] = [command, data];
  return recipients;
};

const sendMessage = () => {
  const t = useLocaleStore().t;
  if (isCooldown.value || !messageInput.value.trim()) return;

  const chatMessage: ChatMessage = {
    fromId: sessionStore.isPlayerOrSpectator ? sessionStore.playerId : "host",
    fromName: sessionStore.currentPlayerName,
    toId: '',
    toName: '',
    text: messageInput.value,
  };

  if (chatStore.activeTab === "global") {
    chatStore.addMessage("global", chatMessage);
    socket.send("direct", buildRecipients("globalChat", chatMessage));
    startCooldown(3000);
  } else if (chatStore.activeTab === "host" && sessionStore.isPlayerOrSpectator) {
    chatMessage.toId = "host";
    chatStore.addMessage("host", chatMessage);
    socket.send("direct", { ['host']: ["chat", chatMessage] });
    startCooldown(800);
  } else if (chatStore.activeTab === "host" && !sessionStore.isPlayerOrSpectator) {
    const toPlayer = playersStore.getById(chatStore.targetPlayer);
    if (!toPlayer ||toPlayer.id === "") return alert(t('chat.cannotSend'));
    chatMessage.toId = toPlayer.id;
    chatMessage.toName = toPlayer.name;
    chatStore.addMessage("host", chatMessage);
    socket.send("direct", { [chatStore.targetPlayer]: ["chat", chatMessage] });
    startCooldown(800);
  } else {
    const neighbor = activeNeighbor.value;
    if (!neighbor || neighbor.id === "") return alert(t('chat.cannotSend'));
    chatMessage.toId = neighbor.id;
    chatMessage.toName = neighbor.name;
    chatStore.addMessage(chatStore.activeTab, chatMessage);
    socket.send("direct", { [neighbor.id]: ["chat", chatMessage] });
    socket.send("direct", { ["host"]: ["chat", chatMessage] });
    animateMessageSent();

    const activityData = { from: sessionStore.playerId, to: neighbor.id };
    socket.send("direct", buildRecipients("chatActivity", activityData));
    startCooldown(800);
  }

  scrollToBottom();
  messageInput.value = "";
};

const handleToggle = () => {
  isChatOpen.value = !isChatOpen.value;
};
</script>

<style scoped>
.player-chat {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  padding: 10px;
  color: white;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
}

.player-chat.closed {
  background: rgba(0, 0, 0, 0.5);
}

.player-chat.closed .chat-container {
  display: none;
}

.player-chat h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.17em;
  margin: 0;
  padding: 0;
  min-height: 30px;
}

.player-chat h3 span {
  flex: 1;
}

.player-chat h3 .fa {
  cursor: pointer;
  margin-left: 10px;
  font-size: 1em;
}

.player-chat h3 .fa-times-circle {
  display: block;
}

.player-chat h3 .fa-plus-circle {
  display: none;
}

.player-chat.closed h3 .fa-times-circle {
  display: none;
}

.player-chat.closed h3 .fa-plus-circle {
  display: block;
}

.chat-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  height: 400px;
  width: min(42ch, 80vw);
}

.tabs {
  display: flex;
  gap: 5px;
  border-bottom: 2px solid #666;
  flex-shrink: 0;
}

.tabs .tab {
  flex: 1;
  border: 1px solid grey;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  padding: 0.15em 1em;
  color: white;
  cursor: pointer;
  transition: background 250ms;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

.tabs .tab:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tabs .tab.active {
  background: linear-gradient(rgb(31, 101, 255) 0%, rgba(0, 0, 0, 0.5) 100%);
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.2);
}

.message {
  background: var(--bg);
  outline: 1px solid var(--bg);
  padding: 0.125rem 0.5rem;
  border-radius: 5px;
  word-wrap: break-word;

  &.own {
    --bg: #666;
    align-self: flex-end;
    max-width: 80%;
    margin-right: 0.5rem;

    &:after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      width: 0;
      height: 0;
      border: 0.4rem solid transparent;
      border-left-color: var(--bg);
      border-right: 0;
      margin-top: -0.4em;
      margin-right: -0.4em;
    }
  }

  &.other {
    --bg: #333;
    align-self: flex-start;
    max-width: 80%;

    &:after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 0;
      height: 0;
      border: 0.4rem solid transparent;
      border-right-color: var(--bg);
      border-left: 0;
      margin-top: -0.4em;
      margin-left: -0.4em;
    }
  }

  &.host {
    --bg: #ddd;
    color: black;
  }
}

select {
  width: 100%;
  font-size: 0.8em;
  margin: 0;
}

.input-area {
  display: flex;
  gap: 5px;
}

.input-area input {
  flex: 1;
  font-size: inherit;
  padding: 0 0.5rem;
  margin: 0;
  border: 1px solid #666;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.input-area input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-area input:focus {
  outline: 1px solid white;
}

.input-area button {
  color: white;
  cursor: pointer;
  transition: background 250ms;
}

.input-area button:disabled {
  cursor: not-allowed;
}

.input-area input:disabled {
  cursor: not-allowed;
}
</style>

<style lang="scss">
.player-chat h3 svg:hover path {
  fill: url(#demon);
  stroke-width: 30px;
  stroke: white;
}
</style>
