<template>
  <Modal v-if="modals.reminder && availableReminders.length && players[playerIndex]" @close="toggleModal('reminder')">
    <h3>{{ t('modal.reminder.title') }}</h3>
    <ul class="reminders">
      <li v-for="reminder in availableReminders" :key="reminder.role + ' ' + reminder.name" class="reminder"
        :class="[reminder.role]" @click="addReminder(reminder)">
        <span class="icon" :style="{
          backgroundImage: `url(${reminder.image && grimoire.isImageOptIn
            ? reminder.image
            : rolePath(reminder.imageAlt || reminder.role)
            })`,
        }" />
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
  </Modal>
</template>

<script setup lang="ts">
import type { Reminder, Role, Player } from "@/types";
import { computed } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
/**
 * Helper function that maps a reminder name with a role-based object that provides necessary visual data.
 * @param role The role for which the reminder should be generated
 * @return {function(*): {image: string|string[]|string|*, role: *, name: *, imageAlt: string|*}}
 */
const mapReminder =
  ({ id, image, imageAlt }: Role) =>
    (name: string): Reminder => ({
      role: id,
      image: image || '',
      imageAlt: imageAlt || '',
      name,
      id: `${id}-${name}`,
    });

const props = defineProps<{
  playerIndex: number;
}>();
const store = useStore();

const modals = computed(() => store.state.modals);
const grimoire = computed(() => store.state.grimoire);
const players = computed(() => store.state.players.players);

const availableReminders = computed((): Reminder[] => {
  let reminders: Reminder[] = [];
  const { players, bluffs } = store.state.players;
  store.state.roles.forEach((role: Role) => {
    // add reminders from player roles
    if (players.some((p: Player) => p.role.id === role.id)) {
      reminders = [...reminders, ...role.reminders!.map(mapReminder(role))];
    }
    // add reminders from bluff/other roles
    else if (bluffs.some((bluff: Role) => bluff.id === role.id)) {
      reminders = [...reminders, ...role.reminders!.map(mapReminder(role))];
    }
    // add global reminders
    if (role.remindersGlobal && role.remindersGlobal.length) {
      reminders = [
        ...reminders,
        ...role.remindersGlobal.map(mapReminder(role)),
      ];
    }
  });
  // add fabled reminders
  store.state.players.fabled.forEach((role: Role) => {
    reminders = [...reminders, ...role.reminders!.map(mapReminder(role))];
  });

  // add out of script traveller reminders
  store.state.othertravellers.forEach((role: Role) => {
    if (players.some((p: Player) => p.role.id === role.id)) {
      reminders = [...reminders, ...role.reminders!.map(mapReminder(role))];
    }
  });

  reminders.push({
    id: "good",
    role: "good",
    name: t('modal.reminder.good'),
  });
  reminders.push({
    id: "evil",
    role: "evil",
    name: t('modal.reminder.evil'),
  });
  reminders.push({
    id: "townsfolk",
    role: "townsfolk",
    name: t('modal.reminder.townsfolk'),
  });
  reminders.push({
    id: "outsider",
    role: "outsider",
    name: t('modal.reminder.outsider'),
  });
  reminders.push({
    id: "minion",
    role: "minion",
    name: t('modal.reminder.minion'),
  });
  reminders.push({
    id: "demon",
    role: "demon",
    name: t('modal.reminder.demon'),
  });
  reminders.push({
    id: "custom",
    role: "custom",
    name: t('modal.reminder.custom'),
  });
  return reminders;
});

function addReminder(reminder: Reminder) {
  const player = store.state.players.players[props.playerIndex];
  let value;
  if (reminder.role === "custom") {
    const name = prompt(t('prompt.customNote'));
    if (!name) return;
    value = [...player.reminders, { role: "custom", name }];
  } else {
    value = [...player.reminders, reminder];
  }
  store.commit("players/update", {
    player,
    property: "reminders",
    value,
  });
  store.commit("toggleModal", "reminder");
}

function rolePath(role: string) {
  return new URL(
    `../../assets/icons/${role}.png`,
    import.meta.url,
  ).href;
}

function toggleModal(modal: string) {
  store.commit("toggleModal", modal);
}
</script>

<style scoped lang="scss">
ul.reminders .reminder {
  background: url("../../assets/reminder.png") center center;
  background-size: 100%;
  width: 14vh;
  height: 14vh;
  max-width: 100px;
  max-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1%;

  border-radius: 50%;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  line-height: 100%;
  transition: transform 500ms ease;

  .icon {
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center center;
    background-repeat: no-repeat;
  }

  .text {
    color: black;
    font-size: 65%;
    font-weight: bold;
    text-align: center;
    top: 28%;
    width: 80%;
    line-height: 1;
  }

  &:hover {
    transform: scale(1.2);
  }
}
</style>
