<template>
  <Modal v-if="modals.nightOrder && roles.size" class="night-reference" @close="toggleModal('nightOrder')">
    <font-awesome-icon icon="address-card" class="fa fa-address-card toggle" :title="t('modal.nightOrder.reference')"
      @click="toggleModal('reference')" />
    <h3>
      {{ t('modal.nightOrder.title') }}
      <font-awesome-icon icon="cloud-moon" class="fa fa-cloud-moon" />
      {{ edition.name || t('modal.nightOrder.custom') }}
    </h3>
    <div class="night">
      <ul class="first">
        <li class="headline">
          {{ t('modal.nightOrder.firstNight') }}
        </li>
        <li v-for="role in rolesFirstNight" :key="role.id" :class="[role.team]">
          <span class="name">
            {{ role.name }}
            <span v-if="role.players.length" class="player">
              <br>
              <small v-for="(player, index) in role.players" :key="index" :class="{ dead: player.isDead }">
                {{ player.name + (role.players.length > index + 1 ? "," : "") }}
              </small>
            </span>
            <span v-if="
              (role.team == 'default' || role.team == 'fabled') &&
              !session.isSpectator &&
              players.length &&
              players[0].role.id
            " class="player">
              <br>
              <small />
            </span>
          </span>
          <span v-if="role.id && role.id != 'empty'" class="icon" :class="role.team">
            <RoleIcon :role="role" />
          </span>
          <span v-if="role.firstNightReminder" class="reminder">
            {{ role.firstNightReminder }}
          </span>
        </li>
      </ul>
      <ul class="other">
        <li class="headline">
          {{ t('modal.nightOrder.otherNights') }}
        </li>
        <li v-for="role in rolesOtherNight" :key="role.id" :class="[role.team]">
          <span v-if="role.id && role.id != 'empty'" class="icon" :class="role.team">
            <RoleIcon :role="role" />
          </span>
          <span class="name">
            {{ role.name }}
            <span v-if="role.players.length" class="player">
              <br>
              <small v-for="(player, index) in role.players" :key="index" :class="{ dead: player.isDead }">
                {{ player.name + (role.players.length > index + 1 ? "," : "") }}
              </small>
            </span>
            <span v-if="
              (role.team == 'default' || role.team == 'fabled') &&
              !session.isSpectator &&
              players.length &&
              players[0].role.id
            " class="player">
              <br>
              <small />
            </span>
          </span>
          <span v-if="role.otherNightReminder" class="reminder">
            {{ role.otherNightReminder }}
          </span>
        </li>
      </ul>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import type { NightOrderRole, Role, Player } from "@/types";
import { computed } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";
import { useTranslation } from '@/composables';
import RoleIcon from "../RoleIcon.vue";

const { t } = useTranslation();
const store = useStore();

const rolesFirstNight = computed(() => {

  function nightIndex(role: Role, officialEdition: boolean): number {
    if (officialEdition && role.firstNightEdition) {
      return role.firstNightEdition;
    }
    return role.firstNight || 0;
  }

  const rolesFirstNight: NightOrderRole[] = [
    {
      id: "dusk",
      name: t('modal.nightOrder.dusk'),
      team: "default",
      firstNight: 2,
      players: [],
      firstNightReminder: t('modal.nightOrder.duskDescription1'),
      image: new URL('@/assets/icons/dusk.png', import.meta.url).href,
    },
    {
      id: "dawn",
      name: t('modal.nightOrder.dawn'),
      firstNight: 1000,
      team: "default",
      players: [],
      firstNightReminder: t('modal.nightOrder.dawnDescription1'),
      image: new URL('@/assets/icons/dawn.png', import.meta.url).href,
    },
  ];
  let toymaker = false;
  // Adding Fabled characters
  fabled.value.forEach((fabled: Role) => {
    if (fabled.firstNight) {
      rolesFirstNight.push({ players: [], ...fabled });
    } else if (fabled.id == "toymaker") {
      toymaker = true;
    }
  });
  roles.value.forEach((role: Role) => {
    if (role.firstNight && (role.team !== "traveler")) {
      const roleWithPlayers: NightOrderRole = {
        ...role,
        players: players.value.filter((p: Player) => p.role.id === role.id)
      };
      rolesFirstNight.push(roleWithPlayers);
    }
  });
  // Adding travelers (duplicates only once)
  const seentravelers: string[] = [];
  let nbtravelers = 0;
  players.value.forEach((player: Player) => {
    if (player.role.team == "traveler") {
      nbtravelers++;
      if (!seentravelers.includes(player.role.id)) {
        seentravelers.push(player.role.id);
        if (player.role.firstNight) {
          const activePlayers = players.value.filter(
            (p: Player) => p.role.id === player.role.id,
          );
          rolesFirstNight.push({ players: activePlayers, ...player.role });
        }
      }
    }
  });
  // Adding Minions/Demon info
  if (players.value.length - nbtravelers > 6 || toymaker) {
    rolesFirstNight.push(
      {
        id: "minion",
        name: t('modal.nightOrder.minionInfo'),
        firstNight: 12,
        team: "minion",
        players: players.value.filter((p: Player) => p.role.team === "minion"),
        firstNightReminder:
          t('modal.nightOrder.minionInfoDescription'),
        image: new URL('@/assets/icons/minion.png', import.meta.url).href,
      },
      {
        id: "demon",
        name: t('modal.nightOrder.demonInfo'),
        firstNight: 18,
        team: "demon",
        players: players.value.filter((p: Player) => p.role.team === "demon"),
        firstNightReminder:
          t('modal.nightOrder.demonInfoDescription'),
        image: new URL('@/assets/icons/demon.png', import.meta.url).href,
      },
    );
  }
  rolesFirstNight.sort((a: NightOrderRole, b: NightOrderRole) => nightIndex(a, edition.value.isOfficial) - nightIndex(b, edition.value.isOfficial));
  return rolesFirstNight;
});

