<template>
  <Modal v-if="grimoire.modal === 'gameState'" class="game-state" @close="grimoire.toggleModal(null)">
    <h3>{{ t('modal.gameState.title') }}</h3>
    <textarea :value="gamestate" @input.stop="input = ($event.target as HTMLTextAreaElement).value"
      @click="($event.target as HTMLTextAreaElement).select()" @keyup.stop="" />
    <div class="button-group">
      <div class="button townsfolk" @click="copy">
        <font-awesome-icon icon="copy" class="fa fa-copy" /> {{ t('modal.gameState.copy') }}
      </div>
      <div v-if="!session.isPlayerOrSpectator" class="button demon" @click="load">
        <font-awesome-icon icon="cog" class="fa fa-cog" /> {{ t('modal.gameState.load') }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Modal } from '@/components';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
} from "@/stores";
import type {
  Edition,
  Player,
  Role,
} from '@/types';

// Types for game state data
interface GameStateData {
  bluffs?: string[];
  edition?: unknown;
  roles?: unknown;
  fabled?: (string | Role)[];
  players?: Partial<Player>[];
}

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const input = ref("");

const players = computed(() => playersStore.players);
const bluffs = computed(() => playersStore.bluffs);
const fabled = computed(() => playersStore.fabled);
const edition = computed(() => grimoire.edition);
const session = sessionStore;

const gamestate = computed(() => {
  return JSON.stringify({
    bluffs: bluffs.value.map(({ id }: Role) => id),
    edition: edition.value?.isOfficial
      ? { id: edition.value.id }
      : edition.value,
    roles: edition.value?.isOfficial
      ? ""
      : grimoire.customRolesStripped,
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
  if (session.isPlayerOrSpectator) return;
  try {
    const data: GameStateData = JSON.parse(input.value || gamestate.value);
    const { bluffs, edition, roles, fabled, players } = data;


    if (edition) {
      // If edition is a partial object (only has id), look it up from editions JSON
      const editionObj = edition as Partial<Edition>;
      const fullEdition =
        editionObj.id && !editionObj.name && !editionObj.isOfficial
          ? grimoire.editions.official.find(e => e.id === editionObj.id)
          : edition;

      if (fullEdition) {
        grimoire.setEdition(fullEdition as Edition);
      } else {
        console.warn(`Edition not found: ${editionObj.id}`);
      }
    }
    if (roles) grimoire.setCustomRoles(roles as Role[]);
    if (bluffs && bluffs.length) {
      bluffs.forEach((role: string, index: number) => {
        playersStore.setBluff({
          index,
          role: grimoire.roles.get(role) || {} as Role,
        });
      });
    }
    if (fabled) {
      playersStore.setFabled({
        fabled: fabled.map((f: string | Role) =>
          typeof f === 'string'
            ? grimoire.fabled.get(f) || {} as Role
            : grimoire.fabled.get(f.id) || f
        ),
      });
    }
    if (players) {
      playersStore.set(players.map((player: Partial<Player>) => ({
        ...player,
        role: typeof player.role === 'string'
          ? grimoire.roles.get(player.role) || grimoire.rolesJSONbyId.get(player.role) || {} as Role
          : player.role || {} as Role,
      })) as Player[]);
    }
    grimoire.toggleModal(null);
  } catch (e) {
    alert("Unable to parse JSON: " + e);
  }
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
