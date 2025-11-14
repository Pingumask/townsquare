import socket from "@/store/socket";
import type {
  Edition,
  EditionsJSON,
  FabledJSON,
  JinxesJSON,
  LocaleModule,
  PlayersMenuState,
  Role,
  RolesJSON,
  RootState,
  StoreLike,
} from "@/types";
import * as Vuex from "vuex";
import editionJSONRaw from "../editions.json";
import players from "./modules/players";
import session from "./modules/session";
import persistence from "./persistence";

const editionJSON = editionJSONRaw as unknown as EditionsJSON;

// helpers
const set =
  (key: keyof RootState["grimoire"]) => (state: RootState, value: unknown) => {
    state.grimoire[key] = value as never;
  };

const toggle =
  (key: keyof RootState["grimoire"]) =>
  ({ grimoire }: RootState, val?: boolean) => {
    if (val === true || val === false) {
      grimoire[key] = val as never;
    } else {
      // flip boolean at runtime; type-safe cast
      grimoire[key] = !grimoire[key] as unknown as never;
    }
  };

const loadLocale = async (): Promise<{
  locale: LocaleModule;
  rolesJSON: RolesJSON;
  jinxesJSON: JinxesJSON;
  fabledJSON: FabledJSON;
}> => {
  const { locale, rolesJSON, jinxesJSON, fabledJSON } = await import(
    "./modules/locale"
  );
  return {
    locale: locale as LocaleModule,
    rolesJSON: rolesJSON as RolesJSON,
    jinxesJSON: jinxesJSON as JinxesJSON,
    fabledJSON: fabledJSON as FabledJSON,
  };
};

const defaultEdition = (): Edition =>
  editionJSON.official[0] ?? {
    id: "custom",
    name: "Custom",
    isOfficial: false,
    roles: [],
  };

