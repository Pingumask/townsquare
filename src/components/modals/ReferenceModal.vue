<template>
  <Modal v-if="modals.reference && roles.size" class="characters" @close="toggleModal('reference')">
    <font-awesome-icon icon="cloud-moon" class="fa fa-cloud-moon toggle" :title="t('modal.reference.nightOrder')"
      @click="toggleModal('nightOrder')" />
    <h3>
      {{ t('modal.reference.title') }}
      <font-awesome-icon icon="address-card" class="fa fa-address-card" />
      {{ edition.name || "Custom Script" }}
    </h3>
    <div v-for="(teamRoles, team) in rolesGrouped" :key="team" :class="['team', team]">
      <aside :aria-label="t(`modal.reference.teamNames.${team}`)">
        <h4>{{ t(`modal.reference.teamNames.${team}`) }}</h4>
      </aside>
      <ul>
        <li v-for="role in teamRoles" :key="role.id" :class="[team]">
          <RoleIcon :role="role" class="icon" />
          <div class="role">
            <span v-if="Object.keys(playersByRole).length" class="player">
              {{ playersByRole[role.id] ? playersByRole[role.id]?.join(", ") : "" }}
            </span>
            <span class="name">{{ role.name }}</span>
            <span class="ability">{{ role.ability }}</span>
          </div>
        </li>
        <li :class="[team]" />
        <li :class="[team]" />
      </ul>
    </div>

    <div v-if="jinxed.length" class="team jinxed">
      <aside :aria-label="t('modal.reference.jinxed')">
        <h4>{{ t('modal.reference.jinxed') }}</h4>
      </aside>
      <ul>
        <li v-for="(jinx, index) in jinxed" :key="index" class="jinxed">
          <RoleIcon :role="jinx.first" />
          <RoleIcon :role="jinx.second" />
          <div class="role">
            <span class="name">{{ jinx.first.name }} & {{ jinx.second.name }}</span>
            <span class="ability">{{ jinx.reason }}</span>
          </div>
        </li>
        <li />
        <li />
      </ul>
    </div>
    <div class="asterisk">
      {{ t('modal.reference.notfirstnight') }}
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { Modal } from '@/components';
import { useTranslation } from '@/composables';
import type { Role, Player, JinxInfo } from '@/types';

import RoleIcon from '../RoleIcon.vue';

const { t } = useTranslation();
const store = useStore();

const roles = computed(() => store.state.roles);
const modals = computed(() => store.state.modals);
const edition = computed(() => store.state.edition);
const jinxes = computed(() => store.state.jinxes);
const players = computed(() => store.state.players.players);

/**
     * Return a list of jinxes in the form of role IDs and a reason
     * @returns {JinxInfo[]} [{first, second, reason}]
     */
const jinxed = computed((): JinxInfo[] => {
  const jinxedList: JinxInfo[] = [];
  roles.value.forEach((role: Role) => {
    if (jinxes.value.get(role.id)) {
      jinxes.value.get(role.id).forEach((reason: string, second: string) => {
        const secondRole = roles.value.get(second);
        if (secondRole) {
          jinxedList.push({
            first: role,
            second: secondRole,
            reason,
          });
        }
      });
    }
  });
  return jinxedList;
});

const rolesGrouped = computed(() => {
  const grouped: Record<string, Role[]> = {};
  roles.value.forEach((role: Role) => {
    if (!grouped[role.team || 'default']) {
      grouped[role.team || 'default'] = [];
    }
    grouped[role.team || 'default']?.push(role);
  });
  delete grouped["traveler"];
  return grouped;
});

const playersByRole = computed(() => {
  const playersMap: Record<string, string[]> = {};
  players.value.forEach(({ name, role }: Player) => {
    if (role && role.id && role.team !== "traveler") {
      if (!playersMap[role.id]) {
        playersMap[role.id] = [];
      }
      playersMap[role.id]?.push(name);
    }
  });
  return playersMap;
});

const toggleModal = (modalName: string) => {
  store.commit("toggleModal", modalName);
};
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

