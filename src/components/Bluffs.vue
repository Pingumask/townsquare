<template>
  <div
    v-if="players.length"
    ref="bluffs"
    class="bluffs"
    :class="{ closed: !isBluffsOpen }"
  >
    <h3>
      <font-awesome-icon
        v-if="bluffs.length > 3"
        icon="minus-circle"
        class="bluff-count"
        @click="bluffs.pop()"
      />
      <span v-if="isPlayerOrSpectator">{{ t("townsquare.others") }}</span>
      <span v-else>{{ t("townsquare.bluffs") }}</span>
      <font-awesome-icon
        v-if="bluffs.length < 12"
        icon="plus-circle"
        class="bluff-count"
        @click="bluffs.push({ id: '' })"
      />
      <font-awesome-icon
        icon="times-circle"
        class="fa fa-times-circle close"
        @click.stop="toggleBluffs"
      />
      <font-awesome-icon
        icon="plus-circle"
        class="fa fa-plus-circle open"
        @click.stop="toggleBluffs"
      />
    </h3>
    <ul>
      <li
        v-for="(bluff, index) in bluffs"
        :key="index"
        @click="openRoleModal(index * -1)"
      >
        <Token :role="bluff" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Token } from "@/components";
import { useLocaleStore, usePlayersStore, useSessionStore } from "@/stores";

const emit = defineEmits(["openRoleModal"]);

const locale = useLocaleStore();
const playersStore = usePlayersStore();
const sessionStore = useSessionStore();
const t = locale.t;

const isBluffsOpen = ref(true);

const bluffs = computed(() => playersStore.bluffs);
const isPlayerOrSpectator = computed(() => sessionStore.isPlayerOrSpectator);
const players = computed(() => playersStore.players);

const openRoleModal = (index: number) => {
  emit("openRoleModal", index);
};

const toggleBluffs = () => {
  isBluffsOpen.value = !isBluffsOpen.value;
};
</script>

<style scoped>
#townsquare .bluffs {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  transform-origin: bottom left;
  transform: scale(1);
  opacity: 1;
  transition: all 250ms ease-in-out;
  z-index: 50;
  padding: 10px;
  color: white;
  width: min(calc(3 * 10vmin + 20px) ,calc((100vmax - 100vmin) / 2 - 40px));
  @media (orientation: portrait) {
    width: 50vw;
  }
}

#townsquare .bluffs.closed {
  opacity: 1;
  width: auto;
  height: auto;
  border: none;
  background: none;
}

#townsquare .bluffs.closed ul,
#townsquare .bluffs.closed h3 span {
  display: none;
}

#townsquare .bluffs h3 {
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  font-size: 1.17em;
}

#townsquare .bluffs h3 .fa {
  cursor: pointer;
}

#townsquare .bluffs h3 .close {
  margin-left: 1vh;
  display: block;
}

#townsquare .bluffs h3 .open {
  margin-left: 1vh;
  display: none;
}

#townsquare .bluffs.closed h3 .close {
  display: none;
}

#townsquare .bluffs.closed h3 .open {
  display: block;
}

#townsquare .bluffs ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10vmin, 1fr));
}

#townsquare .bluffs ul li {
  width: 10vmin;
  height: 10vmin;
  aspect-ratio: 1;
  display: inline-block;
  transition: all 250ms;
  cursor: pointer;
}

.bluff-count {
  height: 1rem;
  margin-inline: 0.25rem;
}
</style>
