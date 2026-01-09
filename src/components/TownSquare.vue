<template>
  <div id="townsquare" class="square" :class="{
    public: userPreferences.hideGrim,
    spectator: session.isPlayerOrSpectator,
    vote: votingStore.nomination,
  }">
    <ul class="circle" :class="['size-' + players.length]">
      <Seat v-for="(player, index) in players" :key="index" :player="player" :class="{
        from: Math.max(swap, move, nominate) === index,
        swap: swap > -1,
        move: move > -1,
        nominate: nominate > -1,
      }" @trigger="handleTrigger(index, $event)" />
    </ul>
    <Bluffs @open-role-modal="openRoleModal" />
    <PlayerChat />
    <SideMenu />
    <Npcs />
    <ReminderModal :player-index="selectedPlayer" />
    <RoleModal :player-index="selectedPlayer" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Bluffs, Npcs, PlayerChat, ReminderModal, RoleModal, Seat, SideMenu } from '@/components';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  usePlayersMenuStore,
  useSessionStore,
  useUserPreferencesStore,
  useVotingStore,
} from "@/stores";
import type { Player } from "@/types";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;
const playersStore = usePlayersStore();
const playersMenuStore = usePlayersMenuStore();
const session = useSessionStore();
const userPreferences = useUserPreferencesStore();
const votingStore = useVotingStore();

const players = computed(() => playersStore.players);

const firstMessage = computed(() => t('modal.nightOrder.firstNight'));// eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars
const otherMessage = computed(() => t('modal.nightOrder.otherNights'));// eslint-disable-line @typescript-eslint/no-unused-vars, no-unused-vars

const move = ref(-1);
const nominate = ref(-1);
const selectedPlayer = ref(0);
const swap = ref(-1);

const handleTrigger = (playerIndex: number, event: string | [string] | [string, unknown]) => {
  const [method, params] = Array.isArray(event) ? [event[0], event[1]] : [event, undefined];
  const methodMap: Record<string, Function> = {
    claimSeat,
    openReminderModal,
    openRoleModal,
    removePlayer,
    swapPlayer,
    movePlayer,
    nominatePlayer,
  };

  if (typeof methodMap[method] === "function") {
    methodMap[method](playerIndex, params);
  }
};

const claimSeat = (playerIndex: number) => {
  const player = players.value[playerIndex];
  if (player && session.playerId === player.id) {
    session.claimSeat(-1);
  } else {
    session.claimSeat(playerIndex);
  }
};

const openReminderModal = (playerIndex: number) => {
  selectedPlayer.value = playerIndex;
  grimoire.toggleModal("reminder");
};

const openRoleModal = (playerIndex: number) => {
  const player = players.value[playerIndex];
  if (session.isPlayerOrSpectator && player && player.role.team === "traveler") return;
  selectedPlayer.value = playerIndex;
  grimoire.toggleModal("role");
};

const cancel = () => {
  move.value = -1;
  swap.value = -1;
  nominate.value = -1;
};

const removePlayer = (playerIndex: number) => {
  if (session.isPlayerOrSpectator || votingStore.lockedVote) return;
  if (!playersMenuStore.removePlayer) return;

  const player = players.value[playerIndex];
  if (!player || !confirm(`Do you really want to remove ${player.name}?`)) return;

  const nomination = votingStore.nomination;
  if (nomination) {
    const nominator = Number(nomination.nominator);
    const nominee = Number(nomination.nominee);
    if (nominator === playerIndex || nominee === playerIndex) {
      // abort vote if removed player is either nominator or nominee
      votingStore.setNomination(null);
    } else if (
      nominator > playerIndex ||
      nominee > playerIndex
    ) {
      // update nomination array if removed player has lower index
      votingStore.setNomination({
        nominator: nominator > playerIndex ? nominator - 1 : nominator,
        nominee: nominee > playerIndex ? nominee - 1 : nominee,
      });
    }
  }
  playersStore.remove(playerIndex);
};

const swapPlayer = (from: number, to?: Player) => {
  if (session.isPlayerOrSpectator || votingStore.lockedVote) return;
  if (!playersMenuStore.swapPlayers) return;

  if (to === undefined) {
    cancel();
    swap.value = from;
  } else {
    const swapTo = players.value.indexOf(to);
    updateNominationForSwap(swap.value, swapTo);
    playersStore.swap([swap.value, swapTo]);
    cancel();
  }
};

const updateNominationForSwap = (swapFrom: number, swapTo: number) => {
  const currentNomination = votingStore.nomination;
  if (!currentNomination) return;

  let newNominator = Number(currentNomination.nominator);
  let newNominee = Number(currentNomination.nominee);

  if (newNominator === swapFrom) newNominator = swapTo;
  else if (newNominator === swapTo) newNominator = swapFrom;

  if (newNominee === swapFrom) newNominee = swapTo;
  else if (newNominee === swapTo) newNominee = swapFrom;

  if (
    Number(currentNomination.nominator) !== newNominator ||
    Number(currentNomination.nominee) !== newNominee
  ) {
    votingStore.setNomination({
      nominator: newNominator,
      nominee: newNominee
    });
  }
};

