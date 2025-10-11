<template>
  <Modal v-if="modals.role && availableRoles.length" @close="close">
    <h3>
      {{ t('modal.role.title') }}
      {{
        playerIndex >= 0 && players.length
          ? players[playerIndex].name
          : t('modal.role.bluff')
      }}
    </h3>
    <ul v-if="tab === 'editionRoles' || !othertravelers.size" class="tokens">
      <li v-for="role in availableRoles" :key="role.id" :class="[role.team]" @click="setRole(role)">
        <Token :role="role" />
      </li>
    </ul>
    <ul v-if="tab === 'othertravelers' && othertravelers.size" class="tokens">
      <li v-for="role in othertravelers.values()" :key="role.id" :class="[role.team]" @click="setRole(role)">
        <Token :role="role" />
      </li>
    </ul>
    <div v-if="playerIndex >= 0 && othertravelers.size && !session.isSpectator" class="button-group">
      <span class="button" :class="{ townsfolk: tab === 'editionRoles' }" @click="tab = 'editionRoles'">{{
        t('modal.role.editionRoles') }}</span>
      <span class="button" :class="{ townsfolk: tab === 'othertravelers' }" @click="tab = 'othertravelers'">{{
        t('modal.role.othertravelers') }}</span>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { Role, Player } from '@/types';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Token from '../Token.vue';
import Modal from './Modal.vue';
import { useTranslation } from '@/composables';

const { t } = useTranslation();
const props = defineProps<{
  playerIndex: number;
}>();
const store = useStore();

const tab = ref('editionRoles');

const availableRoles = computed((): Role[] => {
  const availableRoles: Role[] = [];
  const players = store.state.players.players;
  store.state.roles.forEach((role: Role) => {
    // don't show bluff roles that are already assigned to players
    if (
      props.playerIndex >= 0 ||
      (props.playerIndex < 0 &&
        !players.some((player: Player) => player.role.id === role.id))
    ) {
      availableRoles.push(role);
    }
  });
  // Add empty role option with all required properties
  availableRoles.push({
    id: 'empty',
    name: '',
    team: 'townsfolk',
    isCustom: false,
    reminders: [],
    remindersGlobal: [],
    setup: false,
    forbidden: false
  } as Role);
  return availableRoles;
});

const modals = computed(() => store.state.modals);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);
const othertravelers = computed(() => store.state.othertravelers);

const setRole = (role: Role) => {
  if (props.playerIndex < 0) {
    // assign to bluff slot (index < 0)
    store.commit('players/setBluff', {
      index: props.playerIndex * -1 - 1,
      role,
    });
  } else {
    if (session.value.isSpectator && role.team === 'traveler') return;
    // assign to player
    const player = store.state.players.players[props.playerIndex];
    store.commit('players/update', {
      player,
      property: 'role',
      value: role,
    });
  }
  tab.value = 'editionRoles';
  store.commit('toggleModal', 'role');
};

const close = () => {
  tab.value = 'editionRoles';
  store.commit('toggleModal', 'role');
};
</script>

<style scoped lang="scss">
@use "../../vars.scss" as *;

ul.tokens li {
  border-radius: 50%;
  width: 6vmax;
  margin: 1%;
  transition: transform 500ms ease;

  &.townsfolk {
    box-shadow:
      0 0 10px $townsfolk,
      0 0 10px #004cff;
  }

  &.outsider {
    box-shadow:
      0 0 10px $outsider,
      0 0 10px $outsider;
  }

  &.minion {
    box-shadow:
      0 0 10px $minion,
      0 0 10px $minion;
  }

  &.demon {
    box-shadow:
      0 0 10px $demon,
      0 0 10px $demon;
  }

  &.traveler {
    box-shadow:
      0 0 10px $traveler,
      0 0 10px $traveler;
  }

  &:hover {
    transform: scale(1.2);
    z-index: 10;
  }
}

#townsquare.spectator ul.tokens li.traveler {
  display: none;
}
</style>
