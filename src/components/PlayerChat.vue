<template>
  <div
    v-if="isSeated && grimoire.isWhisperingAllowed"
    ref="playerChat"
    class="player-chat"
    :class="{ closed: !isChatOpen }"
  >
    <h3>
      <span>{{ t("chat.title") }}</span>
      <font-awesome-icon
        icon="times-circle"
        class="fa fa-times-circle"
        @click.stop="toggleChat"
      />
      <font-awesome-icon
        icon="plus-circle"
        class="fa fa-plus-circle"
        @click.stop="toggleChat"
      />
    </h3>
    <div v-if="!isChatOpen" style="display: none"></div>
    <div v-else class="chat-container">
      <ul class="tabs">
        <li
          aria-role="tab"
          class="tab"
          :class="{ active: activeTab === 'left' }"
          @click="activeTab = 'left'"
        >
          {{ leftNeighbor?.name }}
        </li>
        <li
          aria-role="tab"
          class="tab"
          :class="{ active: activeTab === 'right' }"
          @click="activeTab = 'right'"
        >
          {{ rightNeighbor?.name }}
        </li>
      </ul>

      <div ref="messagesContainer" class="messages">
        <div
          v-for="(msg, index) in activeMessages"
          :key="index"
          :class="['message', msg.isOwn ? 'own' : 'other']"
        >
          {{ msg.text }}
        </div>
      </div>

      <div class="input-area">
        <input
          v-model="messageInput"
          type="text"
          :placeholder="t('chat.type_message')"
          :disabled="!activeNeighbor || activeNeighbor.id === ''"
          @keyup.enter="sendMessage"
        />
        <button
          :disabled="!activeNeighbor || activeNeighbor.id === '' || isCooldown"
          @click="sendMessage"
        >
          <font-awesome-icon
            :icon="['fas', 'paper-plane']"
            :title="activeNeighbor && activeNeighbor.id !== '' ? t('chat.send') : t('chat.cannotSend')"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
  useChatStore,
  useGrimoireStore,
  useAnimationStore,
} from "@/stores";
import socket from "@/services/socket";

const locale = useLocaleStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const chatStore = useChatStore();
const grimoire = useGrimoireStore();
const animationStore = useAnimationStore();
const t = locale.t;

const isChatOpen = ref(false);
const activeTab = ref<"left" | "right">("left");
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

const isSeated = computed(() => {
  return sessionStore.isPlayerOrSpectator && currentPlayerIndex.value !== -1;
});

const currentPlayerName = computed(() => {
  return playersStore.players[currentPlayerIndex.value]?.name || "You";
});

const leftNeighbor = computed(() => playersStore.leftNeighbor);

const rightNeighbor = computed(() => playersStore.rightNeighbor);

const activeMessages = computed(() => {
  return chatStore.messages[activeTab.value] || [];
});

const activeNeighbor = computed(() => {
  return activeTab.value === "left" ? leftNeighbor.value : rightNeighbor.value;
});

watch(
  [activeMessages, isChatOpen, activeTab],
  () => {
    if (isChatOpen.value) {
      scrollToBottom();
    }
  },
  { deep: true }
);

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

const animateMessageSent = () => {
  const neighbor = activeNeighbor.value;
  if (!neighbor) return;
  const fromIndex = currentPlayerIndex.value;
  const toIndex = playersStore.players.indexOf(neighbor);
  animationStore.addAnimation({ from: fromIndex, to: toIndex, emoji: "✉️" });
};

const isCooldown = ref(false);

const sendMessage = () => {
  if (isCooldown.value || !messageInput.value.trim()) return;

  const neighbor =
    activeTab.value === "left" ? leftNeighbor.value : rightNeighbor.value;
  if (!neighbor || neighbor.id === "") return;

  const msg = {
    from: currentPlayerName.value,
    text: messageInput.value,
    isOwn: true,
  };
  chatStore.addMessage(activeTab.value, msg);
  scrollToBottom();

  const chatMessage = {
    from: sessionStore.playerId,
    message: messageInput.value,
  };


  socket.send("direct", { [neighbor.id]: ["chat", chatMessage] });

  animateMessageSent();

  const activityData = { from: sessionStore.playerId, to: neighbor.id };
  const recipients: Record<string, unknown> = {};
  players.value
    .filter((p) => p.id !== sessionStore.playerId && p.id !== "")
    .forEach((p) => {
      recipients[p.id] = ["chatActivity", activityData];
    });
  recipients["host"] = ["chatActivity", activityData];
  socket.send("direct", recipients);

  messageInput.value = "";

  isCooldown.value = true;
  setTimeout(() => {
    isCooldown.value = false;
  }, 800);
};
</script>

<style scoped>
.player-chat {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  z-index: 50;
  padding: 10px;
  color: white;
  max-width: 90vw;
  transition: all 250ms ease-in-out;
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
  border-radius: 5px 5px 0 0;
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
  padding: 0.125rem 0.5rem;
  border-radius: 5px;
  word-wrap: break-word;
}

.message.own {
  background: rgba(255, 255, 255, 0.5);
  align-self: flex-end;
  max-width: 80%;
}

.message.other {
  background: rgba(100, 100, 100, 0.5);
  align-self: flex-start;
  max-width: 80%;
}

.input-area {
  display: flex;
  gap: 5px;
}

.input-area input {
  flex: 1;
  font-size: inherit;
  padding: 0 0.5rem;
  margin: 5px auto;
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
