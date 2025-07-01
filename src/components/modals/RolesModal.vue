<template>
  <Modal class="roles" v-if="modals.roles && nonTravelers >= 5" @close="toggleModal('roles')">
    <h3>
      {{
        locale.modal.roles.titleStart +
        nonTravelers +
        locale.modal.roles.titleEnd
      }}
    </h3>
    <ul class="tokens" v-for="(teamRoles, team) in roleSelection" :key="team">
      <li class="count" :class="[team]">
        {{ teamRoles.reduce((a, { selected }) => a + selected, 0) }} /
        {{ game[nonTravelers - 5][team] }}
      </li>
      <li v-for="role in teamRoles" :class="[role.team, role.selected ? 'selected' : '']" :key="role.id"
        @click="role.selected = role.selected ? 0 : 1">
        <Token :role="role" />
        <font-awesome-icon icon="exclamation-triangle" class="fa fa-exclamation-triangle" v-if="role.setup" />
        <div class="buttons" v-if="allowMultiple || role.multiple">
          <font-awesome-icon icon="minus-circle" @click.stop="role.selected--" />
          <span>{{ role.selected > 1 ? "x" + role.selected : "" }}</span>
          <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="role.selected++" />
        </div>
      </li>
    </ul>
    <ul class="tokens">
      <li v-for="role in fabledWithSetup" :class="['fabled', 'selected']" :key="role.id">
        <Token :role="role" />
        <font-awesome-icon icon="exclamation-triangle" class="fa fa-exclamation-triangle" />
      </li>
    </ul>
    <div class="warning" v-if="hasSelectedSetupRoles || fabledWithSetup.length">
      <font-awesome-icon icon="exclamation-triangle" class="fa fa-exclamation-triangle" />
      <span>{{ locale.modal.roles.warning }}</span>
    </div>
    <label class="multiple" :class="{ checked: allowMultiple }">
      <font-awesome-icon :icon="allowMultiple ? 'check-square' : 'square'" />
      <input type="checkbox" name="allow-multiple" v-model="allowMultiple" />
      {{ locale.modal.roles.allowMultiple }}
    </label>
    <div class="button-group">
      <div class="button" @click="assignRoles" :class="{
        disabled: selectedRoles > nonTravelers || !selectedRoles,
      }">
        <font-awesome-icon icon="people-arrows" class="fa fa-people-arrows" />
        {{
          locale.modal.roles.assignStart +
          selectedRoles +
          locale.modal.roles.assignEnd
        }}
      </div>
      <div class="button" @click="selectRandomRoles">
        <font-awesome-icon icon="random" class="fa fa-random" />
        {{ locale.modal.roles.shuffle }}
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import Modal from "./Modal.vue";
import gameJSON from "../../game.json";
import Token from "../Token.vue";

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const store = useStore();

const roleSelection = ref({});
const game = ref(gameJSON);
const allowMultiple = ref(false);

const roles = computed(() => store.state.roles);
const modals = computed(() => store.state.modals);
const locale = computed(() => store.state.locale);
const players = computed(() => store.state.players.players);
const fabled = computed(() => store.state.players.fabled);
const nonTravelers = computed(() => store.getters['players/nonTravelers']);

const selectedRoles = computed(() => {
  return Object.values(roleSelection.value)
    .map((roles) => roles.reduce((a, { selected }) => a + selected, 0))
    .reduce((a, b) => a + b, 0);
});

const hasSelectedSetupRoles = computed(() => {
  return Object.values(roleSelection.value).some((roles) =>
    roles.some((role) => role.selected && role.setup),
  );
});

const fabledWithSetup = computed(() => {
  let res = [];
  for (const fable of fabled.value) {
    if (fable.setup) {
      res.push(fable);
    }
  }
  return res;
});

