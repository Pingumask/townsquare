<template>
  <Modal v-if="modals.fabled && fabled.length" @close="toggleModal('fabled')">
    <h3>{{ t('modal.fabled.title') }}</h3>
    <ul class="tokens">
      <li v-for="role in fabled" :key="role.id" @click="setFabled(role)">
        <Token :role="role" />
      </li>
    </ul>
      <h3 @click="togglePrintAll" class="printAll">
        {{ t('modal.fabled.printAll') }}
        <font-awesome-icon :icon="[
          'fas',
          printAll ? 'check-square' : 'square',
        ]" />
      </h3>
      
  </Modal>
</template>

<script setup lang="ts">
import type { Role } from '@/types';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { Modal, Token } from '@/components';
import { useTranslation } from '@/composables';

const printAll = ref(false);

const { t } = useTranslation();
const store = useStore();

const modals = computed(() => store.state.modals);

const fabled = computed((): Role[] => {
  let allFabled = Array.from(store.state.fabled.values()) as Role[];
  let res = Array() ;
  allFabled.forEach(function(role) {
    if(
      !store.state.players.fabled.some((fable: Role) => fable.id === role.id) &&
      (
        role.team == "loric" ||
        role.anyScript ||
        printAll.value
      )
    ) {
      res.push(role);
    }
  });
  return res;
});


const togglePrintAll = () => {
  printAll.value = !printAll.value;
};

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


.printAll {
  margin-left: auto;
  margin-right: auto;
  width: 40%;
  padding-top: 5%;
  font-size: 100%;
  
  &:hover {
    color: red;
  }
}

</style>
