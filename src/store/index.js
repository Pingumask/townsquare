import Vue from "vue";
import Vuex from "vuex";
import persistence from "./persistence.js";
import socket from "./socket.js";
import players from "./modules/players.js";
import session from "./modules/session.js";
import editionJSON from "../editions.json";

Vue.use(Vuex);

const set = (key) => (state, value) => {
  state.grimoire[key] = value;
};

const toggle = (key) => (state) => {
  state.grimoire[key] = !state.grimoire[key];
};

const loadLocale = async () => {
  const { locale, rolesJSON, jinxesJSON, fabledJSON } = await import(
    "./modules/locale"
  );
  return { locale, rolesJSON, jinxesJSON, fabledJSON };
};

const initializeStore = async () => {
  const { locale, rolesJSON, jinxesJSON, fabledJSON } = await loadLocale();

  const getRolesByEdition = (edition = editionJSON.official[0]) => {
    return new Map(
      rolesJSON.default
        .filter((r) => r.edition === edition.id || edition.roles.includes(r.id))
        .sort((a, b) => b.team.localeCompare(a.team))
        .map((role) => [role.id, role]),
    );
  };

  const getTravelersNotInEdition = (edition = editionJSON.official[0]) => {
    return new Map(
      rolesJSON.default
        .filter(
          (r) =>
            r.team === "traveler" &&
            r.edition !== edition.id &&
            !edition.roles.includes(r.id),
        )
        .map((role) => [role.id, role]),
    );
  };

  const clean = (id) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

  const editionJSONbyId = new Map(
    editionJSON.official.map((edition) => [edition.id, edition]),
  );
  const rolesJSONbyId = new Map(
    rolesJSON.default.map((role) => [role.id, role]),
  );
  const fabled = new Map(fabledJSON.default.map((role) => [role.id, role]));

  // jinxes
  let jinxes = {};
  try {
    jinxes = new Map(
      jinxesJSON.default.map(({ id, hatred }) => [
        clean(id),
        new Map(hatred.map(({ id, reason }) => [clean(id), reason])),
      ]),
    );
  } catch (e) {
    console.error("couldn't load jinxes", e);
  }

  // base definition for custom roles
  const customRole = {
    id: "",
    name: "",
    image: "",
    ability: "",
    edition: "custom",
    firstNight: 0,
    firstNightReminder: "",
    otherNight: 0,
    otherNightReminder: "",
    reminders: [],
    remindersGlobal: [],
    setup: false,
    team: "townsfolk",
    isCustom: true,
  };

  return new Vuex.Store({
    modules: {
      players,
      session,
    },
    state: {
      grimoire: {
        isNight: false,
        isNightOrder: false,
        isRinging: false,
        isPublic: true,
        isMenuOpen: false,
        isStatic: false,
        isMuted: false,
        isImageOptIn: false,
        isStreamerMode: false,
        isOrganVoteMode: false,
        zoom: 0,
        background: "",
        timer: {
          name: "",
          duration: 0,
        },
      },
      modals: {
        edition: false,
        fabled: false,
        gameState: false,
        nightOrder: false,
        reference: false,
        reminder: false,
        role: false,
        roles: false,
        voteHistory: false,
        specialVote: false,
      },
      edition: editionJSONbyId.get("tb"),
      editions: editionJSON,
      roles: getRolesByEdition(),
      otherTravelers: getTravelersNotInEdition(),
      fabled,
      jinxes,
      locale,
    },
    getters: {
      customRolesStripped: ({ roles }) => {
        const customRoles = [];
        const customKeys = Object.keys(customRole);
        const strippedProps = [
          "firstNightReminder",
          "otherNightReminder",
          "isCustom",
        ];
        roles.forEach((role) => {
          if (!role.isCustom) {
            customRoles.push({ id: role.id });
          } else {
            const strippedRole = {};
            for (let prop in role) {
              if (strippedProps.includes(prop)) {
                continue;
              }
              const value = role[prop];
              if (customKeys.includes(prop) && value !== customRole[prop]) {
                strippedRole[customKeys.indexOf(prop)] = value;
              }
            }
            customRoles.push(strippedRole);
          }
        });
        return customRoles;
      },
      rolesJSONbyId: () => rolesJSONbyId,
    },
    mutations: {
      setZoom: set("zoom"),
      setBackground: set("background"),
      toggleMuted: toggle("isMuted"),
      toggleMenu: toggle("isMenuOpen"),
      toggleNightOrder: toggle("isNightOrder"),
      toggleStatic: toggle("isStatic"),
      toggleNight: toggle("isNight"),
      toggleRinging: toggle("isRinging"),
      toggleGrimoire: toggle("isPublic"),
      toggleImageOptIn: toggle("isImageOptIn"),
      toggleStreamerMode: toggle("isStreamerMode"),
      toggleOrganVoteMode: toggle("isOrganVoteMode"),
      setTimer(state, timer) {
        state.grimoire.timer = timer;
      },
      toggleModal({ modals }, name) {
        if (name) {
          modals[name] = !modals[name];
        }
        for (let modal in modals) {
          if (modal === name) continue;
          modals[modal] = false;
        }
      },
      setCustomRoles(state, roles) {
        const processedRoles = roles
          .map((role) => {
            if (role[0]) {
              const customKeys = Object.keys(customRole);
              const mappedRole = {};
              for (let prop in role) {
                if (customKeys[prop]) {
                  mappedRole[customKeys[prop]] = role[prop];
                }
              }
              return mappedRole;
            } else {
              return role;
            }
          })
          .map((role) => {
            role.id = clean(role.id);
            return role;
          })
          .map(
            (role) =>
              rolesJSONbyId.get(role.id) ||
              state.roles.get(role.id) || { ...customRole, ...role },
          )
          .map((role) => {
            if (rolesJSONbyId.get(role.id)) return role;
            role.imageAlt =
              {
                townsfolk: "townsfolk",
                outsider: "outsider",
                minion: "minion",
                demon: "demon",
                fabled: "fabled",
                traveler: "traveler",
              }[role.team] || "custom";
            role.firstNight = Math.abs(role.firstNight);
            role.otherNight = Math.abs(role.otherNight);
            return role;
          })
          .filter((role) => role.name && role.ability && role.team)
          .sort((a, b) => b.team.localeCompare(a.team));

        state.roles = new Map(
          processedRoles
            .filter((role) => role.team !== "fabled")
            .map((role) => [role.id, role]),
        );

        state.fabled = new Map([
          ...processedRoles
            .filter((r) => r.team === "fabled")
            .map((r) => [r.id, r]),
          ...fabledJSON.default.map((role) => [role.id, role]),
        ]);

        state.otherTravelers = new Map(
          rolesJSON.default
            .filter(
              (r) => r.team === "traveler" && !roles.some((i) => i.id === r.id),
            )
            .map((role) => [role.id, role]),
        );
      },
      setEdition(state, edition) {
        if (editionJSONbyId.has(edition.id)) {
          state.edition = editionJSONbyId.get(edition.id);
          state.roles = getRolesByEdition(state.edition);
          state.otherTravelers = getTravelersNotInEdition(state.edition);
        } else {
          state.edition = edition;
        }
        state.modals.edition = false;
      },
    },
    plugins: [persistence, socket],
  });
};

// Create the store and export it
const store = await initializeStore();
export default store;
