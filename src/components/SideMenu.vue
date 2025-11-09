<template>
  <aside v-if="!session.isSpectator || grimoire.isNight" ref="sideMenu" class="sideMenu"
    :class="{ closed: !isSideMenuOpen }">
    <div>
      <h3>
        <font-awesome-icon icon="times-circle" class="fa fa-times-circle" @click.stop="toggleSideMenu" />
        <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="toggleSideMenu" />
        <span v-if="!session.sessionId">{{ t('townsquare.disconnected') }}</span>
        <span v-else-if="!session.isSpectator">{{ t('townsquare.storytellerTools') }}</span>
        <span v-else-if="session.isSpectator && grimoire.isNight">{{ t('modal.nightOrder.title') }}</span>
      </h3>

      <div v-if="session.sessionId && !session.isSpectator">
        <div class="button-group">
          <button class="button" :disabled="session.gamePhase === 'firstNight'"
            :title="t('menu.grimoire.firstNightSwitch')" @click="setGamePhase('firstNight')">
            ☽
          </button>
          <button class="button" :disabled="session.gamePhase === 'day'" :title="t('menu.grimoire.daySwitch')"
            @click="setGamePhase('day')">
            ☀
          </button>
          <button class="button" :disabled="session.gamePhase === 'otherNight'" :title="t('menu.grimoire.nightSwitch')"
            @click="setGamePhase('otherNight')">
            ☾
          </button>
        </div>
        <div v-if="!session.isSpectator && !grimoire.isNight">
          <div class="button-group">
            <button @click="setTimer()">
              🕑 {{ timerDuration }} min
            </button>
            <button @click="renameTimer()">
              🗏 {{ timerName }}
            </button>
            <button class="demon" :disabled="!timerOn" @click="stopTimer()">
              ■
            </button>
            <button class="townfolk" :disabled="timerOn" @click="startTimer()">
              ⏵
            </button>
          </div>
          <div v-if="session.nomination" class="button-group">
            <button v-if="!isSpecialVoteWithMessages" @click="setAccusationTimer()">
              {{ t('townsquare.timer.accusation.button') }}
            </button>
            <button v-else @click="setSpecialVoteTimer()">
              {{ session.nomination.specialVote?.buttonLabel || session.nomination.specialVote?.type || 'Special Vote'
              }}
            </button>
            <button v-if="!isSpecialVoteWithMessages" @click="setDefenseTimer()">
              {{ t('townsquare.timer.defense.button') }}
            </button>
            <button v-if="!isSpecialVoteWithMessages" @click="setDebateTimer()">
              {{ t('townsquare.timer.debate.button') }}
            </button>
            <button v-else @click="setSpecialDebateTimer()">
              {{ t('townsquare.timer.debate.button') }}
            </button>
          </div>
          <div v-else class="button-group">
            <button @click="setDaytimeTimer()">
              {{ t('townsquare.timer.daytime.button') }}
            </button>
            <button @click="setNominationTimer()">
              {{ t('townsquare.timer.nominations.button') }}
            </button>
            <button @click="setDuskTimer()">
              {{ t('townsquare.timer.dusk.button') }}
            </button>
          </div>
          <div class="button-group">
            <button @click="toggleHiddenVote()">
              <font-awesome-icon v-if="session.isSecretVote" :icon="['fas', 'eye-slash']" />
              <font-awesome-icon v-if="!session.isSecretVote" :icon="['fas', 'eye']" />
            </button>
          </div>
          <div class="button-group">
            <button @click="toggleRinging()">
              <font-awesome-icon :icon="['fas', 'bell']" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="grimoire.isNight" class="night-order-container">
        <NightOrderTable :night-type="session.gamePhase" />
      </div>
      <div v-if="!session.sessionId">
        <div class="button-group">
          <button @click="hostSession">{{ t('menu.session.storyteller') }}</button>
        </div>
        <div class="button-group">
          <button @click="joinSession">{{ t('menu.session.player') }}</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { NightOrderTable } from '@/components';
import { useTranslation, isActiveNomination } from '@/composables';
import { GamePhase } from "@/types";

const store = useStore();
const { t } = useTranslation();

// Computed properties from store
const grimoire = computed(() => store.state.grimoire);
const session = computed(() => store.state.session);
const players = computed(() => store.state.players.players);

const isSpecialVoteWithMessages = computed(() => {
  if (!isActiveNomination(session.value.nomination)) return false;
  const nomination = session.value.nomination;
  return !!nomination.specialVote?.timerText;
});

