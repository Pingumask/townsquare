<template>
  <audio ref="gavelAudio" preload="auto" :muted="userPreferences.isMuted" @play="showGavel = true"
    @ended="showGavel = false">
    <source src="../assets/sounds/gavel.mp3">
  </audio>
  <audio ref="ringingAudio" preload="auto" :muted="userPreferences.isMuted" @play="showRinging = true"
    @ended="showRinging = false">
    <source src="../assets/sounds/countdown.mp3">
  </audio>
  <audio ref="roosterAudio" preload="auto" :muted="userPreferences.isMuted" @play="showRooster = true"
    @ended="showRooster = false">
    <source src="../assets/sounds/rooster.mp3">
  </audio>
  <ul>
    <li v-if="showRinging">
      <font-awesome-icon :icon="['fas', 'music']" />
      <font-awesome-icon :icon="['fas', 'bell']" />
      <font-awesome-icon :icon="['fas', 'music']" />
    </li>
    <li v-if="showRooster">
      <img src="../assets/icons/dawn.png" alt="dawn" style="height: 2em">
    </li>
    <li v-if="showGavel">
      <font-awesome-icon :icon="['fas', 'gavel']" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useSoundboardStore, useUserPreferencesStore } from "@/stores";

const userPreferences = useUserPreferencesStore();
const soundboard = useSoundboardStore();

const ringingAudio = ref<HTMLAudioElement>();
const roosterAudio = ref<HTMLAudioElement>();
const gavelAudio = ref<HTMLAudioElement>();

const showGavel = ref(false);
const showRinging = ref(false);
const showRooster = ref(false);

watch(() => soundboard.ringingTrigger, () => {
  if (ringingAudio.value) {
    ringingAudio.value.play();
  }
});

watch(() => soundboard.roosterTrigger, () => {
  if (roosterAudio.value) {
    roosterAudio.value.play();
  }
});

watch(() => soundboard.gavelTrigger, () => {
  if (gavelAudio.value) {
    gavelAudio.value.play();
  }
});
</script>
