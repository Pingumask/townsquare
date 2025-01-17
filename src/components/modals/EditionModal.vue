<template>
  <Modal class="editions" v-if="modals.edition" @close="toggleModal('edition')">
    <h3>{{ locale.modal.edition.title }}</h3>
    <ul>
      <li class="tabs" :class="tab">
        <span class="tab" icon="book-open" @click="tab = 'official'" :class="{ active: tab == 'official' }">{{
          locale.modal.edition.tab.official }}</span>
        <span class="tab" icon="tower-broadcast" @click="tab = 'popular'" :class="{ active: tab == 'popular' }">{{
          locale.modal.edition.tab.popular }}</span>
        <span class="tab" icon="question" @click="tab = 'custom'" :class="{ active: tab == 'custom' }">{{
          locale.modal.edition.tab.custom }}</span>
        <span class="tab" icon="question" @click="
          initPool();
        tab = 'build';
        " :class="{ active: tab == 'build' }">{{ locale.modal.edition.tab.build }}</span>
      </li>
      <template v-if="tab == 'official'">
        <ul class="editions">
          <li v-for="edition in editions.official" class="edition" :class="['edition-' + edition.id]"
            :style="{ backgroundImage: `url(${logoPath(edition)})` }" :key="edition.id" @click="runEdition(edition)">
            {{ edition.name }}
          </li>
        </ul>
      </template>
      <template v-if="tab == 'popular'">
        <ul class="scripts">
          <li v-for="(script, index) in editions.popular" :key="index" @click="launchScript(script[1])">
            {{ script[0] }}
          </li>
        </ul>
        <h3>{{ locale.modal.edition.tab.teensyville }}</h3>
        <ul class="scripts">
          <li v-for="(script, index) in editions.teensyville" :key="index" @click="launchScript(script[1])">
            {{ script[0] }}
          </li>
        </ul>
      </template>
      <template v-if="tab == 'custom'">
        <div class="custom">
          {{ locale.modal.edition.custom.introStart }}
          <a href="https://script.bloodontheclocktower.com/" target="_blank">
            {{ locale.modal.edition.custom.scriptTool }}
          </a>
          {{ locale.modal.edition.custom.introEnd }}.<br />
          <br />
          {{ locale.modal.edition.custom.instructionsStart }}
          <a href="https://github.com/bra1n/townsquare#custom-characters" target="_blank">{{
            locale.modal.edition.custom.documentation }}n</a>
          {{ locale.modal.edition.custom.instructionsEnd }}<br />
          <b>{{ locale.modal.edition.custom.warning }}</b>
          <input type="file" ref="upload" accept="application/json" @change="handleUpload" />
        </div>
        <div class="button-group">
          <div class="button" @click="openUpload">
            <font-awesome-icon icon="file-upload" />
            {{ locale.modal.edition.custom.upload }}
          </div>
          <div class="button" @click="promptURL">
            <font-awesome-icon icon="link" />
            {{ locale.modal.edition.custom.url }}
          </div>
          <div class="button" @click="readFromClipboard">
            <font-awesome-icon icon="clipboard" />
            {{ locale.modal.edition.custom.clipboard }}
          </div>
        </div>
      </template>
      <template v-if="tab == 'build'">
        <section v-for="team in teams" :key="team" class="build team" :class="team">
          <aside class="aside">
            <div>
              <h4>{{ locale.modal.reference.teamNames[team] }}</h4>
              <strong>{{ selectedInTeam(team) }}</strong>
            </div>
          </aside>
          <ul class="roles" :class="team">
            <li v-for="role in rolesForTeam(team)" class="role" :key="role.id" @click="toggleRole(role.id)">
              <Token :role="role" :unchecked="!role.selected" />
            </li>
          </ul>
        </section>
        <div class="button-group">
          <div class="button" @click="resetBuilt">
            <font-awesome-icon :icon="['fas', 'trash-alt']" />
          </div>
          <div class="button" @click="initPool">
            <font-awesome-icon :icon="['fas', 'redo-alt']" />
          </div>
          <div class="button" @click="randomizeBuilt">
            <font-awesome-icon :icon="['fas', 'random']" />
          </div>
          <div class="button" @click="startBuilt">
            <font-awesome-icon :icon="['fas', 'play']" />
          </div>
        </div>
      </template>
    </ul>
  </Modal>
