<template>
  <li :style="zoom">
    <div
      ref="player"
      class="player"
      :class="[
        {
          dead: props.player.isDead,
          marked: votingStore.markedPlayer === index,
          'no-vote': !props.player.voteToken,
          you:
            session.sessionId &&
            props.player.id &&
            props.player.id === session.playerId,
          'vote-yes': votingStore.votes[index],
          'vote-lock': voteLocked,
        },
        props.player.role.team,
      ]"
    >
      <div class="shroud" @click="toggleStatus()" />
      <div class="life" @click="toggleStatus()" />

      <div
        v-if="nightOrder.get(props.player).first && showOrderBubbles"
        class="night-order first"
      >
        <em>{{ nightOrder.get(props.player).first }}</em>
        <span v-if="props.player.role.firstNightReminder">
          {{ props.player.role.firstNightReminder }}
        </span>
      </div>
      <div
        v-if="nightOrder.get(props.player).other && showOrderBubbles"
        class="night-order other"
      >
        <em>{{ nightOrder.get(props.player).other }}</em>
        <span v-if="props.player.role.otherNightReminder">
          {{ props.player.role.otherNightReminder }}
        </span>
      </div>

      <Token
        :role="props.player.role"
        :player="props.player"
        @set-role="$emit('trigger', ['openRoleModal'])"
      />

      <!-- Overlay icons -->
      <div class="overlay">
        <font-awesome-icon v-if="
          !grimoire.isSecretVote ||
          isSpecialVoteWithMessages ||
          !session.isPlayerOrSpectator ||
          props.player.id == session.playerId
        " icon="hand-paper" class="fa fa-hand-paper vote" :title="t('player.handUp')" @click="vote()" />
        <font-awesome-icon v-if="
          grimoire.isSecretVote &&
          !isSpecialVoteWithMessages &&
          session.isPlayerOrSpectator &&
          props.player.id !== session.playerId
        " icon="question" class="fa fa-question vote" :title="t('player.handUp')" @click="vote()" />
        <font-awesome-icon v-if="
          !grimoire.isSecretVote ||
          !session.isPlayerOrSpectator ||
          props.player.id == session.playerId
        " icon="times" class="fa fa-times vote" :title="t('player.handDown')" @click="vote()" />
        <font-awesome-icon v-if="
          grimoire.isSecretVote &&
          !isSpecialVoteWithMessages &&
          session.isPlayerOrSpectator &&
          props.player.id !== session.playerId
        " icon="question" class="fa fa-question vote" :title="t('player.handDown')" @click="vote()" />
        
        <font-awesome-icon v-if="
          session.playerId &&
          props.player.id &&
          props.player.id !== session.playerId &&
          discordStore.isSelectingForChat
        " icon="comments" class="fa fa-comments request-chat" title="Request Private Chat" 
          @click="requestPrivateChat(props.player)" />

        <font-awesome-icon icon="times-circle" class="fa fa-times-circle cancel" :title="t('player.cancel')"
          @click="cancel()" />
        <font-awesome-icon icon="exchange-alt" class="fa fa-exchange-alt swap" :title="t('player.swap')"
          @click="swapPlayer(props.player)" />
        <font-awesome-icon icon="redo-alt" class="fa fa-redo-alt move" :title="t('player.move')"
          @click="movePlayer(props.player)" />
        <font-awesome-icon icon="hand-point-right" class="fa fa-hand-point-right nominate" :title="t('player.nominate')"
          @click="nominatePlayer(props.player)" />
        <font-awesome-icon
          v-if="
            !grimoire.isSecretVote ||
            isSpecialVoteWithMessages ||
            !session.isPlayerOrSpectator ||
            props.player.id == session.playerId
          "
          icon="hand-paper"
          class="fa fa-hand-paper vote"
          :title="t('player.handUp')"
          @click="vote()"
        />
        <font-awesome-icon
          v-if="
            grimoire.isSecretVote &&
            !isSpecialVoteWithMessages &&
            session.isPlayerOrSpectator &&
            props.player.id !== session.playerId
          "
          icon="question"
          class="fa fa-question vote"
          :title="t('player.handUp')"
          @click="vote()"
        />
        <font-awesome-icon
          v-if="
            !grimoire.isSecretVote ||
            !session.isPlayerOrSpectator ||
            props.player.id == session.playerId
          "
          icon="times"
          class="fa fa-times vote"
          :title="t('player.handDown')"
          @click="vote()"
        />
        <font-awesome-icon
          v-if="
            grimoire.isSecretVote &&
            !isSpecialVoteWithMessages &&
            session.isPlayerOrSpectator &&
            props.player.id !== session.playerId
          "
          icon="question"
          class="fa fa-question vote"
          :title="t('player.handDown')"
          @click="vote()"
        />
        <font-awesome-icon
          icon="times-circle"
          class="fa fa-times-circle cancel"
          :title="t('player.cancel')"
          @click="cancel()"
        />
        <font-awesome-icon
          icon="exchange-alt"
          class="fa fa-exchange-alt swap"
          :title="t('player.swap')"
          @click="swapPlayer(props.player)"
        />
        <font-awesome-icon
          icon="redo-alt"
          class="fa fa-redo-alt move"
          :title="t('player.move')"
          @click="movePlayer(props.player)"
        />
        <font-awesome-icon
          icon="hand-point-right"
          class="fa fa-hand-point-right nominate"
          :title="t('player.nominate')"
          @click="nominatePlayer(props.player)"
        />
      </div>

      <!-- Claimed seat icon -->
      <font-awesome-icon
        v-if="props.player.id && session.sessionId"
        icon="chair"
        class="fa fa-chair seat"
        :class="{ highlight: session.isRolesDistributed }"
      />

      <!-- Ghost vote icon -->
      <font-awesome-icon
        v-if="
          (props.player.isDead || player.role.id == 'beggar') &&
          props.player.voteToken
        "
        icon="vote-yea"
        class="fa fa-vote-yea has-vote"
        :title="t('player.ghostVote')"
        @click="updatePlayer('voteToken', false)"
      />
      <font-awesome-icon
        v-if="
          (props.player.isDead || player.role.id == 'beggar') &&
          !props.player.voteToken &&
          !session.isPlayerOrSpectator
        "
        icon="vote-yea"
        class="fa fa-vote-yea has-vote no-token"
        :title="t('player.ghostVote')"
        @click="updatePlayer('voteToken', true)"
      />

      <!-- On block icon -->
      <div class="marked">
        <font-awesome-icon
          v-if="!(session.isPlayerOrSpectator && grimoire.isSecretVote)"
          icon="skull"
          class="fa fa-skull"
        />
      </div>
      <div
        class="name"
        :class="{ active: isMenuOpen }"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span>{{
          // eslint-disable-next-line no-irregular-whitespace
          props.player.name || " "
        }}</span>
        <font-awesome-icon
          v-if="props.player.pronouns"
          icon="venus-mars"
          class="fa fa-venus-mars"
        />
        <div v-if="props.player.pronouns" class="pronouns">
          <span>{{ props.player.pronouns }}</span>
        </div>
      </div>

      <transition name="fold">
        <ul v-if="isMenuOpen" class="menu">
          <li
            v-if="
              (!session.isPlayerOrSpectator && playersMenu.changePronouns) ||
              (session.isPlayerOrSpectator &&
                props.player.id === session.playerId)
            "
            @click="changePronouns"
          >
            <font-awesome-icon icon="venus-mars" class="fa fa-venus-mars" />
            {{ t("player.changePronouns") }}
          </li>
          <li
            v-if="
              (!session.isPlayerOrSpectator && playersMenu.changeName) ||
              ((grimoire.allowSelfNaming || props.player.name === '') &&
                session.isPlayerOrSpectator &&
                player.id === session.playerId)
            "
            @click="changeName"
          >
            <font-awesome-icon icon="user-edit" class="fa fa-user-edit" />
            {{ t("player.changeName") }}
          </li>
          <template v-if="!session.isPlayerOrSpectator">
            <li
              v-if="playersMenu.movePlayer"
              :class="{ disabled: votingStore.lockedVote }"
              @click="movePlayer()"
            >
              <font-awesome-icon icon="redo-alt" class="fa fa-redo-alt" />
              {{ t("player.movePlayer") }}
            </li>
            <li
              v-if="playersMenu.swapPlayers"
              :class="{ disabled: votingStore.lockedVote }"
              @click="swapPlayer()"
            >
              <font-awesome-icon
                icon="exchange-alt"
                class="fa fa-exchange-alt"
              />
              {{ t("player.swapPlayers") }}
            </li>
            <li
              v-if="playersMenu.removePlayer"
              :class="{ disabled: votingStore.lockedVote }"
              @click="removePlayer"
            >
              <font-awesome-icon
                icon="times-circle"
                class="fa fa-times-circle"
              />
              {{ t("player.removePlayer") }}
            </li>
            <li
              v-if="
                props.player.id && session.sessionId && playersMenu.emptySeat
              "
              @click="updatePlayer('id', '', true)"
            >
              <font-awesome-icon icon="chair" class="fa fa-chair" />
              {{ t("player.emptySeat") }}
            </li>
            <li
              v-if="
                props.player.role.id &&
                (props.player.role.team == 'traveler' ||
                  playersMenu.swapAlignment)
              "
              @click="switchAlignment"
            >
              <font-awesome-icon icon="yin-yang" class="fa fa-yin-yang" />
              {{ t("player.swapAlignment") }}
            </li>
            <template v-if="!votingStore.nomination">
              <li @click="nominatePlayer()">
                <font-awesome-icon
                  icon="hand-point-right"
                  class="fa fa-hand-point-right"
                />
                {{ t("player.nomination") }}
              </li>
            </template>
            <template v-if="!votingStore.nomination && playersMenu.specialVote">
              <li @click="specialVote()">
                <font-awesome-icon icon="vote-yea" class="fa fa-vote-yea" />
                {{ t("player.specialVote") }}
              </li>
            </template>
          </template>
          <li
            v-if="session.isPlayerOrSpectator"
            :class="{
              disabled: props.player.id && props.player.id !== session.playerId,
            }"
            @click="claimSeat"
          >
            <font-awesome-icon icon="chair" class="fa fa-chair" />
            <template v-if="!props.player.id">
              {{ t("player.claimSeat") }}
            </template>
            <template v-else-if="props.player.id === session.playerId">
              {{ t("player.vacateSeat") }}
            </template>
            <template v-else> {{ t("player.occupiedSeat") }}</template>
          </li>
        </ul>
      </transition>
    </div>

    <template v-if="props.player.reminders">
      <div
        v-for="reminder in props.player.reminders"
        :key="reminder.role.id + ' ' + reminder.name"
        class="reminder"
        :class="[reminder.role.id]"
        @click="removeReminder(reminder)"
      >
        <picture
          v-if="reminder.role.id !== 'custom'"
          :class="reminder.role?.team"
        >
          <RoleIcon :role="reminder.role" />
        </picture>
        <span class="text">{{ reminder.name }}</span>
      </div>
    </template>
    <div class="reminder add" @click="$emit('trigger', ['openReminderModal'])">
      <span class="icon" />
    </div>
    <div class="reminderHoverTarget" />
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RoleIcon, Token } from "@/components";
import { isActiveNomination } from "@/services/nomination";
import type { Player, Reminder } from "@/types";
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  usePlayersMenuStore,
  useSessionStore,
  useUserPreferencesStore,
  useVotingStore,
  useDiscordStore,
} from "@/stores";

