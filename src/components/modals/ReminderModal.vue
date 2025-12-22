<template>
  <Modal v-if="grimoire.modal === 'reminder' && availableReminders.length && players[playerIndex]"
    @close="grimoire.toggleModal(null)">
    <h3>{{ t('modal.reminder.title') }}</h3>
    <ul class="reminders">
      <li v-for="reminder in availableReminders" :key="reminder.role.id + ' ' + reminder.name" class="reminder"
        :class="[reminder.role.id]" @click="addReminder(reminder)">
        <picture :class="reminder.role?.team">
          <RoleIcon :role="reminder.role" />
        </picture>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Modal, RoleIcon } from '@/components';
import { getRoleImage } from '@/services';
import {
  SPECIAL_REMINDER_ROLES,
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
} from "@/stores";
import type {
  Player,
  Reminder,
  Role,
} from "@/types";

const locale = useLocaleStore();
const t = locale.t;

const mapReminder =
  (role: Role) =>
    (name: string): Reminder => ({
      role: role,
      image: role.image || getRoleImage(role),
      imageAlt: role.imageAlt || '',
      name,
      id: `${role.id}-${name}`,
    });

const props = defineProps<{
  playerIndex: number;
}>();

const playersStore = usePlayersStore();
const grimoire = useGrimoireStore();

const players = computed(() => playersStore.players);

const availableReminders = computed((): Reminder[] => {
  let reminders: Reminder[] = [];
  const { players, bluffs } = playersStore;

  grimoire.roles.forEach((role: Role) => {
    // add reminders from player roles
    if (players.some((p: Player) => p.role.id === role.id)) {
      if (role.reminders) {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      }
    }
    // add reminders from bluff/other roles
    else if (bluffs.some((bluff: Role) => bluff.id === role.id)) {
      if (role.reminders) {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      }
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
  playersStore.fabled.forEach((role: Role) => {
    if (role.reminders) {
      reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
    }
  });

  // add out of script traveler reminders
  grimoire.othertravelers.forEach((role: Role) => {
    if (players.some((p: Player) => p.role.id === role.id)) {
      if (role.reminders) {
        reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
      }
    }
  });

  reminders.push({
    id: "good",
    role: SPECIAL_REMINDER_ROLES.good,
    name: t('modal.reminder.good'),
  });
  reminders.push({
    id: "evil",
    role: SPECIAL_REMINDER_ROLES.evil,
    name: t('modal.reminder.evil'),
  });
  reminders.push({
    id: "townsfolk",
    role: SPECIAL_REMINDER_ROLES.townsfolk,
    name: t('modal.reminder.townsfolk'),
  });
  reminders.push({
    id: "outsider",
    role: SPECIAL_REMINDER_ROLES.outsider,
    name: t('modal.reminder.outsider'),
  });
  reminders.push({
    id: "minion",
    role: SPECIAL_REMINDER_ROLES.minion,
    name: t('modal.reminder.minion'),
  });
  reminders.push({
    id: "demon",
    role: SPECIAL_REMINDER_ROLES.demon,
    name: t('modal.reminder.demon'),
  });
  reminders.push({
    id: "custom",
    role: SPECIAL_REMINDER_ROLES.custom,
    name: t('modal.reminder.custom'),
  });
  return reminders;
});

function addReminder(reminder: Reminder) {
  const player = playersStore.players[props.playerIndex];
  if (!player) return;
  let value;
  if (reminder.role.id === "custom") {
    const name = prompt(t('prompt.customNote'));
    if (!name) return;
    value = [...player.reminders, { role: SPECIAL_REMINDER_ROLES.custom, name }];
  } else if (reminder.name === "?") {
    let name = prompt(t('prompt.customNote'));
    if (!name) name = "?";
    value = [...player.reminders, { role: reminder.role, name }];
  } else {
    value = [...player.reminders, reminder];
  }
  playersStore.update({
    player,
    property: "reminders",
    value,
  });
  grimoire.toggleModal(null);
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

  li {
    position: relative;
  }

  picture {
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
  }

  picture * {
    max-width: 100%;
    max-height: 100%;
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
