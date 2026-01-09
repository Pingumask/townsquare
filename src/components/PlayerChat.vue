<template>
  <div v-if="isSeated" ref="playerChat" class="player-chat" :class="{ closed: !isChatOpen }">
    <h3>
      <span>{{ t('chat.title') }}</span>
      <font-awesome-icon icon="times-circle" class="fa fa-times-circle" @click.stop="toggleChat" />
      <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="toggleChat" />
    </h3>
    <div v-if="!isChatOpen" style="display: none;"></div>
    <div v-else class="chat-container">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'left' }" 
          @click="activeTab = 'left'"
        >
          {{ leftNeighbor?.name }}
        </button>
        <button 
          :class="{ active: activeTab === 'right' }" 
          @click="activeTab = 'right'"
        >
          {{ rightNeighbor?.name }}
        </button>
      </div>

      <div class="messages">
        <div 
          v-for="(msg, index) in activeMessages" 
          :key="index"
          :class="['message', msg.isOwn ? 'own' : 'other']"
        >
          <strong>{{ msg.from }}:</strong> {{ msg.text }}
        </div>
      </div>

      <div class="input-area">
        <input 
          v-model="messageInput" 
          type="text"
          :placeholder="t('chat.type_message')"
          @keyup.enter="sendMessage"
        />
        <button @click="sendMessage">{{ t('chat.send') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useLocaleStore, usePlayersStore, useSessionStore, useChatStore } from "@/stores";
import socket from "@/services/socket";

const locale = useLocaleStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const chatStore = useChatStore();
const t = locale.t;

const isChatOpen = ref(false);
const activeTab = ref<'left' | 'right'>('left');
const messageInput = ref('');

const players = computed(() => playersStore.players);
const currentPlayerIndex = computed(() => {
  return players.value.findIndex(p => p.id === sessionStore.playerId);
});

const isSeated = computed(() => {
  return sessionStore.isPlayerOrSpectator && currentPlayerIndex.value !== -1;
});

const currentPlayerName = computed(() => {
  return playersStore.players[currentPlayerIndex.value]?.name || 'You';
});

const leftNeighbor = computed(() => {
  if (currentPlayerIndex.value === -1) return null;
  const idx = (currentPlayerIndex.value - 1 + players.value.length) % players.value.length;
  return players.value[idx];
});

const rightNeighbor = computed(() => {
  if (currentPlayerIndex.value === -1) return null;
  const idx = (currentPlayerIndex.value + 1) % players.value.length;
  return players.value[idx];
});

const activeMessages = computed(() => {
  return chatStore.messages[activeTab.value] || [];
});

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

const sendMessage = () => {
  if (!messageInput.value.trim()) return;
  
  const neighbor = activeTab.value === 'left' ? leftNeighbor.value : rightNeighbor.value;
  if (!neighbor) return;

  // Add message to store
  const msg = {
    from: currentPlayerName.value,
    text: messageInput.value,
    isOwn: true,
  };
  chatStore.addMessage(activeTab.value, msg);
  
  // Send via socket to neighbor with sender ID included
  const chatMessage = {
    from: sessionStore.playerId,
    message: messageInput.value,
  };
  
  console.log("[Chat] Sending to", neighbor.id, ":", chatMessage);

  socket.send("direct", { [neighbor.id]: ["chat", chatMessage] });
  
  messageInput.value = '';
};
</script>

<style scoped>
.player-chat {
  position: absolute;
  left: 10px;
  top: 40%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  border: 3px solid #4a4a4a;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  z-index: 50;
  padding: 10px;
  color: white;
  width: 350px;
  max-width: 90vw;
  transition: all 250ms ease-in-out;
  display: flex;
  flex-direction: column;
}

.player-chat.closed {
  width: auto;
  height: auto;
  border: 3px solid #4a4a4a;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 10px;
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
  font-size: 1.5em;
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

.tabs button {
  flex: 1;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px 5px 0 0;
  transition: background 250ms;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabs button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tabs button.active {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 2px solid #fff;
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.message {
  padding: 8px;
  border-radius: 5px;
  word-wrap: break-word;
}

.message.own {
  background: rgba(100, 150, 255, 0.5);
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
  padding: 8px;
  border: 1px solid #666;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.input-area input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-area button {
  padding: 8px 16px;
  background: rgba(100, 150, 255, 0.7);
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: background 250ms;
}

.input-area button:hover {
  background: rgba(100, 150, 255, 0.9);
}
</style>