const locale = useLocaleStore();
const t = locale.t;
interface Props {
  player: Player;
  unchecked?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update-player": [property: string, value: unknown];
  trigger: [action: string | [string, unknown] | [string]];
}>();

const grimoire = useGrimoireStore();
const playersStore = usePlayersStore();
const playersMenu = usePlayersMenuStore();
const session = useSessionStore();
const userPreferences = useUserPreferencesStore();
const votingStore = useVotingStore();
const discordStore = useDiscordStore();

const index = computed(() => players.value.indexOf(props.player));
const players = computed<Player[]>(() => playersStore.players);
const nightOrder = computed(() => playersStore.nightOrder);
const showOrderBubbles = computed(() => {
  if (session.isPlayerOrSpectator) {
    return userPreferences.orderBubblesAsPlayer;
  } else {
    return userPreferences.orderBubblesAsHost;
  }
});

const voteLocked = computed(() => {
  if (!isActiveNomination(votingStore.nomination)) return false;

  const nomination = votingStore.nomination;
  const playersCount = players.value.length;

  // Determine the reference player index for vote locking
  let referenceIndex: number;
  if (typeof nomination.nominee === "number") {
    referenceIndex = nomination.nominee;
  } else if (typeof nomination.nominator === "number") {
    referenceIndex = nomination.nominator;
  } else {
    return false; // Can't determine vote lock for special votes without player indices
  }

  const indexAdjusted =
    (index.value - 1 + playersCount - referenceIndex) % playersCount;
  return indexAdjusted < votingStore.lockedVote - 1;
});

