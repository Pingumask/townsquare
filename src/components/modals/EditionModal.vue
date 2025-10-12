<template>
  <Modal v-if="modals.edition" class="editions" @close="toggleModal('edition')">
    <h3>{{ t('modal.edition.title') }}</h3>
    <ul>
      <li class="tabs" :class="tab">
        <span class="tab" icon="book-open" :class="{ active: tab == 'official' }" @click="tab = 'official'">{{
          t('modal.edition.tab.official') }}</span>
        <span class="tab" icon="tower-broadcast" :class="{ active: tab == 'popular' }" @click="tab = 'popular'">{{
          t('modal.edition.tab.popular') }}</span>
        <span class="tab" icon="question" :class="{ active: tab == 'custom' }" @click="tab = 'custom'">{{
          t('modal.edition.tab.custom') }}</span>
        <span class="tab" icon="question" :class="{ active: tab == 'build' }" @click="
          initPool();
        tab = 'build';
        ">{{ t('modal.edition.tab.build') }}</span>
      </li>
      <template v-if="tab == 'official'">
        <ul class="editions">
          <li v-for="edition in editions.official" :key="edition.id" class="edition" :class="['edition-' + edition.id]"
            :style="{ backgroundImage: `url(${logoPath(edition)})` }" @click="runEdition(edition)">
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
        <h3>{{ t('modal.edition.tab.teensyville') }}</h3>
        <ul class="scripts">
          <li v-for="(script, index) in editions.teensyville" :key="index" @click="launchScript(script[1])">
            {{ script[0] }}
          </li>
        </ul>
      </template>
      <template v-if="tab == 'custom'">
        <div class="custom">
          {{ t('modal.edition.custom.introStart') }}
          <a href="https://script.bloodontheclocktower.com/" target="_blank">
            {{ t('modal.edition.custom.scriptTool') }}
          </a>
          {{ t('modal.edition.custom.introEnd') }}.<br>
          <br>
          {{ t('modal.edition.custom.instructionsStart') }}
          <a href="https://github.com/bra1n/townsquare#custom-characters" target="_blank">{{
            t('modal.edition.custom.documentation') }}n</a>
          {{ t('modal.edition.custom.instructionsEnd') }}<br>
          <b>{{ t('modal.edition.custom.warning') }}</b>
          <input ref="upload" type="file" accept="application/json" @change="handleUpload">
        </div>
        <div class="button-group">
          <div class="button" @click="openUpload">
            <font-awesome-icon icon="file-upload" />
            {{ t('modal.edition.custom.upload') }}
          </div>
          <div class="button" @click="promptURL">
            <font-awesome-icon icon="link" />
            {{ t('modal.edition.custom.url') }}
          </div>
          <div class="button" @click="readFromClipboard">
            <font-awesome-icon icon="clipboard" />
            {{ t('modal.edition.custom.clipboard') }}
          </div>
        </div>
      </template>
      <template v-if="tab == 'build'">
        <section v-for="team in teams" :key="team" class="build team" :class="team">
          <aside class="aside">
            <div>
              <h4>{{ t(`modal.reference.teamNames.${team}`) }}</h4>
              <strong>{{ selectedInTeam(team) }}</strong>
            </div>
          </aside>
          <ul class="roles" :class="team">
            <li v-for="role in rolesForTeam(team)" :key="role.id" class="role" @click="toggleRole(role.id)">
              <Token :role="role" :unchecked="!role.selected" />
            </li>
          </ul>
        </section>
        <div class="button-group">
          <div class="button" @click="resetBuilt">
            <font-awesome-icon :icon="['fas', 'trash-alt']" />
          </div>
          <div class="button" @click="selectAll">
            <font-awesome-icon :icon="['fab', 'docker']" />
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

<script setup lang="ts">
import type { Role, Edition, ToggleableRole, ParsedRole, ScriptMeta } from "@/types";
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { Modal, Token } from "@/components";
import { useTranslation } from '@/composables';

const { t } = useTranslation();
const store = useStore();
const tab = ref("official");

// Get rolesJSON from the store's getters
const rolesJSON = computed(() => store.getters.rolesJSONbyId || new Map());
const draftPool = ref<ToggleableRole[]>([]);
const teams = ["townsfolk", "outsider", "minion", "demon"] as const;
const recommendedTeamSize: Record<string, number> = {
  townsfolk: 13,
  outsider: 4,
  minion: 4,
  demon: 4,
};

