<template>
  <div id="controls">
    <span v-show="votingStore.voteHistory.length && session.sessionId" class="nomlog-summary"
      :title="`${votingStore.voteHistory.length} recent ${votingStore.voteHistory.length == 1 ? 'nomination' : 'nominations'}`"
      @click="grimoire.toggleModal('voteHistory')">
      <font-awesome-icon icon="book-dead" class="fa fa-book-dead" />
      {{ votingStore.voteHistory.length }}
    </span>
    <span v-if="session.sessionId" class="session"
      :title="`${session.playerCount} other players in this session${session.ping ? ' (' + session.ping + 'ms latency)' : ''}`"
      :class="{ spectator: session.isPlayerOrSpectator, reconnecting: session.isReconnecting }"
      @click="session.leaveSession">
      <font-awesome-icon :icon="['fas', 'tower-broadcast']" class="fa fa-tower-broadcast" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: userPreferences.isMenuOpen }">
      <font-awesome-icon icon="cog" class="fa fa-cog"
        @click="userPreferences.isMenuOpen = !userPreferences.isMenuOpen" />
      <ul>
        <li class="tabs" :class="tab">
          <font-awesome-icon :icon="['fas', 'tower-broadcast']" class="fa fa-tower-broadcast"
            :class="{ active: tab === 'session' }" @click="tab = 'session'" />
          <font-awesome-icon icon="bars-progress" class="fa fa-bars-progress" :class="{ active: tab === 'options' }"
            @click="tab = 'options'" />
          <font-awesome-icon v-if="!session.isPlayerOrSpectator" icon="users" class="fa fa-users"
            :class="{ active: tab === 'setup' }" @click="tab = 'setup'" />
          <font-awesome-icon v-if="!session.isPlayerOrSpectator" icon="book-open" class="fa fa-book-open"
            :class="{ active: tab === 'storytelling' }" @click="tab = 'storytelling'" />
          <font-awesome-icon v-if="!session.isPlayerOrSpectator" icon="chair" class="fa fa-chair"
            :class="{ active: tab === 'playersMenu' }" @click="tab = 'playersMenu'" />
          <font-awesome-icon v-if="!session.isPlayerOrSpectator" icon="music" class="fa fa-music"
            :class="{ active: tab === 'soundboard' }" @click="tab = 'soundboard'" />
          <font-awesome-icon icon="theater-masks" class="fa fa-theater-masks" :class="{ active: tab === 'gameplay' }"
            @click="tab = 'gameplay'" />
          <font-awesome-icon icon="question" class="fa fa-question" :class="{ active: tab === 'about' }"
            @click="tab = 'about'" />
        </li>

        <template v-if="tab === 'session'">
          <!-- Session -->
          <li v-if="session.sessionId" class="headline">
            {{
              session.isPlayerOrSpectator
                ? t('menu.tabs.session.player')
                : t('menu.tabs.session.host')
            }}
          </li>
          <li v-else class="headline">
            {{ t('menu.tabs.session.create') }}
          </li>
          <template v-if="!session.sessionId">
            <li @click="session.hostSession">
              {{ t('menu.storyteller') }}<em>[H]</em>
            </li>
            <li @click="session.joinSession">
              {{ t('menu.player') }}<em>[J]</em>
            </li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              {{ t('menu.delay') }}
              {{ session.isPlayerOrSpectator ? t('menu.host') : t('menu.players') }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li @click="session.copySessionUrl">
              {{ t('menu.link') }}
              <em><font-awesome-icon icon="copy" class="fa fa-copy" /></em>
            </li>
            <li @click="session.leaveSession()">
              {{ t('menu.leave') }}
              <em>{{ userPreferences.isStreamerMode ? "(hidden)" : session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'options'">
          <!-- Options -->
          <li class="headline">
            {{ t('menu.tabs.options') }}
          </li>
          <li v-if="players.length" @click="userPreferences.hideGrim = !userPreferences.hideGrim">
            {{ userPreferences.hideGrim ? t('menu.show') : t('menu.hide') }}
            <em>[G]</em>
          </li>
          <li v-if="session.isPlayerOrSpectator"
            @click="userPreferences.orderBubblesAsPlayer = !userPreferences.orderBubblesAsPlayer">
            {{ t('menu.order') }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                userPreferences.orderBubblesAsPlayer ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li v-else @click="userPreferences.orderBubblesAsHost = !userPreferences.orderBubblesAsHost">
            {{ t('menu.order') }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                userPreferences.orderBubblesAsHost ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li v-if="players.length">
            {{ t('menu.zoom') }}
            <em>
              <font-awesome-icon icon="search-minus" class="fa fa-search-minus"
                @click="userPreferences.zoom = Math.max(userPreferences.zoom - 1, -5)" />
              {{ Math.round(100 + userPreferences.zoom * 10) }}%
              <font-awesome-icon icon="search-plus" class="fa fa-search-plus"
                @click="userPreferences.zoom = Math.min(userPreferences.zoom + 1, 10)" />
            </em>
          </li>
          <li>
            {{ t('menu.language') }}
            <em>
              <font-awesome-icon icon="chevron-left" class="fa fa-chevron-left" @click="previousLanguage" />
              {{ locale.currentLanguage.toUpperCase() }}
              <font-awesome-icon icon="chevron-right" class="fa fa-chevron-right" @click="nextLanguage" />
            </em>
          </li>
          <li @click="setBackground()">
            {{ t('menu.background') }}
            <em><font-awesome-icon icon="image" class="fa fa-image" /></em>
          </li>
          <li v-if="!grimoire.edition?.isOfficial" @click="imageOptIn">
            <small>{{ t('menu.customImages') }}</small>
            <em><font-awesome-icon :icon="[
              'fas',
              userPreferences.isImageOptIn ? 'check-square' : 'square',
            ]" /></em>
          </li>
          <li @click="userPreferences.isStreamerMode = !userPreferences.isStreamerMode">
            <small>{{ t('menu.streamerMode') }}</small>
            <em><font-awesome-icon :icon="[
              'fas',
              userPreferences.isStreamerMode ? 'check-square' : 'square',
            ]" /></em>
          </li>
          <li @click="userPreferences.isStatic = !userPreferences.isStatic">
            {{ t('menu.animations') }}
            <em><font-awesome-icon :icon="['fas', userPreferences.isStatic ? 'check-square' : 'square']" /></em>
          </li>
          <li @click="userPreferences.isMuted = !userPreferences.isMuted">
            {{ t('menu.mute') }}
            <em><font-awesome-icon :icon="['fas', userPreferences.isMuted ? 'volume-mute' : 'volume-up']" /></em>
          </li>
        </template>

        <template v-if="tab === 'setup' && !session.isPlayerOrSpectator">
          <!-- Setup -->
          <li class="headline">
            {{ t('menu.tabs.setup') }}
          </li>
          <li @click="grimoire.newGame">
            {{ t('menu.newGame') }}
            <em><font-awesome-icon icon="hand-sparkles" class="fa fa-hand-sparkles" /></em>
          </li>
          <li v-if="players.length < 20" @click="playersStore.addPlayer()">
            {{ t('menu.addPlayer') }}<em>[A]</em>
          </li>
          <li v-if="players.length < 19" @click="playersStore.addPlayers()">
            {{ t('menu.addPlayers') }}<em>[P]</em>
          </li>
          <li v-if="players.length > 2" @click="playersStore.randomize()">
            {{ t('menu.randomizeSeats') }}
            <em><font-awesome-icon icon="dice" class="fa fa-dice" /></em>
          </li>
          <li v-if="players.length" @click="playersStore.clearPlayers">
            {{ t('menu.removeSeats') }}
            <em><font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" /></em>
          </li>
          <li v-if="players.length" @click="playersStore.clearRoles(false)">
            {{ t('menu.clearRoles') }}
            <em><font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" /></em>
          </li>
          <li v-if="!session.isPlayerOrSpectator" @click="grimoire.toggleModal('edition')">
            {{ t('menu.selectEdition') }}
            <em>[E]</em>
          </li>
          <li v-if="!session.isPlayerOrSpectator" @click="grimoire.toggleModal('fabled')">
            {{ t('menu.addFabled') }}
            <em><font-awesome-icon icon="dragon" class="fa fa-dragon" /></em>
          </li>
          <li v-if="!session.isPlayerOrSpectator && players.length > 4" @click="grimoire.toggleModal('roles')">
            {{ t('menu.assign') }}
            <em>[C]</em>
          </li>
          <li v-if="!session.isPlayerOrSpectator" @click="playersStore.distributeRolesAction()">
            {{ t('menu.sendRoles') }}
            <em><font-awesome-icon icon="theater-masks" class="fa fa-theater-masks" /></em>
          </li>
          <li @click="grimoire.endGame">
            {{ t('menu.endGame') }}
            <em><font-awesome-icon icon="ranking-star" class="fa fa-ranking-star" /></em>
          </li>
        </template>

        <template v-if="tab === 'storytelling'">
          <!-- Storytelling -->
          <li class="headline">
            {{ t('menu.tabs.storytelling') }}
          </li>
          <li v-if="session.sessionId" @click="grimoire.toggleNight">
            <template v-if="grimoire.gamePhase === 'pregame'">
              {{ t('menu.firstNightSwitch') }}
            </template>
            <template v-if="grimoire.gamePhase === 'firstNight' || grimoire.gamePhase === 'otherNight'">
              {{ t('menu.daySwitch') }}
            </template>
            <template v-if="grimoire.gamePhase === 'day'">
              {{ t('menu.nightSwitch') }}
            </template>
            <em>[S]</em>
          </li>
          <li v-if="!session.isPlayerOrSpectator" @click="playersStore.distributeRolesAction()">
            {{ t('menu.sendRoles') }}
            <em><font-awesome-icon icon="theater-masks" class="fa fa-theater-masks" /></em>
          </li>
          <li @click="grimoire.setSecretVote(!grimoire.isSecretVote)">
            {{ t('menu.secretVote') }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                grimoire.isSecretVote ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li :class="{ disabled: !grimoire.isVoteHistoryAllowed && session.isPlayerOrSpectator }"
            @click="grimoire.toggleModal('voteHistory')">
            {{ t('menu.voteHistory') }}<em>[V]</em>
          </li>
          <li @click="grimoire.setVoteHistoryAllowed(!grimoire.isVoteHistoryAllowed)">
            {{ t('menu.allowVoteHistory') }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                grimoire.isVoteHistoryAllowed ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="grimoire.setAllowSelfNaming(!grimoire.allowSelfNaming)">
            {{ t('menu.selfNaming') }}
            <em><font-awesome-icon :icon="[
              'fas',
              grimoire.allowSelfNaming ? 'check-square' : 'square',
            ]" /></em>
          </li>
        </template>

        <template v-if="tab === 'playersMenu' && !session.isPlayerOrSpectator">
          <!-- Players' Menu -->
          <li class="headline">{{ t('menu.tabs.playersMenu') }}</li>
          <li @click="playersMenu.changePronouns = !playersMenu.changePronouns">
            <small>
              <div>
                <font-awesome-icon icon="venus-mars" class="fa fa-venus-mars" />
                {{ t('player.changePronouns') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.changePronouns ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.changeName = !playersMenu.changeName">
            <small>
              <div>
                <font-awesome-icon icon="user-edit" class="fa fa-user-edit" />
                {{ t('player.changeName') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.changeName ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.movePlayer = !playersMenu.movePlayer">
            <small>
              <div>
                <font-awesome-icon icon="redo-alt" class="fa fa-redo-alt" />
                {{ t('player.movePlayer') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.movePlayer ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.swapPlayers = !playersMenu.swapPlayers">
            <small>
              <div>
                <font-awesome-icon icon="exchange-alt" class="fa fa-exchange-alt" />
                {{ t('player.swapPlayers') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.swapPlayers ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.removePlayer = !playersMenu.removePlayer">
            <small>
              <div>
                <font-awesome-icon icon="times-circle" class="fa fa-times-circle" />
                {{ t('player.removePlayer') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.removePlayer ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.swapAlignment = !playersMenu.swapAlignment">
            <small>
              <div>
                <font-awesome-icon icon="yin-yang" class="fa fa-yin-yang" />
                {{ t('player.swapAlignment') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.swapAlignment ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="playersMenu.specialVote = !playersMenu.specialVote">
            <small>
              <div>
                <font-awesome-icon icon="vote-yea" class="fa fa-vote-yea" />
                {{ t('player.specialVote') }}
              </div>
            </small>
            <em>
              <font-awesome-icon :icon="[
                'fas',
                playersMenu.specialVote ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
        </template>

        <template v-if="tab === 'soundboard'">
          <!-- Soundboard -->
          <li class="headline">
            {{ t('menu.tabs.soundboard') }}
          </li>
          <li @click="soundboard.playSound({ sound: 'ringing' })">
            {{ t('sound.ringing') }}
            <em>[B]</em>
          </li>
          <li @click="soundboard.playSound({ sound: 'rooster' })">
            {{ t('sound.rooster') }}
            <em>[D]</em>
          </li>
          <li @click="soundboard.playSound({ sound: 'gavel' })">
            {{ t('sound.gavel') }}
            <em>[H]</em>
          </li>
        </template>

        <template v-if="tab === 'gameplay'">
          <!-- Gameplay -->
          <li class="headline">
            {{ t('menu.tabs.gameplay') }}
          </li>
          <li @click="grimoire.toggleModal('reference')">
            {{ t('menu.reference') }}
            <em>[R]</em>
          </li>
          <li @click="grimoire.toggleModal('nightOrder')">
            {{ t('menu.nightOrder') }}
            <em>[N]</em>
          </li>
          <li :class="{ disabled: !grimoire.isVoteHistoryAllowed && session.isPlayerOrSpectator }"
            @click="grimoire.toggleModal('voteHistory')">
            {{ t('menu.voteHistory') }}<em>[V]</em>
          </li>
          <li v-if="players.length" @click="playersStore.clearRoles(false)">
            {{ t('menu.clearRoles') }}
            <em><font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'about'">
          <li class="headline">
            {{ t('menu.tabs.about') }}
          </li>
          <li @click="grimoire.toggleModal('gameState')">
            {{ t('menu.gameState') }}
            <em><font-awesome-icon icon="file-code" class="fa fa-file-code" /></em>
          </li>
          <li>
            <a href="https://discord.gg/gD3AB8qCrw" target="_blank">
              {{ t('menu.discord') }}
            </a>
            <em>
              <a href="https://discord.gg/gD3AB8qCrw" target="_blank">
                <font-awesome-icon :icon="['fab', 'discord']" />
              </a>
            </em>
          </li>
          <li>
            <a href="https://github.com/Pingumask/townsquare" target="_blank">
              {{ t('menu.source') }}
            </a>
            <em>
              <a href="https://github.com/Pingumask/townsquare" target="_blank">
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
          <li>
            <a href="https://github.com/Pingumask/townsquare/issues" target="_blank">
              {{ t('menu.issues') }}<br />
              {{ t('menu.request') }}
            </a>
            <em>
              <a href="https://github.com/Pingumask/townsquare/issues" target="_blank">
                <font-awesome-icon :icon="['fa', 'bug']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useGrimoireStore,
  useLocaleStore,
  usePlayersStore,
  usePlayersMenuStore,
  useSessionStore,
  useSoundboardStore,
  useUserPreferencesStore,
  useVotingStore,
} from "@/stores";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const playersStore = usePlayersStore();
const playersMenu = usePlayersMenuStore();
const session = useSessionStore();
const soundboard = useSoundboardStore();
const userPreferences = useUserPreferencesStore();
const votingStore = useVotingStore();
const t = locale.t;

const players = computed(() => playersStore.players);

type Tab = 'session' | 'options' | 'setup' | 'storytelling' | 'playersMenu' | 'soundboard' | 'gameplay' | 'about';
const tab = ref<Tab>('session');

const setBackground = () => {
  const background = prompt(t('prompt.background'));
  if (background || background === '') {
    userPreferences.background = background;
  }
};

const imageOptIn = () => {
  if (userPreferences.isImageOptIn || confirm(t('prompt.imageOptIn'))) {
    userPreferences.isImageOptIn = !userPreferences.isImageOptIn;
  }
};

const supportedLangs = ['en', 'fr', 'es'];

const nextLanguage = () => {
  const currentIndex = supportedLangs.indexOf(locale.currentLanguage);
  const nextIndex = (currentIndex + 1) % supportedLangs.length;
  locale.forceLocale(supportedLangs[nextIndex]);
};

const previousLanguage = () => {
  const currentIndex = supportedLangs.indexOf(locale.currentLanguage);
  const prevIndex = (currentIndex - 1 + supportedLangs.length) % supportedLangs.length;
  locale.forceLocale(supportedLangs[prevIndex]);
};
</script>

<style scoped lang="scss">
@use "../vars.scss" as *;

// success animation
@keyframes greenToWhite {
  from {
    color: green;
  }

  to {
    color: white;
  }
}

// Controls
#controls {
  position: absolute;
  right: 3px;
  top: 3px;
  text-align: right;
  padding-right: 50px;
  z-index: 75;

  svg {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));

    &.success {
      animation: greenToWhite 1s normal forwards;
      animation-iteration-count: 1;
    }
  }

  >span {
    display: inline-block;
    cursor: pointer;
    z-index: 5;
    margin-top: 7px;
    margin-left: 10px;
  }

  span.nomlog-summary {
    color: var(--townsfolk);
  }

  span.session {
    color: var(--demon);

    &.spectator {
      color: var(--townsfolk);
    }

    &.reconnecting {
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  50% {
    opacity: 0.5;
    color: gray;
  }
}

.fa svg {
  height: 1rem;
}

.menu {
  width: 260px;
  transform-origin: 244px 20px;
  transition: transform 500ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform: rotate(-90deg);
  position: absolute;
  right: 0;
  top: 0;
  user-select: none;

  &.open {
    transform: rotate(0deg);
  }

  >svg {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    margin-bottom: -8px;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    padding: 5px 5px 18px;
  }

  a {
    color: white;
    text-decoration: none;
  }

  li:hover a {
    color: red;
  }

  ul {
    display: flex;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
    border-radius: 10px 0 10px 10px;

    li {
      padding: 2px 5px;
      color: white;
      text-align: left;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 30px;

      &.tabs {
        display: flex;
        padding: 0;

        svg {
          flex-grow: 1;
          flex-shrink: 0;
          border-bottom: 3px solid black;
          border-right: 3px solid black;
          padding: 5px 0;
          cursor: pointer;
          transition: color 250ms;

          &:hover {
            color: red;
          }

          &:last-child {
            border-right: 0;
          }
        }

        .active {
          background: linear-gradient(to bottom,
              var(--townsfolk) 0%,
              rgba(0, 0, 0, 0.5) 100%);
        }
      }

      &:not(.headline) {
        cursor: pointer;

        &:not(.tabs):not(.disabled):hover {
          color: red;
        }

        &.disabled {
          color: gray;
          cursor: not-allowed;
        }
      }

      em {
        flex-grow: 0;
        font-style: normal;
        margin-left: 10px;
        font-size: 80%;
      }

    }

    .headline {
      font-family: PiratesBay, sans-serif;
      letter-spacing: 1px;
      padding: 0 10px;
      text-align: center;
      justify-content: center;
      background: linear-gradient(to right,
          var(--townsfolk) 0%,
          rgba(0, 0, 0, 0.5) 20%,
          rgba(0, 0, 0, 0.5) 80%,
          var(--demon) 100%);
    }
  }
}
</style>
