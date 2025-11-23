<template>
  <div v-if="fabled.length" class="fabled" :class="{ closed: !isFabledOpen }">
    <h3>
      <span>{{ t('townsquare.fabled') }}</span>
      <font-awesome-icon icon="times-circle" class="fa fa-times-circle" @click.stop="toggleFabled" />
      <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="toggleFabled" />
    </h3>
    <ul>
      <li v-for="(role, index) in fabled" :key="index" :class="role.team" @click="removeFabled(index)">
        <div v-if="
          nightOrder.get(role)?.first &&
          (isNightOrder || !isSpectator)
        " class="night-order first">
          <em>{{ nightOrder.get(role)?.first }}</em>
          <span v-if="role.firstNightReminder">{{ role.firstNightReminder }}</span>
        </div>
        <div v-if="
          nightOrder.get(role)?.other &&
          (isNightOrder || !isSpectator)
        " class="night-order other">
          <em>{{ nightOrder.get(role)?.other }}</em>
          <span v-if="role.otherNightReminder">{{ role.otherNightReminder }}</span>
        </div>
        <Token :role="role" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { usePlayersStore, useSessionStore, useGrimoireStore, useLocaleStore } from "@/stores";
import { Token } from "@/components";

const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const grimoireStore = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;

const isFabledOpen = ref(true);

const fabled = computed(() => playersStore.fabled);
const nightOrder = computed(() => playersStore.nightOrder);
const isSpectator = computed(() => sessionStore.isSpectator);
const isNightOrder = computed(() => grimoireStore.isNightOrder);

const toggleFabled = () => {
  isFabledOpen.value = !isFabledOpen.value;
};

const removeFabled = (index: number) => {
  if (isSpectator.value) return;
  playersStore.setFabled({ index });
};
</script>
