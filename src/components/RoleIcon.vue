<template>
  <picture v-if="role.id && role.id != 'empty'" class="role" :class="[player?.alignment, role.team]">
    <img v-if="role.image && grimoire.isImageOptIn" :src="rolePath(role)" :alt="role.id">
    <img v-else-if="role.image && !grimoire.isImageOptIn" :src="rolePath({ id: 'custom' } as Role)" :alt="role.id">
    <InlineSvg v-else :src="rolePath(role)" />
  </picture>
</template>

<script setup lang="ts">
import type { Role, Player } from '@/types';
import { computed } from 'vue';
import { useStore } from 'vuex';
import InlineSvg from 'vue-inline-svg';
import { useRolePath } from '@/composables';


const props = defineProps<{
  role: Role;
  player?: Player | undefined;
}>();

const store = useStore();
const grimoire = computed(() => store.state.grimoire);

const role = computed(() => props.role);
const player = computed(() => props.player);

const { rolePath } = useRolePath();
</script>

<style scoped lang="scss">
.role {
  width: 100%;
  height: 100%;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: contain;
  position: relative;
  z-index: 0;
  margin-top: 0.3em;
  mix-blend-mode: var(--blend);
}

.role img,
.role svg {
  max-width: 100%;
  max-height: 100%;
}
</style>
