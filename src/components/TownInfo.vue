<template>
  <ul class="info">
    <audio preload="auto">
      <source src="../assets/sounds/countdown.mp3">
      <source src="../assets/sounds/rooster.mp3">
    </audio>
    <li class="edition" :class="['edition-' + edition.id]" :style="{
      backgroundImage: 'url(' + logoUrl + ')',
    }" />
    <li v-if="players.length - teams.traveler < 5">
      {{ t('towninfo.addPlayers') }}
    </li>
    <li>
      <span v-if="!edition.isOfficial" class="meta">
        {{ edition.name }}
        {{ edition.author ? " ©" + edition.author : "" }}
      </span>
      <span>
        {{ players.length }} <font-awesome-icon icon="users" class="players fa-users" />
      </span>
      <span>
        {{ teams.alive }}
        <font-awesome-icon icon="heartbeat" class="alive fa-heartbeat" />
      </span>
      <span v-if="teams.traveler > 0">
        {{ teams.aliveNT }}
        <font-awesome-icon icon="house-user" class="alive fa-house-user" />
      </span>
      <span>
        {{ teams.votes }} <font-awesome-icon icon="vote-yea" class="votes fa-vote-yea" />
      </span>
    </li>
    <li v-if="players.length - teams.traveler >= 5">
      <span>
        {{ teams.townsfolk }}
        <font-awesome-icon icon="user-friends" class="townsfolk fa-user-friends" />
      </span>
      <span>
        {{ teams.outsider }}
        <font-awesome-icon class="outsider" :icon="(teams.outsider || 0) > 1 ? 'user-friends' : 'user'" />
      </span>
      <span>
        {{ teams.minion }}
        <font-awesome-icon class="minion" :icon="(teams.minion || 0) > 1 ? 'user-friends' : 'user'" />
      </span>
      <span>
        {{ teams.demon }}
        <font-awesome-icon class="demon" :icon="(teams.demon || 0) > 1 ? 'user-friends' : 'user'" />
      </span>
      <span v-if="teams.traveler">
        {{ teams.traveler }}
        <font-awesome-icon class="traveler" :icon="teams.traveler > 1 ? 'user-friends' : 'user'" />
      </span>
    </li>
    <li v-if="session.gamePhase === 'firstNight' || session.gamePhase === 'otherNight'">
      <font-awesome-icon :icon="['fas', 'cloud-moon']" />
      {{ t('towninfo.nightPhase') }}
    </li>
    <li v-if="grimoire.isRinging">
      <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
        <source src="../assets/sounds/countdown.mp3">
      </audio>
      <font-awesome-icon :icon="['fas', 'music']" />
      <font-awesome-icon :icon="['fas', 'bell']" />
      <font-awesome-icon :icon="['fas', 'music']" />
    </li>
    <li v-else-if="grimoire.isRooster">
      <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
        <source src="../assets/sounds/rooster.mp3">
      </audio>
      <img src="../assets/icons/dawn.png" alt="dawn" style="height: 2em">
    </li>
    <li v-if="markedStoryteller" class="marked">
      <font-awesome-icon icon="skull" class="fa fa-skull" />
    </li>
    <li>
      <Countdown v-if="grimoire.timer.duration" :timer-name="grimoire.timer.name"
        :timer-duration="grimoire.timer.duration" class="timer" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import gameJSON from '@/game.json';
import { Countdown } from '@/components';
import { useTranslation } from '@/composables';
import type { Player } from '@/types';

const { t } = useTranslation();
const store = useStore();

const edition = computed(() => store.state.edition);
const grimoire = computed(() => store.state.grimoire);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);

const markedStoryteller = computed(() => {
  return typeof session.value.markedPlayer == 'string' && !(session.value.isSpectator && session.value.isSecretVote)
});

const logoUrl = computed(() => {
  if (edition.value.logo && !edition.value.logo.includes('.')) {
    return new URL(`../assets/logos/${edition.value.logo}.png`, import.meta.url).href;
  }

  if (edition.value.logo && grimoire.value.isImageOptIn) {
    return edition.value.logo;
  }

  return new URL('../assets/logos/custom.png', import.meta.url).href;
});

const teams = computed(() => {
  const nontravelers = store.getters['players/nontravelers'];
  const alive = players.value.filter((player: Player) => player.isDead !== true).length;
  const aliveNT = players.value.filter(
    (player: Player) => player.isDead !== true && player.role.team !== 'traveler'
  ).length;
  return {
    ...gameJSON[nontravelers - 5],
    traveler: players.value.length - nontravelers,
    alive,
    aliveNT,
    votes: players.value.filter(
      (player: Player) => (!player.isDead && player.role.id !== "beggar") || player.voteToken
    ).length,
  };
});
</script>

<style lang="scss" scoped>
@use "../vars.scss" as *;

.info {
  position: absolute;
  display: flex;
  width: 100vw;
  height: 20vh;

  align-items: center;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  background: url("../assets/demon-head.png") center center no-repeat;
  background-size: auto 100%;

  li {
    font-weight: bold;
    width: 100%;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7));
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    text-shadow:
      0 2px 1px black,
      0 -2px 1px black,
      2px 0 1px black,
      -2px 0 1px black;

    span {
      white-space: nowrap;
    }

    .meta {
      text-align: center;
      flex-basis: 100%;
      font-family: PiratesBay, sans-serif;
      font-weight: normal;
    }

    svg {
      margin-right: 10px;
    }

    .players {
      color: #00f700;
    }

    .alive {
      color: #ff4a50;
    }

    .votes {
      color: #fff;
    }

    .townsfolk {
      color: $townsfolk;
    }

    .outsider {
      color: $outsider;
    }

    .minion {
      color: $minion;
    }

    .demon {
      color: $demon;
    }

    .traveler {
      color: $traveler;
    }
  }

  li.edition {
    width: 220px;
    height: 200px;
    max-width: 100%;
    max-height: 100%;
    background-position: 0 center;
    background-repeat: no-repeat;
    background-size: 100% auto;
    position: absolute;
    top: -50%;
  }
}

.marked {
  opacity: 0.5;
  position: absolute;

  svg {
    height: 80px;
    width: 80px;
    stroke: white;
    stroke-width: 15px;

    path {
      fill: white;
    }
  }
}

.timer {
  width: 40vmin;
}
</style>
