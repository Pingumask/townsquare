<template>
  <div v-if="grimoire.isDiscordIntegrationEnabled" class="discord-panel" :class="{ open: isOpen }">
    <div class="tab" @click="isOpen = !isOpen">
      <span>Voice</span>
    </div>

    <div v-if="isOpen" class="content">
      <div v-if="!userPreferences.discordUsername" class="warning">
        Please set your Discord Username in Settings or click a seat to enable Voice Chat integration.
      </div>
      
      <div v-else>
        <!-- Incoming Request Alert -->
        <div v-if="Object.keys(discordStore.privateRequests).length > 0" class="requests">
             <div v-for="(_, pid) in discordStore.privateRequests" :key="pid" class="request-item">
                <span class="req-text">{{ getPlayerName(pid) }} wants to call</span>
                <div class="req-actions">
                  <button class="accept" @click="discordStore.acceptPrivateChat(pid)">Join</button>
                  <button class="reject" @click="delete discordStore.privateRequests[pid]">X</button>
                </div>
             </div>
        </div>

        <div class="controls">
           <div v-if="!session.isPlayerOrSpectator" class="host-controls">
             <button 
               class="call-all-btn" 
               @click="callAllPlayers"
             >
               <font-awesome-icon icon="users" />
               Call Main Hall
             </button>

             <button 
               class="mute-btn" 
               :class="{ muted: discordStore.isMuted }"
               @click="discordStore.toggleMute()"
               :title="discordStore.isMuted ? 'Unmute All' : 'Mute All'"
             >
               <font-awesome-icon :icon="discordStore.isMuted ? 'microphone-slash' : 'microphone'" />
             </button>
           </div>

           <button 
             class="request-call-btn" 
             :class="{ active: discordStore.isSelectingForChat }"
             @click="discordStore.toggleSelection()"
           >
             <font-awesome-icon icon="headset" />
             {{ discordStore.isSelectingForChat ? 'Select Player...' : 'Request Call' }}
           </button>
        </div>

        <!-- Public Rooms -->
        <div class="room-list">
          <div 
            v-for="room in ['Main Hall', 'Potion Shop', 'Library']" 
            :key="room"
            class="room"
            :class="{ active: discordStore.currentRoom === room }"
            @click="discordStore.moveToRoom(room)"
          >
            <div class="room-header">
              <span class="room-name">{{ room }}</span>
              <span v-if="discordStore.roomState[room]?.length" class="count">
                {{ discordStore.roomState[room].length }}
              </span>
            </div>
            
            <div class="players">
               <span v-for="pid in discordStore.roomState[room]" :key="pid" class="player-pill">
                  {{ getPlayerName(pid) }}
               </span>
            </div>
          </div>
        </div>

        <!-- Active Private Call -->
        <div v-if="discordStore.activePrivateRoom" class="private-call">
          <h3>Private Call</h3>
          <div class="room active">
             <div class="players">
               <span v-for="pid in discordStore.roomState[discordStore.activePrivateRoom] || []" :key="pid" class="player-pill">
                  {{ getPlayerName(pid) }}
               </span>
            </div>
            <button class="exit-btn" @click="discordStore.moveToRoom('Main Hall')">
               <font-awesome-icon icon="phone-slash" /> Leave
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDiscordStore, useGrimoireStore, usePlayersStore, useSessionStore, useUserPreferencesStore } from "@/stores";

const isOpen = ref(false);
const discordStore = useDiscordStore();
const grimoire = useGrimoireStore();
const session = useSessionStore();
const playersStore = usePlayersStore();
const userPreferences = useUserPreferencesStore();

function callAllPlayers() {
  if (confirm("Move all players to Main Hall?")) {
    discordStore.callAllToMainHall();
  }
}

const getPlayerName = (id: string) => playersStore.players.find(p => p.id === id)?.name ?? id;

</script>

<style lang="scss" scoped>
@use "../vars.scss" as *;

.discord-panel {
  position: absolute;
  top: 50px;
  left: 0;
  z-index: 100;
  transition: all 0.3s ease;
  pointer-events: none;

  .tab {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #444;
    border-left: none;
    border-radius: 0 10px 10px 0;
    padding: 10px 15px;
    cursor: pointer;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: all;
    font-weight: bold;
    
    &:hover {
      background: rgba(30,30,30,0.9);
    }
  }

  &.open {
    transform: translateX(0);
    
    .tab {
      background: #333;
    }
  }

  .content {
    margin-top: 50px; 
    margin-left: 10px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #444;
    border-radius: 10px;
    padding: 15px;
    width: 280px;
    pointer-events: all;
    max-height: 80vh;
    overflow-y: auto;
  }
}

.controls {
  margin-bottom: 10px;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.host-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

%btn {
  width: 100%;
  padding: 8px;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

.call-all-btn {
  @extend %btn;
  background: #c44;
  border: 1px solid #a33;
  flex: 1;
  &:hover { background: #d55; }
}

.mute-btn {
  padding: 8px;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  background: #4a4a4a;
  border: 1px solid #666;
  width: 40px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  &.muted {
    background: #c44;
    border: 1px solid #a33;
  }
  &:hover { background: #5a5a5a; }
  &.muted:hover { background: #d55; }
}

.request-call-btn {
  @extend %btn;
  background: #2a2a2a;
  border: 1px solid #444;
  &.active { background: var(--townsfolk); }
  &:hover { background: #3a3a3a; }
  &.active:hover { background: var(--townsfolk); opacity: 0.9; }
}

.requests {
  margin-bottom: 15px;
  background: rgba(0, 100, 0, 0.2);
  padding: 10px;
  border-radius: 5px;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 0.9em;
  
  .req-actions {
    display: flex;
    gap: 5px;
    
    button {
       padding: 2px 6px;
       border-radius: 3px;
       border: none;
       cursor: pointer;
       
       &.accept { background: #28a745; color: white; }
       &.reject { background: #dc3545; color: white; }
    }
  }
}

.room {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 5px;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  transition: background 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255,255,255,0.1);
  }

  &.active {
    border-color: var(--townsfolk);
    background: rgba(var(--townsfolk-rgb), 0.1);
  }
}

.room-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 5px;
}

.players {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.player-pill {
  font-size: 0.8em;
  background: #444;
  padding: 2px 6px;
  border-radius: 4px;
}

.private-call {
  margin-top: 20px;
  border-top: 1px solid #444;
  padding-top: 10px;
  
  h3 {
    font-size: 1em;
    margin-bottom: 5px;
    text-align: left;
  }
  
  .exit-btn {
    margin-top: 5px;
    width: 100%;
    background: #a33;
    color: white;
    border: none;
    padding: 5px;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #c44;
    }
  }
}

.warning {
  color: #ffaa00;
  font-size: 0.9em;
  text-align: center;
}
</style>
