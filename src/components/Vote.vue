<template>
  <div id="vote">
    <div class="arrows">
      <span v-if="nominee" class="nominee" :style="nomineeStyle" />
      <span v-if="nominator" class="nominator" :style="nominatorStyle" />
    </div>
    <div class="overlay">
      <audio preload="auto">
        <source src="../assets/sounds/countdown.mp3">
      </audio>
      <em class="blue">{{ nominatorDisplayName }}</em>
      {{ voteAction }}
      <em v-if="!shouldHideNominee">
        {{ nomineeDisplayName }}
      </em>
      {{ t('vote.exclam') }}
      <br>
      <em v-if="
        !session.isSecretVote ||
        (nominee && nominee.role.team == 'traveler') ||
        !session.isSpectator
      " class="blue">
        {{ voters?.length }} {{ t('vote.votes') }}
      </em>
      <em v-else class="blue"> ? {{ t('vote.votes') }} </em>
      {{ t('vote.inFavor') }}
      <em v-if="
        (nominee && nominee.role.team !== 'traveler') ||
        (session.nomination && typeof session.nomination.nominee === 'string')
      ">
        ({{ t('vote.majorityIs') }} {{ Math.ceil(alive / 2) }})
      </em>
      <em v-else-if="nominee">
        ({{ t('vote.majorityIs') }} {{ Math.ceil(players.length / 2) }})
      </em>

      <template v-if="!session.isSpectator">
        <br>
        <em v-if="
          session.isSecretVote &&
          ((nominee && nominee.role.team !== 'traveler') ||
            (session.nomination && typeof session.nomination.nominee === 'string'))
        " class="orange">
          {{ t('vote.secretBallot') }}
        </em>
        <div v-if="!session.isVoteInProgress && session.lockedVote < 1">
          {{ t('vote.timePerPlayer') }}
          <font-awesome-icon icon="minus-circle" class="fa fa-minus-circle" @mousedown.prevent="setVotingSpeed(-250)" />
          {{ session.votingSpeed / 1000 }}s
          <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @mousedown.prevent="setVotingSpeed(250)" />
        </div>
        <div class="button-group">
          <div v-if="!session.isVoteInProgress" class="button townsfolk" @click="countdown">
            {{ t('vote.countdown') }}
          </div>
          <div v-if="!session.isVoteInProgress" class="button" @click="start">
            {{ session.lockedVote ? t('vote.restart') : t('vote.start') }}
          </div>
          <template v-else>
            <div class="button townsfolk" :class="{ disabled: !session.lockedVote }" @click="pause">
              {{ voteTimer ? t('vote.pause') : t('vote.resume') }}
            </div>
            <div class="button" @click="stop">
              {{ t('vote.reset') }}
            </div>
          </template>
          <div class="button demon" @click="finish">
            {{ t('vote.close') }}
          </div>
        </div>
        <div v-if="
          !shouldHideNominee &&
          (!nominee || nominee.role.team !== 'traveler')
        " class="button-group mark">
          <div class="button" :class="{
            disabled: session.nomination?.nominee === session.markedPlayer,
          }" @click="setMarked">
            {{ t('vote.setMarked') }}
          </div>
          <div class="button" @click="removeMarked">
            {{ t('vote.removeMarked') }}
          </div>
        </div>
      </template>
      <template v-else-if="canVote">
        <div v-if="!session.isVoteInProgress">
          {{ session.votingSpeed / 1000 }} {{ t('vote.secondsBetweenVotes') }}
        </div>
        <div class="button-group">
          <div class="button townsfolk" :class="{ disabled: !currentVote }" @click="vote(false)">
            {{ t('vote.handDown') }}
          </div>
          <div class="button demon" :class="{ disabled: currentVote }" @click="vote(true)">
            {{ t('vote.handUp') }}
          </div>
        </div>
      </template>
      <div v-else-if="!player">
        {{ t('vote.seatToVote') }}
      </div>
      <Countdown v-if="grimoire.timer.duration" :timer-name="grimoire.timer.name"
        :timer-duration="grimoire.timer.duration" />
    </div>
    <div v-if="session.isVoteInProgress && !session.lockedVote" class="countdown">
      <span>3</span>
      <span>2</span>
      <span>1</span>
      <span>{{ t('vote.doVote') }}</span>
      <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
        <source src="../assets/sounds/countdown.mp3">
      </audio>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { useStore } from "vuex";
