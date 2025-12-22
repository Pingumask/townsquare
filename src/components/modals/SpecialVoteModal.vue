<template>
  <Modal v-if="grimoire.modal === 'specialVote'" @close="grimoire.toggleModal(null)">
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
import { computed } from 'vue';
import { Modal } from '@/components';
import { createSpecialVote } from '@/services';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  useVotingStore,
} from "@/stores";
import type { Nomination } from '@/types';

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;
const playersStore = usePlayersStore();
const votingStore = useVotingStore();

const players = computed(() => playersStore.players);

function launchVote(nomination: Nomination) {
  votingStore.setNomination(nomination);
  grimoire.toggleModal(null);
}

function bishopVote() {
  launchVote(createSpecialVote(
    t('modal.specialvote.st'),
    votingStore.playerForSpecialVote,
    { type: 'bishop' }
  ));
}

function atheistVote() {
  launchVote(createSpecialVote(
    votingStore.playerForSpecialVote,
    t('modal.specialvote.st'),
    { type: 'atheist' }
  ));
}

function cultleaderVote() {
  launchVote(createSpecialVote(
    votingStore.playerForSpecialVote,
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
  const player = players.value[votingStore.playerForSpecialVote];
  if (!player) return;
  const playerName = player.name;
  const input = prompt(
    t('modal.specialvote.complete') +
    playerName +
    " ____________________" +
    t('vote.exclam'),
  );
  if (!input) return;

  launchVote(createSpecialVote(
    votingStore.playerForSpecialVote,
    null, // Custom votes don't have a specific nominee
    {
      type: 'custom',
      timerText: input,                    // User's custom input
      debateText: t('modal.specialvote.customMessages.debateText'),     // "The debate is open"
      buttonLabel: t('modal.specialvote.customMessages.buttonLabel'),  // "(Custom)"
    }
  ));
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
