<template>
  <ul :class="nightType">
    <li class="headline">
      {{ nightType === 'firstNight' ? t('modal.nightOrder.firstNight') : t('modal.nightOrder.otherNights') }}
    </li>
    <li v-for="role in roles" :key="role.id" :class="[role.team]">
      <span v-if="nightType === 'firstNight' && role.id && role.id != 'empty'" class="icon" :class="role.team">
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
      <span v-if="nightType === 'otherNight' && role.id && role.id != 'empty'" class="icon" :class="role.team">
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
import { useStore } from "vuex";
import { useTranslation } from '@/composables';
import { RoleIcon } from '@/components';
import type { NightOrderRole, Role, Player } from "@/types";

interface Props {
  nightType: 'firstNight' | 'otherNight';
}

const props = defineProps<Props>();
const { t } = useTranslation();
const store = useStore();

const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);
const fabled = computed(() => store.state.players.fabled);
const rolesStore = computed(() => store.state.roles);

const roles = computed(() => {
  // Get night order from data.json
  const nightOrder = props.nightType === 'firstNight'
    ? store.state.nightOrder.firstNight
    : store.state.nightOrder.otherNight;

  const nightRoles: NightOrderRole[] = [];

  // Process roles in night order from data.json
  nightOrder.forEach((roleId: string) => {
    // Handle special markers
    if (roleId === 'dusk') {
      nightRoles.push({
        id: "dusk",
        name: t('modal.nightOrder.dusk'),
        team: "default",
        players: [],
        firstNightReminder: props.nightType === 'firstNight' ? t('modal.nightOrder.duskDescription1') : '',
        otherNightReminder: props.nightType === 'otherNight' ? t('modal.nightOrder.duskDescription2') : '',
        image: new URL('@/assets/icons/dusk.png', import.meta.url).href,
      });
      return;
    }

    if (roleId === 'dawn') {
      nightRoles.push({
        id: "dawn",
        name: t('modal.nightOrder.dawn'),
        team: "default",
        players: [],
        firstNightReminder: props.nightType === 'firstNight' ? t('modal.nightOrder.dawnDescription1') : '',
        otherNightReminder: props.nightType === 'otherNight' ? t('modal.nightOrder.dawnDescription2') : '',
        image: new URL('@/assets/icons/dawn.png', import.meta.url).href,
      });
      return;
    }

    // Handle special info roles for first night
    if (roleId === 'minioninfo') {
      if (props.nightType === 'firstNight') {
        nightRoles.push({
          id: "minion",
          name: t('modal.nightOrder.minionInfo'),
          team: "minion",
          players: players.value.filter((p: Player) => p.role.team === "minion"),
          firstNightReminder: t('modal.nightOrder.minionInfoDescription'),
          otherNightReminder: '',
          image: new URL('@/assets/icons/minion.png', import.meta.url).href,
        });
      }
      return;
    }

    if (roleId === 'demoninfo') {
      if (props.nightType === 'firstNight') {
        nightRoles.push({
          id: "demon",
          name: t('modal.nightOrder.demonInfo'),
          team: "demon",
          players: players.value.filter((p: Player) => p.role.team === "demon"),
          firstNightReminder: t('modal.nightOrder.demonInfoDescription'),
          otherNightReminder: '',
          image: new URL('@/assets/icons/demon.png', import.meta.url).href,
        });
      }
      return;
    }

    // Find the role in our stores
    const role = rolesStore.value.get(roleId) || fabled.value.find((f: Role) => f.id === roleId);
    if (role) {
      const roleWithPlayers: NightOrderRole = {
        ...role,
        players: players.value.filter((p: Player) => p.role.id === role.id)
      };
      nightRoles.push(roleWithPlayers);
    }
  });

  // Roles are already in the correct order from data.json
  return nightRoles;
});
</script>

<style scoped lang="scss">
@use "../vars.scss" as *;

.fabled {
  .name {
    background: linear-gradient(90deg, $fabled, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $fabled, transparent 35%);
    }
  }
}

.townsfolk {
  --blend: normal;
  --color: #1f65ff;

  .name {
    background: linear-gradient(90deg, $townsfolk, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $townsfolk, transparent 35%);
    }
  }
}

.outsider {
  --blend: normal;
  --color: #46d5ff;

  .name {
    background: linear-gradient(90deg, $outsider, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $outsider, transparent 35%);
    }
  }
}

.minion {
  --blend: normal;
  --color: #ff6900;

  .name {
    background: linear-gradient(90deg, $minion, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $minion, transparent 35%);
    }
  }
}

.demon {
  --blend: normal;
  --color: #ce0100;

  .name {
    background: linear-gradient(90deg, $demon, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $demon, transparent 35%);
    }
  }
}

.traveler {
  .name {
    background: linear-gradient(90deg, $traveler, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $traveler, transparent 35%);
    }
  }
}

.default {
  .name {
    background: linear-gradient(90deg, $default, transparent 35%);

    .other & {
      background: linear-gradient(-90deg, $default, transparent 35%);
    }
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

/** hide players when town square is set to "public" **/
#townsquare.public~* .player {
  display: none;
}
</style>
