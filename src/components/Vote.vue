<template>
  <div id="vote">
    <div class="arrows">
      <span class="nominee" :style="nomineeStyle" v-if="nominee"></span>
      <span class="nominator" :style="nominatorStyle" v-if="nominator"></span>
    </div>
    <div class="overlay">
      <audio preload="auto">
        <source src="../assets/sounds/countdown.mp3">
      </audio>
      <em class="blue">{{
        nominator
          ? nominator.name
          : session.nomination[0][0].toUpperCase() +
          session.nomination[0].slice(1)
      }}</em>
      {{
        typeof session.nomination[1] == "object"
          ? session.nomination[1][0]
          : nominee && nominee.role.team == "traveler"
            ? locale.vote.callexile
            : locale.vote.nominates
      }}
      <em v-if="typeof session.nomination[1] !== 'object'">{{
        nominee ? nominee.name : session.nomination[1]
      }}</em>{{ locale.vote.exclam }}
      <br />
      <em class="blue" v-if="
        !grimoire.isOrganVoteMode ||
        (nominee && nominee.role.team == 'traveler') ||
        !session.isSpectator
      ">
        {{ voters?.length }} {{ locale.vote.votes }}
      </em>
      <em class="blue" v-else> ? {{ locale.vote.votes }} </em>
      {{ locale.vote.inFavor }}
      <em v-if="
        (nominee && nominee.role.team !== 'traveler') ||
        typeof session.nomination[1] == 'string'
      ">
        ({{ locale.vote.majorityIs }} {{ Math.ceil(alive / 2) }})
      </em>
      <em v-else-if="nominee">
        ({{ locale.vote.majorityIs }} {{ Math.ceil(players.length / 2) }})
      </em>

      <template v-if="!session.isSpectator">
        <br />
        <em class="orange" v-if="
          grimoire.isOrganVoteMode &&
          ((nominee && nominee.role.team !== 'traveler') ||
            typeof session.nomination[1] == 'string')
        ">
          {{ locale.vote.secretBallot }}
        </em>
        <div v-if="!session.isVoteInProgress && session.lockedVote < 1">
          {{ locale.vote.timePerPlayer }}
          <font-awesome-icon @mousedown.prevent="setVotingSpeed(-500)" icon="minus-circle" class="fa fa-minus-circle" />
          {{ session.votingSpeed / 1000 }}s
          <font-awesome-icon @mousedown.prevent="setVotingSpeed(500)" icon="plus-circle" class="fa fa-plus-circle" />
        </div>
        <div class="button-group">
          <div class="button townsfolk" v-if="!session.isVoteInProgress" @click="countdown">
            {{ locale.vote.countdown }}
          </div>
          <div class="button" v-if="!session.isVoteInProgress" @click="start">
            {{ session.lockedVote ? locale.vote.restart : locale.vote.start }}
          </div>
          <template v-else>
            <div class="button townsfolk" :class="{ disabled: !session.lockedVote }" @click="pause">
              {{ voteTimer ? locale.vote.pause : locale.vote.resume }}
            </div>
            <div class="button" @click="stop">{{ locale.vote.reset }}</div>
          </template>
          <div class="button demon" @click="finish">
            {{ locale.vote.close }}
          </div>
        </div>
        <div class="button-group mark" v-if="
          typeof session.nomination[1] !== 'object' &&
          (!nominee || nominee.role.team !== 'traveler')
        ">
          <div class="button" :class="{
            disabled: session.nomination[1] === session.markedPlayer,
          }" @click="setMarked">
            {{ locale.vote.setMarked }}
          </div>
          <div class="button" @click="removeMarked">
            {{ locale.vote.removeMarked }}
          </div>
        </div>
      </template>
      <template v-else-if="canVote">
        <div v-if="!session.isVoteInProgress">
          {{ session.votingSpeed / 1000 }} {{ locale.vote.secondsBetweenVotes }}
        </div>
        <div class="button-group">
          <div class="button townsfolk" @click="vote(false)" :class="{ disabled: !currentVote }">
            {{ locale.vote.handDown }}
          </div>
          <div class="button demon" @click="vote(true)" :class="{ disabled: currentVote }">
            {{ locale.vote.handUp }}
          </div>
        </div>
      </template>
      <div v-else-if="!player">
        {{ locale.vote.seatToVote }}
      </div>
      <Countdown v-if="grimoire.timer.duration" :timerName="grimoire.timer.name"
        :timerDuration="grimoire.timer.duration" />
    </div>
    <div class="countdown" v-if="session.isVoteInProgress && !session.lockedVote">
      <span>3</span>
      <span>2</span>
      <span>1</span>
      <span>{{ locale.vote.doVote }}</span>
      <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
        <source src="../assets/sounds/countdown.mp3">
      </audio>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import Countdown from "./Countdown.vue";

