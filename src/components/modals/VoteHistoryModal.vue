<template>
  <Modal v-if="grimoire.modal === 'voteHistory' && (votingStore.voteHistory || !session.isPlayerOrSpectator)"
    class="vote-history" @close="grimoire.toggleModal(null)">
    <h3>{{ t('modal.voteHistory.title') }}</h3>

    <template v-if="!session.isPlayerOrSpectator">
      <div class="options">
        <div class="option" @click="grimoire.setVoteHistoryAllowed(!grimoire.isVoteHistoryAllowed)">
          <font-awesome-icon :icon="[
            'fas',
            grimoire.isVoteHistoryAllowed ? 'check-square' : 'square',
          ]" />
          {{ t('modal.voteHistory.accessibility') }}
        </div>
        <div class="option" @click="votingStore.clearVoteHistory()">
          <font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" />
          {{ t('modal.voteHistory.clear') }}
        </div>
      </div>
    </template>
    <table>
      <thead>
        <tr>
          <th scope="col">
            {{ t('modal.voteHistory.time') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.day') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.nominator') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.nominee') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.type') }}
          </th>
          <th v-if="!session.isPlayerOrSpectator" scope="col">
            <font-awesome-icon v-if="grimoire.isSecretVote" icon="eye-slash" class="fa fa-eye-slash" />
            <font-awesome-icon v-else icon="eye" class="fa fa-eye" />
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.majority') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.votes') }}
          </th>
          <th scope="col">
            <font-awesome-icon icon="user-friends" class="fa fa-user-friends" />
            {{ t('modal.voteHistory.voters') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(vote, index) in votingStore.voteHistory" :key="index">
          <td>
            {{ vote.timestamp.getHours().toString().padStart(2, "0") }}:{{
              vote.timestamp.getMinutes().toString().padStart(2, "0")
            }}
          </td>
          <td>{{ vote.day }}</td>
          <td class="nominator">{{ vote.nominator }}</td>
          <td class="nominee">{{ vote.nominee }}</td>
          <td>{{ vote.type }}</td>
          <td v-if="!session.isPlayerOrSpectator">
            <font-awesome-icon v-if="vote.anonymous" icon="eye-slash" class="fa fa-eye-slash" />
            <font-awesome-icon v-else icon="eye" class="fa fa-eye" />
          </td>
          <td v-if="vote.nominee">
            {{ vote.majority }}
            <font-awesome-icon :icon="[
              'fas',
              vote.anonymous && session.isPlayerOrSpectator
                ? 'minus-square'
                : vote.votes.length >= vote.majority
                  ? 'check-square'
                  : 'square',
            ]" />
          </td>
          <td v-else />
          <td v-if="vote.anonymous && session.isPlayerOrSpectator">
            <font-awesome-icon v-if="vote.anonymous" icon="eye-slash" class="fa fa-eye-slash" />
          </td>
          <td v-else>
            {{ vote.votes.length }}
            <font-awesome-icon icon="hand-paper" class="fa fa-hand-paper" />
          </td>
          <td>
            {{
              vote.anonymous && session.isPlayerOrSpectator
                ? t('modal.voteHistory.hiddenVote')
                : vote.votes.join(", ")
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </Modal>
</template>

<script setup lang="ts">
import { Modal } from '@/components';
import {
  useGrimoireStore,
  useLocaleStore,
  useSessionStore,
  useVotingStore,
} from "@/stores";

const locale = useLocaleStore();
const grimoire = useGrimoireStore();
const session = useSessionStore();
const votingStore = useVotingStore();
const t = locale.t;
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

.clear {
  position: absolute;
  left: 20px;
  top: 15px;
  cursor: pointer;

  &:hover {
    color: red;
  }
}

.options {
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: center;
}

.option {
  color: white;
  text-decoration: none;
  margin: 0 15px;

  &:hover {
    color: red;
    cursor: pointer;
  }
}

h3 {
  margin: 0 40px 0 10px;

  svg {
    vertical-align: middle;
  }
}

table {
  border-spacing: 10px 0;
  margin-left: auto;
  margin-right: auto;
}

thead th {
  font-weight: bold;
  border-bottom: 1px solid white;
  text-align: center;
  padding: 0 3px;
}

tbody {
  td.nominator {
    color: var(--townsfolk);
  }

  td.nominee {
    color: var(--demon);
  }

  td:nth-child(5) {
    text-align: center;
  }

  td:nth-child(6) {
    text-align: center;
  }
}
</style>
