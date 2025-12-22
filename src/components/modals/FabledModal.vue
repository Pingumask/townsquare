<template>
  <Modal v-if="grimoire.modal === 'fabled'" @close="grimoire.toggleModal(null)">
    <h3>{{ t('modal.fabled.title') }}</h3>
    <ul class="tokens">
      <li v-for="role in fabled" :key="role.id" @click="setFabled(role)">
        <Token :role="role" />
      </li>
    </ul>
    <input v-model="rolefilter" type="search" :placeholder="t('modal.role.search')" />
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Modal, Token } from '@/components';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,

} from "@/stores";
import type { Role } from "@/types";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const playersStore = usePlayersStore();

const t = locale.t;

const rolefilter = ref('');

const fabled = computed((): Role[] => {
  const available = [] as Role[];
  grimoire.fabled.forEach((role: Role) => {
    if (
      role.name?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
      role.id?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
      role.ability?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
      role.firstNightReminder?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
      role.otherNightReminder?.toLowerCase().includes(rolefilter.value?.toLowerCase())
    ) {
      available.push(role);
    }
  })
  return available.filter((role: Role) => !playersStore.fabled.some((fable: Role) => fable.id === role.id))
});

function setFabled(role: Role) {
  playersStore.setFabled({ fabled: role });
  grimoire.toggleModal(null);
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

input[type=search] {
  display: block;
  width: 100%;
  background: transparent;
  border: solid #fff;
  border-width: 0 0 1px 0;
  outline: none;
  color: #fff;
  font-size: 1em;
  touch-action: none;
  border-bottom-color: #777;
}
</style>
