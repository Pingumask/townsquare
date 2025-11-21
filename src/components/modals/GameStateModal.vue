<template>
  <Modal v-if="modals.gameState" class="game-state" @close="toggleModal('gameState')">
    <h3>{{ t('modal.gameState.title') }}</h3>
    <textarea :value="gamestate" @input.stop="input = ($event.target as HTMLTextAreaElement).value"
      @click="($event.target as HTMLTextAreaElement).select()" @keyup.stop="" />
    <div class="button-group">
      <div class="button townsfolk" @click="copy">
        <font-awesome-icon icon="copy" class="fa fa-copy" /> {{ t('modal.gameState.copy') }}
      </div>
      <div v-if="!session.isSpectator" class="button demon" @click="load">
        <font-awesome-icon icon="cog" class="fa fa-cog" /> {{ t('modal.gameState.load') }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { Role, Player, Edition, Modals } from '@/types';
import { ref, computed } from 'vue';
import { Modal } from '@/components';
import { useTranslation } from '@/composables';
import { useGrimoireStore, usePlayersStore, useSessionStore } from "@/stores";

const { t } = useTranslation();
// Types for game state data
interface GameStateData {
  bluffs?: string[];
  edition?: unknown;
  roles?: unknown;
  fabled?: (string | Role)[];
  players?: Partial<Player>[];
}

const grimoireStore = useGrimoireStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const input = ref("");

const modals = computed(() => grimoireStore.modals);
const players = computed(() => playersStore.players);
const bluffs = computed(() => playersStore.bluffs);
const fabled = computed(() => playersStore.fabled);
const edition = computed(() => grimoireStore.edition);
const session = sessionStore;

const gamestate = computed(() => {
  return JSON.stringify({
    bluffs: bluffs.value.map(({ id }: Role) => id),
    edition: edition.value?.isOfficial
      ? { id: edition.value.id }
      : edition.value,
    roles: edition.value?.isOfficial
      ? ""
      : grimoireStore.customRolesStripped,
    fabled: fabled.value.map((fabled: Role) =>
      fabled.isCustom ? fabled : { id: fabled.id },
    ),
    players: players.value.map((player: Player) => ({
      ...player,
      role: player.role.id || {},
    })),
  });
});

const copy = () => {
  navigator.clipboard.writeText(input.value || gamestate.value);
};

const load = () => {
  if (session.isSpectator) return;
  try {
    const data: GameStateData = JSON.parse(input.value || gamestate.value);
    const { bluffs, edition, roles, fabled, players } = data;

    if (roles) grimoireStore.setCustomRoles(roles as (Role | Record<string, unknown>)[]);
    if (edition) grimoireStore.setEdition(edition as Edition);
    if (bluffs && bluffs.length) {
      bluffs.forEach((role: string, index: number) => {
        playersStore.setBluff({
          index,
          role: grimoireStore.roles.get(role) || {} as Role,
        });
      });
    }
    if (fabled) {
      playersStore.setFabled({
        fabled: fabled.map((f: string | Role) =>
          typeof f === 'string'
            ? grimoireStore.fabled.get(f) || {} as Role
            : grimoireStore.fabled.get(f.id) || f
        ),
      });
    }
    if (players) {
      playersStore.set(players.map((player: Partial<Player>) => ({
        ...player,
        role: typeof player.role === 'string'
          ? grimoireStore.roles.get(player.role) || grimoireStore.rolesJSONbyId.get(player.role) || {} as Role
          : player.role || {} as Role,
      })) as Player[]);
    }
    toggleModal("gameState");
  } catch (e) {
    alert("Unable to parse JSON: " + e);
  }
};

const toggleModal = (modal: keyof Modals) => {
  grimoireStore.toggleModal(modal);
};
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

h3 {
  margin: 0 40px;
}

textarea {
  background: transparent;
  color: white;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(255, 255, 255, 0.5);
  width: 60vw;
  height: 30vh;
  max-width: 100%;
  margin: 5px 0;
}
</style>
