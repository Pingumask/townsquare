<template>
  <Modal v-if="modals.reminder && availableReminders.length && players[playerIndex]" @close="toggleModal('reminder')">
    <h3>{{ locale.modal.reminder.title }}</h3>
    <ul class="reminders">
      <li v-for="reminder in availableReminders" class="reminder" :class="[reminder.role]"
        :key="reminder.role + ' ' + reminder.name" @click="addReminder(reminder)">
        <span class="icon" :style="{
          backgroundImage: `url(${reminder.image && grimoire.isImageOptIn
            ? reminder.image
            : rolePath(reminder.role)
            })`,
        }"></span>
        <span class="text">{{ reminder.name }}</span>
      </li>
    </ul>
  </Modal>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";

/**
 * Helper function that maps a reminder name with a role-based object that provides necessary visual data.
 * @param role The role for which the reminder should be generated
 * @return {function(*): {image: string|string[]|string|*, role: *, name: *, imageAlt: string|*}}
 */
const mapReminder =
  ({ id, image, imageAlt }) =>
    (name) => ({
      role: id,
      image,
      imageAlt,
      name,
    });

const props = defineProps(["playerIndex"]);
const store = useStore();

const modals = computed(() => store.state.modals);
const grimoire = computed(() => store.state.grimoire);
const locale = computed(() => store.state.locale);
const roles = computed(() => store.state.roles);
const jinxes = computed(() => store.state.jinxes);
const players = computed(() => store.state.players.players);

const availableReminders = computed(() => {
  let reminders = [];
  const { players, bluffs } = store.state.players;
  roles.value.forEach((role) => {
    // add reminders from player roles
    if (players.some((p) => p.role.id === role.id)) {
      reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
    }
    // add reminders from bluff/other roles
    else if (bluffs.some((bluff) => bluff.id === role.id)) {
      reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
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
  store.state.players.fabled.forEach((role) => {
    reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
  });

  // add out of script traveler reminders
  store.state.otherTravelers.forEach((role) => {
    if (players.some((p) => p.role.id === role.id)) {
      reminders = [...reminders, ...role.reminders.map(mapReminder(role))];
    }
  });
  
  // looking at the jinxes to potentially add  reminders
  roles.value.forEach((role) => {
    if (jinxes.value.get(role.id)) {
      jinxes.value.get(role.id).forEach((reason, second) => {
        if (typeof reason == "object" && roles.value.get(second)) {
          reminders.push({
            role: "djinn",
            name: reason[1],
          });
        }
      });
    }
  });

  reminders.push({
    role: "good",
    name: locale.value.modal.reminder.good,
  });
  reminders.push({
    role: "evil",
    name: locale.value.modal.reminder.evil,
  });
  reminders.push({
    role: "townsfolk",
    name: locale.value.modal.reminder.townsfolk,
  });
  reminders.push({
    role: "outsider",
    name: locale.value.modal.reminder.outsider,
  });
  reminders.push({
    role: "minion",
    name: locale.value.modal.reminder.minion,
  });
  reminders.push({
    role: "demon",
    name: locale.value.modal.reminder.demon,
  });
  reminders.push({
    role: "custom",
    name: locale.value.modal.reminder.custom,
  });
  return reminders;
});

function addReminder(reminder) {
  const player = store.state.players.players[props.playerIndex];
  let value;
  if (reminder.role === "custom") {
    const name = prompt(locale.value.prompt.customNote);
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

function rolePath(role) {
  return new URL(
    `../../assets/icons/${role}.png`,
    import.meta.url,
  ).href;
}

function toggleModal(modal) {
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