const initializeStore = async () => {
  const { locale, rolesJSON, jinxesJSON, fabledJSON } = await loadLocale();

  // Load master locale (English) for fallback
  const masterLocale = (await import(
    "./locale/en/ui.json"
  )) as unknown as LocaleModule;

  const getRolesByEdition = (edition: Edition = defaultEdition()) => {
    return new Map(
      rolesJSON.default
        .filter(
          (r) =>
            r.edition === edition.id || (edition.roles || []).includes(r.id)
        )
        .sort((a, b) => String(b.team).localeCompare(String(a.team)))
        .map((role) => [role.id, role] as const)
    );
  };

  const gettravelersNotInEdition = (edition: Edition = defaultEdition()) => {
    return new Map(
      rolesJSON.default
        .filter(
          (r) =>
            r.team === "traveler" &&
            r.edition !== edition.id &&
            !(edition.roles || []).includes(r.id)
        )
        .map((role) => [role.id, role] as const)
    );
  };

  const clean = (id: string) =>
    id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

  // Create a map for alternate role names to main role IDs
  const alternateRoleMap = new Map<string, string>();
  rolesJSON.default.forEach((role) => {
    if (role.alternates) {
      role.alternates.forEach((alternate) => {
        alternateRoleMap.set(clean(alternate), role.id);
      });
    }
  });

  // Helper function to resolve role ID, checking for alternates
  const resolveRoleId = (id: string): string => {
    const cleanId = clean(id);
    return alternateRoleMap.get(cleanId) || cleanId;
  };

  const editionJSONbyId = new Map(
    editionJSON.official.map((edition) => [edition.id, edition] as const)
  );
  const rolesJSONbyId = new Map(
    rolesJSON.default.map((role) => [role.id, role] as const)
  );
  const fabled = new Map(
    fabledJSON.default.map((role) => [role.id, role] as const)
  );

  // jinxes
  let jinxes: Map<string, Map<string, string>> = new Map();
  try {
    jinxes = new Map(
      jinxesJSON.default.map(
        ({ id, hatred }) =>
          [
            clean(id),
            new Map(
              hatred.map(({ id, reason }) => [clean(id), reason] as const)
            ),
          ] as const
      )
    );
  } catch (e) {
    console.error("couldn't load jinxes", e);
  }

  // base definition for custom roles
  const customRole: Role = {
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

  return new (
    Vuex as unknown as { Store: new (...args: unknown[]) => unknown }
  ).Store({
    modules: {
      players,
      session,
    },
    state: {
      grimoire: {
        disableHotkeys: false,
        isNightOrder: false,
        isRinging: false,
        isRooster: false,
        isPublic: true,
        isMenuOpen: false,
        isStatic: false,
        isMuted: false,
        isImageOptIn: false,
        isStreamerMode: false,

        zoom: 0,
        background: "",
        timer: {
          name: "",
          duration: 0,
        },
        timerDurations: {
          daytime: 6,
          nominations: 2,
          dusk: 1,
          accusation: 0.5,
          defense: 0.5,
          debate: 1,
          custom: 1,
          customDebate: 1,
        },
      },
      playersMenu: {
        changePronouns: false,
        changeName: true,
        movePlayer: true,
        swapPlayers: false,
        removePlayer: true,
        swapAlignment: false,
        specialVote: false,
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
      othertravelers: gettravelersNotInEdition(),
      fabled,
      jinxes,
      locale,
    } as RootState,
    getters: {
      /**
       * Translation function that traverses locale objects using dot notation
       */
      t: (state: RootState) => (key: string) => {
        if (!key || typeof key !== "string") return key;

        const keys = key.split(".");

        // Helper function to traverse nested object
        const traverse = (obj: Record<string, unknown>, keyPath: string[]) => {
          let current: unknown = obj;
          for (const k of keyPath) {
            if (
              current &&
              typeof current === "object" &&
              !Array.isArray(current) &&
              k in (current as Record<string, unknown>)
            ) {
              current = (current as Record<string, unknown>)[k];
            } else {
              return null;
            }
          }
          return current as string | null;
        };

        // First try the current locale
        let result = traverse(state.locale.default, keys);

        // If not found, try the master locale (English)
        if (result === null) {
          result = traverse(masterLocale.default, keys);
        }

        // If still not found, return the original key
        return result !== null ? result : key;
      },
      customRolesStripped: ({ roles }: { roles: Map<string, Role> }) => {
        const customRoles: Array<Record<string, unknown> | { id: string }> = [];
        const customKeys = Object.keys(customRole) as string[];
        const strippedProps = [
          "firstNightReminder",
          "otherNightReminder",
          "isCustom",
        ] as const;
        roles.forEach((role) => {
          if (!role.isCustom) {
            customRoles.push({ id: role.id });
          } else {
            const strippedRole: Record<string, unknown> = {};
            const roleObj = role as unknown as Record<string, unknown>;
            const customObj = customRole as unknown as Record<string, unknown>;
            for (const prop in roleObj) {
              if (strippedProps.includes(prop as typeof strippedProps[number]))
                continue;
              const value = roleObj[prop];
              if (customKeys.includes(prop) && value !== customObj[prop]) {
                strippedRole[String(customKeys[customKeys.indexOf(prop)])] =
                  value;
              }
            }
            customRoles.push(strippedRole);
          }
        });
        return customRoles;
      },
      rolesJSONbyId: () => rolesJSONbyId,
    },
    actions: {
      toggleRinging({
        commit,
      }: {
        commit: (mutation: string, payload?: unknown) => void;
      }) {
        commit("toggleRinging", true);
        setTimeout(() => commit("toggleRinging", false), 4000);
      },
      toggleRooster({
        commit,
      }: {
        commit: (mutation: string, payload?: unknown) => void;
      }) {
        commit("toggleRooster", true);
        setTimeout(() => commit("toggleRooster", false), 3000);
      },
      toggleGavel({
        commit,
      }: {
        commit: (mutation: string, payload?: unknown) => void;
      }) {
        commit("toggleGavel", true);
        setTimeout(() => commit("toggleGavel", false), 2000);
      },
    },
    mutations: {
      setZoom: set("zoom"),
      setBackground: set("background"),
      toggleMuted: toggle("isMuted"),
      toggleMenu: toggle("isMenuOpen"),
      toggleNightOrder: toggle("isNightOrder"),
      toggleStatic: toggle("isStatic"),
      toggleRinging: toggle("isRinging"),
      toggleRooster: toggle("isRooster"),
      toggleGavel: toggle("isGavel"),
      toggleGrimoire: toggle("isPublic"),
      toggleImageOptIn: toggle("isImageOptIn"),
      toggleStreamerMode: toggle("isStreamerMode"),

      setTimer(state: RootState, timer: { name?: string; duration?: number }) {
        state.grimoire.timer = timer as Required<
          Pick<RootState["grimoire"]["timer"], "name" | "duration">
        >;
      },
      setTimerDuration(
        state: RootState,
        {
          type,
          duration,
        }: {
          type: keyof RootState["grimoire"]["timerDurations"];
          duration: number;
        }
      ) {
        state.grimoire.timerDurations[type] = duration;
      },
      setTimerDurations(
        state: RootState,
        durations: Partial<RootState["grimoire"]["timerDurations"]>
      ) {
        state.grimoire.timerDurations = {
          ...state.grimoire.timerDurations,
          ...durations,
        };
      },
      togglePlayersMenu(state: RootState, name: keyof PlayersMenuState) {
        state.playersMenu[name] = !state.playersMenu[name];
      },
      toggleModal({ modals }: RootState, name?: keyof RootState["modals"]) {
        if (name) {
          modals[name] = !modals[name];
        }
        for (const modal in modals) {
          if (modal === name) continue;
          modals[modal as keyof RootState["modals"]] = false;
        }
      },
      setCustomRoles(
        state: RootState,
        roles: Array<Role | Record<string, unknown>>
      ) {
        const processedRoles = roles
          .map((role) => {
            if (Array.isArray(role) && (role as unknown[])[0]) {
              const customKeys = Object.keys(customRole) as string[];
              const mappedRole: Record<string, unknown> = {};
              const roleObj = role as unknown as Record<string, unknown>;
              for (const prop in roleObj) {
                const key = (customKeys as unknown as Record<string, string>)[
                  prop
                ];
                if (key) {
                  mappedRole[key] = roleObj[prop];
                }
              }
              return mappedRole;
            } else {
              return role as unknown as Record<string, unknown>;
            }
          })
          .map((role) => {
            const r = role as unknown as Record<string, unknown>;
            const originalId = String(r["id"]);
            const resolvedId = resolveRoleId(originalId);
            r["id"] = resolvedId;
            return r as unknown as Role;
          })
          .map(
            (role) =>
              rolesJSONbyId.get(role.id) ||
              state.roles.get(role.id) || { ...customRole, ...role }
          )
          .map((role) => {
            if (rolesJSONbyId.get(role.id)) return role;
            const r = role as unknown as Record<string, unknown>;
            r["imageAlt"] =
              (
                {
                  townsfolk: "townsfolk",
                  outsider: "outsider",
                  minion: "minion",
                  demon: "demon",
                  fabled: "fabled",
                  traveler: "traveler",
                } as Record<string, string>
              )[String(role.team)] || "custom";
            role.firstNight = Math.abs(Number(role.firstNight));
            role.otherNight = Math.abs(Number(role.otherNight));
            return role;
          })
          .filter((role) => role.name && role.ability && role.team)
          .sort((a, b) => String(b.team).localeCompare(String(a.team)));

        state.roles = new Map(
          processedRoles
            .filter((role) => role.team !== "fabled" && role.team !== "loric")
            .map((role) => [role.id, role] as const)
        );

        state.fabled = new Map([
          ...processedRoles
            .filter((r) => r.team === "fabled" || r.team === "loric")
            .map((r) => [r.id, r] as const),
          ...fabledJSON.default.map((role) => [role.id, role] as const),
        ]);

        state.othertravelers = new Map(
          rolesJSON.default
            .filter(
              (r) =>
                r.team === "traveler" &&
                !roles.some((i) => (i as Role).id === r.id)
            )
            .map((role) => [role.id, role] as const)
        );
      },
      setEdition(state: RootState, edition: Edition) {
        if (editionJSONbyId.has(edition.id)) {
          state.edition = editionJSONbyId.get(edition.id) as Edition;
          state.roles = getRolesByEdition(state.edition!);
          state.othertravelers = gettravelersNotInEdition(state.edition!);
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
let store: StoreLike<RootState> | null = null;

const getStore = async () => {
  if (!store) {
    store = (await initializeStore()) as StoreLike<RootState>;
  }
  return store;
};

export default getStore;