import { Countdown } from '@/components';
import { useTranslation, isActiveNomination } from '@/composables';
import type { Player } from '@/types';

const store = useStore();
const { t } = useTranslation();

const players = computed(() => store.state.players.players);
const session = computed(() => store.state.session);
const grimoire = computed(() => store.state.grimoire);
const alive = computed(() => store.getters["players/alive"]);

const voteTimer = ref<ReturnType<typeof setInterval> | null>(null);

const nominator = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return null;

  const nominatorRef = session.value.nomination.nominator;
  if (typeof nominatorRef === 'number') {
    return players.value[nominatorRef] || null;
  }
  return null; // For special votes with string/null nominators
});

const nominatorStyle = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return {};

  const playersCount = players.value.length;
  const nominatorRef = session.value.nomination.nominator;

  if (typeof nominatorRef !== 'number') return {};

  if (nominee.value) {
    return {
      transform: `rotate(${Math.round((nominatorRef / playersCount) * 360)}deg)`,
      transitionDuration: session.value.votingSpeed - 100 + "ms",
    };
  } else {
    const lock = session.value.lockedVote;
    const rotation =
      (360 * (nominatorRef + Math.min(lock, playersCount))) / playersCount;
    return {
      transform: `rotate(${Math.round(rotation)}deg)`,
      transitionDuration: session.value.votingSpeed - 100 + "ms",
    };
  }
});

const nominee = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return null;

  const nomineeRef = session.value.nomination.nominee;
  if (typeof nomineeRef === 'number') {
    return players.value[nomineeRef] || null;
  }
  return null; // For special votes with string/null nominees
});

const nomineeStyle = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return {};

  const playersCount = players.value.length;
  const nomineeRef = session.value.nomination.nominee;

  if (typeof nomineeRef !== 'number') return {};

  const lock = session.value.lockedVote;
  const rotation = (360 * (nomineeRef + Math.min(lock, playersCount))) / playersCount;
  return {
    transform: `rotate(${Math.round(rotation)}deg)`,
    transitionDuration: session.value.votingSpeed - 100 + "ms",
  };
});

const isFreeVote = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return false;
  return (
    session.value.nomination.nominee === null
    || nominee.value?.role.team === 'traveler'
  )
});

const player = computed(() => {
  return players.value.find((p: Player) => p.id === session.value.playerId);
});

const currentVote = computed(() => {
  const index = players.value.findIndex((p: Player) => p.id === session.value.playerId);
  return index >= 0 ? !!session.value.votes[index] : undefined;
});

// Type-safe computed properties for nomination handling
const nominatorDisplayName = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return '';

  if (nominator.value) {
    return nominator.value.name;
  }

  const nominatorRef = session.value.nomination.nominator;
  if (typeof nominatorRef === 'string') {
    return nominatorRef.charAt(0).toUpperCase() + nominatorRef.slice(1);
  }

  return '';
});

const nomineeDisplayName = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return '';

  if (nominee.value) {
    return nominee.value.name;
  }

  const nomineeRef = session.value.nomination.nominee;
  if (typeof nomineeRef === 'string') {
    // Capitalize string nominees (like "storyteller")
    return nomineeRef.charAt(0).toUpperCase() + nomineeRef.slice(1);
  }

  return '';
});

const voteAction = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return '';

  const nomination = session.value.nomination;

  // Check if it's a special vote with custom action text
  if (nomination.specialVote?.timerText) {
    return nomination.specialVote.timerText;
  }

  // Check if it's a traveler exile
  if (nominee.value?.role?.team === 'traveler') {
    return t('vote.callexile');
  }

  // Default nomination action
  return t('vote.nominates');
});

