<template>
  <div id="app" tabindex="-1" :class="{
    night: (grimoire.gamePhase === 'firstNight' || grimoire.gamePhase === 'otherNight'),
    static: userPreferences.isStatic,
  }" :style="{
    backgroundImage: `url('${background}')`,
    backgroundColor: `${backgroundColor}`,
  }" @keyup="keyup">
    <video v-if="background && background.match(/\.(mp4|webm)$/i)" id="background" :src="background" autoplay loop
      tabindex="-1" aria-hidden="true" aria-label="Decorative background video">
      <track kind="captions" src="" default
        label="This is a user imported background video, it mostly has no sound or only ambient sounds" />
    </video>
    <div class="backdrop" />

    <Intro v-if="!players.length" />
    <TownInfo v-if="players.length && !votingStore.nomination" />
    <Vote v-if="votingStore.nomination" />
    <Parchment v-if="grimoire.showParchment" />

    <TownSquare />
    <Menu />
    <EditionModal />
    <FabledModal />
    <RolesModal />
    <ReferenceModal />
    <NightOrderModal />
    <VoteHistoryModal />
    <GameStateModal />
    <SpecialVoteModal />
    <Notes />
    <Gradients />
    <span id="version">v{{ version }}{{ isBeta ? '-beta' : '' }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import app from "../package.json";
import {
  useGrimoireStore,
  usePlayersStore,
  useSessionStore,
  useSoundboardStore,
  useUserPreferencesStore,
  useVotingStore,
} from "@/stores";
import {
  Gradients,
  Intro,
  Menu,
  Notes,
  TownInfo,
  Vote,
  EditionModal,
  FabledModal,
  GameStateModal,
  NightOrderModal,
  ReferenceModal,
  RolesModal,
  SpecialVoteModal,
  TownSquare,
  VoteHistoryModal,
  Parchment,
} from "@/components";

const grimoire = useGrimoireStore();
const playersStore = usePlayersStore();
const session = useSessionStore();
const soundboard = useSoundboardStore();
const userPreferences = useUserPreferencesStore();
const votingStore = useVotingStore();
const version = app.version;

const edition = computed(() => grimoire.edition);
const players = computed(() => playersStore.players);

const background = computed(() => {
  if (userPreferences.isStreamerMode) {
    return "none";
  }
  return userPreferences.background || edition.value?.background || "none";
});

const backgroundColor = computed(() => {
  return userPreferences.isStreamerMode ? "#000000" : "transparent";
});

const isBeta = computed(() => import.meta.env.MODE === "development");

function keyup(event: KeyboardEvent) {
  const { key, ctrlKey, metaKey } = event;
  const target = event.target as HTMLElement;
  if (ctrlKey || metaKey || ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

  switch (key.toLocaleLowerCase()) {
    case "g":
      userPreferences.hideGrim = !userPreferences.hideGrim;
      break;
    case "a":
      playersStore.addPlayer();
      break;
    case "p":
      playersStore.addPlayers();
      break;
    case "h":
      if (!session.isPlayerOrSpectator && session.sessionId) {
        soundboard.playSound({ sound: "gavel" });
      } else {
        session.hostSession();
      }
      break;
    case "j":
      session.joinSession();
      break;
    case "r":
      grimoire.toggleModal("reference");
      break;
    case "n":
      grimoire.toggleModal("nightOrder");
      break;
    case "e":
      if (session.isPlayerOrSpectator) return;
      grimoire.toggleModal("edition");
      break;
    case "c":
      if (session.isPlayerOrSpectator) return;
      grimoire.toggleModal("roles");
      break;
    case "v":
      if (votingStore.voteHistory.length || !session.isPlayerOrSpectator) {
        grimoire.toggleModal("voteHistory");
      }
      break;
    case "s":
      grimoire.toggleNight();
      break;
    case "b":
      if (session.isPlayerOrSpectator) return;
      soundboard.playSound({ sound: "ringing" });
      break;
    case "d":
      if (session.isPlayerOrSpectator) return;
      soundboard.playSound({ sound: "rooster" });
      break;
    case "escape":
      grimoire.toggleModal(null);
      break;
    case "q":
      userPreferences.notes.opened = !userPreferences.notes.opened;
      break;
  }
}
</script>

<style lang="scss">
@use "vars" as *;
@use "media" as *;

@font-face {
  font-family: "Papyrus";
  src:
    url("assets/fonts/papyrus.woff2") format("woff2"),
    /* chrome firefox */
    url("assets/fonts/papyrus.woff") format("woff"),
    /* chrome firefox */
    url("assets/fonts/papyrus.ttf") format("truetype"),
    /* chrome firefox opera Safari, Android, iOS 4.2+*/
    url("assets/fonts/papyrus.svg#PapyrusW01") format("svg");
  /* iOS 4.1- */
}

@font-face {
  font-family: PiratesBay;
  src: url("assets/fonts/piratesbay.ttf");
  font-display: swap;
}

html,
body {
  font-size: clamp(0.8em, 2.5vmin, 1.2em);
  line-height: 1.4;
  background: url("assets/background.jpg") center center;
  background-size: cover;
  color: white;
  height: 100%;
  font-family: "Roboto Condensed", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

* {
  box-sizing: border-box;
  position: relative;
}

a {
  color: var(--townsfolk);

  &:hover {
    color: var(--demon);
  }
}

h1,
h2,
h3,
h4,
h5 {
  margin: 0;
  text-align: center;
  font-family: PiratesBay, sans-serif;
  letter-spacing: 1px;
  font-weight: normal;
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

#app {
  height: 100%;
  background-position: center center;
  background-size: cover;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;

  // disable all animations
  &.static *,
  &.static *:after,
  &.static *:before {
    transition: none !important;
    animation: none !important;
  }
}

#version {
  position: absolute;
  text-align: center;
  bottom: 0;
  font-size: 60%;
  opacity: 0.5;
}

.blur-enter-active,
.blur-leave-active {
  transition: all 250ms;
  filter: blur(0);
}

.blur-enter,
.blur-leave-to {
  opacity: 0;
  filter: blur(20px);
}

// Buttons
.button-group {
  display: flex;
  align-items: center;
  justify-content: center;
  align-content: center;

  button,
  .button {
    margin: 5px 0;
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 15px;
      border-bottom-left-radius: 15px;
    }

    &:last-child {
      border-top-right-radius: 15px;
      border-bottom-right-radius: 15px;
    }
  }
}

button,
.button {
  font-family: "Roboto Condensed", sans-serif;
  font-size: 1.2rem;
  padding: 0;
  border: solid 0.125em transparent;
  border-radius: 15px;
  box-shadow:
    inset 0 1px 1px #9c9c9c,
    0 0 10px #000;
  background:
    radial-gradient(at 0 -15%, rgba(#fff, 0.07) 70%, rgba(#fff, 0) 71%) 0 0/ 80% 90% no-repeat content-box,
    linear-gradient(#4e4e4e, #040404) content-box,
    linear-gradient(#292929, #010101) border-box;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px rgba(0, 0, 0, 0.5);
  line-height: 170%;
  margin: 5px auto;
  cursor: pointer;
  transition: all 200ms;
  white-space: nowrap;

  &:hover {
    color: red;
  }

  &[disabled],
  &.disabled {
    color: gray;
    cursor: not-allowed;
    opacity: 0.75;
  }

  &:before,
  &:after {
    content: " ";
    display: inline-block;
    width: 10px;
    height: 10px;
  }

  &.townsfolk {
    background:
      radial-gradient(at 0 -15%,
        rgba(255, 255, 255, 0.07) 70%,
        rgba(255, 255, 255, 0) 71%) 0 0/80% 90% no-repeat content-box,
      linear-gradient(#0031ad, rgba(5, 0, 0, 0.22)) content-box,
      linear-gradient(#292929, #001142) border-box;
    box-shadow:
      inset 0 1px 1px #002c9c,
      0 0 10px #000;

    &hover:not([disabled]),
    &:hover:not(.disabled) {
      color: #008cf7;
    }
  }

  &.demon {
    background:
      radial-gradient(at 0 -15%,
        rgba(255, 255, 255, 0.07) 70%,
        rgba(255, 255, 255, 0) 71%) 0 0/80% 90% no-repeat content-box,
      linear-gradient(#ad0000, rgba(5, 0, 0, 0.22)) content-box,
      linear-gradient(#292929, #420000) border-box;
    box-shadow:
      inset 0 1px 1px #9c0000,
      0 0 10px #000;
  }
}

/* video background */
video#background {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Night phase backdrop */
#app>.backdrop {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  pointer-events: none;
  background: black;
  background: linear-gradient(180deg,
      rgba(0, 0, 0, 1) 0%,
      rgba(1, 22, 46, 1) 50%,
      rgba(0, 39, 70, 1) 100%);
  opacity: 0;
  transition: all 1s ease-in-out;

  &:after {
    content: " ";
    display: block;
    width: 100%;
    padding-right: 2000px;
    height: 100%;
    background: url("assets/clouds.png") repeat;
    background-size: 2000px auto;
    animation: move-background 120s linear infinite;
    opacity: 0.3;
  }
}

@keyframes move-background {
  from {
    transform: translate3d(-2000px, 0px, 0px);
  }

  to {
    transform: translate3d(0px, 0px, 0px);
  }
}

#app.night>.backdrop {
  opacity: 0.5;
}

#app.night {
  filter: grayscale(15%) saturate(85%);
}
</style>
