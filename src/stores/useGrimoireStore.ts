import { defineStore } from "pinia";
import type {
  GrimoireState,
  Timer,
  TimerDurations,
  Edition,
  EditionsJSON,
  Role,
  Modals,
  GameComposition,
} from "@/types";
import editionJSONRaw from "@/editions.json";

const editionJSON = editionJSONRaw as unknown as EditionsJSON;

import { useLocaleStore } from "./useLocaleStore";

const defaultEdition = (): Edition =>
  editionJSON.official[0] ?? {
    id: "custom",
    name: "Custom",
    isOfficial: false,
    roles: [],
  };

// ... (imports)

export const useGrimoireStore = defineStore("grimoire", {
  state: (): GrimoireState & {
    edition?: Edition | undefined;
    editions: EditionsJSON;
    roles: Map<string, Role>;
    othertravelers: Map<string, Role>;
    fabled: Map<string, Role>;
    jinxes: Map<string, Map<string, string>>;
    // locale removed
    rolesJSONbyId: Map<string, Role>;
    alternateRoleMap: Map<string, string>;
    modals: Modals;
  } => ({
    disableHotkeys: false,
    isNightOrder: false,
    isRinging: false,
    isRooster: false,
    isGavel: false,
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
    // Data that was previously in root state
    edition: undefined as Edition | undefined,
    editions: editionJSON,
    roles: new Map(),
    othertravelers: new Map(),
    fabled: new Map(),
    jinxes: new Map(),
    // locale removed
    rolesJSONbyId: new Map(),
    alternateRoleMap: new Map(),
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
  }),

  getters: {
    t: () => {
      const localeStore = useLocaleStore();
      return localeStore.t;
    },

    customRolesStripped: (state) => {
      // ... (keep existing logic)
      const customRoles: Array<Record<string, unknown> | { id: string }> = [];
      const customRoleBase: Role = {
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
      const customKeys = Object.keys(customRoleBase) as string[];
      const strippedProps = [
        "firstNightReminder",
        "otherNightReminder",
        "isCustom",
      ] as const;

      state.roles.forEach((role) => {
        if (!role.isCustom) {
          customRoles.push({ id: role.id });
        } else {
          const strippedRole: Record<string, unknown> = {};
          const roleObj = role as unknown as Record<string, unknown>;
          const customObj = customRoleBase as unknown as Record<string, unknown>;
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
    }
  },

  actions: {
    async initialize() {
      const localeStore = useLocaleStore();
      await localeStore.initialize();

      const rolesJSON = localeStore.rolesJSON;
      const jinxesJSON = localeStore.jinxesJSON;
      const fabledJSON = localeStore.fabledJSON;

      const clean = (id: string) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

      this.rolesJSONbyId = new Map(
        rolesJSON.default.map((role) => [role.id, role] as const)
      );

      this.alternateRoleMap = new Map();
      rolesJSON.default.forEach((role) => {
        // Map the role's own cleaned ID to its raw ID
        this.alternateRoleMap.set(clean(role.id), role.id);

        if (role.alternates) {
          role.alternates.forEach((alternate) => {
            this.alternateRoleMap.set(clean(alternate), role.id);
          });
        }
      });

      this.jinxes = new Map();
      jinxesJSON.default.forEach((jinx) => {
        const cleanId = clean(jinx.id);
        if (!this.jinxes.has(cleanId)) {
          this.jinxes.set(cleanId, new Map());
        }
        jinx.hatred.forEach((j) => {
          this.jinxes.get(cleanId)?.set(clean(j.id), j.reason);
        });
      });

      this.fabled = new Map(
        fabledJSON.default.map((role) => [role.id, role] as const)
      );

      if (!this.edition) {
        this.setEdition(defaultEdition());
      }
    },

    toggleRinging(value?: boolean) {
      if (value === true || value === false) {
        this.isRinging = value;
      } else {
        this.isRinging = !this.isRinging;
      }
      if (this.isRinging) {
        setTimeout(() => { this.isRinging = false }, 4000);
      }
    },
    toggleRooster(value?: boolean) {
      if (value === true || value === false) {
        this.isRooster = value;
      } else {
        this.isRooster = !this.isRooster;
      }
      if (this.isRooster) {
        setTimeout(() => { this.isRooster = false }, 3000);
      }
    },
    toggleGavel(value?: boolean) {
      if (value === true || value === false) {
        this.isGavel = value;
      } else {
        this.isGavel = !this.isGavel;
      }
      if (this.isGavel) {
        setTimeout(() => { this.isGavel = false }, 2000);
      }
    },

    setZoom(zoom: number) {
      this.zoom = zoom;
    },
    setBackground(background: string) {
      this.background = background;
    },
    toggleMuted(val?: boolean) {
      this.isMuted = val ?? !this.isMuted;
    },
    toggleMenu(val?: boolean) {
      this.isMenuOpen = val ?? !this.isMenuOpen;
    },
    toggleNightOrder(val?: boolean) {
      this.isNightOrder = val ?? !this.isNightOrder;
    },
    toggleStatic(val?: boolean) {
      this.isStatic = val ?? !this.isStatic;
    },
    toggleGrimoire(val?: boolean) {
      this.isPublic = val ?? !this.isPublic;
    },
    toggleImageOptIn(val?: boolean) {
      this.isImageOptIn = val ?? !this.isImageOptIn;
    },
    toggleStreamerMode(val?: boolean) {
      this.isStreamerMode = val ?? !this.isStreamerMode;
    },
    toggleModal(name?: keyof Modals) {
      if (name) {
        this.modals[name] = !this.modals[name];
      }
      for (const modal in this.modals) {
        if (modal === name) continue;
        this.modals[modal as keyof Modals] = false;
      }
    },

    setTimer(timer: { name?: string; duration?: number }) {
      this.timer = timer as Timer;
    },
    setTimerDuration({ type, duration }: { type: keyof TimerDurations; duration: number }) {
      this.timerDurations[type] = duration;
    },
    setTimerDurations(durations: Partial<TimerDurations>) {
      this.timerDurations = { ...this.timerDurations, ...durations };
    },

    setEdition(edition: Edition) {
      this.edition = edition;

      // Clear existing roles and travelers
      this.roles = new Map();
      this.othertravelers = new Map();

      // Helper to clean IDs
      const clean = (id: string) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

      const resolveRoleId = (id: string): string => {
        const cleanId = clean(id);
        return this.alternateRoleMap.get(cleanId) || cleanId;
      };

      // If edition has role IDs, populate roles map from rolesJSONbyId
      if (edition.roles && edition.roles.length > 0) {
        edition.roles.forEach((roleId: string) => {
          // Try exact match first
          let role = this.rolesJSONbyId.get(roleId);

          // If not found, try resolved ID
          if (!role) {
            const resolvedId = resolveRoleId(roleId);
            role = this.rolesJSONbyId.get(resolvedId);
          }

          if (role) {
            this.roles.set(role.id, role);
          } else {
            console.warn(`Role not found for ID: ${roleId}`);
          }
        });
      } else {
        // If no roles array (e.g. official editions), filter by edition ID
        this.rolesJSONbyId.forEach((role) => {
          if (role.edition === edition.id) {
            this.roles.set(role.id, role);
          }
        });
      }

      // Populate othertravelers with travelers NOT in the current edition
      this.othertravelers = new Map(
        Array.from(this.rolesJSONbyId.values())
          .filter(
            (r) =>
              r.team === "traveler" &&
              !this.roles.has(r.id)
          )
          .map((role) => [role.id, role] as const)
      );

      this.modals.edition = false;
    },

    setCustomRoles(roles: Array<Role | Record<string, unknown>>) {
      // Helper to clean IDs
      const clean = (id: string) => id.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

      const resolveRoleId = (id: string): string => {
        const cleanId = clean(id);
        return this.alternateRoleMap.get(cleanId) || cleanId;
      };

      const customRoleBase: Role = {
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

      const customKeys = Object.keys(customRoleBase) as string[];

      const processedRoles = roles
        .map((role) => {
          if (Array.isArray(role) && (role as unknown[])[0]) {
            // Handle array format [name, id, ...] if applicable, or just map keys
            const mappedRole: Record<string, unknown> = {};
            const roleObj = role as unknown as Record<string, unknown>;
            for (const prop in roleObj) {
              const key = (customKeys as unknown as Record<string, string>)[prop];
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
          // Don't modify ID here, just cast
          return role as unknown as Role;
        })
        .map(
          (role) => {
            // Try exact match first
            let found = this.rolesJSONbyId.get(role.id);

            // If not found, try resolved ID
            if (!found) {
              const resolvedId = resolveRoleId(role.id);
              found = this.rolesJSONbyId.get(resolvedId);
            }

            // If found (either exact or resolved), return it
            if (found) return found;

            // If existing in current roles, return it
            if (this.roles.get(role.id)) return this.roles.get(role.id)!;

            // Otherwise, it's a custom role, use original ID
            return { ...customRoleBase, ...role };
          }
        )
        .map((role) => {
          if (this.rolesJSONbyId.get(role.id)) return role;
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

      this.roles = new Map(
        processedRoles
          .filter((role) => role.team !== "fabled" && role.team !== "loric")
          .map((role) => [role.id, role] as const)
      );

      this.fabled = new Map([
        ...processedRoles
          .filter((r) => r.team === "fabled" || r.team === "loric")
          .map((r) => [r.id, r] as const),
        ...Array.from(this.fabled.entries()),
      ]);

      // Re-add custom fabled to the map
      processedRoles
        .filter((r) => r.team === "fabled" || r.team === "loric")
        .forEach(r => this.fabled.set(r.id, r));


      this.othertravelers = new Map(
        Array.from(this.rolesJSONbyId.values())
          .filter(
            (r) =>
              r.team === "traveler" &&
              !this.roles.has(r.id)
          )
          .map((role) => [role.id, role] as const)
      );
    },

    getGameComposition(playerCount: number): GameComposition {
      playerCount = Math.max(playerCount, 5);
      let townsfolk = 0;
      let outsider = 0;
      let minion = 0;
      let demon = 1;

      if (playerCount >= 7) {
        outsider = (playerCount - 7) % 3;
        minion = 1 + Math.floor((playerCount - 7) / 3);
      } else {
        minion = 1;
        outsider = playerCount % 2 ? 1 : 0;
      }
      townsfolk = playerCount - demon - minion - outsider;

      return {
        townsfolk,
        outsider,
        minion,
        demon
      };
    },
  },
  persist: {
    paths: [
      "background",
      "isMuted",
      "isStatic",
      "isImageOptIn",
      "isStreamerMode",
      "isNightOrder",
      "zoom",
      "timerDurations",
      "edition",
      "roles",
      "fabled",
      "othertravelers",
      "isPublic",
    ],
    serializer: {
      serialize: (state: GrimoireState) => {
        const s = state;
        return JSON.stringify({
          ...s,
          roles: Array.from(s.roles.entries()),
          fabled: Array.from(s.fabled.entries()),
          othertravelers: Array.from(s.othertravelers.entries()),
        });
      },
      deserialize: (value: string) => {
        const state = JSON.parse(value);
        return {
          ...state,
          roles: new Map(state.roles),
          fabled: new Map(state.fabled),
          othertravelers: new Map(state.othertravelers),
        };
      },
    },
    afterRestore: (ctx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (ctx.store.isPublic) localStorage.removeItem("isGrimoire");
      else localStorage.setItem("isGrimoire", "1");
      document.title = `Blood on the Clocktower ${ctx.store.isPublic ? "Town Square" : "Grimoire"}`;
    }
  } as any,// eslint-disable-line @typescript-eslint/no-explicit-any
});