const shouldHideNominee = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return false;

  const nomination = session.value.nomination;

  // Hide nominee if it's a special vote with custom timer text (like cultleader, custom)
  // but show nominee for special votes like bishop/atheist that have string nominees
  return !!nomination.specialVote?.timerText;
});

const voudonInPlay = computed(() => {
  for (const player of players.value) {
    if (player.role.id == "voudon") return !player.isDead;
  }
  return false;
});

const canVote = computed(() => {
  if (!player.value || !isActiveNomination(session.value.nomination)) return false;

  const nomination = session.value.nomination;

  if ( // Dead player without a token or voudon
    (player.value.isDead || player.value.role.id == "beggar")
    && !player.value.voteToken
    && !isFreeVote.value
    && !voudonInPlay.value
  ) return false;

  if (
    !player.value.isDead
    && voudonInPlay.value
    && !isFreeVote.value
  ) return false; // Player is alive and a voudon is in play on a classic vote

  const sessionData = session.value;
  const playersCount = players.value.length;
  const index = players.value.indexOf(player.value);

  // Determine reference player index for vote order calculation
  let referenceIndex: number;
  if (nominee.value && typeof nomination.nominee === 'number') {
    referenceIndex = nomination.nominee;
  } else if (typeof nomination.nominator === 'number') {
    referenceIndex = nomination.nominator;
  } else {
    referenceIndex = 0;
  }

  const indexAdjusted =
    (index - 1 + playersCount - referenceIndex) % playersCount;
  return indexAdjusted >= sessionData.lockedVote - 1;
});

const voters = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return [];

  const nomination = session.value.nomination;

  // Determine reference player index for vote ordering
  let referenceIndex: number;
  if (nominee.value && typeof nomination.nominee === 'number') {
    referenceIndex = nomination.nominee;
  } else if (typeof nomination.nominator === 'number') {
    referenceIndex = nomination.nominator;
  } else {
    // For special votes without player indices, use index 0
    referenceIndex = 0;
  }

  const votersList = Array(players.value.length)
    .fill("")
    .map((_, index) =>
      session.value.votes[index] ? players.value[index].name : "",
    );
  const reorder = [
    ...votersList.slice(referenceIndex + 1),
    ...votersList.slice(0, referenceIndex + 1),
  ];
  return (
    session.value.lockedVote
      ? reorder.slice(0, session.value.lockedVote - 1)
      : reorder
  ).filter((n) => !!n);
});

const countdown = () => {
  store.commit("session/lockVote", 0);
  store.commit("session/setVoteInProgress", true);
  voteTimer.value = setInterval(() => {
    start();
  }, 4000);
};

const start = () => {
  store.commit("session/lockVote", 1);
  store.commit("session/setVoteInProgress", true);
  if (voteTimer.value) {
    clearInterval(voteTimer.value);
  }
  voteTimer.value = setInterval(() => {
    store.commit("session/lockVote");
    if (session.value.lockedVote > players.value.length) {
      if (voteTimer.value) {
        clearInterval(voteTimer.value);
      }
      store.commit("session/setVoteInProgress", false);
    }
  }, session.value.votingSpeed);
};

const pause = () => {
  if (voteTimer.value) {
    clearInterval(voteTimer.value);
    voteTimer.value = null;
  } else {
    voteTimer.value = setInterval(() => {
      store.commit("session/lockVote");
      if (session.value.lockedVote > players.value.length) {
        if (voteTimer.value) {
          clearInterval(voteTimer.value);
        }
        store.commit("session/setVoteInProgress", false);
      }
    }, session.value.votingSpeed);
  }
};

const stop = () => {
  if (voteTimer.value) {
    clearInterval(voteTimer.value);
  }
  voteTimer.value = null;
  store.commit("session/setVoteInProgress", false);
  store.commit("session/lockVote", 0);
};

const finish = () => {
  if (voteTimer.value) {
    clearInterval(voteTimer.value);
  }
  store.commit("session/addHistory", {
    players: players.value,
    isOrganVoteMode: session.value.isSecretVote,
    localeTexts: {
      exile: t('modal.voteHistory.exile'),
      execution: t('modal.voteHistory.execution')
    }
  });
  store.commit("session/nomination");
};