const rolesOtherNight = computed(() => {

  function nightIndex(role: Role, officialEdition: boolean): number {
    if (officialEdition && role.otherNightEdition) {
      return role.otherNightEdition;
    }
    return role.otherNight || 0;
  }

  const rolesOtherNight: NightOrderRole[] = [{
    id: "dusk",
    name: t('modal.nightOrder.dusk'),
    team: "default",
    otherNight: 2,
    players: [],
    otherNightReminder: t('modal.nightOrder.duskDescription2'),
    image: new URL('@/assets/icons/dusk.png', import.meta.url).href,
  },
  {
    id: "dawn",
    name: t('modal.nightOrder.dawn'),
    team: "default",
    otherNight: 1000,
    players: [],
    otherNightReminder: t('modal.nightOrder.dawnDescription2'),
    image: new URL('@/assets/icons/dawn.png', import.meta.url).href,
  },
  ];
  fabled.value.filter(({ otherNight }: Role) => otherNight)
    .forEach((fabled: Role) => {
      rolesOtherNight.push({ players: [], ...fabled });
    });
  roles.value.forEach((role: Role) => {
    if (role.otherNight && role.team !== "traveler") {
      const roleWithPlayers: NightOrderRole = {
        ...role,
        players: players.value.filter((p: Player) => p.role.id === role.id)
      };
      rolesOtherNight.push(roleWithPlayers);
    }
  });
  // Adding travelers (duplicates only once)
  const seentravelers: string[] = [];
  players.value.forEach((player: Player) => {
    if (
      player.role.otherNight &&
      player.role.team == "traveler" &&
      !seentravelers.includes(player.role.id)
    ) {
      const activePlayers = players.value.filter(
        (p: Player) => p.role.id === player.role.id,
      );
      seentravelers.push(player.role.id);
      rolesOtherNight.push({ players: activePlayers, ...player.role });
    }
  });
  rolesOtherNight.sort((a: NightOrderRole, b: NightOrderRole) => nightIndex(a, edition.value.isOfficial) - nightIndex(b, edition.value.isOfficial));
  return rolesOtherNight;
});

const edition = computed(() => store.state.edition);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);
const fabled = computed(() => store.state.players.fabled);
const modals = computed(() => store.state.modals);
const roles = computed(() => store.state.roles);

const toggleModal = (modal: string) => {
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
      max-width: 5vh;
      max-height: 5vh;
      background-size: 100% auto;
      background-position: center center;
      background-repeat: no-repeat;
      flex-grow: 0;
      flex-shrink: 0;
      text-align: center;
      margin: 0 2px;

      img,
      svg {
        max-width: 100%;
        max-height: 100%;
      }

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

.icon {
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
}

/** hide players when town square is set to "public" **/
#townsquare.public~.night-reference .modal .player {
  display: none;
}
</style>