// Reactive data
const isSideMenuOpen = ref(false);
const timerName = ref("Timer");
const timerDuration = ref(1);
const timerOn = ref(false);
const timerEnder = ref<ReturnType<typeof setTimeout> | null>(null);
const currentTimerType = ref<keyof typeof grimoire.value.timerDurations | null>(null);

// Methods
const toggleSideMenu = () => {
  isSideMenuOpen.value = !isSideMenuOpen.value;
};

const hostSession = () => {
  if (session.value.sessionId) return;
  const sessionId = prompt(
    t('prompt.createSession'),
    String(Math.round(Math.random() * 10000)),
  );
  if (sessionId) {
    store.commit('session/clearVoteHistory');
    store.commit('session/setSpectator', false);
    store.commit('session/setSessionId', sessionId);
    store.commit('toggleGrimoire', false);
    copySessionUrl();
  }
};

const joinSession = () => {
  if (session.value.sessionId) return leaveSession();
  let sessionId = prompt(t('prompt.joinSession'));
  if (sessionId && sessionId.match(/^https?:\/\//i)) {
    sessionId = sessionId.split('#').pop() || null;
  }
  if (sessionId) {
    store.commit('session/clearVoteHistory');
    store.commit('session/setSpectator', true);
    store.commit('toggleGrimoire', false);
    store.commit('session/setSessionId', sessionId);
  }
};

const leaveSession = () => {
  if (confirm(t('prompt.leaveSession'))) {
    store.commit('session/setSpectator', false);
    store.commit('session/setSessionId', '');
  }
};

const copySessionUrl = () => {
  const url = window.location.href.split('#')[0];
  const link = url + '#' + session.value.sessionId;
  navigator.clipboard.writeText(link);
};

const setGamePhase = (gamePhase: GamePhase) => {
  if (gamePhase === "day") {
    store.commit("toggleNight", false);
    store.commit("toggleRooster", true);
    setTimeout(() => store.commit("toggleRooster", false), 4000);
  } else if (gamePhase === "otherNight" || gamePhase === "firstNight") {
    store.commit("session/setMarkedPlayer", -1);
    store.commit("toggleNight", true);
  }
  store.commit("session/setGamePhase", gamePhase);
};

const toggleHiddenVote = () => {
  store.commit("session/toggleSecretVote");
};

const toggleRinging = () => {
  store.commit("toggleRinging", true);
  setTimeout(() => store.commit("toggleRinging", false), 4000);
};

const renameTimer = () => {
  let newName = prompt(t('townsquare.timer.prompt.name'), timerName.value);
  if (newName === "") {
    newName = t('townsquare.timer.default.text');
  }
  if (newName) {
    timerName.value = newName.trim();
  }
};

const setDaytimeTimer = () => {
  currentTimerType.value = 'daytime';
  timerDuration.value = grimoire.value.timerDurations.daytime;
  timerName.value = t('townsquare.timer.daytime.text');
};

const setNominationTimer = () => {
  currentTimerType.value = 'nominations';
  timerDuration.value = grimoire.value.timerDurations.nominations;
  timerName.value = t('townsquare.timer.nominations.text');
};

const setDuskTimer = () => {
  currentTimerType.value = 'dusk';
  timerDuration.value = grimoire.value.timerDurations.dusk;
  timerName.value = t('townsquare.timer.dusk.text');
};

const setAccusationTimer = () => {
  if (!isActiveNomination(session.value.nomination)) return;

  currentTimerType.value = 'accusation';
  timerDuration.value = 1;
  const nomination = session.value.nomination;

  let timerText = t('townsquare.timer.accusation.text');

  // Get nominator name for $accusator placeholder
  const nominatorName = typeof nomination.nominator === 'number'
    ? players.value[nomination.nominator]?.name || ''
    : typeof nomination.nominator === 'string'
      ? nomination.nominator.charAt(0).toUpperCase() + nomination.nominator.slice(1)
      : '';

  // Get nominee name for $accusee placeholder
  const nomineeName = typeof nomination.nominee === 'number'
    ? players.value[nomination.nominee]?.name || ''
    : nomination.nominee || '';

  timerText = timerText
    .replace("$accusator", nominatorName)
    .replace("$accusee", nomineeName);

  timerName.value = timerText;
};

const setDefenseTimer = () => {
  if (!isActiveNomination(session.value.nomination)) return;

  currentTimerType.value = 'defense';
  timerDuration.value = grimoire.value.timerDurations.defense;
  const nomination = session.value.nomination;

  let timerText = t('townsquare.timer.defense.text');

  // Get nominee name for $accusee placeholder
  const nomineeName = typeof nomination.nominee === 'number'
    ? players.value[nomination.nominee]?.name || ''
    : typeof nomination.nominee === 'string'
      ? nomination.nominee.charAt(0).toUpperCase() + nomination.nominee.slice(1)
      : '';

  // Get nominator name for $accusator placeholder
  const nominatorName = typeof nomination.nominator === 'number'
    ? players.value[nomination.nominator]?.name || ''
    : nomination.nominator || '';

  timerText = timerText
    .replace("$accusee", nomineeName)
    .replace("$accusator", nominatorName);

  timerName.value = timerText;
};

const setDebateTimer = () => {
  if (!isActiveNomination(session.value.nomination)) return;

  currentTimerType.value = 'debate';
  timerDuration.value = grimoire.value.timerDurations.debate;
  const nomination = session.value.nomination;

  let timerText = t('townsquare.timer.debate.text');

  // Get nominee name for $accusee placeholder
  const nomineeName = typeof nomination.nominee === 'number'
    ? players.value[nomination.nominee]?.name || ''
    : nomination.nominee || '';

  timerText = timerText.replace("$accusee", nomineeName);
  timerName.value = timerText;
};

const setSpecialVoteTimer = () => {
  if (!isActiveNomination(session.value.nomination)) return;

  currentTimerType.value = 'custom';
  timerDuration.value = grimoire.value.timerDurations.custom;
  const nomination = session.value.nomination;

  // Get nominator name
  const nominatorName = typeof nomination.nominator === 'number'
    ? players.value[nomination.nominator]?.name || ''
    : nomination.nominator || '';

  // Get the timer text
  const message = nomination.specialVote?.timerText || '';

  const timerText = `${nominatorName} ${message}`;
  timerName.value = timerText;
};

const setSpecialDebateTimer = () => {
  if (!isActiveNomination(session.value.nomination)) return;

  currentTimerType.value = 'customDebate';
  timerDuration.value = grimoire.value.timerDurations.customDebate;
  const nomination = session.value.nomination;

  // Get the debate text
  let timerText = nomination.specialVote?.debateText || '';

  // Replace $player placeholder with nominator name
  const nominatorName = typeof nomination.nominator === 'number'
    ? players.value[nomination.nominator]?.name || ''
    : nomination.nominator || '';

  timerText = timerText.replace("$player", nominatorName);
  timerName.value = timerText;
};

const setTimer = () => {
  const newDuration = prompt(t('townsquare.timer.prompt.duration'));
  if (isNaN(Number(newDuration))) {
    return alert(t('townsquare.timer.prompt.durationError'));
  }
  if (Number(newDuration) > 0) {
    timerDuration.value = Number(newDuration);
    // Save the new duration for the current timer type
    if (currentTimerType.value) {
      store.commit('setTimerDuration', {
        type: currentTimerType.value,
        duration: Number(newDuration)
      });
    }
  }
};

const startTimer = () => {
  const timer = { name: timerName.value, duration: timerDuration.value * 60 };
  store.commit("setTimer", timer);
  timerOn.value = true;
  timerEnder.value = setTimeout(stopTimer, timer.duration * 1000);
};

const stopTimer = () => {
  store.commit("setTimer", {});
  timerOn.value = false;
  if (timerEnder.value) {
    clearTimeout(timerEnder.value);
  }
};
</script>

<style scoped lang="scss">
@use "../vars.scss" as *;

.sideMenu {
  position: absolute;
  bottom: 10px;
  left: auto;
  right: 10px;
  width: min-content;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  border: 3px solid black;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  transform-origin: bottom left;
  transform: scale(1);
  opacity: 1;
  transition: all 250ms ease-in-out;
  z-index: 50;

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

  .button-group {
    transition: all 250ms;
  }

  .night-order-container {
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: hidden;
    margin: 5px;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;

      &:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    }
  }

  &.closed {
    svg.fa-times-circle {
      display: none;
    }

    svg.fa-plus-circle {
      display: block;
    }

    .button-group,
    .button-group *,
    .night-order-container,
    .night-order-container * {
      width: 0px;
      height: 0px;
      scale: 0;
    }
  }
}
</style>