const vote = (vote: boolean): boolean => {
  if (!canVote.value) return false;
  const index = players.value.findIndex((p: Player) => p.id === session.value.playerId);
  if (index >= 0 && !!session.value.votes[index] !== vote) {
    store.commit("session/voteSync", [index, vote]);
    return true;
  }
  return false;
};

const setVotingSpeed = (diff: number) => {
  const speed = Math.round(session.value.votingSpeed + diff);
  if (speed >= 0) {
    store.commit("session/setVotingSpeed", speed);
  }
};

const setMarked = () => {
  store.commit("session/setMarkedPlayer", session.value.nomination.nominee);
};

const removeMarked = () => {
  store.commit("session/setMarkedPlayer", -1);
};

onUnmounted(() => {
  if (voteTimer.value) {
    clearInterval(voteTimer.value);
  }
});
</script>

<style lang="scss" scoped>
@use "../vars.scss" as *;

#vote {
  position: absolute;
  margin: auto;
  width: 20vw;
  z-index: 20;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  background: url("../assets/demon-head.png") center center no-repeat;
  background-size: auto 75%;
  text-align: center;
  text-shadow:
    0 1px 2px #000000,
    0 -1px 2px #000000,
    1px 0 2px #000000,
    -1px 0 2px #000000;

  .mark .button {
    font-size: 75%;
    margin: 0;
  }

  &:after {
    content: " ";
    padding-bottom: 100%;
    display: block;
  }

  em {
    color: $demon;
    font-style: normal;
    font-weight: bold;

    &.blue {
      color: $townsfolk;
    }

    &.orange {
      color: $minion;
    }
  }

  svg {
    cursor: pointer;

    &:hover path {
      fill: url(#demon);
      stroke-width: 30px;
      stroke: white;
    }
  }
}

@keyframes arrow-cw {
  0% {
    opacity: 0;
    transform: rotate(-180deg);
  }

  100% {
    opacity: 1;
    transform: rotate(0deg);
  }
}

@keyframes arrow-ccw {
  0% {
    opacity: 0;
    transform: rotate(180deg);
  }

  100% {
    opacity: 1;
    transform: rotate(0deg);
  }
}

.arrows {
  position: absolute;
  display: flex;
  height: 150%;
  width: 25%;
  pointer-events: none;

  span {
    position: absolute;
    width: 100%;
    height: 100%;
    transition: transform 2.9s ease-in-out;
  }

  span:before {
    content: " ";
    width: 100%;
    height: 100%;
    display: block;
    background-size: auto 100%;
    background-repeat: no-repeat;
    background-position: center center;
    position: absolute;
    filter: drop-shadow(0px 0px 3px #000);
  }

  .nominator:before {
    background-image: url("../assets/clock-small.png");
    animation: arrow-ccw 1s ease-out;
  }

  .nominee:before {
    background-image: url("../assets/clock-big.png");
    animation: arrow-cw 1s ease-out;
  }
}

@keyframes countdown {
  0% {
    transform: scale(1.5);
    opacity: 0;
    filter: blur(20px);
  }

  10% {
    opacity: 1;
  }

  50% {
    transform: scale(1);
    filter: blur(0);
  }

  90% {
    color: $townsfolk;
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

@keyframes countdown-go {
  0% {
    transform: scale(1.5);
    opacity: 0;
    filter: blur(20px);
  }

  10% {
    opacity: 1;
  }

  50% {
    transform: scale(1);
    filter: blur(0);
  }

  90% {
    color: $demon;
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.countdown {
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  audio {
    height: 0;
    width: 0;
    visibility: hidden;
  }

  span {
    position: absolute;
    font-size: 8em;
    font-weight: bold;
    opacity: 0;
  }

  span:nth-child(1) {
    animation: countdown 1100ms normal forwards;
  }

  span:nth-child(2) {
    animation: countdown 1100ms normal forwards 1000ms;
  }

  span:nth-child(3) {
    animation: countdown 1100ms normal forwards 2000ms;
  }

  span:nth-child(4) {
    animation: countdown-go 1100ms normal forwards 3000ms;
  }
}
</style>