const movePlayer = (from: number, to?: Player) => {
  if (session.isPlayerOrSpectator || votingStore.lockedVote) return;
  if (!playersMenuStore.movePlayer) return;

  if (to === undefined) {
    cancel();
    move.value = from;
  } else {
    if (votingStore.nomination) {
      // update nomination if it is affected by the move
      const moveTo = players.value.indexOf(to);
      const currentNomination = votingStore.nomination;

      const mapIndex = (idx: number) => {
        if (idx === move.value) return moveTo;
        if (idx > move.value && idx <= moveTo) return idx - 1;
        if (idx < move.value && idx >= moveTo) return idx + 1;
        return idx;
      };

      const newNominator = mapIndex(Number(currentNomination.nominator));
      const newNominee = mapIndex(Number(currentNomination.nominee));

      if (
        Number(currentNomination.nominator) !== newNominator ||
        Number(currentNomination.nominee) !== newNominee
      ) {
        votingStore.setNomination({
          nominator: newNominator,
          nominee: newNominee
        });
      }
    }
    playersStore.move([
      move.value,
      players.value.indexOf(to),
    ]);
    cancel();
  }
};

const nominatePlayer = (from: number, to?: Player) => {
  if (session.isPlayerOrSpectator || votingStore.lockedVote) return;
  if (to === undefined) {
    cancel();
    if (from !== nominate.value) {
      nominate.value = from;
    }
  } else {
    votingStore.setNomination({
      nominator: nominate.value,
      nominee: players.value.indexOf(to)
    });
    cancel();
  }
};
</script>

<style lang="scss">
@use "sass:math";
@use "../vars.scss" as *;

#townsquare {
  width: 100vw;
  height: 100%;
  padding: 20px;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
}

.circle {
  padding: 0;
  width: 95vmin;
  height: 95vmin;
  list-style: none;
  margin: 0;

  >li {
    position: absolute;
    left: 50%;
    height: 50vmin;
    max-height: 50%;
    transform-origin: 0 100%;
    pointer-events: none;

    &:hover {
      z-index: 25 !important;
    }

    >.player {
      margin-left: -50%;
      width: 100%;
      pointer-events: all;
    }

    >.reminder {
      margin-left: -25%;
      width: 50%;
      pointer-events: all;
    }
  }
}

@mixin on-circle($item-count) {
  $angle: math.div(360, $item-count);
  $rot: 0;

  // rotation and tooltip placement
  @for $i from 1 through $item-count {
    &:nth-child(#{$i}) {
      transform: rotate($rot * 1deg);

      $quarter: math.div($item-count, 4);
      $position: $i - 1;

      .player>.menu {
        left: -50%;
        right: -50%;
      }

      @if ($position < $quarter) {
        .player>.menu {
          top: calc(100% + 0.25em);
          bottom: auto;
          right: auto;
          left: -20%;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(-90deg);
        }
      }

      @else if ($position <=$quarter * 2) {
        .player>.menu {
          transform-origin: center bottom;
          bottom: 1.52em;
          top: auto;
          right: auto;
          left: -20%;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(90deg);
        }
      }

      @else if ($position <=$quarter * 3) {
        .player>.menu {
          transform-origin: center bottom;
          bottom: 1.52em;
          top: auto;
          right: -10%;
          left: auto;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(90deg);
        }
      }

      @else {
        .player>.menu {
          transform-origin: center top;
          top: calc(100% + 0.25em);
          bottom: auto;
          right: -10%;
          left: auto;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(-90deg);
        }
      }

      @if ($position ==0) {
        .player>ul.menu {
          top: calc(100% + 0.25em);
          bottom: auto;
          left: -50%;
          right: -40%;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(-90deg);
        }
      }

      @else if ($position ==$quarter*2) {
        .player>.menu {
          transform-origin: center bottom;
          bottom: 1.52em;
          top: auto;
          right: -40%;
          left: -50%;
        }

        .fold-enter-from,
        .fold-leave-to {
          transform: perspective(200px) rotateX(90deg);
        }
      }

      >* {
        transform: rotate($rot * -1deg);
      }

      // animation cascade
      .life,
      .token,
      .shroud,
      .night-order,
      .seat {
        animation-delay: ($i - 1) * 50ms;
        transition-delay: ($i - 1) * 50ms;
      }

      // move reminders closer to the sides of the circle
      $q: math.div($item-count, 4);
      $x: $i - 1;

      @if $x < $q or ($x >=math.div($item-count, 2) and $x < $q * 3) {
        .player {
          margin-bottom: -10% + 20% * (1 - math.div($x % $q, $q));
        }
      }

      @else {
        .player {
          margin-bottom: -10% + 20% * math.div($x % $q, $q);
        }
      }
    }

    $rot: $rot + $angle;
  }
}

@for $i from 1 through 20 {
  .circle.size-#{$i}>li {
    @include on-circle($item-count: $i);
  }
}