const selectRandomRoles = () => {
  roleSelection.value = {};
  roles.value.forEach((role) => {
    if (!roleSelection.value[role.team]) {
      roleSelection.value[role.team] = [];
    }
    roleSelection.value[role.team].push(role);
    role.selected = 0;
  });
  delete roleSelection.value["traveler"];
  const playerCount = Math.max(5, nonTravelers.value);
  const composition = game.value[playerCount - 5];
  Object.keys(composition).forEach((team) => {
    for (let x = 0; x < composition[team]; x++) {
      if (roleSelection.value[team]) {
        const available = roleSelection.value[team].filter(
          (role) => !role.selected,
        );
        if (available.length) {
          randomElement(available).selected = 1;
        }
      }
    }
  });
};

const assignRoles = () => {
  if (selectedRoles.value <= nonTravelers.value && selectedRoles.value) {
    // generate list of selected roles and randomize it
    const roles = Object.values(roleSelection.value)
      .map((roles) =>
        roles
          // duplicate roles selected more than once and filter unselected
          .reduce((a, r) => [...a, ...Array(r.selected).fill(r)], []),
      )
      // flatten into a single array
      .reduce((a, b) => [...a, ...b], [])
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
    players.value.forEach((player) => {
      if (player.role.team !== "traveler" && roles.length) {
        const value = roles.pop();
        store.commit("players/update", {
          player,
          property: "role",
          value,
        });
        store.commit("players/update", {
          player,
          property: "alignment",
          value: "auto",
        });
      }
    });
    store.commit("toggleModal", "roles");
  }
};

const toggleModal = (modal) => {
  store.commit("toggleModal", modal);
};

onMounted(() => {
  if (!Object.keys(roleSelection.value).length) {
    selectRandomRoles();
  }
});

watch(roles, () => {
  selectRandomRoles();
});
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

ul.tokens {
  padding-left: 5vmin;
  margin-top: 5px;

  li {
    border-radius: 50%;
    width: 5vmax;
    margin: 5px;
    opacity: 0.5;
    transition: all 250ms;

    &.selected {
      opacity: 1;

      .buttons {
        display: flex;
      }

      .fa-exclamation-triangle {
        display: block;
      }
    }

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

    &.fabled {
      box-shadow:
        0 0 10px $fabled,
        0 0 10px $fabled;
    }

    &:hover {
      transform: scale(1.2);
      z-index: 10;
    }

    .fa-exclamation-triangle {
      position: absolute;
      color: red;
      filter: drop-shadow(0 0 3px black) drop-shadow(0 0 3px black);
      top: 5px;
      right: -5px;
      font-size: 150%;
      display: none;
    }

    .buttons {
      display: none;
      position: absolute;
      top: 95%;
      text-align: center;
      width: 100%;
      z-index: 30;
      font-weight: bold;
      filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));

      span {
        flex-grow: 1;
      }

      svg {
        opacity: 0.25;
        cursor: pointer;

        &:hover {
          opacity: 1;
          color: red;
        }
      }
    }
  }

  .count {
    opacity: 1;
    position: absolute;
    left: 0;
    font-weight: bold;
    font-size: 75%;
    width: 5%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:after {
      content: " ";
      display: block;
      padding-top: 100%;
    }

    &.townsfolk {
      color: $townsfolk;
    }

    &.outsider {
      color: $outsider;
    }

    &.minion {
      color: $minion;
    }

    &.demon {
      color: $demon;
    }
  }
}

.roles .modal {
  .multiple {
    display: block;
    text-align: center;
    cursor: pointer;
    margin-top: 20px;

    &.checked,
    &:hover {
      color: red;
    }

    svg {
      margin-right: 5px;
    }

    input {
      display: none;
    }
  }

  .warning {
    color: red;
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 10;

    svg {
      font-size: 150%;
      vertical-align: middle;
    }

    span {
      display: none;
      text-align: center;
      position: absolute;
      right: -20px;
      bottom: 30px;
      width: 420px;
      background: rgba(0, 0, 0, 0.75);
      padding: 5px;
      border-radius: 10px;
      border: 2px solid black;
    }

    &:hover span {
      display: block;
    }
  }
}
</style>
