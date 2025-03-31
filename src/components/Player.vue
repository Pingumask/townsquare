<template>
  <li :style="zoom">
    <div ref="player" class="player" :class="[
      {
        dead: props.player.isDead,
        marked: session.markedPlayer === index,
        'no-vote': !props.player.voteToken,
        you: session.sessionId && props.player.id && props.player.id === session.playerId,
        'vote-yes': session.votes[index],
        'vote-lock': voteLocked,
      },
      props.player.role.team,
    ]">
      <div class="shroud" @click="toggleStatus()"></div>
      <div class="life" @click="toggleStatus()"></div>

      <div class="night-order first" v-if="
        nightOrder.get(props.player).first &&
        (grimoire.isNightOrder || !session.isSpectator)
      ">
        <em>{{ nightOrder.get(props.player).first }}.</em>
        <span v-if="props.player.role.firstNightReminder">
          {{ props.player.role.firstNightReminder }}
        </span>
      </div>
      <div class="night-order other" v-if="
        nightOrder.get(props.player).other &&
        (grimoire.isNightOrder || !session.isSpectator)
      ">
        <em>{{ nightOrder.get(props.player).other }}.</em>
        <span v-if="props.player.role.otherNightReminder">
          {{ props.player.role.otherNightReminder }}
        </span>
      </div>

      <Token :role="props.player.role" @set-role="$emit('trigger', ['openRoleModal'])" />

      <!-- Overlay icons -->
      <div class="overlay">
        <font-awesome-icon v-if="
          !grimoire.isOrganVoteMode ||
          typeof session.nomination[1] == 'object' ||
          !session.isSpectator ||
          props.player.id == session.playerId
        " icon="hand-paper" class="fa fa-hand-paper vote" :title="locale.player.handUp" @click="vote()" />
        <font-awesome-icon v-if="
          grimoire.isOrganVoteMode &&
          typeof session.nomination[1] !== 'object' &&
          session.isSpectator &&
          props.player.id !== session.playerId
        " icon="question" class="fa fa-question vote" :title="locale.player.handUp" @click="vote()" />
        <font-awesome-icon v-if="
          !grimoire.isOrganVoteMode ||
          !session.isSpectator ||
          props.player.id == session.playerId
        " icon="times" class="fa fa-times vote" :title="locale.player.handDown" @click="vote()" />
        <font-awesome-icon v-if="
          grimoire.isOrganVoteMode &&
          typeof session.nomination[1] !== 'object' &&
          session.isSpectator &&
          props.player.id !== session.playerId
        " icon="question" class="fa fa-question vote" :title="locale.player.handDown" @click="vote()" />
        <font-awesome-icon icon="times-circle" class="fa fa-times-circle cancel" :title="locale.player.cancel"
          @click="cancel()" />
        <font-awesome-icon icon="exchange-alt" class="fa fa-exchange-alt swap" @click="swapPlayer(props.player)"
          :title="locale.player.swap" />
        <font-awesome-icon icon="redo-alt" class="fa fa-redo-alt move" @click="movePlayer(props.player)"
          :title="locale.player.move" />
        <font-awesome-icon icon="hand-point-right" class="fa fa-hand-point-right nominate"
          @click="nominatePlayer(props.player)" :title="locale.player.nominate" />
      </div>

      <!-- Claimed seat icon -->
      <font-awesome-icon icon="chair" class="fa fa-chair seat" v-if="props.player.id && session.sessionId"
        :class="{ highlight: session.isRolesDistributed }" />

      <!-- Ghost vote icon -->
      <font-awesome-icon icon="vote-yea" class="fa fa-vote-yea has-vote"
        v-if="(props.player.isDead || player.role.id=='beggar') && props.player.voteToken" @click="updatePlayer('voteToken', false)"
        :title="locale.player.ghostVote" />
      <font-awesome-icon icon="vote-yea" class="fa fa-vote-yea has-vote no-token"
        v-if="(props.player.isDead || player.role.id=='beggar') && !props.player.voteToken && !session.isSpectator" @click="updatePlayer('voteToken', true)"
        :title="locale.player.ghostVote" />

      <!-- On block icon -->
      <div class="marked">
        <font-awesome-icon icon="skull" class="fa fa-skull" v-if="!(session.isSpectator && grimoire.isOrganVoteMode)" />
      </div>
      <div class="name" @click="isMenuOpen = !isMenuOpen" :class="{ active: isMenuOpen }">
        <span>{{ props.player.name }}</span>
        <font-awesome-icon icon="venus-mars" class="fa fa-venus-mars" v-if="props.player.pronouns" />
        <div class="pronouns" v-if="props.player.pronouns">
          <span>{{ props.player.pronouns }}</span>
        </div>
      </div>

      <transition name="fold">
        <ul class="menu" v-if="isMenuOpen">
          <li @click="changePronouns" v-if="
            !session.isSpectator ||
            (session.isSpectator && props.player.id === session.playerId)
          ">
            <font-awesome-icon icon="venus-mars" class="fa fa-venus-mars" />
            {{ locale.player.changePronouns }}
          </li>
          <template v-if="!session.isSpectator">
            <li @click="changeName">
              <font-awesome-icon icon="user-edit" class="fa fa-user-edit" />
              {{ locale.player.changeName }}
            </li>
            <li @click="movePlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="redo-alt" class="fa fa-redo-alt" />
              {{ locale.player.movePlayer }}
            </li>
            <li @click="swapPlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="exchange-alt" class="fa fa-exchange-alt" />
              {{ locale.player.swapPlayers }}
            </li>
            <li @click="removePlayer" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="times-circle" class="fa fa-times-circle" />
              {{ locale.player.removePlayer }}
            </li>
            <li @click="updatePlayer('id', '', true)" v-if="props.player.id && session.sessionId">
              <font-awesome-icon icon="chair" class="fa fa-chair" />
              {{ locale.player.emptySeat }}
            </li>
            <template v-if="!session.nomination">
              <li @click="nominatePlayer()">
                <font-awesome-icon icon="hand-point-right" class="fa fa-hand-point-right" />
                {{ locale.player.nomination }}
              </li>
            </template>
            <template v-if="!session.nomination">
              <li @click="specialVote()">
                <font-awesome-icon icon="vote-yea" class="fa fa-vote-yea" />
                {{ locale.player.specialVote }}
              </li>
            </template>
          </template>
          <li @click="claimSeat" v-if="session.isSpectator"
            :class="{ disabled: props.player.id && props.player.id !== session.playerId }">
            <font-awesome-icon icon="chair" class="fa fa-chair" />
            <template v-if="!props.player.id">
              {{ locale.player.claimSeat }}
            </template>
            <template v-else-if="props.player.id === session.playerId">
              {{ locale.player.vacateSeat }}
            </template>
            <template v-else> {{ locale.player.occupiedSeat }}</template>
          </li>
        </ul>
      </transition>
    </div>

    <template v-if="props.player.reminders">
      <div class="reminder" :key="reminder.role + ' ' + reminder.name" v-for="reminder in props.player.reminders"
        :class="[reminder.role]" @click="removeReminder(reminder)">
        <span class="icon" :style="{
          backgroundImage: `url(${reminder.image && grimoire.isImageOptIn
            ? reminder.image
            : rolePath(reminder.imageAlt || reminder.role)
            })`,
        }"></span>
        <span class="text">{{ reminder.name }}</span>
      </div>
    </template>
    <div class="reminder add" @click="$emit('trigger', ['openReminderModal'])">
      <span class="icon"></span>
    </div>
    <div class="reminderHoverTarget"></div>
  </li>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import Token from "./Token.vue";

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update-player', 'trigger']);

