<template>
  <Modal class="editions" v-if="modals.edition" @close="toggleModal('edition')">
    <h3>{{ locale.modal.edition.title }}</h3>
    <ul>
      <li class="tabs" :class="tab">
        <span
          class="tab"
          icon="book-open"
          @click="tab = 'official'"
          :class="{ active: tab == 'official' }"
          >{{ locale.modal.edition.tab.official }}</span
        >
        <span
          class="tab"
          icon="broadcast-tower"
          @click="tab = 'popular'"
          :class="{ active: tab == 'popular' }"
          >{{ locale.modal.edition.tab.popular }}</span
        >
        <span
          class="tab"
          icon="question"
          @click="tab = 'custom'"
          :class="{ active: tab == 'custom' }"
          >{{ locale.modal.edition.tab.custom }}</span
        >
        <span
          class="tab"
          icon="question"
          @click="
            initPool();
            tab = 'build';
          "
          :class="{ active: tab == 'build' }"
          >{{ locale.modal.edition.tab.build }}</span
        >
      </li>
      <template v-if="tab == 'official'">
        <ul class="editions">
          <li
            v-for="edition in editions.official"
            class="edition"
            :class="['edition-' + edition.id]"
            :style="{
              backgroundImage: `url(${editionPath(edition)})`,
            }"
            :key="edition.id"
            @click="runEdition(edition)"
          >
            {{ edition.name }}
          </li>
        </ul>
      </template>
      <template v-if="tab == 'popular'">
        <ul class="scripts">
          <li
            v-for="(script, index) in editions.popular"
            :key="index"
            @click="handleURL(script[1])"
          >
            {{ script[0] }}
          </li>
        </ul>
        <h3>{{ locale.modal.edition.tab.teensyville }}</h3>
        <ul class="scripts">
          <li
            v-for="(script, index) in editions.teensyville"
            :key="index"
            @click="handleURL(script[1])"
          >
            {{ script[0] }}
          </li>
        </ul>
      </template>
      <template v-if="tab == 'custom'">
        <div class="custom">
          {{ locale.modal.edition.custom.introStart }}
          <a href="https://script.bloodontheclocktower.com/" target="_blank">{{
            locale.modal.edition.custom.scriptTool
          }}</a>
          {{ locale.modal.edition.custom.introEnd }}.<br />
          <br />
          {{ locale.modal.edition.custom.instructionsStart }}
          <a
            href="https://github.com/bra1n/townsquare#custom-characters"
            target="_blank"
            >{{ locale.modal.edition.custom.documentation }}n</a
          >
          {{ locale.modal.edition.custom.instructionsEnd }}<br />
          <b>{{ locale.modal.edition.custom.warning }}</b>
          <input
            type="file"
            ref="upload"
            accept="application/json"
            @change="handleUpload"
          />
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
        <section
          v-for="team in teams"
          :key="team"
          class="build team"
          :class="team"
        >
          <aside class="aside">
            <div>
              <h4>{{ locale.modal.reference.teamNames[team] }}</h4>
              <strong>{{ selectedInTeam(team) }}</strong>
            </div>
          </aside>
          <ul class="roles" :class="team">
            <li
              v-for="role in rolesForTeam(team)"
              class="role"
              :class="{ selected: role.selected }"
              :key="role.id"
              @click="toggleRole(role.id)"
            >
              <Token :role="role" />
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

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal.vue";
import { rolesJSON } from "../../store/modules/locale";
import Token from "../Token.vue";