</template>

<script setup>
import { computed, ref } from "vue";
import { useStore } from "vuex";
import Modal from "./Modal.vue";
import { rolesJSON } from "../../store/modules/locale";
import Token from "../Token.vue";

const store = useStore();
const tab = ref("official");
const draftPool = ref(rolesJSON);
const teams = ["townsfolk", "outsider", "minion", "demon"];
const recommendedTeamSize = {
  townsfolk: 13,
  outsider: 4,
  minion: 4,
  demon: 4,
};

const modals = computed(() => store.state.modals);
const locale = computed(() => store.state.locale);
const editions = computed(() => store.state.editions);
const roles = computed(() => store.state.roles);
const jinxes = computed(() => store.state.jinxes);

function initPool() {
  draftPool.value = rolesJSON.default;
  resetBuilt();
  for (let [role] of roles.value) {
    toggleRole(role);
  }
}

function toggleRole(id) {
  const role = draftPool.value.find((r) => r.id === id);
  if (role) {
    role.selected = !role.selected;
  }
}

function rolesForTeam(team) {
  return draftPool.value?.filter((role) => role.team === team && !role.outOfDate) ?? [];
}

function selectedInTeam(team) {
  return draftPool.value?.filter(
    (role) => role.team === team && role.selected,
  ).length;
}

function resetBuilt() {
  for (let role of draftPool.value) {
    role.selected = false;
  }
}

function randomizeBuilt() {
  resetBuilt();
  for (let team of teams) {
    let currentPool = rolesForTeam(team);
    for (let i = 0; i < recommendedTeamSize[team]; i++) {
      let picked = currentPool.splice(
        Math.floor(Math.random() * currentPool.length),
        1,
      )[0];
      picked.selected = true;
    }
  }
}

function startBuilt() {
  const selected = draftPool.value.filter((role) => role.selected);
  parseRoles(selected);
}

function openUpload() {
  document.querySelector("input[type='file']").click();
}

function handleUpload(event) {
  const file = event.target.files[0];
  if (!file?.size) {
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const uploadedRoles = JSON.parse(reader.result);
      parseRoles(uploadedRoles);
    } catch (e) {
      alert(`Error reading custom script: ${e.message}`);
    }
    event.target.value = "";
  });
  reader.readAsText(file);
}

function promptURL() {
  const url = prompt(locale.value.prompt.customUrl);
  if (url) {
    handleURL(url);
  }
}

function logoPath(edition) {
  return new URL(`../../assets/logos/${edition.logo}.png`, import.meta.url).href;
}

async function launchScript(fileName) {
  await handleURL(`/scripts/${fileName}`);
}

async function handleURL(url) {
  const res = await fetch(url);
  if (res?.json) {
    try {
      const script = await res.json();
      parseRoles(script);
    } catch (e) {
      alert(`${locale.value.prompt.customError}: ${e.message}`);
    }
  }
}

async function readFromClipboard() {
  const text = await navigator.clipboard.readText();
  try {
    const uploadedRoles = JSON.parse(text);
    parseRoles(uploadedRoles);
  } catch (e) {
    alert(`Error reading custom script: ${e.message}`);
  }
}

