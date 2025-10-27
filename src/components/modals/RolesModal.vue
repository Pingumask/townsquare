<template>
  <Modal v-if="modals.roles && nontravelers >= 5" class="roles" @close="toggleModal('roles')">
    <h3>
      {{
        t('modal.roles.titleStart') +
        nontravelers +
        t('modal.roles.titleEnd')
      }}
    </h3>
    <ul v-for="(teamRoles, team) in roleSelection" :key="team" class="tokens">
      <li class="count" :class="[team]">
        {{ getTeamRoleCount(teamRoles) }} /
        {{ game[nontravelers - 5]?.[team as keyof typeof game[0]] }}
      </li>
      <li v-for="role in teamRoles" :key="role.id" :class="[role.team, role.selected ? 'selected' : '']"
        @click="role.selected = role.selected ? 0 : 1">
        <Token :role="role" />
        <font-awesome-icon v-if="role.setup" icon="exclamation-triangle" class="fa fa-exclamation-triangle" />
        <div v-if="allowMultiple || role.multiple" class="buttons">
          <font-awesome-icon icon="minus-circle" @click.stop="role.selected--" />
          <span>{{ role.selected > 1 ? "x" + role.selected : "" }}</span>
          <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="role.selected++" />
        </div>
      </li>
    </ul>
    <ul class="tokens">
      <li v-for="role in fabledWithSetup" :key="role.id" :class="['fabled', 'selected']">
        <Token :role="role" />
        <font-awesome-icon icon="exclamation-triangle" class="fa fa-exclamation-triangle" />
      </li>
    </ul>
    <div v-if="hasSelectedSetupRoles || fabledWithSetup.length" class="warning">
      <font-awesome-icon icon="exclamation-triangle" class="fa fa-exclamation-triangle" />
      <span>{{ t('modal.roles.warning') }}</span>
    </div>
    <label class="multiple" :class="{ checked: allowMultiple }">
      <font-awesome-icon :icon="allowMultiple ? 'check-square' : 'square'" />
      <input v-model="allowMultiple" type="checkbox" name="allow-multiple">
      {{ t('modal.roles.allowMultiple') }}
    </label>
    <div class="button-group">
      <div class="button" :class="{
        disabled: selectedRoles > nontravelers || !selectedRoles,
      }" @click="assignRoles">
        <font-awesome-icon icon="people-arrows" class="fa fa-people-arrows" />
        {{
          t('modal.roles.assignStart') +
          selectedRoles +
          t('modal.roles.assignEnd')
        }}
      </div>
      <div class="button" @click="selectRandomRoles">
        <font-awesome-icon icon="random" class="fa fa-random" />
        {{ t('modal.roles.shuffle') }}
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import gameJSON from "@/game.json";
import { Modal, Token } from '@/components';
import { useTranslation } from '@/composables';
import type { GameComposition, Role, RoleGroup, SelectableRole, Player } from "@/types";

const { t } = useTranslation();
const randomElement = <T>(arr: T[]): T => {
  if (arr.length === 0) throw new Error('Cannot select from empty array');
  return arr[Math.floor(Math.random() * arr.length)]!;
};

const store = useStore();

const roleSelection = ref<RoleGroup>({});
const game = ref<GameComposition[]>(gameJSON);
const allowMultiple = ref(false);

const roles = computed(() => store.state.roles);
const modals = computed(() => store.state.modals);
const players = computed(() => store.state.players.players);
const fabled = computed(() => store.state.players.fabled);
const nontravelers = computed(() => store.getters['players/nontravelers']);

const selectedRoles = computed(() => {
  return Object.values(roleSelection.value)
    .map((roles: SelectableRole[]) => roles.reduce((a: number, { selected }) => a + selected, 0))
    .reduce((a: number, b: number) => a + b, 0);
});

const hasSelectedSetupRoles = computed(() => {
  return Object.values(roleSelection.value).some((roles: SelectableRole[]) =>
    roles.some((role: SelectableRole) => role.selected && role.setup),
  );
});

const fabledWithSetup = computed(() => {
  let res: Role[] = [];
  for (const fable of fabled.value) {
    if (fable.setup) {
      res.push(fable);
    }
  }
  return res;
});

// Helper function for template to get team role count
const getTeamRoleCount = (teamRoles: SelectableRole[]) => {
  return teamRoles.reduce((a: number, { selected }) => a + selected, 0);
};

const selectRandomRoles = () => {
  roleSelection.value = {};
  roles.value.forEach((role: Role) => {
    const selectableRole: SelectableRole = { ...role, selected: 0 };
    if (!roleSelection.value[role.team || 'unknown']) {
      roleSelection.value[role.team || 'unknown'] = [];
    }
    roleSelection.value[role.team || 'unknown']?.push(selectableRole);
  });
  delete roleSelection.value["traveler"];
  const playerCount = Math.max(5, nontravelers.value);
  const composition = game.value[playerCount - 5];
  if (composition) {
    Object.keys(composition).forEach((team: string) => {
      const teamKey = team as keyof GameComposition;
      for (let x = 0; x < composition[teamKey]; x++) {
        if (roleSelection.value[team]) {
          const available = roleSelection.value[team].filter(
            (role: SelectableRole) => !role.selected,
          );
          if (available.length) {
            randomElement(available).selected = 1;
          }
        }
      }
    });
  }
};

const assignRoles = () => {
  if (selectedRoles.value <= nontravelers.value && selectedRoles.value) {
    // generate list of selected roles and randomize it
    const roles = Object.values(roleSelection.value)
      .map((roles: SelectableRole[]) =>
        roles
          // duplicate roles selected more than once and filter unselected
          .reduce((a: SelectableRole[], r: SelectableRole) => [...a, ...Array(r.selected).fill(r)], []),
      )
      // flatten into a single array
      .reduce((a: SelectableRole[], b: SelectableRole[]) => [...a, ...b], [])
      .map((a: SelectableRole) => [Math.random(), a] as [number, SelectableRole])
      .sort((a: [number, SelectableRole], b: [number, SelectableRole]) => a[0] - b[0])
      .map((a: [number, SelectableRole]) => a[1]);
    players.value.forEach((player: Player) => {
      if (player.role.team !== "traveler" && roles.length) {
        const value = roles.pop();
        store.commit("players/update", {
          player,
          property: "role",
          value,
        });
      }
      store.commit("players/update", {
        player,
        property: "alignment",
        value: null,
      });
    });
    store.commit("toggleModal", "roles");
  }
};

const toggleModal = (modal: string) => {
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

    &.loric {
      box-shadow:
        0 0 10px $loric,
        0 0 10px $loric;
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
