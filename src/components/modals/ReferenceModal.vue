<template>
  <Modal class="characters" @close="toggleModal('reference')" v-if="modals.reference && roles.size">
    <font-awesome-icon @click="toggleModal('nightOrder')" icon="cloud-moon" class="fa fa-cloud-moon toggle"
      :title="locale.modal.reference.nightOrder" />
    <h3>
      {{ locale.modal.reference.title }}
      <font-awesome-icon icon="address-card" class="fa fa-address-card" />
      {{ edition.name || "Custom Script" }}
    </h3>
    <div v-for="(teamRoles, team) in rolesGrouped" :key="team" :class="['team', team]">
      <aside :aria-label="locale.modal.reference.teamNames[team]">
        <h4>{{ locale.modal.reference.teamNames[team] }}</h4>
      </aside>
      <ul>
        <li v-for="role in teamRoles" :class="[team]" :key="role.id">
          <span class="icon" v-if="role.id" :style="{
            backgroundImage: `url(${role.image && grimoire.isImageOptIn
              ? role.image
              : rolePath(role)
              })`,
          }"></span>
          <div class="role">
            <span class="player" v-if="Object.keys(playersByRole).length">
              {{ playersByRole[role.id] ? playersByRole[role.id].join(", ") : "" }}
            </span>
            <span class="name">{{ role.name }}</span>
            <span class="ability">{{ role.ability }}</span>
          </div>
        </li>
        <li :class="[team]"></li>
        <li :class="[team]"></li>
      </ul>
    </div>

    <div class="team jinxed" v-if="jinxed.length">
      <aside :aria-label="locale.modal.reference.jinxed">
        <h4>{{ locale.modal.reference.jinxed }}</h4>
      </aside>
      <ul>
        <li v-for="(jinx, index) in jinxed" :key="index">
          <span class="icon" :style="{
            backgroundImage: 'url(' + rolePath(jinx.first) + ')',
          }"></span>
          <span class="icon" :style="{
            backgroundImage: 'url(' + rolePath(jinx.second) + ')',
          }"></span>
          <div class="role">
            <span class="name">{{ jinx.first.name }} & {{ jinx.second.name }}</span>
            <span class="ability">{{ typeof jinx.reason == "string" ? jinx.reason : jinx.reason[0] }}</span>
          </div>
        </li>
        <li></li>
        <li></li>
      </ul>
    </div>
    <div class="asterisk">{{ locale.modal.reference.notfirstnight }}</div>
  </Modal>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";

const store = useStore();

const roles = computed(() => store.state.roles);
const modals = computed(() => store.state.modals);
const edition = computed(() => store.state.edition);
const grimoire = computed(() => store.state.grimoire);
const jinxes = computed(() => store.state.jinxes);
const locale = computed(() => store.state.locale);
const players = computed(() => store.state.players.players);

/**
     * Return a list of jinxes in the form of role IDs and a reason
     * @returns {*[]} [{first, second, reason}]
     */
const jinxed = computed(() => {
  const jinxedList = [];
  roles.value.forEach((role) => {
    if (jinxes.value.get(role.id)) {
      jinxes.value.get(role.id).forEach((reason, second) => {
        if (roles.value.get(second)) {
          jinxedList.push({
            first: role,
            second: roles.value.get(second),
            reason,
          });
        }
      });
    }
  });
  return jinxedList;
});

const rolesGrouped = computed(() => {
  const grouped = {};
  roles.value.forEach((role) => {
    if (!grouped[role.team]) {
      grouped[role.team] = [];
    }
    grouped[role.team].push(role);
  });
  delete grouped["traveler"];
  return grouped;
});

const playersByRole = computed(() => {
  const playersMap = {};
  players.value.forEach(({ name, role }) => {
    if (role && role.id && role.team !== "traveler") {
      if (!playersMap[role.id]) {
        playersMap[role.id] = [];
      }
      playersMap[role.id].push(name);
    }
  });
  return playersMap;
});

const rolePath = (role) => {
  return new URL(
    `../../assets/icons/${role.imageAlt || role.id}.png`,
    import.meta.url,
  ).href;
};

const toggleModal = (modalName) => {
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
  .name {
    color: $fabled;
  }

  aside {
    background: linear-gradient(-90deg, $fabled, transparent);
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
    .icon {
      width: 6vmin;
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
    display: flex;
    align-items: center;
    max-width: 100%;
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