const store = useStore();

const players = computed(() => store.state.players.players);
const session = computed(() => store.state.session);
const grimoire = computed(() => store.state.grimoire);
const locale = computed(() => store.state.locale);
const alive = computed(() => store.getters["players/alive"]);

const voteTimer = ref(null);

const nominator = computed(() => {
  try {
    return players.value[session.value.nomination[0]];
  } catch (error) {
    return null;
  }
});

const nominatorStyle = computed(() => {
  const playersCount = players.value.length;
  const nomination = session.value.nomination[0];
  if (nominee.value) {
    return {
      transform: `rotate(${Math.round((nomination / playersCount) * 360)}deg)`,
      transitionDuration: session.value.votingSpeed - 100 + "ms",
    };
  } else {
    const lock = session.value.lockedVote;
    const rotation =
      (360 * (nomination + Math.min(lock, playersCount))) / playersCount;
    return {
      transform: `rotate(${Math.round(rotation)}deg)`,
      transitionDuration: session.value.votingSpeed - 100 + "ms",
    };
  }
});

const nominee = computed(() => {
  try {
    return players.value[session.value.nomination[1]];
  } catch (error) {
    return null;
  }
});

const nomineeStyle = computed(() => {
  const playersCount = players.value.length;
  const nomination = session.value.nomination[1];
  const lock = session.value.lockedVote;
  const rotation = (360 * (nomination + Math.min(lock, playersCount))) / playersCount;
  return {
    transform: `rotate(${Math.round(rotation)}deg)`,
    transitionDuration: session.value.votingSpeed - 100 + "ms",
  };
});

const player = computed(() => {
  return players.value.find((p) => p.id === session.value.playerId);
});

const currentVote = computed(() => {
  const index = players.value.findIndex((p) => p.id === session.value.playerId);
  return index >= 0 ? !!session.value.votes[index] : undefined;
});

const noVoudon = computed(() => {
  for (let i = 0; i < players.value.length; i++) {
    if (players.value[i].role.id == "voudon")
      return players.value[i].isDead;
  }
  return true;
});

const canVote = computed(() => {
  if (!player.value) return false;
  if (
    player.value.isVoteless &&
    (nominee.value && nominee.value.role.team !== "traveler" ||
      typeof session.value.nomination[1] === "string") &&
    noVoudon.value
  )
    return false;
  const sessionData = session.value;
  const playersCount = players.value.length;
  const index = players.value.indexOf(player.value);
  const indexAdjusted =
    (index -
      1 +
      playersCount -
      (nominee.value ? sessionData.nomination[1] : sessionData.nomination[0])) %
    playersCount;
  return indexAdjusted >= sessionData.lockedVote - 1;
});

const voters = computed(() => {
  const nomination = nominee.value
    ? session.value.nomination[1]
    : session.value.nomination[0];
  const votersList = Array(players.value.length)
    .fill("")
    .map((x, index) =>
      session.value.votes[index] ? players.value[index].name : "",
    );
  const reorder = [
    ...votersList.slice(nomination + 1),
    ...votersList.slice(0, nomination + 1),
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
  clearInterval(voteTimer.value);
  voteTimer.value = setInterval(() => {
    store.commit("session/lockVote");
    if (session.value.lockedVote > players.value.length) {
      clearInterval(voteTimer.value);
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
        clearInterval(voteTimer.value);
        store.commit("session/setVoteInProgress", false);
      }
    }, session.value.votingSpeed);
  }
};

const stop = () => {
  clearInterval(voteTimer.value);
  voteTimer.value = null;
  store.commit("session/setVoteInProgress", false);
  store.commit("session/lockVote", 0);
};

const finish = () => {
  clearInterval(voteTimer.value);
  store.commit("session/addHistory", players.value);
  store.commit("session/nomination");
};

const vote = (vote) => {
  if (!canVote.value) return false;
  const index = players.value.findIndex((p) => p.id === session.value.playerId);
  if (index >= 0 && !!session.value.votes[index] !== vote) {
    store.commit("session/voteSync", [index, vote]);
  }
};

const setVotingSpeed = (diff) => {
  const speed = Math.round(session.value.votingSpeed + diff);
  if (speed > 0) {
    store.commit("session/setVotingSpeed", speed);
  }
};

const setMarked = () => {
  store.commit("session/setMarkedPlayer", session.value.nomination[1]);
};

const removeMarked = () => {
  store.commit("session/setMarkedPlayer", -1);
};

onUnmounted(() => {
  clearInterval(voteTimer.value);
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