const store = useStore();
const players = computed(() => store.state.players.players);
const grimoire = computed(() => store.state.grimoire);
const session = computed(() => store.state.session);
const locale = computed(() => store.state.locale);
const nightOrder = computed(() => store.getters["players/nightOrder"]);

const index = computed(() => players.value.indexOf(props.player));
const voteLocked = computed(() => {
  if (!session.value.nomination) return false;
  const playersCount = players.value.length;
  const indexAdjusted =
    (index.value -
      1 +
      playersCount -
      (typeof session.value.nomination[1] == "number"
        ? session.value.nomination[1]
        : session.value.nomination[0])) %
    playersCount;
  return indexAdjusted < session.value.lockedVote - 1;
});

const zoom = computed(() => {
  if (players.value.length < 7) {
    return { width: 18 + grimoire.value.zoom + "vmin" };
  } else if (players.value.length <= 10) {
    return { width: 16 + grimoire.value.zoom + "vmin" };
  } else if (players.value.length <= 15) {
    return { width: 14 + grimoire.value.zoom + "vmin" };
  } else {
    return { width: 12 + grimoire.value.zoom + "vmin" };
  }
});

const isMenuOpen = ref(false);

function changePronouns() {
  if (session.value.isSpectator && props.player.id !== session.value.playerId) return;
  const pronouns = prompt("Player pronouns", props.player.pronouns);
  if (pronouns !== null) {
    updatePlayer("pronouns", pronouns, true);
  }
}

