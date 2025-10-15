<template>
  <Modal v-if="modals.voteHistory && (session.voteHistory || !session.isSpectator)" class="vote-history"
    @close="toggleModal('voteHistory')">
    <font-awesome-icon v-if="session.isSpectator" icon="trash-alt" class="fa fa-trash-alt clear"
      title="Clear vote history" @click="clearVoteHistory" />

    <h3>{{ t('modal.voteHistory.title') }}</h3>

    <template v-if="!session.isSpectator">
      <div class="options">
        <div class="option" @click="setRecordVoteHistory">
          <font-awesome-icon :icon="[
            'fas',
            session.isVoteHistoryAllowed ? 'check-square' : 'square',
          ]" />
          {{ t('modal.voteHistory.accessibility') }}
        </div>
        <div class="option" @click="clearVoteHistory">
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
            {{ t('modal.voteHistory.nominator') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.nominee') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.type') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.votes') }}
          </th>
          <th scope="col">
            {{ t('modal.voteHistory.majority') }}
          </th>
          <th scope="col">
            <font-awesome-icon icon="user-friends" class="fa fa-user-friends" />
            {{ t('modal.voteHistory.voters') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(vote, index) in session.voteHistory" :key="index">
          <td>
            {{ vote.timestamp.getHours().toString().padStart(2, "0") }}:{{
              vote.timestamp.getMinutes().toString().padStart(2, "0")
            }}
          </td>
          <td>{{ vote.nominator }}</td>
          <td>{{ vote.nominee }}</td>
          <td>{{ vote.type }}</td>
          <td>
            {{ vote.votes == null ? "?" : vote.votes.length }}
            <font-awesome-icon icon="hand-paper" class="fa fa-hand-paper" />
          </td>
          <td v-if="vote.nominee">
            {{ vote.majority }}
            <font-awesome-icon :icon="[
              'fas',
              vote.votes == null
                ? 'minus-square'
                : vote.votes.length >= vote.majority
                  ? 'check-square'
                  : 'square',
            ]" />
          </td>
          <td v-else />
          <td>
            {{
              vote.votes == null
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
import { computed } from "vue";
import { useStore } from "vuex";
import { Modal } from '@/components';
import { useTranslation } from '@/composables';

const { t } = useTranslation();
const store = useStore();

const session = computed(() => store.state.session);
const modals = computed(() => store.state.modals);

const clearVoteHistory = () => {
  store.commit("session/clearVoteHistory");
};

const setRecordVoteHistory = () => {
  store.commit("session/setVoteHistoryAllowed", !session.value.isVoteHistoryAllowed);
};

const toggleModal = (modalName: string) => {
  store.commit("toggleModal", modalName);
};
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
  td:nth-child(2) {
    color: $townsfolk;
  }

  td:nth-child(3) {
    color: $demon;
  }

  td:nth-child(5) {
    text-align: center;
  }

  td:nth-child(6) {
    text-align: center;
  }
}
</style>
