<template>
  <div v-if="players.length" ref="bluffs" class="bluffs" :class="{ closed: !isBluffsOpen }">
    <h3>
      <span v-if="isPlayerOrSpectator">{{ t('townsquare.others') }}</span>
      <span v-else>{{ t('townsquare.bluffs') }}</span>
      <font-awesome-icon icon="times-circle" class="fa fa-times-circle" @click.stop="toggleBluffs" />
      <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="toggleBluffs" />
    </h3>
    <ul>
      <li v-for="index in bluffSize" :key="index" @click="openRoleModal(index * -1)">
        <Token :role="bluffs[index - 1] || { id: '' }" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Token } from "@/components";
import {
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
} from "@/stores";

const emit = defineEmits(["openRoleModal"]);

const locale = useLocaleStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const t = locale.t;

const bluffSize = ref(3);
const isBluffsOpen = ref(true);

const bluffs = computed(() => playersStore.bluffs);
const isPlayerOrSpectator = computed(() => sessionStore.isPlayerOrSpectator);
const players = computed(() => playersStore.players);

const openRoleModal = (index: number) => {
  emit("openRoleModal", index);
};

const toggleBluffs = () => {
  isBluffsOpen.value = !isBluffsOpen.value;
};
</script>

<style scoped>
.bluffs {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  transform-origin: bottom left;
  transform: scale(1);
  opacity: 1;
  transition: all 250ms ease-in-out;
  z-index: 50;
  padding: 10px;
  color: white;
}

.bluffs.closed {
  opacity: 1;
  width: auto;
  height: auto;
  border: none;
  background: none;
}

.bluffs.closed ul,
.bluffs.closed h3 span {
  display: none;
}

.bluffs h3 {
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  font-size: 1.17em;
}

.bluffs h3 .fa {
  cursor: pointer;
}

.bluffs h3 .fa-times-circle {
  margin-left: 1vh;
  display: block;
}

.bluffs h3 .fa-plus-circle {
  margin-left: 1vh;
  display: none;
}

.bluffs.closed h3 .fa-times-circle {
  display: none;
}

.bluffs.closed h3 .fa-plus-circle {
  display: block;
}

.bluffs ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bluffs li {
  width: 14vmin;
  height: 14vmin;
  margin: 0 0.5%;
  display: inline-block;
  transition: all 250ms;
  cursor: pointer;
}
</style>
