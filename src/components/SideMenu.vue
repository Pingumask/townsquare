<template>
  <aside ref="sideMenu" class="sideMenu" :class="{ closed: !isSideMenuOpen }">

    <h3>
      <font-awesome-icon icon="times-circle" class="fa fa-times-circle" @click.stop="toggleSideMenu" />
      <font-awesome-icon icon="plus-circle" class="fa fa-plus-circle" @click.stop="toggleSideMenu" />
      <span>
        {{ t(`townsquare.gamephase.${grimoire.gamePhase}`) }}
        <div v-if="grimoire.gamePhase === 'day' || grimoire.gamePhase === 'otherNight'" id="daycounter">
          <font-awesome-icon v-if="!session.isPlayerOrSpectator && grimoire.dayCount > 1" icon="fa-minus-circle"
            @click="dayDown()" />
          {{ grimoire.dayCount }}
          <font-awesome-icon v-if="!session.isPlayerOrSpectator" icon="fa-plus-circle"
            @click="grimoire.setDayCount(grimoire.dayCount + 1);" />
        </div>
      </span>
    </h3>
    <div class="content">
      <div v-if="session.sessionId && !session.isPlayerOrSpectator">
        <div class="button-group">
          <button class="button" :disabled="grimoire.gamePhase === 'pregame'" :title="t('menu.newGame')"
            @click="grimoire.newGame">
            <font-awesome-icon icon="hand-sparkles" />
          </button>
          <button class="button" :disabled="grimoire.gamePhase !== 'pregame'" :title="t('menu.firstNightSwitch')"
            @click="grimoire.setGamePhase('firstNight')">
            ☽
          </button>
          <button class="button" :disabled="grimoire.gamePhase === 'day' || grimoire.gamePhase === 'pregame'"
            :title="t('menu.daySwitch')" @click="grimoire.setGamePhase('day')">
            ☀
          </button>
          <button class="button" :disabled="grimoire.gamePhase === 'otherNight' || grimoire.gamePhase === 'pregame'"
            :title="t('menu.nightSwitch')" @click="grimoire.setGamePhase('otherNight')">
            ☾
          </button>
          <button class="button" :disabled="grimoire.gamePhase === 'pregame' || grimoire.gamePhase === 'postgame'"
            :title="t('menu.endGame')" @click="grimoire.endGame">
            <font-awesome-icon icon="ranking-star" />
          </button>
        </div>
        <div v-if="grimoire.gamePhase !== 'pregame'" class="button-group">
          <button :title="t('sound.ringing')" @click="soundboard.playSound({ sound: 'ringing' })">
            <font-awesome-icon :icon="['fas', 'bell']" />
          </button>
          <button :title="t('sound.rooster')" @click="soundboard.playSound({ sound: 'rooster' })">
            🐔
          </button>
          <button :title="t('sound.gavel')" @click="soundboard.playSound({ sound: 'gavel' })">
            <font-awesome-icon :icon="['fas', 'gavel']" />
          </button>
          <button :title="t('sound.death')" @click="soundboard.playSound({ sound: 'death' })">
            🪦
          </button>
          <button :title="t('sound.drumRoll')" @click="soundboard.playSound({ sound: 'drumRoll' })">
            🥁
          </button>
        </div>
        <div v-if="grimoire.gamePhase !== 'pregame' && grimoire.gamePhase !== 'postgame'" class="button-group">
          <button :title="t('menu.secretVote')" @click="grimoire.setSecretVote(!grimoire.isSecretVote)">
            <font-awesome-icon v-if="grimoire.isSecretVote" :icon="['fas', 'eye-slash']" />
            <font-awesome-icon v-if="!grimoire.isSecretVote" :icon="['fas', 'eye']" />
          </button>
        </div>
        <div v-if="grimoire.gamePhase === 'pregame'">
          <div class="button-group">
            <button @click="session.copySessionUrl()">
              {{ t('menu.link') }}
            </button>
          </div>
          <div class="button-group">
            <button @click="playersStore.addPlayers()">
              {{ t('menu.addPlayers') }}
            </button>
          </div>
          <div class="button-group">
            <button @click="grimoire.toggleModal('edition')">
              {{ t('menu.selectEdition') }}
            </button>
          </div>
          <div class="button-group">
            <button @click="grimoire.toggleModal('roles')">
              {{ t('menu.assign') }}
            </button>
          </div>
          <div class="button-group">
            <button @click="playersStore.distributeRolesAction()">
              {{ t('menu.sendRoles') }}
            </button>
          </div>
        </div>
        <div v-if="grimoire.gamePhase === 'day'">
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
          <div v-if="votingStore.nomination" class="button-group">
            <button v-if="!isSpecialVoteWithMessages" @click="setAccusationTimer()">
              {{ t('townsquare.timer.accusation.button') }}
            </button>
            <button v-else @click="setSpecialVoteTimer()">
              {{
                votingStore.nomination.specialVote?.buttonLabel
                || votingStore.nomination.specialVote?.type
                || 'Special Vote'
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
        </div>
        <div v-if="grimoire.gamePhase === 'postgame'">
          <h4>{{ t('postgame.announceWinner') }}</h4>
          <div class="button-group">
            <div class="button townsfolk" @click="grimoire.announceWinner('good')">
              {{ t('postgame.good') }}
            </div>
            <div class="button demon" @click="grimoire.announceWinner('evil')">
              {{ t('postgame.evil') }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="grimoire.gamePhase === 'firstNight' || grimoire.gamePhase === 'otherNight'"
        class="night-order-container">
        <div v-if="grimoire.gamePhase === 'firstNight' && !session.isPlayerOrSpectator" class="button-group">
          <button @click="playersStore.distributeRolesAction()">
            {{ t('menu.sendRoles') }}
          </button>
        </div>
        <NightOrderTable :night-type="grimoire.gamePhase" />
      </div>
      <div v-if="!session.sessionId">
        <div class="button-group">
          <button @click="session.hostSession">{{ t('menu.storyteller') }}</button>
        </div>
        <div class="button-group">
          <button @click="session.joinSession">{{ t('menu.player') }}</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { NightOrderTable } from '@/components';
import { isActiveNomination } from '@/services';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
  useSoundboardStore,
  useUserPreferencesStore,
  useVotingStore,
} from "@/stores";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const playersStore = usePlayersStore();
const session = useSessionStore();
const soundboard = useSoundboardStore();
const userPreferences = useUserPreferencesStore();
const votingStore = useVotingStore();
const t = locale.t;

const players = computed(() => playersStore.players);

const isSpecialVoteWithMessages = computed(() => {
  if (!isActiveNomination(votingStore.nomination)) return false;
  const nomination = votingStore.nomination;
  return !!nomination.specialVote?.timerText;
});

// Helper function to capitalize first letter of a string
const capitalizeString = (str: string): string => {
  if (!str || str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Reactive data
const isSideMenuOpen = ref(true);
const timerName = ref("Timer");
const timerDuration = ref(1);
const timerOn = ref(false);
const timerEnder = ref<ReturnType<typeof setTimeout> | null>(null);
const currentTimerType = ref<keyof typeof userPreferences.timerDurations | null>(null);

// Methods
const toggleSideMenu = () => {
  isSideMenuOpen.value = !isSideMenuOpen.value;
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
  timerDuration.value = userPreferences.timerDurations.daytime;
  timerName.value = t('townsquare.timer.daytime.text');
};

const setNominationTimer = () => {
  currentTimerType.value = 'nominations';
  timerDuration.value = userPreferences.timerDurations.nominations;
  timerName.value = t('townsquare.timer.nominations.text');
};

const setDuskTimer = () => {
  currentTimerType.value = 'dusk';
  timerDuration.value = userPreferences.timerDurations.dusk;
  timerName.value = t('townsquare.timer.dusk.text');
};

const setAccusationTimer = () => {
  if (!isActiveNomination(votingStore.nomination)) return;

  currentTimerType.value = 'accusation';
  timerDuration.value = 1;
  const nomination = votingStore.nomination;

  let timerText = t('townsquare.timer.accusation.text');

  // Get nominator name for $accusator placeholder
  let nominatorName = '';
  if (typeof nomination.nominator === 'number') {
    nominatorName = players.value[nomination.nominator]?.name || '';
  } else if (typeof nomination.nominator === 'string') {
    nominatorName = capitalizeString(nomination.nominator);
  }

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
  if (!isActiveNomination(votingStore.nomination)) return;

  currentTimerType.value = 'defense';
  timerDuration.value = userPreferences.timerDurations.defense;
  const nomination = votingStore.nomination;

  let timerText = t('townsquare.timer.defense.text');

  // Get nominee name for $accusee placeholder
  let nomineeName = '';
  if (typeof nomination.nominee === 'number') {
    nomineeName = players.value[nomination.nominee]?.name || '';
  } else if (typeof nomination.nominee === 'string') {
    nomineeName = capitalizeString(nomination.nominee);
  }

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
  if (!isActiveNomination(votingStore.nomination)) return;

  currentTimerType.value = 'debate';
  timerDuration.value = userPreferences.timerDurations.debate;
  const nomination = votingStore.nomination;

  let timerText = t('townsquare.timer.debate.text');

  // Get nominee name for $accusee placeholder
  const nomineeName = typeof nomination.nominee === 'number'
    ? players.value[nomination.nominee]?.name || ''
    : nomination.nominee || '';

  timerText = timerText.replace("$accusee", nomineeName);
  timerName.value = timerText;
};

const setSpecialVoteTimer = () => {
  if (!isActiveNomination(votingStore.nomination)) return;

  currentTimerType.value = 'custom';
  timerDuration.value = userPreferences.timerDurations.custom;
  const nomination = votingStore.nomination;

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
  if (!isActiveNomination(votingStore.nomination)) return;

  currentTimerType.value = 'customDebate';
  timerDuration.value = userPreferences.timerDurations.customDebate;
  const nomination = votingStore.nomination;

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
  if (Number.isNaN(Number(newDuration))) {
    return alert(t('townsquare.timer.prompt.durationError'));
  }
  if (Number(newDuration) > 0) {
    timerDuration.value = Number(newDuration);
    // Save the new duration for the current timer type
    if (currentTimerType.value) {
      userPreferences.timerDurations[currentTimerType.value] = Number(newDuration);
    }
  }
};

const startTimer = () => {
  const timer = { name: timerName.value, duration: timerDuration.value * 60 };
  grimoire.setTimer(timer);
  timerOn.value = true;
  timerEnder.value = setTimeout(stopTimer, timer.duration * 1000);
};

const stopTimer = () => {
  grimoire.setTimer({});
  timerOn.value = false;
  if (timerEnder.value) {
    clearTimeout(timerEnder.value);
  }
};

const dayDown = () => {
  grimoire.setDayCount(grimoire.dayCount - 1);
  if (grimoire.gamePhase === "otherNight" && grimoire.dayCount === 1) {
    grimoire.setGamePhase("firstNight");
  }
}

</script>

<style scoped lang="scss">
@use "../vars.scss" as *;

.sideMenu {
  position: absolute;

  .content {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 85vh;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--background-color);
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

  bottom: 10px;
  left: auto;
  right: 10px;
  width: min-content;
  background: var(--background-color);
  backdrop-filter: blur(3px);
  border-radius: 10px;
  border: 3px solid var(--border-color);
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
  transform-origin: bottom left;
  transform: scale(1);
  opacity: 1;
  transition: all 250ms ease-in-out;
  z-index: 50;

  h3 {
    margin: 5px 1vh 0 0;
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
        margin-left: 0.25rem;
        margin-right: 0.5rem;
      }

      &.fa-plus-circle {
        margin-left: 0.25rem;
        margin-right: 0.5rem;
        display: none;
      }
    }
  }

  .button-group {
    transition: all 250ms;
  }

  .night-order-container {
    margin: 5px;
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

  #daycounter {
    display: inline-block;

    svg {
      height: 1rem;
      opacity: 0;
    }

    &:hover svg {
      opacity: 1;
    }
  }
}

h4 {
  text-align: center;
}
</style>

<style lang="scss">
.sideMenu h3 svg:hover path {
  fill: url(#demon);
  stroke-width: 30px;
  stroke: white;
}
</style>
