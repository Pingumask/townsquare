<template>
  <Modal
    class="characters"
    @close="toggleModal('reference')"
    v-if="modals.reference && roles.size"
  >
    <font-awesome-icon
      @click="toggleModal('nightOrder')"
      icon="cloud-moon"
      class="toggle"
      :title="locale.modal.reference.nightOrder"
    />
    <h3>
      {{ locale.modal.reference.title }}
      <font-awesome-icon icon="address-card" />
      {{ edition.name || "Custom Script" }}
    </h3>
    <div
      v-for="(teamRoles, team) in rolesGrouped"
      :key="team"
      :class="['team', team]"
    >
      <aside>
        <h4>{{ locale.modal.reference.teamNames[team] }}</h4>
      </aside>
      <ul>
        <li v-for="role in teamRoles" :class="[team]" :key="role.id">
          <span
            class="icon"
            v-if="role.id"
            :style="{
              backgroundImage: `url(${
                role.image && grimoire.isImageOptIn
                  ? role.image
                  : require(
                      '../../assets/icons/' +
                        (role.imageAlt || role.id) +
                        '.png',
                    )
              })`,
            }"
          ></span>
          <div class="role">
            <span class="player" v-if="Object.keys(playersByRole).length">{{
              playersByRole[role.id] ? playersByRole[role.id].join(", ") : ""
            }}</span>
            <span class="name">{{ role.name }}</span>
            <span class="ability">{{ role.ability }}</span>
          </div>
        </li>
        <li :class="[team]"></li>
        <li :class="[team]"></li>
      </ul>
    </div>

    <div class="team jinxed" v-if="jinxed.length">
      <aside>
        <h4>{{ locale.modal.reference.jinxed }}</h4>
      </aside>
      <ul>
        <li v-for="(jinx, index) in jinxed" :key="index">
          <span
            class="icon"
            :style="{
              backgroundImage: `url(${require(
                '../../assets/icons/' + jinx.first.id + '.png',
              )})`,
            }"
          ></span>
          <span
            class="icon"
            :style="{
              backgroundImage: `url(${require(
                '../../assets/icons/' + jinx.second.id + '.png',
              )})`,
            }"
          ></span>
          <div class="role">
            <span class="name"
              >{{ jinx.first.name }} & {{ jinx.second.name }}</span
            >
            <span class="ability">{{ jinx.reason }}</span>
          </div>
        </li>
        <li></li>
        <li></li>
      </ul>
    </div>
    <div class="asterisk">{{ locale.modal.reference.notfirstnight }}</div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

export default {
  components: {
    Modal,
  },
  computed: {
    /**
     * Return a list of jinxes in the form of role IDs and a reason
     * @returns {*[]} [{first, second, reason}]
     */
    jinxed: function () {
      const jinxed = [];
      this.roles.forEach((role) => {
        if (this.jinxes.get(role.id)) {
          this.jinxes.get(role.id).forEach((reason, second) => {
            if (this.roles.get(second)) {
              jinxed.push({
                first: role,
                second: this.roles.get(second),
                reason,
              });
            }
          });
        }
      });
      return jinxed;
    },
    rolesGrouped: function () {
      const rolesGrouped = {};
      this.roles.forEach((role) => {
        if (!rolesGrouped[role.team]) {
          rolesGrouped[role.team] = [];
        }
        rolesGrouped[role.team].push(role);
      });
      delete rolesGrouped["traveler"];
      return rolesGrouped;
    },
    playersByRole: function () {
      const players = {};
      this.players.forEach(({ name, role }) => {
        if (role && role.id && role.team !== "traveler") {
          if (!players[role.id]) {
            players[role.id] = [];
          }
          players[role.id].push(name);
        }
      });
      return players;
    },
    ...mapState(["roles", "modals", "edition", "grimoire", "jinxes", "locale"]),
    ...mapState("players", ["players"]),
  },
  methods: {
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

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
      margin: 0 -5px;
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
#townsquare.public ~ .characters .modal .player {
  display: none;
}
</style>