function toggleStatus() {
  if (grimoire.value.isPublic) {
    if (!props.player.isDead) {
      updatePlayer("isDead", true);
      if (props.player.isMarked) {
        updatePlayer("isMarked", false);
      }
    } else if (!props.player.voteToken) {
      updatePlayer("voteToken", true);
      updatePlayer("isDead", false);
    } else {
      updatePlayer("voteToken", false);
    }
  } else {
    updatePlayer("isDead", !props.player.isDead);
    if (props.player.isMarked) {
      updatePlayer("isMarked", false);
    }
    if (props.player.voteToken != props.player.isDead) {
      updatePlayer("voteToken", !props.player.voteToken);
    }
  }
}

function changeName() {
  if (session.value.isSpectator) return;
  const name = prompt("Player name", props.player.name) || props.player.name;
  updatePlayer("name", name, true);
}

function removeReminder(reminder) {
  const reminders = [...props.player.reminders];
  reminders.splice(props.player.reminders.indexOf(reminder), 1);
  updatePlayer("reminders", reminders, true);
}

function rolePath(role) {
  return new URL(`../assets/icons/${role}.png`, import.meta.url).href;
}

function updatePlayer(property, value, closeMenu = false) {
  if (
    session.value.isSpectator &&
    property !== "reminders" &&
    property !== "pronouns"
  )
    return;
  store.commit("players/update", {
    player: props.player,
    property,
    value,
  });
  if (closeMenu) {
    isMenuOpen.value = false;
  }
}

function removePlayer() {
  isMenuOpen.value = false;
  emit("trigger", ["removePlayer"]);
}

function swapPlayer(player) {
  isMenuOpen.value = false;
  emit("trigger", ["swapPlayer", player]);
}

function movePlayer(player) {
  isMenuOpen.value = false;
  emit("trigger", ["movePlayer", player]);
}

function nominatePlayer(player) {
  isMenuOpen.value = false;
  emit("trigger", ["nominatePlayer", player]);
}

function specialVote() {
  isMenuOpen.value = false;
  store.commit("session/setPlayerForSpecialVote", players.value.indexOf(props.player));
  store.commit("toggleModal", "specialVote");
}

function cancel() {
  emit("trigger", ["cancel"]);
}

function claimSeat() {
  isMenuOpen.value = false;
  emit("trigger", ["claimSeat"]);
}

