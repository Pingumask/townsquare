<template>
  <div v-if="players.length" ref="bluffs" class="bluffs" :class="{ closed: !isBluffsOpen }">
    <h3>
      <span v-if="isSpectator">{{ t('townsquare.others') }}</span>
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
import { usePlayersStore, useSessionStore } from "@/stores";
import { useTranslation } from "@/composables";
import { Token } from "@/components";

const emit = defineEmits(["openRoleModal"]);

const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const { t } = useTranslation();

const isBluffsOpen = ref(true);
const bluffSize = ref(3);

const players = computed(() => playersStore.players);
const bluffs = computed(() => playersStore.bluffs);
const isSpectator = computed(() => sessionStore.isSpectator);

const toggleBluffs = () => {
  isBluffsOpen.value = !isBluffsOpen.value;
};

const openRoleModal = (index: number) => {
  emit("openRoleModal", index);
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
  /* Keep opacity 1 to show the plus button */
}

.bluffs.closed ul,
.bluffs.closed h3 span {
  display: none;
}

.bluffs.closed {
  width: auto;
  height: auto;
  border: none;
  background: none;
}

.bluffs h3 {
  margin: 5px 1vh 0;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  font-size: 1.2em;
}

.bluffs h3 .fa {
  cursor: pointer;
  font-size: 0.8em;
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
  font-size: 1.5em;
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
