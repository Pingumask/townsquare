<template>
  <Modal v-if="modals.fabled && fabled.length" @close="toggleModal('fabled')">
    <h3>{{ t('modal.fabled.title') }}</h3>
    <ul class="tokens">
      <li v-for="role in fabled" :key="role.id" @click="setFabled(role)">
        <Token :role="role" />
      </li>
    </ul>
  </Modal>
</template>

<script setup lang="ts">
import type { Role } from '@/types';
import { computed } from 'vue';
import { useStore } from 'vuex';
import Token from '../Token.vue';
import Modal from './Modal.vue';
import { useTranslation } from '@/composables';

const { t } = useTranslation();
const store = useStore();

const modals = computed(() => store.state.modals);

const fabled = computed((): Role[] => {
  return (Array.from(store.state.fabled.values()) as Role[]).filter((role: Role) =>
    !store.state.players.fabled.some((fable: Role) => fable.id === role.id)
  );
});

function setFabled(role: Role) {
  store.commit('players/setFabled', { fabled: role });
  store.commit('toggleModal', 'fabled');
}

function toggleModal(modal: string) {
  store.commit('toggleModal', modal);
}
</script>

<style scoped lang="scss">
@use "../../vars.scss" as *;

ul.tokens li {
  border-radius: 50%;
  width: 8vmax;
  margin: 0.5%;
  transition: transform 500ms ease;

  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}
</style>