function vote() {
  if (session.value.isSpectator) return;
  if (!voteLocked.value) return;
  store.commit("session/voteSync", [
    index.value,
    !session.value.votes[index.value],
  ]);
}
</script>

<style lang="scss">
@use "../vars.scss" as *;

.fold-enter-active,
.fold-leave-active {
  transition: transform 250ms ease-in-out;
  transform-origin: left center;
  transform: perspective(200px);
}

.fold-enter,
.fold-leave-to {
  transform: perspective(200px) rotateY(90deg);
}

/***** Player token *****/
.circle .player {
  margin-bottom: 10px;

  &:before {
    content: " ";
    display: block;
    padding-top: 100%;
  }

  .shroud {
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 45%;
    cursor: pointer;
    transform: rotateX(0deg);
    transform-origin: top center;
    transition: transform 200ms ease-in-out;
    z-index: 2;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8));

    &:before {
      content: " ";
      background: url("../assets/shroud.png") center -10px no-repeat;
      background-size: auto 110%;
      position: absolute;
      margin-left: -50%;
      width: 100%;
      height: 100%;
      left: 50%;
      top: -30%;
      opacity: 0;
      transform: perspective(400px) scale(1.5);
      transform-origin: top center;
      transition: all 200ms;
      pointer-events: none;
    }

    #townsquare.spectator & {
      pointer-events: none;
    }

    #townsquare:not(.spectator) &:hover:before {
      opacity: 0.5;
      top: -10px;
      transform: scale(1);
    }
  }

  &.dead .shroud:before {
    opacity: 1;
    top: 0;
    transform: perspective(400px) scale(1);
  }

  #townsquare:not(.spectator) &.dead .shroud:hover:before {
    opacity: 1;
  }
}

/****** Life token *******/
.player {
  z-index: 2;

  .life {
    border-radius: 50%;
    width: 100%;
    background: url("../assets/life.png") center center;
    background-size: 100%;
    border: 3px solid black;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: transform 200ms ease-in-out;
    transform: perspective(400px) rotateY(180deg);
    backface-visibility: hidden;
    position: absolute;
    left: 0;
    top: 0;

    &:before {
      content: " ";
      display: block;
      padding-top: 100%;
    }
  }

  &.dead {
    &.no-vote .life:after {
      display: none;
    }

    .life {
      background-image: url("../assets/death.png");

      &:after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: url("../assets/vote.png") center center no-repeat;
        background-size: 50%;
        height: 100%;
        pointer-events: none;
      }
    }
  }

  &.traveler .life {
    filter: grayscale(100%);
  }
}

#townsquare.public .player {
  .shroud {
    transform: perspective(400px) rotateX(90deg);
    pointer-events: none;
  }

  .life {
    transform: perspective(400px) rotateY(0deg);
  }

  &.traveler:not(.dead) .token {
    transform: perspective(400px) scale(0.8);
    pointer-events: none;
    transition-delay: 0s;
  }

  &.traveler.dead .token {
    transition-delay: 0s;
  }
}

/***** Role token ******/
.player .token {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  transition: transform 200ms ease-in-out;
  transform: perspective(400px) rotateY(0deg);
  backface-visibility: hidden;
}

#townsquare.public .circle .token {
  transform: perspective(400px) rotateY(-180deg);
}

/****** Player choice icons *******/
.player .overlay {
  width: 100%;
  position: absolute;
  pointer-events: none;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:after {
    content: " ";
    display: block;
    padding-top: 100%;
  }
}

