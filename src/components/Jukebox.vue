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
  <audio ref="deathAudio" preload="auto" :muted="userPreferences.isMuted" @play="showDeath = true"
    @ended="showDeath = false">
    <source src="../assets/sounds/death.mp3">
  </audio>
  <audio ref="votingBellAudio" preload="auto" :muted="userPreferences.isMuted">
    <source src="../assets/sounds/voting_bell.mp3">
  </audio>
  <audio ref="votingClock1Audio" preload="auto" :muted="userPreferences.isMuted">
    <source src="../assets/sounds/voting_clock_1.mp3">
  </audio>
  <audio ref="votingClock2Audio" preload="auto" :muted="userPreferences.isMuted">
    <source src="../assets/sounds/voting_clock_2.mp3">
  </audio>
  <audio ref="riserAudio" preload="auto" :muted="userPreferences.isMuted">
    <source src="../assets/sounds/riser.mp3">
  </audio>
  <audio ref="drumRollAudio" preload="auto" :muted="userPreferences.isMuted" @play="showDrumRoll = true"
    @ended="showDrumRoll = false">
    <source src="../assets/sounds/drum_roll.mp3">
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
    <li v-if="showDeath">
      🪦
    </li>
    <li v-if="showDrumRoll">
      🥁
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Ref } from "vue";
import { useSoundboardStore, useUserPreferencesStore } from "@/stores";

const userPreferences = useUserPreferencesStore();
const soundboard = useSoundboardStore();

const ringingAudio = ref<HTMLAudioElement>();
const roosterAudio = ref<HTMLAudioElement>();
const gavelAudio = ref<HTMLAudioElement>();
const deathAudio = ref<HTMLAudioElement>();
const votingBellAudio = ref<HTMLAudioElement>();
const votingClock1Audio = ref<HTMLAudioElement>();
const votingClock2Audio = ref<HTMLAudioElement>();
const riserAudio = ref<HTMLAudioElement>();
const drumRollAudio = ref<HTMLAudioElement>();

const showGavel = ref(false);
const showRinging = ref(false);
const showRooster = ref(false);
const showDeath = ref(false);
const showDrumRoll = ref(false);

function playOverlapping(audioRef: Ref<HTMLAudioElement | undefined, HTMLAudioElement | undefined>) {
  if (!audioRef.value) return;
  const clone = audioRef.value.cloneNode(true) as HTMLAudioElement;
  clone.volume = audioRef.value.volume;
  clone.muted = audioRef.value.muted;
  clone.play();
}

watch(() => soundboard.ringingTrigger, () => {
  if (ringingAudio.value) {
    ringingAudio.value.volume = soundboard.ringingVolume;
    ringingAudio.value.muted = userPreferences.isMuted;
    ringingAudio.value.play();
  }
});

watch(() => soundboard.roosterTrigger, () => {
  if (roosterAudio.value) {
    roosterAudio.value.volume = soundboard.roosterVolume;
    roosterAudio.value.muted = userPreferences.isMuted;
    roosterAudio.value.play();
  }
});

watch(() => soundboard.gavelTrigger, () => {
  if (gavelAudio.value) {
    gavelAudio.value.volume = soundboard.gavelVolume;
    gavelAudio.value.muted = userPreferences.isMuted;
    gavelAudio.value.play();
  }
});

watch(() => soundboard.deathTrigger, () => {
  if (deathAudio.value) {
    deathAudio.value.volume = soundboard.deathVolume;
    deathAudio.value.muted = userPreferences.isMuted;
    deathAudio.value.play();
  }
});

watch(() => soundboard.votingBellTrigger, () => {
  if (votingBellAudio.value) {
    votingBellAudio.value.volume = soundboard.votingBellVolume;
    votingBellAudio.value.muted = userPreferences.isMuted;
    votingBellAudio.value.play();
  }
});

watch(() => soundboard.votingClockTrigger, () => {
  let votingClockAudio;
  if (soundboard.votingClockType === 0) {
    votingClockAudio = votingClock1Audio;
    soundboard.votingClockType = 1;
  }
  else {
    votingClockAudio = votingClock2Audio;
    soundboard.votingClockType = 0;
  }
  if (votingClockAudio.value) {
    votingClockAudio.value.volume = soundboard.votingClockVolume;
    votingClockAudio.value.muted = userPreferences.isMuted;
    playOverlapping(votingClockAudio);
  }
});

watch(() => soundboard.riserTrigger, () => {
  if (riserAudio.value) {
    riserAudio.value.volume = soundboard.riserVolume;
    riserAudio.value.muted = userPreferences.isMuted;
    riserAudio.value.play();
  }
});

watch(() => soundboard.drumRollTrigger, () => {
  if (drumRollAudio.value) {
    drumRollAudio.value.volume = soundboard.drumRollVolume;
    drumRollAudio.value.muted = userPreferences.isMuted;
    drumRollAudio.value.play();
  }
});

</script>