const isSpecialVoteWithMessages = computed(() => {
  if (!isActiveNomination(votingStore.nomination)) return false;
  const nomination = votingStore.nomination;
  return !!nomination.specialVote?.timerText;
});

const zoom = computed(() => {
  if (players.value.length < 7) {
    return { width: 18 + userPreferences.zoom + "vmin" };
  } else if (players.value.length <= 10) {
    return { width: 16 + userPreferences.zoom + "vmin" };
  } else if (players.value.length <= 15) {
    return { width: 14 + userPreferences.zoom + "vmin" };
  } else {
    return { width: 12 + userPreferences.zoom + "vmin" };
  }
});

const isMenuOpen = ref(false);

function changePronouns() {
  if (session.isPlayerOrSpectator && props.player.id !== session.playerId)
    return;
  const pronouns = prompt("Player pronouns", props.player.pronouns);
  if (pronouns !== null) {
    updatePlayer("pronouns", pronouns, true);
  }
}

function toggleStatus() {
  if (userPreferences.hideGrim) {
    if (!props.player.isDead) {
      updatePlayer("isDead", true);
    } else if (props.player.voteToken) {
      updatePlayer("voteToken", false);
    } else {
      updatePlayer("voteToken", true);
      updatePlayer("isDead", false);
    }
  } else {
    updatePlayer("isDead", !props.player.isDead);
    if (props.player.voteToken !== props.player.isDead) {
      updatePlayer("voteToken", !props.player.voteToken);
    }
  }
}