.player .overlay svg {
  position: absolute;
  filter: drop-shadow(0 0 3px black);
  z-index: 2;
  cursor: pointer;

  &.swap,
  &.move,
  &.nominate,
  &.vote,
  &.cancel {
    width: 50%;
    height: 60%;
    opacity: 0;
    pointer-events: none;
    transition: all 250ms;
    transform: scale(0.2);

    * {
      stroke-width: 10px;
      stroke: white;
      fill: url(#default);
    }

    &:hover *,
    &.fa-hand-paper * {
      fill: url(#demon);
    }

    &.fa-times * {
      fill: url(#townsfolk);
    }

    &.fa-question * {
      fill: url(#minion);
    }
  }
}

// other player voted yes, but is not locked yet
#townsquare.vote .player.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-yes .overlay svg.vote.fa-question,
#townsquare.vote .player:not(.vote-yes) .overlay svg.vote.fa-question {
  opacity: 0.5;
  transform: scale(1);
}

// you voted yes | a locked vote yes | a locked vote no
#townsquare.vote .player.you.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock:not(.vote-yes) .overlay svg.vote.fa-times,
#townsquare.vote .player.you.vote-yes .overlay svg.vote.fa-question,
#townsquare.vote .player.vote-lock.vote-yes .overlay svg.vote.fa-question,
#townsquare.vote .player.vote-lock:not(.vote-yes) .overlay svg.vote.fa-question {
  opacity: 1;
  transform: scale(1);
}

// a locked vote can be clicked on by the ST
#townsquare.vote:not(.spectator) .player.vote-lock .overlay svg.vote {
  pointer-events: all;
}

li.from:not(.nominate) .player .overlay svg.cancel {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

li.swap:not(.from) .player .overlay svg.swap,
li.nominate .player .overlay svg.nominate,
li.move:not(.from) .player .overlay svg.move {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

/****** Vote icon ********/
.player .has-vote {
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  transition: opacity 250ms;
  z-index: 2;

  #townsquare.public & {
    opacity: 0;
    pointer-events: none;
  }
}

.player .no-token {
  color: #000;
  filter: drop-shadow(0 0 3px white);
  transition: opacity 250ms;
  z-index: 2;

  #townsquare.public & {
    opacity: 0;
    pointer-events: none;
  }
}

.has-vote {
  position: absolute;
  margin-top: -15%;
  right: 2px;
}

/****** Session seat glow *****/
@mixin glow($name, $color) {
  @keyframes #{$name}-glow {
    0% {
      box-shadow: 0 0 rgba($color, 1);
      border-color: $color;
    }

    50% {
      border-color: black;
    }

    100% {
      box-shadow: 0 0 20px 16px transparent;
      border-color: $color;
    }
  }

  .player.you.#{$name} .token {
    animation: #{$name}-glow 5s ease-in-out infinite;
  }
}

@include glow("townsfolk", $townsfolk);
@include glow("outsider", $outsider);
@include glow("demon", $demon);
@include glow("minion", $minion);
@include glow("traveler", $traveler);

.player.you .token {
  animation: townsfolk-glow 5s ease-in-out infinite;
}

/****** Marked icon ******/
.player .marked {
  position: absolute;
  width: 100%;
  top: 0;
  filter: drop-shadow(0px 0px 6px black);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 250ms;
  opacity: 0;

  &:before {
    content: " ";
    padding-top: 100%;
    display: block;
  }

  svg {
    height: 60%;
    width: 60%;
    position: absolute;
    stroke: white;
    stroke-width: 15px;

    path {
      fill: white;
    }
  }
}

.player.marked .marked {
  opacity: 0.5;
}

/****** Seat icon ********/
.player .seat {
  position: absolute;
  left: 2px;
  margin-top: -15%;
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  cursor: default;
  z-index: 2;

  &.highlight {
    animation: redToWhite 1s normal forwards;
    animation-iteration-count: 1;
  }
}

// highlight animation
@keyframes redToWhite {
  from {
    color: $demon;
  }

  to {
    color: white;
  }
}

.player.you .seat {
  color: $townsfolk;
}

