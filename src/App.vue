<template>
  <div id="app" tabindex="-1" :class="{
    night: grimoire.isNight,
    static: grimoire.isStatic,
  }" :style="{
    backgroundImage: `url('${background}')`,
    backgroundColor: `${backgroundColor}`,
  }" @keyup="keyup">
    <video v-if="background && background.match(/\.(mp4|webm)$/i)" id="background" :src="background" autoplay loop />
    <div class="backdrop" />

    <Intro v-if="!players.length" />
    <TownInfo v-if="players.length && !session.nomination" />
    <Vote v-if="session.nomination" />

    <TownSquare />
    <Menu ref="menuRef" />
    <EditionModal />
    <FabledModal />
    <RolesModal />
    <ReferenceModal />
    <NightOrderModal />
    <VoteHistoryModal />
    <GameStateModal />
    <SpecialVoteModal />
    <Gradients />
    <span id="version">v{{ version }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "vuex";
import app from "../package.json";
import Gradients from "./components/Gradients.vue";
import Intro from "./components/Intro.vue";
import Menu from "./components/Menu.vue";
import EditionModal from "./components/modals/EditionModal.vue";
import FabledModal from "./components/modals/FabledModal.vue";
import GameStateModal from "./components/modals/GameStateModal.vue";
import NightOrderModal from "./components/modals/NightOrderModal.vue";
import ReferenceModal from "./components/modals/ReferenceModal.vue";
import RolesModal from "./components/modals/RolesModal.vue";
import SpecialVoteModal from "./components/modals/SpecialVoteModal.vue";
import VoteHistoryModal from "./components/modals/VoteHistoryModal.vue";
import TownInfo from "./components/TownInfo.vue";
import TownSquare from "./components/TownSquare.vue";
import Vote from "./components/Vote.vue";

const store = useStore();
const version = app.version;

// Type for Menu component exposed methods
interface MenuRef {
  addPlayer: () => void;
  hostSession: () => void;
  joinSession: () => void;
  toggleNight: () => void;
  toggleRinging: () => void;
}

const menuRef = ref<MenuRef | null>(null);

const grimoire = computed(() => store.state.grimoire);
const session = computed(() => store.state.session);
const edition = computed(() => store.state.edition);
const players = computed(() => store.state.players.players);

const background = computed(() => {
  if (grimoire.value.isStreamerMode) {
    return "none";
  }
  return grimoire.value.background || edition.value.background || "none";
});

const backgroundColor = computed(() => {
  return grimoire.value.isStreamerMode ? "#000000" : "transparent";
});

function keyup({ key, ctrlKey, metaKey }: KeyboardEvent) {
  if (ctrlKey || metaKey) return;
  switch (key.toLocaleLowerCase()) {
    case "g":
      store.commit("toggleGrimoire");
      break;
    case "a":
      menuRef.value?.addPlayer();
      break;
    case "h":
      menuRef.value?.hostSession();
      break;
    case "j":
      menuRef.value?.joinSession();
      break;
    case "r":
      store.commit("toggleModal", "reference");
      break;
    case "n":
      store.commit("toggleModal", "nightOrder");
      break;
    case "e":
      if (session.value.isSpectator) return;
      store.commit("toggleModal", "edition");
      break;
    case "c":
      if (session.value.isSpectator) return;
      store.commit("toggleModal", "roles");
      break;
    case "v":
      if (session.value.voteHistory.length || !session.value.isSpectator) {
        store.commit("toggleModal", "voteHistory");
      }
      break;
    case "s":
      if (session.value.isSpectator) return;
      menuRef.value?.toggleNight();
      break;
    case "b":
      if (session.value.isSpectator) return;
      menuRef.value?.toggleRinging();
      break;
    case "escape":
      store.commit("toggleModal");
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
  font-size: 1.2em;
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
  color: $townsfolk;

  &:hover {
    color: $demon;
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

.button {
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

  &.disabled {
    color: gray;
    cursor: default;
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
  transition: opacity 1s ease-in-out;

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
</style>
