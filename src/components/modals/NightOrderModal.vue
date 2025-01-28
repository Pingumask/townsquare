<template>
  <Modal class="night-reference" @close="toggleModal('nightOrder')" v-if="modals.nightOrder && roles.size">
    <font-awesome-icon @click="toggleModal('reference')" icon="address-card" class="fa fa-address-card toggle"
      :title="locale.modal.nightOrder.reference" />
    <h3>
      {{ locale.modal.nightOrder.title }}
      <font-awesome-icon icon="cloud-moon" class="fa fa-cloud-moon" />
      {{ edition.name || locale.modal.nightOrder.custom }}
    </h3>
    <div class="night">
      <ul class="first">
        <li class="headline">{{ locale.modal.nightOrder.firstNight }}</li>
        <li v-for="role in rolesFirstNight" :key="role.name" :class="[role.team]">
          <span class="name">
            {{ role.name }}
            <span class="player" v-if="role.players.length">
              <br />
              <small v-for="(player, index) in role.players" :class="{ dead: player.isDead }" :key="index">
                {{ player.name + (role.players.length > index + 1 ? "," : "") }}
              </small>
            </span>
            <span class="player" v-if="
              (role.team == 'default' || role.team == 'fabled') &&
              !session.isSpectator &&
              players.length &&
              players[0].role.id
            ">
              <br />
              <small> </small>
            </span>
          </span>
          <span class="icon" v-if="role.id" :style="{
            backgroundImage: `url(${role.image && grimoire.isImageOptIn
              ? role.image
              : rolePath(role)
              })`,
          }"></span>
          <span class="reminder" v-if="role.firstNightReminder">
            {{ role.firstNightReminder }}
          </span>
        </li>
      </ul>
      <ul class="other">
        <li class="headline">{{ locale.modal.nightOrder.otherNights }}</li>
        <li v-for="role in rolesOtherNight" :key="role.name" :class="[role.team]">
          <span class="icon" v-if="role.id" :style="{
            backgroundImage: `url(${role.image && grimoire.isImageOptIn
              ? role.image
              : rolePath(role)
              })`,
          }"></span>
          <span class="name">
            {{ role.name }}
            <span class="player" v-if="role.players.length">
              <br />
              <small v-for="(player, index) in role.players" :class="{ dead: player.isDead }" :key="index">
                {{ player.name + (role.players.length > index + 1 ? "," : "") }}
              </small>
            </span>
            <span class="player" v-if="
              (role.team == 'default' || role.team == 'fabled') &&
              !session.isSpectator &&
              players.length &&
              players[0].role.id
            ">
              <br />
              <small> </small>
            </span>
          </span>
          <span class="reminder" v-if="role.otherNightReminder">
            {{ role.otherNightReminder }}
          </span>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";

const store = useStore();

const rolesFirstNight = computed(() => {

  function nightIndex(role, officialEdition) {
    if(officialEdition && role.firstNightEdition) {
      return role.firstNightEdition;
	}
    return role.firstNight;
  }
  
  const rolesFirstNight = [
    {
      id: "dusk",
      name: locale.value.modal.nightOrder.dusk,
      team: "default",
      firstNight: 2,
      players: [],
      firstNightReminder: locale.value.modal.nightOrder.duskDescription1,
    },
    {
      id: "dawn",
      name: locale.value.modal.nightOrder.dawn,
      firstNight: 1000,
      team: "default",
      players: [],
      firstNightReminder: locale.value.modal.nightOrder.dawnDescription1,
    },
  ];
  let toymaker = false;
  // Adding Fabled characters
  fabled.value.forEach((fabled) => {
    if (fabled.firstNight) {
      rolesFirstNight.push({ players: [], ...fabled });
    } else if (fabled.id == "toymaker") {
      toymaker = true;
    }
  });
  roles.value.forEach((role) => {
    if (role.firstNight && role.team !== "traveler") {
      role.players = players.value.filter((p) => p.role.id === role.id);
      rolesFirstNight.push(role);
    }
  });
  // Adding Travellers (duplicates only once)
  const seenTravelers = [];
  let nbTravelers = 0;
  players.value.forEach((player) => {
    if (player.role.team == "traveler") {
      nbTravelers++;
      if (!seenTravelers.includes(player.role.id)) {
        seenTravelers.push(player.role.id);
        if (player.role.firstNight) {
          const activePlayers = players.value.filter(
            (p) => p.role.id === player.role.id,
          );
          rolesFirstNight.push({ players: activePlayers, ...player.role });
        }
      }
    }
  });
  // Adding Minions/Demon info
  if (players.value.length - nbTravelers > 6 || toymaker) {
    rolesFirstNight.push(
      {
        id: "minion",
        name: locale.value.modal.nightOrder.minionInfo,
        firstNight: 12,
        team: "minion",
        players: players.value.filter((p) => p.role.team === "minion"),
        firstNightReminder:
          locale.value.modal.nightOrder.minionInfoDescription,
      },
      {
        id: "demon",
        name: locale.value.modal.nightOrder.demonInfo,
        firstNight: 18,
        team: "demon",
        players: players.value.filter((p) => p.role.team === "demon"),
        firstNightReminder:
          locale.value.modal.nightOrder.demonInfoDescription,
      },
    );
  }
  rolesFirstNight.sort((a, b) => nightIndex(a,edition.value.isOfficial) - nightIndex(b,edition.value.isOfficial));
  return rolesFirstNight;
});

