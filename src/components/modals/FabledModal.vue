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
import { computed } from 'vue';
import { Modal, Token } from '@/components';
import { useGrimoireStore, useLocaleStore, usePlayersStore } from "@/stores";
import type { Modals, Role } from "@/types";

const grimoireStore = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;
const playersStore = usePlayersStore();

const modals = computed(() => grimoireStore.modals);

const fabled = computed((): Role[] => {
  return (Array.from(grimoireStore.fabled.values()) as Role[]).filter((role: Role) =>
    !playersStore.fabled.some((fable: Role) => fable.id === role.id)
  );
});

function setFabled(role: Role) {
  playersStore.setFabled({ fabled: role });
  grimoireStore.toggleModal('fabled');
}

const toggleModal = (modal: keyof Modals) => {
  grimoireStore.toggleModal(modal);
};
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
