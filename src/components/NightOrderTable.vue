<template>
  <ul :class="nightType">
    <li class="headline">
      {{ nightType === 'firstNight' ? t('modal.nightOrder.firstNight') : t('modal.nightOrder.otherNights') }}
    </li>
    <li v-for="role in roles" :key="role.id" :class="[role.team]">
      <span v-if="nightType === 'otherNight' && role.id && role.id != 'empty'" class="icon" :class="role.team">
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
          !session.isPlayerOrSpectator &&
          players.length &&
          players[0]?.role?.id
        " class="player">
          <br>
          <small />
        </span>
      </span>
      <span v-if="nightType === 'firstNight' && role.id && role.id != 'empty'" class="icon" :class="role.team">
        <RoleIcon :role="role" />
      </span>
      <span v-if="nightType === 'firstNight' && role.firstNightReminder" class="reminder">
        {{ role.firstNightReminder }}
      </span>
      <span v-if="nightType === 'otherNight' && role.otherNightReminder" class="reminder">
        {{ role.otherNightReminder }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { RoleIcon } from '@/components';
import type { NightOrderRole, Player, Role } from "@/types";
import { useGrimoireStore, useLocaleStore, usePlayersStore, useSessionStore } from "@/stores";

interface Props {
  nightType: 'firstNight' | 'otherNight';
}

const props = defineProps<Props>();

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;
const playersStore = usePlayersStore();
const session = useSessionStore();

const edition = computed(() => grimoire.edition);
const fabled = computed(() => playersStore.fabled);
const players = computed(() => playersStore.players);

const roles = computed(() => {
  function nightIndex(role: Role, officialEdition: boolean): number {
    if (props.nightType === 'firstNight') {
      if (officialEdition && role.firstNightEdition) {
        return role.firstNightEdition;
      }
      return role.firstNight || 0;
    } else {
      if (officialEdition && role.otherNightEdition) {
        return role.otherNightEdition;
      }
      return role.otherNight || 0;
    }
  }

  const nightRoles: NightOrderRole[] = [];

  // Add dusk and dawn markers
  if (props.nightType === 'firstNight') {
    nightRoles.push(
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
      }
    );
  } else {
    nightRoles.push(
      {
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
      }
    );
  }

  // Add fabled characters
  let toymaker = false;
  fabled.value.forEach((fabledRole: Role) => {
    if (props.nightType === 'firstNight' && fabledRole.firstNight) {
      nightRoles.push({ players: [], ...fabledRole });
    } else if (props.nightType === 'otherNight' && fabledRole.otherNight) {
      nightRoles.push({ players: [], ...fabledRole });
    } else if (fabledRole.id === "toymaker") {
      toymaker = true;
    }
  });

  // Add regular roles (non-travelers)
  grimoire.roles.forEach((role: Role) => {
    const hasNightAction = props.nightType === 'firstNight' ? role.firstNight : role.otherNight;
    if (hasNightAction && role.team !== "traveler") {
      const roleWithPlayers: NightOrderRole = {
        ...role,
        players: players.value.filter((p: Player) => p.role.id === role.id)
      };
      nightRoles.push(roleWithPlayers);
    }
  });

  // Add travelers (duplicates only once)
  const seenTravelers: string[] = [];
  let nbTravelers = 0;
  players.value.forEach((player: Player) => {
    if (player.role.team === "traveler") {
      nbTravelers++;
      const hasNightAction = props.nightType === 'firstNight' ? player.role.firstNight : player.role.otherNight;
      if (hasNightAction && !seenTravelers.includes(player.role.id)) {
        seenTravelers.push(player.role.id);
        const activePlayers = players.value.filter((p: Player) => p.role.id === player.role.id);
        nightRoles.push({ players: activePlayers, ...player.role });
      }
    }
  });

  // Add Minions/Demon info (first night only)
  if (props.nightType === 'firstNight' && (players.value.length - nbTravelers > 6 || toymaker)) {
    nightRoles.push(
      {
        id: "minion",
        name: t('modal.nightOrder.minionInfo'),
        firstNight: 13,
        team: "minion",
        players: players.value.filter((p: Player) => p.role.team === "minion"),
        firstNightReminder: t('modal.nightOrder.minionInfoDescription'),
        image: new URL('@/assets/icons/minion.png', import.meta.url).href,
      },
      {
        id: "demon",
        name: t('modal.nightOrder.demonInfo'),
        firstNight: 19,
        team: "demon",
        players: players.value.filter((p: Player) => p.role.team === "demon"),
        firstNightReminder: t('modal.nightOrder.demonInfoDescription'),
        image: new URL('@/assets/icons/demon.png', import.meta.url).href,
      }
    );
  }

  // Sort by night order
  nightRoles.sort((a: NightOrderRole, b: NightOrderRole) =>
    nightIndex(a, !!edition.value?.isOfficial) - nightIndex(b, !!edition.value?.isOfficial)
  );

  return nightRoles;
});
</script>

<style scoped lang="scss">
@use "../vars.scss" as *;

.fabled {
  --blend: normal;
  --color: var(--fabled);
}

.loric {
  --blend: normal;
  --color: #4fda66;
}

.townsfolk {
  --blend: normal;
  --color: var(--townsfolk);
}

.outsider {
  --blend: normal;
  --color: var(--outsider);
}

.minion {
  --blend: normal;
  --color: var(--minion);
}

.demon {
  --blend: normal;
  --color: var(--demon);
}

.traveler {
  --color: #cc04ff;
}

.default {
  --color: var(--default);
}

.name {
  background: linear-gradient(90deg, var(--color), transparent 55%);

  .otherNight & {
    background: linear-gradient(-90deg, var(--color), transparent 55%);
    text-align: left;
  }
}

ul {
  min-width: 25ch;
  margin-right: 10px;
  scrollbar-gutter: stable both-edges;

  li {
    display: flex;
    width: 100%;
    margin-bottom: 3px;
    filter: unset;

    .icon {
      max-width: 4vmin;
      max-height: 4vmin;
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
      flex-grow: 1;
      flex-shrink: 0;
      text-align: right;
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
      right: 30vw;
      bottom: 10%;
      width: 40vw;
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

  .headline {
    display: block;
    font-weight: bold;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    padding: 5px 10px;
    border-radius: 0;
    text-align: center;
  }
}

/** hide players when town square is set to "public" **/
#townsquare.public~* .player,
#townsquare.public .player {
  display: none;
}
</style>