export default {
  components: {
    Modal,
    Token,
  },
  data() {
    return {
      tab: "official",
      draftPool: rolesJSON,
      teams: ["townsfolk", "outsider", "minion", "demon"],
      recommendedTeamSize: {
        townsfolk: 13,
        outsider: 4,
        minion: 4,
        demon: 4,
      },
    };
  },
  computed: {
    ...mapState(["modals", "locale", "editions", "roles", "jinxes"]),
  },
  methods: {
    initPool() {
      console.log("init pool");
      this.draftPool = rolesJSON.default;
      this.resetBuilt();
      for (let [role] of this.roles) {
        this.toggleRole(role);
      }
    },
    toggleRole(id) {
      const role = this.draftPool.find((r) => r.id === id);
      if (role) {
        this.$set(role, "selected", !role.selected);
      }
    },
    rolesForTeam(team) {
      return this.draftPool?.filter((role) => role.team === team) ?? [];
    },
    selectedInTeam(team) {
      return this.draftPool?.filter(
        (role) => role.team === team && role.selected,
      ).length;
    },
    resetBuilt() {
      for (let role of this.draftPool) {
        this.$set(role, "selected", false);
      }
    },
    randomizeBuilt() {
      this.resetBuilt();
      for (let team of this.teams) {
        let currentPool = this.rolesForTeam(team);
        for (let i = 0; i < this.recommendedTeamSize[team]; i++) {
          let picked = currentPool.splice(
            Math.floor(Math.random() * currentPool.length),
            1,
          )[0];
          this.$set(picked, "selected", true);
        }
      }
    },
    startBuilt() {
      const selected = this.draftPool.filter((role) => role.selected);
      this.parseRoles(selected);
    },
    openUpload() {
      this.$refs.upload.click();
    },
    handleUpload() {
      const file = this.$refs.upload.files[0];
      if (!file?.size) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        try {
          const uploadedRoles = JSON.parse(reader.result);
          this.parseRoles(uploadedRoles);
        } catch (e) {
          alert(`Error reading custom script: ${e.message}`);
        }
        this.$refs.upload.value = "";
      });
      reader.readAsText(file);
    },
    promptURL() {
      const url = prompt(this.locale.prompt.customUrl);
      if (url) {
        this.handleURL(url);
      }
    },
    async handleURL(url) {
      const res = await fetch(url);
      if (res?.json) {
        try {
          const script = await res.json();
          this.parseRoles(script);
        } catch (e) {
          alert(`${this.locale.prompt.customError}: ${e.message}`);
        }
      }
    },
    async readFromClipboard() {
      const text = await navigator.clipboard.readText();
      try {
        const uploadedRoles = JSON.parse(text);
        this.parseRoles(uploadedRoles);
      } catch (e) {
        alert(`Error reading custom script: ${e.message}`);
      }
    },
    parseRoles(pickedRoles) {
      if (!pickedRoles || !pickedRoles.length) return;
      pickedRoles = pickedRoles.map((role) =>
        typeof role === "string" ? { id: role } : role,
      );
      const metaIndex = pickedRoles.findIndex(({ id }) => id === "_meta");
      const meta = metaIndex > -1 ? pickedRoles.splice(metaIndex, 1).pop() : {};
      this.$store.commit("setCustomRoles", pickedRoles);
      this.$store.commit("setEdition", { ...meta, id: "custom" });
      // set fabled
      const fabled = [];
      let djinnAdded = false;
      let djinnNeeded = false;
      let bootleggerAdded = false;
      let bootleggerNedded = false;
      pickedRoles.forEach((role) => {
        if (this.$store.state.fabled.has(role.id || role)) {
          fabled.push(this.$store.state.fabled.get(role.id || role));
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
        }
        // If the role isn't fabled, neither custom, and if we neither added a Djinn neither planned to add a Djinn, we look if this role is jinxed
        else if (!djinnAdded && !djinnNeeded && this.jinxes.get(role.id)) {
          this.jinxes.get(role.id).forEach((reason, second) => {
            if (this.roles.get(second)) {
              djinnNeeded = true;
            }
          });
        }
      });
      if (djinnNeeded && !djinnAdded) {
        fabled.push(this.$store.state.fabled.get("djinn"));
      }
      if (bootleggerNedded && !bootleggerAdded) {
        fabled.push(this.$store.state.fabled.get("bootlegger"));
      }
      this.$store.commit("players/setFabled", { fabled });
    },
    runEdition(edition) {
      this.$store.commit("setEdition", edition);
      // The editions contain no Fabled
      this.$store.commit("players/setFabled", { fabled: [] });
    },
    editionPath(edition) {
      return new URL(`../../assets/logos/${edition.id}.png`, import.meta.url)
        .href;
    },
    ...mapMutations(["toggleModal", "setEdition"]),
  },
};
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
  opacity: 0.7;

  &.selected {
    opacity: 1;
  }
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
      background: linear-gradient(
        rgb(31, 101, 255) 0%,
        rgba(0, 0, 0, 0.5) 100%
      );
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
    overflow: hidden;
  }
}
</style>
