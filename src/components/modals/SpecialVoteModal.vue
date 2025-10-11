<template>
  <Modal v-if="modals.specialVote" @close="toggleModal('specialVote')">
    <h3>{{ t('modal.specialvote.title') }}</h3>
    <div class="allTheButtons">
      <button @click="bishopVote()">
        <img src="../../assets/icons/bishop.svg" :alt="t('modal.specialvote.bishop')">
        <span>{{ t('modal.specialvote.bishop') }}</span>
      </button>
      <button @click="atheistVote()">
        <img src="../../assets/icons/atheist.svg" :alt="t('modal.specialvote.atheist')">
        <span>{{ t('modal.specialvote.atheist') }}</span>
      </button>
      <button @click="cultleaderVote()">
        <img src="../../assets/icons/cultleader.svg" :alt="t('modal.specialvote.cultleader')">
        <span>{{ t('modal.specialvote.cultleader') }}</span>
      </button>
      <button @click="customVote()">
        <img src="../../assets/icons/custom.png" :alt="t('modal.specialvote.custom')">
        <span>{{ t('modal.specialvote.custom') }}</span>
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { Nomination } from '@/types';
import { computed } from 'vue';
import { useStore } from 'vuex';
import Modal from './Modal.vue';
import { useTranslation, createSpecialVote } from '@/composables';

const { t } = useTranslation();
const store = useStore();

const modals = computed(() => store.state.modals);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);

function launchVote(nomination: Nomination) {
  store.commit('session/nomination', { nomination });
  store.commit('toggleModal', 'specialVote');
}

function bishopVote() {
  launchVote(createSpecialVote(
    t('modal.specialvote.st'),
    session.value.playerForSpecialVote,
    { type: 'bishop' }
  ));
}

function atheistVote() {
  launchVote(createSpecialVote(
    session.value.playerForSpecialVote,
    t('modal.specialvote.st'),
    { type: 'atheist' }
  ));
}

function cultleaderVote() {
  launchVote(createSpecialVote(
    session.value.playerForSpecialVote,
    null, // Cult leader votes don't have a specific nominee
    {
      type: 'cultleader',
      timerText: t('modal.specialvote.cultleaderMessages.timerText'),
      debateText: t('modal.specialvote.cultleaderMessages.debateText'),
      buttonLabel: t('modal.specialvote.cultleaderMessages.buttonLabel'),
    }
  ));
}

function customVote() {
  const playerName = players.value[session.value.playerForSpecialVote].name;
  const input = prompt(
    t('modal.specialvote.complete') +
    playerName +
    " ____________________" +
    t('vote.exclam'),
  );
  if (!input) return;

  launchVote(createSpecialVote(
    session.value.playerForSpecialVote,
    null, // Custom votes don't have a specific nominee
    {
      type: 'custom',
      timerText: input,                    // User's custom input
      debateText: t('modal.specialvote.customMessages.debateText'),     // "The debate is open"
      buttonLabel: t('modal.specialvote.customMessages.buttonLabel'),  // "(Custom)"
    }
  ));
}

function toggleModal(modalName: string) {
  store.commit('toggleModal', modalName);
}
</script>

<style scoped lang="scss">
ul {
  width: 100%;
}

div.allTheButtons {
  margin-top: 30px;
}

button {
  background-color: #66027f;
  border: none;
  border-radius: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 35%;
  margin-top: 15px;
  display: flex;
  align-items: center;
}

button:hover {
  background-color: #9903bf;
}

button:focus {
  background-color: #cc04ff;
}

span {
  font-family: PiratesBay, sans-serif;
  font-size: 22px;
  color: white;
  flex: 1;
  text-align: center;
}

img {
  width: 80px;
  display: block;
  margin-left: auto;
}

template {
  margin-top: 30px;
}
</style>