function switchAlignment() {
  let selectedPlayer = players.value.find((player) => player === props.player);
  if (!selectedPlayer) return;
  if (
    selectedPlayer.alignment === undefined ||
    selectedPlayer.alignment === null
  ) {
    if (
      selectedPlayer.role.team === "townsfolk" ||
      selectedPlayer.role.team === "outsider"
    ) {
      selectedPlayer.alignment = "evil";
    } else {
      selectedPlayer.alignment = "good";
    }
  } else if (selectedPlayer.alignment === "good") {
    selectedPlayer.alignment = "evil";
  } else if (selectedPlayer.role.team === "traveler") {
    selectedPlayer.alignment = null;
  } else {
    selectedPlayer.alignment = "good";
  }
}

function changeName() {
  if (session.isPlayerOrSpectator && props.player.id !== session.playerId)
    return;
  const name =
    prompt(t("prompt.addPlayer"), props.player.name) || props.player.name;
  if (name !== null && name !== "") {
    updatePlayer("name", name, true);
  }
}

function removeReminder(reminder: Reminder) {
  const reminders = [...props.player.reminders];
  reminders.splice(props.player.reminders.indexOf(reminder), 1);
  updatePlayer("reminders", reminders, true);
}

function updatePlayer(
  property: keyof Player,
  value: unknown,
  closeMenu = false,
) {
  if (
    session.isPlayerOrSpectator &&
    property !== "reminders" &&
    property !== "pronouns" &&
    property !== "name" &&
    property !== "id"
  )
    return;
  playersStore.update({
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

function swapPlayer(player?: Player) {
  isMenuOpen.value = false;
  emit("trigger", ["swapPlayer", player]);
}

function movePlayer(player?: Player) {
  isMenuOpen.value = false;
  emit("trigger", ["movePlayer", player]);
}

function nominatePlayer(player?: Player) {
  isMenuOpen.value = false;
  emit("trigger", ["nominatePlayer", player]);
}

function specialVote() {
  isMenuOpen.value = false;
  votingStore.setPlayerForSpecialVote(players.value.indexOf(props.player));
  grimoire.toggleModal("specialVote");
}

function cancel() {
  emit("trigger", ["cancel"]);
}

function requestPrivateChat(player: Player) {
  emit("trigger", ["requestPrivateChat", player]);
}

function claimSeat() {
  isMenuOpen.value = false;
  emit("trigger", ["claimSeat"]);
  
  const isUnclaiming = props.player?.id === session.playerId;
  if (isUnclaiming) return;

  if (props.player.name === "") {
    setTimeout(() => changeName(), 100);
  }
  if (!userPreferences.discordUsername) {
    setTimeout(() => {
      const username = prompt("Enter your Discord Username (for Voice Chat integration):");
      if (username) {
        userPreferences.$patch({ discordUsername: username });
      }
    }, 200);
  }
}

function vote() {
  if (session.isPlayerOrSpectator) return;
  if (!voteLocked.value) return;
  votingStore.voteSync([index.value, !votingStore.votes[index.value]]);
}
</script>

<style lang="scss">
@use "../vars.scss" as *;

.townsfolk {
  --color: var(--townsfolk);
  --blend: multiply;
}

.outsider,
.outsider.good {
  --color: var(--outsider);
  --blend: normal;
  filter: drop-shadow(#000c 0 0 8px);
}

.minion {
  --color: var(--minion);
  --blend: multiply;
}

.demon,
.demon.evil {
  --color: var(--demon);
  --blend: multiply;
}

.traveler {
  --blend: multiply;
  --color1: var(--townsfolk);
  --color2: var(--minion);

  .good {
    --color2: var(--default);
  }

  .evil {
    --color1: var(--default);
  }
}

.good {
  --color: #2956b8;
  --blend: multiply;
}

.evil {
  --color: var(--minion);
  --blend: multiply;
}

.fold-enter-active,
.fold-leave-active {
  transition: transform 250ms ease-in-out;
  transform-origin: center top;
  transform: perspective(200px) rotate-X(0deg);
}

picture {
  position: absolute;
  top: 0;
  width: 90%;
  height: 90%;
}

picture * {
  width: 12vmin;
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
  &.request-chat,
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
    
    &.fa-comments * {
      fill: url(#townsfolk);
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
#townsquare.vote
  .player.vote-lock:not(.vote-yes)
  .overlay
  svg.vote.fa-question {
  opacity: 1;
  transform: scale(1);
}

// a locked vote can be clicked on by the ST
#townsquare.vote:not(.spectator) .player.vote-lock .overlay svg.vote {
  pointer-events: all;
}

li .player .overlay svg.request-chat {
  opacity: 0.8;
  transform: scale(0.8) translateY(-60%);
  pointer-events: all;
  
  &:hover {
    transform: scale(1) translateY(-60%);
    opacity: 1;
  }
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

@include glow("townsfolk", var(--townsfolk));
@include glow("outsider", var(--outsider));
@include glow("demon", var(--demon));
@include glow("minion", var(--minion));
@include glow("traveler", var(--traveler));
@include glow("traveller", var(--traveler));

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
    color: var(--demon);
  }

  to {
    color: white;
  }
}

.player.you .seat {
  color: var(--townsfolk);
}

/***** Player name *****/
.player > .name {
  right: 10%;
  display: flex;
  justify-content: center;
  font-size: clamp(16px, calc(-1.1429rem + 4.2857vw), 28px);
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
    background: rgba(0, 0, 0, 0.8);
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

.player.dead > .name {
  color: #aaaa;
}

/***** Player menu *****/
.player > .menu {
  z-index: 10;
  position: absolute;
  left: 110%;
  bottom: -5px;
  text-align: left;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.9);
  padding: 2px 5px;
  border-radius: 10px;
  border: 3px solid #000;
  margin-left: 15px;
  cursor: pointer;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  user-select: none;

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

.circle .player .shroud:hover ~ .token .ability,
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

picture > * {
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
}
</style>