function parseRoles(pickedRoles) {
  if (!pickedRoles || !pickedRoles.length) return;
  pickedRoles = pickedRoles.map((role) =>
    typeof role === "string" ? { id: role } : role,
  );
  const metaIndex = pickedRoles.findIndex(({ id }) => id === "_meta");
  const meta = metaIndex > -1 ? pickedRoles.splice(metaIndex, 1).pop() : {};
  store.commit("setCustomRoles", pickedRoles);
  store.commit("setEdition", { ...meta, id: "custom" });
  const fabled = [];
  let djinnAdded = false;
  let djinnNeeded = false;
  let bootleggerAdded = false;
  let bootleggerNedded = false;
  pickedRoles.forEach((role) => {
    if (store.state.fabled.has(role.id || role)) {
      fabled.push(store.state.fabled.get(role.id || role));
      if ((role.id || role) == "djinn") {
        djinnAdded = true;
      } else if ((role.id || role) == "bootlegger") {
        bootleggerAdded = true;
      }
    } else if (role.edition == "custom" || role.image) {
      /* If the role isn't fabled, but detected as custom, we will need a Bootlegger
           * NB: The actual version isn't perfect, since they only detect custom roles with an image or with the argument "edition":"custom".
           * The code will could be changed later, when all non-custom roles will have an attribute "edition"
           */
      bootleggerNedded = true;
    } else if (!djinnAdded && !djinnNeeded && jinxes.value.get(role.id)) {
      // If the role isn't fabled, neither custom, and if we neither added a Djinn neither planned to add a Djinn, we look if this role is jinxed
      jinxes.value.get(role.id).forEach((reason, second) => {
        if (roles.value.get(second)) {
          djinnNeeded = true;
        }
      });
    }
  });
  if (djinnNeeded && !djinnAdded) {
    fabled.push(store.state.fabled.get("djinn"));
  }
  if (bootleggerNedded && !bootleggerAdded) {
    fabled.push(store.state.fabled.get("bootlegger"));
  }
  store.commit("players/setFabled", { fabled });
}

function runEdition(edition) {
  store.commit("setEdition", edition);
  store.commit("players/setFabled", { fabled: [] });
}

function toggleModal(modal) {
  store.commit('toggleModal', modal);
}
</script>

<style scoped lang="scss">
@use "../../vars.scss" as *;

ul {
  width: 100%;
}

ul.editions {
  .edition {
    font-family: PiratesBay, sans-serif;
    letter-spacing: 1px;
    text-align: center;
    padding-top: 15%;
    background-position: center center;
    background-size: 100% auto;
    background-repeat: no-repeat;
    width: 30%;
    margin: 5px;
    font-size: 120%;
    text-shadow:
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000,
      0 0 5px rgba(0, 0, 0, 0.75);
    cursor: pointer;

    &:hover {
      color: red;
    }
  }
}

.build .role {
  width: 4vmax;
}

.tabs {
  display: flex;
  padding: 0;
  justify-content: flex-start;
  width: 100%;
  gap: 0.25rem;
  border-bottom: 3px solid white;

  .tab {
    text-align: center;
    flex-grow: 1;
    flex-shrink: 0;
    height: 35px;
    border: 1px solid grey;
    border-radius: 5px 5px 0 0;
    padding: 0.15em 1em;
    cursor: pointer;
    transition: color 250ms;
    user-select: none;

    &:hover {
      color: red;
    }

    &.active {
      background: linear-gradient(rgb(31, 101, 255) 0%,
          rgba(0, 0, 0, 0.5) 100%);
    }
  }
}

.custom {
  text-align: center;
  margin-block: 1em;
}

input[type="file"] {
  display: none;
}

.scripts {
  margin-block: 1em;
  list-style-type: disc;
  font-size: 120%;
  cursor: pointer;
  display: flex;
  gap: 0.75em 1em;
  justify-content: flex-start;

  li {
    text-align: left;
    list-style-type: none;
    border: 1px solid white;
    border-radius: 100vmax;
    padding: 0.15em 1.5em;
    background: linear-gradient(#4e4e4e, #040404);
    user-select: none;

    &:hover {
      color: red;
    }
  }
}

.townsfolk {
  aside {
    background: linear-gradient(-90deg, $townsfolk, transparent);
  }
}

.outsider {
  aside {
    background: linear-gradient(-90deg, $outsider, transparent);
  }
}

.minion {
  aside {
    background: linear-gradient(-90deg, $minion, transparent);
  }
}

.demon {
  aside {
    background: linear-gradient(-90deg, $demon, transparent);
  }
}

.team {
  display: grid;
  width: 100%;
  grid-template-columns: 3rem 1fr;

  aside {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    font-size: 0.7rem;

    strong {
      display: block;
      font-size: 1.4rem;
    }

    div {
      font-size: 1.1rem;
      text-align: center;
      rotate: 90deg;
    }

    h4 {
      margin-block: 0.25rem;
    }
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding-left: 1rem;
    padding-block: 0.25rem;
    overflow: visible;
  }
}
</style>