/***** Demon bluffs / Fabled *******/
#townsquare>.bluffs,
#townsquare>.fabled {
  position: absolute;
  left: 10px;

  &.bluffs {
    bottom: 10px;
  }

  &.fabled {
    top: 10px;
  }

  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  transform-origin: bottom left;
  transform: scale(1);
  opacity: 1;
  transition: all 250ms ease-in-out;
  z-index: 50;

  >svg {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;

    &:hover {
      color: red;
    }
  }

  h3 {
    margin: 5px 1vh 0;
    display: flex;
    align-items: center;
    align-content: center;
    justify-content: center;

    span {
      flex-grow: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    svg {
      cursor: pointer;
      flex-grow: 0;

      &.fa-times-circle {
        margin-left: 1vh;
      }

      &.fa-plus-circle {
        margin-left: 1vh;
        display: none;
      }

      &:hover path {
        fill: url(#demon);
        stroke-width: 30px;
        stroke: white;
      }
    }
  }

  ul {
    display: flex;
    align-items: center;
    justify-content: center;

    li {
      width: 14vmin;
      height: 14vmin;
      margin: 0 0.5%;
      display: inline-block;
      transition: all 250ms;
    }
  }

  .button-group {
    transition: all 250ms;

    input {
      background: none;
      border: none;
      color: white;
      font-size: 1.1em;
    }
  }

  &.closed {
    svg.fa-times-circle {
      display: none;
    }

    svg.fa-plus-circle {
      display: block;
    }

    ul li {
      scale: 0;
      width: 0;
      height: 0;

      .night-order {
        opacity: 0;
      }

      .token {
        border-width: 0;
      }
    }

    .button-group,
    .button-group * {
      width: 0px;
      height: 0px;
      scale: 0;
    }
  }
}

#townsquare.public>.bluffs {
  opacity: 0;
  transform: scale(0.1);
}

.fabled ul li .token:before {
  content: " ";
  opacity: 0;
  transition: opacity 250ms;
  background-image: url("../assets/icons/x.png");
  z-index: 2;
}

.fabled {
  --color: #D4AF37;
  --blend: hard-light;
}

.loric {
  --color: #267933;
  --blend: multiply;
}

/**** Night reminders ****/
.night-order {
  position: absolute;
  width: 100%;
  cursor: pointer;
  opacity: 1;
  transition: opacity 200ms;
  display: flex;
  top: 0;
  align-items: center;
  pointer-events: none;

  &:after {
    content: " ";
    display: block;
    padding-top: 100%;
  }

  #townsquare.public & {
    opacity: 0;
    pointer-events: none;
  }

  &:hover~.token .ability {
    opacity: 0;
  }

  span {
    display: flex;
    position: absolute;
    padding: 5px 10px 5px 30px;
    width: 350px;
    z-index: 25;
    font-size: 70%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
    text-align: left;
    align-items: center;
    opacity: 0;
    transition: opacity 200ms ease-in-out;

    &:before {
      transform: rotate(-90deg);
      transform-origin: center top;
      left: -98px;
      top: 50%;
      font-size: 100%;
      position: absolute;
      font-weight: bold;
      text-align: center;
      width: 200px;
    }

    &:after {
      content: " ";
      border: 10px solid transparent;
      width: 0;
      height: 0;
      position: absolute;
    }
  }

  &.first span {
    right: 120%;
    background: linear-gradient(to right,
        var(--townsfolk) 0%,
        rgba(0, 0, 0, 0.5) 20%);

    &:before {
      content: v-bind(firstMessage);
    }

    &:after {
      border-left-color: var(--townsfolk);
      margin-left: 3px;
      left: 100%;
    }
  }

  &.other span {
    left: 120%;
    background: linear-gradient(to right, var(--demon) 0%, rgba(0, 0, 0, 0.5) 20%);

    &:before {
      content: v-bind(otherMessage);
    }

    &:after {
      right: 100%;
      margin-right: 3px;
      border-right-color: var(--demon);
    }
  }

  em {
    font-style: normal;
    position: absolute;
    width: 1.5em;
    height: 1.5em;
    max-width: 40px;
    max-height: 40px;
    border-radius: 50%;
    border: 3px solid black;
    filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.5));
    font-weight: bold;
    opacity: 1;
    pointer-events: all;
    transition: opacity 200ms;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3;
  }

  &.first em {
    left: -10%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, var(--townsfolk) 100%);
  }

  &.other em {
    right: -10%;
    background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, var(--demon) 100%);
  }

  em:hover+span {
    opacity: 1;
  }

  // adjustment for fabled
  .fabled &.first {
    span {
      right: auto;
      left: 40px;

      &:after {
        left: auto;
        right: 100%;
        margin-left: 0;
        margin-right: 3px;
        border-left-color: transparent;
        border-right-color: var(--townsfolk);
      }
    }
  }
}

#townsquare:not(.spectator) .fabled ul li:hover .token:before {
  opacity: 1;
}
</style>
