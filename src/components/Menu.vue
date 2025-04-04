<template>
  <div id="controls">
    <span class="nomlog-summary" v-show="session.voteHistory.length && session.sessionId"
      :title="`${session.voteHistory.length} recent ${session.voteHistory.length == 1 ? 'nomination' : 'nominations'}`"
      @click="toggleModal('voteHistory')">
      <font-awesome-icon icon="book-dead" class="fa fa-book-dead" />
      {{ session.voteHistory.length }}
    </span>
    <span class="session" v-if="session.sessionId" @click="leaveSession"
      :title="`${session.playerCount} other players in this session${session.ping ? ' (' + session.ping + 'ms latency)' : ''}`"
      :class="{ spectator: session.isSpectator, reconnecting: session.isReconnecting }">
      <font-awesome-icon :icon="['fas', 'tower-broadcast']" class="fa fa-tower-broadcast" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: grimoire.isMenuOpen }">
      <font-awesome-icon icon="cog" class="fa fa-cog" @click="toggleMenu" />
      <ul>
        <li class="tabs" :class="tab">
          <font-awesome-icon icon="book-open" class="fa fa-book-open" @click="tab = 'grimoire'" />
          <font-awesome-icon :icon="['fas', 'tower-broadcast']" class="fa fa-tower-broadcast"
            @click="tab = 'session'" />
          <font-awesome-icon icon="users" class="fa fa-users" v-if="!session.isSpectator" @click="tab = 'players'" />
          <font-awesome-icon icon="theater-masks" class="fa fa-theater-masks" @click="tab = 'characters'" />
          <font-awesome-icon icon="question" class="fa fa-question" @click="tab = 'help'" />
        </li>

        <template v-if="tab === 'grimoire'">
          <!-- Grimoire -->
          <li class="headline">{{ locale.menu.grimoire.title }}</li>
          <li @click="toggleGrimoire" v-if="players.length">
            <template v-if="!grimoire.isPublic">{{ locale.menu.grimoire.hide }}</template>
            <template v-if="grimoire.isPublic">{{ locale.menu.grimoire.show }}</template>
            <em>[G]</em>
          </li>
          <li @click="toggleNight" v-if="!session.isSpectator">
            <template v-if="!grimoire.isNight">{{ locale.menu.grimoire.nightSwitch }}</template>
            <template v-if="grimoire.isNight">{{ locale.menu.grimoire.daySwitch }}</template>
            <em>[S]</em>
          </li>
          <li @click="toggleRinging" v-if="!session.isSpectator">
            {{ locale.menu.grimoire.ringBell }}
            <em>[B]</em>
          </li>
          <li @click="toggleOrganVoteMode" v-if="!session.isSpectator">
            {{ locale.menu.grimoire.organGrinder }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                grimoire.isOrganVoteMode ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li @click="toggleNightOrder" v-if="session.isSpectator">
            {{ locale.menu.grimoire.order }}
            <em>
              <font-awesome-icon :icon="[
                'fas',
                grimoire.isNightOrder ? 'check-square' : 'square',
              ]" />
            </em>
          </li>
          <li v-if="players.length">
            {{ locale.menu.grimoire.zoom }}
            <em>
              <font-awesome-icon @click="setZoom(grimoire.zoom - 1)" icon="search-minus" class="fa fa-search-minus" />
              {{ Math.round(100 + grimoire.zoom * 10) }}%
              <font-awesome-icon @click="setZoom(grimoire.zoom + 1)" icon="search-plus" class="fa fa-search-plus" />
            </em>
          </li>
          <li @click="setBackground">
            {{ locale.menu.grimoire.background }}
            <em><font-awesome-icon icon="image" class="fa fa-image" /></em>
          </li>
          <li v-if="!edition.isOfficial" @click="imageOptIn">
            <small>{{ locale.menu.grimoire.customImages }}</small>
            <em><font-awesome-icon :icon="[
              'fas',
              grimoire.isImageOptIn ? 'check-square' : 'square',
            ]" /></em>
          </li>
          <li @click="streamerMode">
            <small>{{ locale.menu.grimoire.streamerMode }}</small>
            <em><font-awesome-icon :icon="[
              'fas',
              grimoire.isStreamerMode ? 'check-square' : 'square',
            ]" /></em>
          </li>
          <li @click="toggleStatic">
            {{ locale.menu.grimoire.animations }}
            <em><font-awesome-icon :icon="['fas', grimoire.isStatic ? 'check-square' : 'square']" /></em>
          </li>
          <li @click="toggleMuted">
            {{ locale.menu.grimoire.mute }}
            <em><font-awesome-icon :icon="['fas', grimoire.isMuted ? 'volume-mute' : 'volume-up']" /></em>
          </li>
        </template>

        <template v-if="tab === 'session'">
          <!-- Session -->
          <li class="headline" v-if="session.sessionId">
            {{
              session.isSpectator
                ? locale.menu.session.title.player
                : locale.menu.session.title.host
            }}
          </li>
          <li class="headline" v-else>
            {{ locale.menu.session.title.create }}
          </li>
          <template v-if="!session.sessionId">
            <li @click="hostSession">
              {{ locale.menu.session.storyteller }}<em>[H]</em>
            </li>
            <li @click="joinSession">
              {{ locale.menu.session.player }}<em>[J]</em>
            </li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              {{ locale.menu.session.delay }}
              {{ session.isSpectator ? locale.menu.session.host : locale.menu.session.players }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li @click="copySessionUrl">
              {{ locale.menu.session.link }}
              <em><font-awesome-icon icon="copy" class="fa fa-copy" /></em>
            </li>
            <li v-if="!session.isSpectator" @click="distributeRoles">
              {{ locale.menu.session.sendRoles }}
              <em><font-awesome-icon icon="theater-masks" class="fa fa-theater-masks" /></em>
            </li>
            <li v-if="session.voteHistory.length || !session.isSpectator" @click="toggleModal('voteHistory')">
              {{ locale.menu.session.voteHistory }}<em>[V]</em>
            </li>
            <li @click="leaveSession">
              {{ locale.menu.session.leave }}
              <em>{{ session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'players' && !session.isSpectator">
          <!-- Users -->
          <li class="headline">{{ locale.menu.players.title }}</li>
          <li @click="addPlayer" v-if="players.length < 20">
            {{ locale.menu.players.add }}<em>[A]</em>
          </li>
          <li @click="randomizeSeatings" v-if="players.length > 2">
            {{ locale.menu.players.randomize }}
            <em><font-awesome-icon icon="dice" class="fa fa-dice" /></em>
          </li>
          <li @click="clearPlayers" v-if="players.length">
            {{ locale.menu.players.removeAll }}
            <em><font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'characters'">
          <!-- Characters -->
          <li class="headline">{{ locale.menu.characters.title }}</li>
          <li v-if="!session.isSpectator" @click="toggleModal('edition')">
            {{ locale.menu.characters.selectEdition }}
            <em>[E]</em>
          </li>
          <li @click="toggleModal('roles')" v-if="!session.isSpectator && players.length > 4">
            {{ locale.menu.characters.assign }}
            <em>[C]</em>
          </li>
          <li v-if="!session.isSpectator" @click="toggleModal('fabled')">
            {{ locale.menu.characters.addFabled }}
            <em><font-awesome-icon icon="dragon" class="fa fa-dragon" /></em>
          </li>
          <li @click="clearRoles" v-if="players.length">
            {{ locale.menu.characters.removeAll }}
            <em><font-awesome-icon icon="trash-alt" class="fa fa-trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'help'">
          <!-- Help -->
          <li class="headline">{{ locale.menu.help.title }}</li>
          <li @click="toggleModal('reference')">
            {{ locale.menu.help.reference }}
            <em>[R]</em>
          </li>
          <li @click="toggleModal('nightOrder')">
            {{ locale.menu.help.nightOrder }}
            <em>[N]</em>
          </li>
          <li @click="toggleModal('gameState')">
            {{ locale.menu.help.gameState }}
            <em><font-awesome-icon icon="file-code" class="fa fa-file-code" /></em>
          </li>
          <li>
            <a href="https://discord.gg/gD3AB8qCrw" target="_blank">
              {{ locale.menu.help.discord }}
            </a>
            <em>
              <a href="https://discord.gg/gD3AB8qCrw" target="_blank">
                <font-awesome-icon :icon="['fab', 'discord']" />
              </a>
            </em>
          </li>
          <li>
            <a href="https://github.com/Pingumask/townsquare" target="_blank">
              {{ locale.menu.help.source }}
            </a>
            <em>
              <a href="https://github.com/Pingumask/townsquare" target="_blank">
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, defineExpose } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const grimoire = computed(() => store.state.grimoire);
const session = computed(() => store.state.session);
const edition = computed(() => store.state.edition);
const locale = computed(() => store.state.locale);
const players = computed(() => store.state.players.players);

const tab = ref('grimoire');

const setBackground = () => {
  const background = prompt(locale.value.prompt.background);
  if (background || background === '') {
    store.commit('setBackground', background);
  }
};

const hostSession = () => {
  if (session.value.sessionId) return;
  const sessionId = prompt(
    locale.value.prompt.createSession,
    Math.round(Math.random() * 10000),
  );
  if (sessionId) {
    store.commit('session/clearVoteHistory');
    store.commit('session/setSpectator', false);
    store.commit('session/setSessionId', sessionId);
    store.commit('toggleGrimoire', false);
    copySessionUrl();
  }
};

const copySessionUrl = () => {
  const url = window.location.href.split('#')[0];
  const link = url + '#' + session.value.sessionId;
  navigator.clipboard.writeText(link);
};

const distributeRoles = () => {
  if (session.value.isSpectator) return;
  const popup = locale.value.prompt.sendRoles;
  if (confirm(popup)) {
    // Checking all players to see if one of them has a forbidden role
    let forbiddenRole="";
    for (let i=0 ; i<players.value.length && !forbiddenRole ; i++) {
      if(players.value[i].role.forbidden) {
        forbiddenRole = players.value[i].role.name;
      }
    }		
    let confirmedDistribution = (forbiddenRole == "") ;		
    if(!confirmedDistribution) {
      const forbiddenPopup = locale.value.prompt.sendRolesWithForbidden1 + forbiddenRole + locale.value.prompt.sendRolesWithForbidden2;
      confirmedDistribution = confirm(forbiddenPopup);
    }
    if(confirmedDistribution) {
      store.commit('session/distributeRoles', true);
      setTimeout(() => {
        store.commit('session/distributeRoles', false);
      }, 2000);
    }
  }
};

const imageOptIn = () => {
  const popup = locale.value.prompt.imageOptIn;
  if (grimoire.value.isImageOptIn || confirm(popup)) {
    toggleImageOptIn();
  }
};

const streamerMode = () => {
  toggleStreamerMode();
};

const joinSession = () => {
  if (session.value.sessionId) return leaveSession();
  let sessionId = prompt(locale.value.prompt.joinSession);
  if (sessionId.match(/^https?:\/\//i)) {
    sessionId = sessionId.split('#').pop();
  }
  if (sessionId) {
    store.commit('session/clearVoteHistory');
    store.commit('session/setSpectator', true);
    store.commit('toggleGrimoire', false);
    store.commit('session/setSessionId', sessionId);
  }
};

const leaveSession = () => {
  if (confirm(locale.value.prompt.leaveSession)) {
    store.commit('session/setSpectator', false);
    store.commit('session/setSessionId', '');
  }
};

const addPlayer = () => {
  if (session.value.isSpectator) return;
  if (players.value.length >= 20) return;
  const name = prompt(locale.value.prompt.addPlayer);
  if (name) {
    store.commit('players/add', name);
  }
};

const randomizeSeatings = () => {
  if (session.value.isSpectator) return;
  if (confirm(locale.value.prompt.randomizeSeatings)) {
    store.dispatch('players/randomize');
  }
};

const clearPlayers = () => {
  if (session.value.isSpectator) return;
  if (confirm(locale.value.prompt.clearPlayers)) {
    if (session.value.nomination) {
      store.commit('session/nomination');
    }
    store.commit('players/clear');
  }
};

const clearRoles = () => {
  if (confirm(locale.value.prompt.clearRoles)) {
    store.dispatch('players/clearRoles');
  }
};

const toggleNight = () => {
  store.commit('toggleNight');
  if (grimoire.value.isNight) {
    store.commit('session/setMarkedPlayer', -1);
  }
};

const toggleOrganVoteMode = () => {
  store.commit('toggleOrganVoteMode');
};

const toggleRinging = () => {
  store.commit('toggleRinging', true);
  setTimeout(() => store.commit('toggleRinging', false), 4000);
};

const toggleGrimoire = () => store.commit('toggleGrimoire');
const toggleMenu = () => store.commit('toggleMenu');
const toggleImageOptIn = () => store.commit('toggleImageOptIn');
const toggleStreamerMode = () => store.commit('toggleStreamerMode');
const toggleMuted = () => store.commit('toggleMuted');
const toggleNightOrder = () => store.commit('toggleNightOrder');
const toggleStatic = () => store.commit('toggleStatic');
const setZoom = (zoom) => store.commit('setZoom', zoom);
const toggleModal = (modal) => store.commit('toggleModal', modal);

defineExpose({
  addPlayer,
  hostSession,
  joinSession,
  toggleNight,
  toggleRinging,
});
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
    color: $townsfolk;
  }

  span.session {
    color: $demon;

    &.spectator {
      color: $townsfolk;
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
  width: 220px;
  transform-origin: 200px 22px;
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

    &:hover {
      color: red;
    }
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

        &.grimoire .fa-book-open,
        &.players .fa-users,
        &.characters .fa-theater-masks,
        &.session .fa-tower-broadcast,
        &.help .fa-question {
          background: linear-gradient(to bottom,
              $townsfolk 0%,
              rgba(0, 0, 0, 0.5) 100%);
        }
      }

      &:not(.headline):not(.tabs):hover {
        cursor: pointer;
        color: red;
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
          $townsfolk 0%,
          rgba(0, 0, 0, 0.5) 20%,
          rgba(0, 0, 0, 0.5) 80%,
          $demon 100%);
    }
  }
}
</style>
