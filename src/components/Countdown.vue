<template>
  <div :data-text="timerName" :style="style" class="countdown" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  timerName?: string;
  timerDuration?: number;
}>();

const style = computed(() => `--timer: ${props.timerDuration}`);
</script>

<style lang="scss" scoped>
div {
  width: 100%;
  height: 1.4em;
  border: 2px solid black;
  backdrop-filter: blur(3px);
  position: relative;
  z-index: 0;
  margin-top: 0.3em;
}

div::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(255, 0, 0, 0.8);
  backdrop-filter: blur(3px);
  z-index: 1;
  animation: forwards countdown calc(var(--timer) * 1s) linear;
}

div::after {
  position: absolute;
  inset: 0;
  text-align: center;
  content: attr(data-text);
  z-index: 2;
  backdrop-filter: blur(3px);
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0) 5%,
      rgba(255, 255, 255, 0.5) 15%,
      rgba(255, 255, 255, 0) 35%,
      rgba(0, 0, 0, 0) 60%,
      rgba(0, 0, 0, 0.7) 100%);
}

@keyframes countdown {
  0% {
    width: 100%;
  }

  100% {
    width: 0%;
    display: none;
  }
}
</style>