const modals = computed(() => store.state.modals);
const editions = computed(() => store.state.editions);
const roles = computed(() => store.state.roles);
const jinxes = computed(() => store.state.jinxes);

function initPool() {
  draftPool.value = Array.from(rolesJSON.value.values()) as ToggleableRole[];
  resetBuilt();
  for (let [role] of roles.value) {
    toggleRole(role);
  }
}

function toggleRole(id: string) {
  const role = draftPool.value.find((r: ToggleableRole) => r.id === id);
  if (role) {
    role.selected = !role.selected;
  }
}

function rolesForTeam(team: string) {
  return draftPool.value?.filter((role: ToggleableRole) => role.team === team) ?? [];
}

function selectedInTeam(team: string) {
  return draftPool.value?.filter(
    (role: ToggleableRole) => role.team === team && role.selected,
  ).length;
}

function resetBuilt() {
  for (let role of draftPool.value) {
    role.selected = false;
  }

}
function selectAll() {
  for (let role of draftPool.value) {
    role.selected = true;
  }
}

function randomizeBuilt() {
  resetBuilt();
  for (let team of teams) {
    let currentPool = rolesForTeam(team);
    for (let i = 0; i < (recommendedTeamSize[team] || 0); i++) {
      if (currentPool.length > 0) {
        let picked = currentPool.splice(
          Math.floor(Math.random() * currentPool.length),
          1,
        )[0];
        if (picked) {
          picked.selected = true;
        }
      }
    }
  }
}

function startBuilt() {
  const selected = draftPool.value.filter((role: ToggleableRole) => role.selected);
  parseRoles(selected);
}

function openUpload() {
  const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
  fileInput?.click();
}

function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file?.size) {
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const result = reader.result as string;
      const uploadedRoles = JSON.parse(result);
      parseRoles(uploadedRoles);
    } catch (e) {
      const error = e as Error;
      alert(`Error reading custom script: ${error.message}`);
    }
    target.value = "";
  });
  reader.readAsText(file);
}

function promptURL() {
  const url = prompt(t('prompt.customUrl'));
  if (url) {
    handleURL(url);
  }
}

function logoPath(edition: Edition) {
  return new URL(`../../assets/logos/${edition.logo}.png`, import.meta.url).href;
}

async function launchScript(fileName: string) {
  await handleURL(`/scripts/${fileName}`);
}

async function handleURL(url: string) {
  const res = await fetch(url);
  if (res?.json) {
    try {
      const script = await res.json();
      parseRoles(script);
    } catch (e) {
      const error = e as Error;
      alert(`${t('prompt.customError')}: ${error.message}`);
    }
  }
}

async function readFromClipboard() {
  const text = await navigator.clipboard.readText();
  try {
    const uploadedRoles = JSON.parse(text);
    parseRoles(uploadedRoles);
  } catch (e) {
    const error = e as Error;
    alert(`Error reading custom script: ${error.message}`);
  }
}

function parseRoles(pickedRoles: (string | ParsedRole)[]) {
  if (!pickedRoles || !pickedRoles.length) return;
  const processedRoles = pickedRoles.map((role: string | ParsedRole) =>
    typeof role === "string" ? { id: role } : role,
  );
  const metaIndex = processedRoles.findIndex(({ id }: ParsedRole) => id === "_meta");
  const meta: ScriptMeta = metaIndex > -1 ? processedRoles.splice(metaIndex, 1).pop() || {} : {};
  store.commit("setCustomRoles", processedRoles);
  store.commit("setEdition", { ...meta, id: "custom" });
  const fabled: Role[] = [];
  let djinnAdded = false;
  let djinnNeeded = false;
  let bootleggerAdded = false;
  let bootleggerNedded = false;
  processedRoles.forEach((role: ParsedRole) => {
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
      jinxes.value.get(role.id).forEach((_reason: string, second: string) => {
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

function runEdition(edition: Edition) {
  store.commit("setEdition", edition);
  store.commit("players/setFabled", { fabled: [] });
}

function toggleModal(modal: string) {
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
    font-size: clamp(16px, calc(-1.1429rem + 4.2857vw), 28px);
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
  font-size: clamp(16px, calc(-1.1429rem + 4.2857vw), 28px);
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
      font-size: clamp(12px, 0.4rem + 1.6vh, 20px);
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
