<template>
  <Modal class="game-state" v-if="modals.gameState" @close="toggleModal('gameState')">
    <h3>{{ locale.modal.gameState.title }}</h3>
    <textarea :value="gamestate" @input.stop="input = $event.target.value" @click="$event.target.select()"
      @keyup.stop=""></textarea>
    <div class="button-group">
      <div class="button townsfolk" @click="copy">
        <font-awesome-icon icon="copy" class="fa fa-copy" /> {{ locale.modal.gameState.copy }}
      </div>
      <div class="button demon" @click="load" v-if="!session.isSpectator">
        <font-awesome-icon icon="cog" class="fa fa-cog" /> {{ locale.modal.gameState.load }}
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import Modal from "./Modal.vue";

const store = useStore();
const input = ref("");

const modals = computed(() => store.state.modals);
const players = computed(() => store.state.players);
const edition = computed(() => store.state.edition);
const session = computed(() => store.state.session);
const locale = computed(() => store.state.locale);

const gamestate = computed(() => {
  return JSON.stringify({
    bluffs: players.value.bluffs.map(({ id }) => id),
    edition: edition.value.isOfficial
      ? { id: edition.value.id }
      : edition.value,
    roles: edition.value.isOfficial
      ? ""
      : store.getters.customRolesStripped,
    fabled: players.value.fabled.map((fabled) =>
      fabled.isCustom ? fabled : { id: fabled.id },
    ),
    players: players.value.players.map((player) => ({
      ...player,
      role: player.role.id || {},
    })),
  });
});

const copy = () => {
  navigator.clipboard.writeText(input.value || gamestate.value);
};

const load = () => {
  if (session.value.isSpectator) return;
  try {
    const data = JSON.parse(input.value || gamestate.value);
    const { bluffs, edition, roles, fabled, players } = data;

    if (roles) store.commit("setCustomRoles", roles);
    if (edition) store.commit("setEdition", edition);
    if (bluffs.length) {
      bluffs.forEach((role, index) => {
        store.commit("players/setBluff", {
          index,
          role: store.state.roles.get(role) || {},
        });
      });
    }
    if (fabled) {
      store.commit("players/setFabled", {
        fabled: fabled.map(f => store.state.fabled.get(f) || store.state.fabled.get(f.id) || f),
      });
    }
    if (players) {
      store.commit("players/set", players.map(player => ({
        ...player,
        role: store.state.roles.get(player.role) || store.getters.rolesJSONbyId.get(player.role) || {},
      })));
    }
    toggleModal("gameState");
  } catch (e) {
    alert("Unable to parse JSON: " + e);
  }
};

const toggleModal = (modal) => {
  store.commit("toggleModal", modal);
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