const rolesOtherNight = computed(() => {

  function nightIndex(role, officialEdition) {
    if(officialEdition && role.otherNightEdition) {
      return role.otherNightEdition;
	}
    return role.otherNight;
  }

  const rolesOtherNight = [{
    id: "dusk",
    name: locale.value.modal.nightOrder.dusk,
    team: "default",
    otherNight: 2,
    players: [],
    otherNightReminder: locale.value.modal.nightOrder.duskDescription2,
  },
  {
    id: "dawn",
    name: locale.value.modal.nightOrder.dawn,
    team: "default",
    otherNight: 1000,
    players: [],
    otherNightReminder: locale.value.modal.nightOrder.dawnDescription2,
  },
  ];
  fabled.value.filter(({ otherNight }) => otherNight)
    .forEach((fabled) => {
      rolesOtherNight.push({ players: [], ...fabled });
    });
  roles.value.forEach((role) => {
    if (role.otherNight && role.team !== "traveler") {
      role.players = players.value.filter((p) => p.role.id === role.id);
      rolesOtherNight.push(role);
    }
  });
  // Adding Travellers (duplicates only once)
  const seenTravelers = [];
  players.value.forEach((player) => {
    if (
      player.role.otherNight &&
      player.role.team == "traveler" &&
      !seenTravelers.includes(player.role.id)
    ) {
      const activePlayers = players.value.filter(
        (p) => p.role.id === player.role.id,
      );
      seenTravelers.push(player.role.id);
      rolesOtherNight.push({ players: activePlayers, ...player.role });
    }
  });
  rolesOtherNight.sort((a, b) => nightIndex(a,edition.value.isOfficial) - nightIndex(b,edition.value.isOfficial));
  return rolesOtherNight;
});

const edition = computed(() => store.state.edition);
const grimoire = computed(() => store.state.grimoire);
const locale = computed(() => store.state.locale);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);
const fabled = computed(() => store.state.players.fabled);
const modals = computed(() => store.state.modals);
const roles = computed(() => store.state.roles);

const rolePath = (role) => {
  return new URL(
    `../../assets/icons/${role.imageAlt || role.id}.png`,
    import.meta.url,
  ).href;
};

const toggleModal = (modal) => {
  store.commit("toggleModal", modal);
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

h4 {
  text-transform: capitalize;
  display: flex;
  align-items: center;
  height: 20px;

  &:before,
  &:after {
    content: " ";
    width: 100%;
    height: 1px;
    border-radius: 2px;
  }

  &:before {
    margin-right: 15px;
  }

  &:after {
    margin-left: 15px;
  }
}

.fabled {
  .name {
    background: linear-gradient(90deg, $fabled, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $fabled, transparent 35%);
    }
  }
}

.townsfolk {
  .name {
    background: linear-gradient(90deg, $townsfolk, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $townsfolk, transparent 35%);
    }
  }
}

.outsider {
  .name {
    background: linear-gradient(90deg, $outsider, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $outsider, transparent 35%);
    }
  }
}

.minion {
  .name {
    background: linear-gradient(90deg, $minion, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $minion, transparent 35%);
    }
  }
}

.demon {
  .name {
    background: linear-gradient(90deg, $demon, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $demon, transparent 35%);
    }
  }
}

.traveler {
  .name {
    background: linear-gradient(90deg, $traveler, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $traveler, transparent 35%);
    }
  }
}

.default {
  .name {
    background: linear-gradient(90deg, $default, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $default, transparent 35%);
    }
  }
}

ul {
  li {
    display: flex;
    width: 100%;
    margin-bottom: 3px;

    .icon {
      width: 5vh;
      background-size: 100% auto;
      background-position: center center;
      background-repeat: no-repeat;
      flex-grow: 0;
      flex-shrink: 0;
      text-align: center;
      margin: 0 2px;

      &:after {
        content: " ";
        display: block;
        padding-top: 66%;
      }
    }

    .name {
      flex-grow: 0;
      flex-shrink: 0;
      width: 5%;
      text-align: right;
      font-size: 110%;
      padding: 5px;
      border-left: 1px solid rgba(255, 255, 255, 0.4);
      border-right: 1px solid rgba(255, 255, 255, 0.4);

      small {
        color: #888;
        margin-right: 5px;

        &.dead {
          text-decoration: line-through;
        }
      }
    }

    .reminder {
      position: fixed;
      padding: 5px 10px;
      left: 50%;
      bottom: 10%;
      width: 500px;
      z-index: 25;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 10px;
      border: 3px solid black;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
      text-align: left;
      pointer-events: none;
      opacity: 0;
      transition: opacity 200ms ease-in-out;
      margin-left: -250px;
    }

    &:hover .reminder {
      opacity: 1;
    }
  }

  &.legend {
    font-weight: bold;
    height: 20px;
    margin-top: 10px;

    li span {
      background: none;
      height: auto;
      font-family: inherit;
      font-size: inherit;
    }

    .icon:after {
      padding-top: 0;
    }
  }
}

.night {
  display: flex;
  align-items: flex-start;
  justify-content: center;

  >*:first-child {
    margin-right: 2vh;
  }

  >* {
    flex-grow: 0;
    flex-wrap: nowrap;
    flex-direction: column;
  }

  .headline {
    display: block;
    font-weight: bold;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    padding: 5px 10px;
    border-radius: 0;
    text-align: center;
  }

  .name {
    flex-grow: 1;
  }

  .first {
    .name {
      border-left: 0;
    }
  }

  .other {
    li .name {
      text-align: left;
      border-right: 0;
    }
  }
}

/** hide players when town square is set to "public" **/
#townsquare.public~.night-reference .modal .player {
  display: none;
}
</style>
