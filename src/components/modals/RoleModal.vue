<template>
  <Modal v-if="grimoire.modal === 'role' && availableRoles.length" @close="grimoire.toggleModal(null)">
    <h3>
      {{ t('modal.role.title') }}
      {{ playerName }}
    </h3>
    <ul v-if="tab === 'editionRoles' || !othertravelers.length" class="tokens">
      <li v-for="role in availableRoles" :key="role.id" :class="[role.team]" @click="setRole(role)">
        <Token :role="role" />
      </li>
    </ul>
    <ul v-if="tab === 'othertravelers' && othertravelers.length" class="tokens">
      <li v-for="role in othertravelers.values()" :key="role.id" :class="[role.team]" @click="setRole(role)">
        <Token :role="role" />
      </li>
    </ul>
    <div v-if="playerIndex >= 0 && othertravelers.length && !session.isPlayerOrSpectator" class="button-group">
      <span class="button" :class="{ townsfolk: tab === 'editionRoles' }" @click="tab = 'editionRoles'">{{
        t('modal.role.editionRoles') }}</span>
      <span class="button" :class="{ townsfolk: tab === 'othertravelers' }" @click="tab = 'othertravelers'">{{
        t('modal.role.othertravelers') }}</span>
    </div>
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
  useSessionStore,

} from "@/stores";
import type { Player, Role } from '@/types';

const props = defineProps<{
  playerIndex: number;
}>();

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const playersStore = usePlayersStore();
const session = useSessionStore();

const t = locale.t;

const rolefilter = ref('');
const tab = ref('editionRoles');

const playerName = computed(() => {
  if (props.playerIndex >= 0 && playersStore.players.length > props.playerIndex) {
    const player = playersStore.players[props.playerIndex];
    return player ? player.name : t('modal.role.bluff');
  }
  return t('modal.role.bluff');
});

const availableRoles = computed((): Role[] => {
  const availableRoles: Role[] = [];
  const players = playersStore.players;
  grimoire.roles.forEach((role: Role) => {
    // don't show bluff roles that are already assigned to players
    if (
      (
        props.playerIndex >= 0 ||
        (props.playerIndex < 0 &&
          !players.some((player: Player) => player.role.id === role.id))
      ) && (
        role.name?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
        role.id?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
        role.ability?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
        role.firstNightReminder?.toLowerCase().includes(rolefilter.value?.toLowerCase()) ||
        role.otherNightReminder?.toLowerCase().includes(rolefilter.value?.toLowerCase())
      )
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
  } as Role);
  return availableRoles;
});

const othertravelers = computed((): Role[] => {
  const available = [] as Role[];
  grimoire.othertravelers.forEach((role: Role) => {
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
  return available;
});

const setRole = (role: Role) => {
  if (props.playerIndex < 0) {
    // assign to bluff slot (index < 0)
    playersStore.setBluff({
      index: props.playerIndex * -1 - 1,
      role,
    });
  } else {
    if (session.isPlayerOrSpectator && role.team === 'traveler') return;
    // assign to player
    const player = playersStore.players[props.playerIndex];
    if (!player) return;
    playersStore.update({
      player,
      property: 'role',
      value: role,
    });
  }
  tab.value = 'editionRoles';
  grimoire.toggleModal(null);
};
</script>

<style scoped lang="scss">
@use "../../vars.scss" as *;

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

ul.tokens li {
  border-radius: 50%;
  width: 6vmax;
  margin: 1%;
  transition: transform 500ms ease;

  &.townsfolk {
    box-shadow:
      0 0 10px var(--townsfolk),
      0 0 10px #004cff;
  }

  &.outsider {
    box-shadow:
      0 0 10px var(--outsider),
      0 0 10px var(--outsider);
  }

  &.minion {
    box-shadow:
      0 0 10px var(--minion),
      0 0 10px var(--minion);
  }

  &.demon {
    box-shadow:
      0 0 10px var(--demon),
      0 0 10px var(--demon);
  }

  &.traveler {
    box-shadow:
      0 0 10px var(--traveler),
      0 0 10px var(--traveler);
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