/***** Player name *****/
.player>.name {
  right: 10%;
  display: flex;
  justify-content: center;
  font-size: 120%;
  line-height: 120%;
  cursor: pointer;
  white-space: nowrap;
  width: 120%;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  top: 5px;
  box-shadow: 0 0 5px black;
  padding: 0 4px;
  user-select: none;

  svg {
    top: 3px;
    margin-right: 2px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    flex-grow: 1;
  }

  #townsquare:not(.spectator) &:hover,
  &.active {
    color: red;
  }

  &:hover .pronouns {
    opacity: 1;
    color: white;
  }

  .pronouns {
    display: flex;
    position: absolute;
    right: 110%;
    max-width: 250px;
    z-index: 25;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease-in-out;
    padding: 0 4px;
    bottom: -3px;

    &:before {
      content: " ";
      border: 10px solid transparent;
      width: 0;
      height: 0;
      border-left-color: black;
      position: absolute;
      margin-left: 2px;
      left: 100%;
    }
  }
}

.player.dead>.name {
  opacity: 0.5;
}

/***** Player menu *****/
.player>.menu {
  position: absolute;
  left: 110%;
  bottom: -5px;
  text-align: left;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 10px;
  border: 3px solid #000;
  margin-left: 15px;
  cursor: pointer;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  user-select: none;

  &:before {
    content: " ";
    width: 0;
    height: 0;
    position: absolute;
    border: 10px solid transparent;
    border-right-color: black;
    right: 100%;
    bottom: 5px;
    margin-right: 2px;
  }

  li:hover {
    color: red;
  }

  li.disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: white;
    }
  }

  svg {
    margin-right: 2px;
    user-select: none;
  }
}

/***** Ability text *****/
#townsquare.public .circle .ability {
  display: none;
}

.circle .player .shroud:hover~.token .ability,
.circle .player .token:hover .ability {
  opacity: 1;
}

/**** Night reminders ****/
.player .night-order {
  z-index: 3;
}

.player.dead .night-order em {
  color: #ddd;
  background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, gray 100%);
}

/***** Reminder token *****/
.circle .reminder {
  background: url("../assets/reminder.png") center center;
  background-size: 100%;
  width: 50%;
  height: 0;
  padding-bottom: 50%;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0 0 -25%;
  border-radius: 50%;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: all 200ms;
  cursor: pointer;

  .text {
    line-height: 90%;
    color: black;
    font-size: 50%;
    font-weight: bold;
    text-align: center;
    margin-top: 50%;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 15%;
    text-shadow:
      0 1px 1px #f6dfbd,
      0 -1px 1px #f6dfbd,
      1px 0 1px #f6dfbd,
      -1px 0 1px #f6dfbd;
  }

  .icon,
  &:after {
    content: " ";
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center 0;
    background-repeat: no-repeat;
    background-image: url("../assets/icons/plus.png");
    transition: opacity 200ms;
  }

  &:after {
    background-image: url("../assets/icons/x.png");
    opacity: 0;
    top: 5%;
  }

  &.add {
    opacity: 0;
    top: 30px;

    &:after {
      display: none;
    }

    .icon {
      top: 5%;
    }
  }

  &.custom {
    .icon {
      display: none;
    }

    .text {
      font-size: 70%;
      word-break: break-word;
      margin-top: 0;
      display: flex;
      align-items: center;
      align-content: center;
      justify-content: center;
      border-radius: 50%;
      top: 0;
    }
  }

  &:hover:before {
    opacity: 0;
  }

  &:hover:after {
    opacity: 1;
  }
}

.circle .reminderHoverTarget {
  opacity: 0;
  width: calc(50% + 8px);
  padding-top: calc(50% + 38px);
  margin-top: calc(-25% - 33px);
  margin-left: calc(-25% - 1px);
  border-radius: 0 0 999px 999px;
  pointer-events: auto;
  transform: none !important;
  z-index: -1;
}

.circle li:hover .reminder.add {
  opacity: 1;
  top: 0;
}

.circle li:hover .reminder.add:before {
  opacity: 1;
}

#townsquare.public .reminder {
  opacity: 0;
  pointer-events: none;
}
</style>