.toggle {
  position: absolute;
  left: 20px;
  top: 15px;
  cursor: pointer;

  &:hover {
    color: red;
  }
}

h3 {
  margin: 0 40px;

  svg {
    vertical-align: middle;
  }
}

.townsfolk {
  .name {
    color: $townsfolk;
  }

  aside {
    background: linear-gradient(-90deg, $townsfolk, transparent);
  }
}

.icon {
  --blend: normal;

  &.townsfolk {
    --color: #1f65ff;
  }

  &.outsider {
    --color: #46d5ff;
  }

  &.minion {
    --color: #ff6900;
  }

  &.demon {
    --color: #ce0100;
  }

  picture,
  picture svg {
    width: 12vmin;
    text-align: left;
  }

  top: 0;
  width: 4rem;
  height: 4rem;
  text-align: right;
}

.outsider {
  .name {
    color: $outsider;
  }

  aside {
    background: linear-gradient(-90deg, $outsider, transparent);
  }
}

.minion {
  .name {
    color: $minion;
  }

  aside {
    background: linear-gradient(-90deg, $minion, transparent);
  }
}

.demon {
  .name {
    color: $demon;
  }

  aside {
    background: linear-gradient(-90deg, $demon, transparent);
  }
}

.jinxed {
  .role {
    --blend: normal;
  }

  .name {
    color: $fabled;
  }

  aside {
    background: linear-gradient(-90deg, $fabled, transparent);
  }

  ul li {
    display: grid;
    grid-template-columns: 6vmin 6vmin 1fr;
    align-items: center;
  }

  picture:first-of-type {
    position: relative;
    left: 0.5rem;
    top: -0.75rem;
  }

  picture:last-of-type {
    position: relative;
    right: 0.5rem;
    bottom: -0.75rem;
  }
}

.asterisk {
  font-size: 60%;
  text-align: right;
  padding-top: 20px;
}

.team {
  display: flex;
  align-items: stretch;

  &:not(:last-child):after {
    content: " ";
    display: block;
    width: 25%;
    height: 1px;
    background: linear-gradient(90deg, #ffffffaa, transparent);
    position: absolute;
    left: 0;
    bottom: 0;
  }

  aside {
    width: 30px;
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    align-content: center;
    overflow: hidden;
    text-shadow: 0 0 4px black;
  }

  h4 {
    text-transform: uppercase;
    text-align: center;
    transform: rotate(90deg);
    transform-origin: center;
    font-size: 80%;
  }

  &.jinxed {

    .icon,
    picture {
      width: 6vmin;
      height: 6vmin
    }
  }
}

ul {
  flex-grow: 1;
  display: grid;
  width: calc(100% - 35px);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  padding: 15px 5px;

  li {
    display: grid;
    align-items: start;
    padding-bottom: 1rem;
    grid-template-columns: 12vmin 1fr;
    text-align: justify;

    .icon {
      width: 12vmin;
      background-size: contain;
      background-position: center right;
      background-repeat: no-repeat;
      flex-shrink: 0;
      flex-grow: 0;
      position: relative;
      top: 0.5em;

      &:after {
        content: " ";
        display: block;
        padding-top: 75%;
      }
    }

    .role {
      line-height: 80%;
      flex-grow: 1;
    }

    .name {
      font-weight: bold;
      font-size: 75%;
      display: block;
    }

    .player {
      color: #888;
      float: right;
      font-size: 60%;
    }

    .ability {
      font-size: 70%;
    }
  }
}

/** break into 1 column below 600px **/
@media screen and (max-width: 600px) {
  ul {
    grid-template-columns: 1fr;

    li {
      .role {
        line-height: 100%;
      }

      .name {
        font-size: 100%;
      }

      .player {
        font-size: 100%;
      }

      .ability {
        font-size: 90%;
      }
    }
  }

  .team aside {
    width: 15px;
  }
}

/** hide players when town square is set to "public" **/
#townsquare.public~.characters .modal .player {
  display: none;
}
</style>
