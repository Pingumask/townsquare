import { defineStore } from "pinia";
import editionJSONRaw from "@/editions.json";
import socket from "@/services/socket";
import {
  useLocaleStore,
  usePlayersStore,
  useSessionStore,
  useSoundboardStore,
  useVotingStore,
} from "@/stores";
import type {
  Edition,
  EditionsJSON,
  GameComposition,
  GamePhase,
  HatredEntry,
  Modals,
  Persist,
  Role,
  Timer,
} from "@/types";

const editionJSON = editionJSONRaw as unknown as EditionsJSON;

const defaultEdition = (): Edition =>
  editionJSON.official[0] ?? {
    id: "custom",
    name: "Custom",
    isOfficial: false,
    roles: [],
  };

interface GrimoireState {
  timer: Timer;
  edition?: Edition | undefined;
  editions: EditionsJSON;
  roles: Map<string, Role>;
  othertravelers: Map<string, Role>;
  fabled: Map<string, Role>;
  jinxes: Map<string, Map<string, string>>;
  rolesJSONbyId: Map<string, Role>;
  modal: Modals;
  allowSelfNaming: boolean;
  isVoteHistoryAllowed: boolean;
  isSecretVote: boolean;
  isTextChatAllowed: boolean;
  gamePhase: GamePhase;
  dayCount: number;
  showParchment: boolean;
}

export const useGrimoireStore = defineStore("grimoire", {
  state: (): GrimoireState => ({
    timer: {
      name: "",
      duration: 0,
    },
    edition: undefined,
    editions: editionJSON,
    roles: new Map<string, Role>(),
    othertravelers: new Map<string, Role>(),
    fabled: new Map<string, Role>(),
    jinxes: new Map<string, Map<string, string>>(),
    rolesJSONbyId: new Map<string, Role>(),
    modal: null,
    allowSelfNaming: true,
    isVoteHistoryAllowed: true,
    isSecretVote: false,
    isTextChatAllowed: true,
    gamePhase: "offline",
    dayCount: 0,
    showParchment: false,
  }),

  getters: {
    t: () => {
      const localeStore = useLocaleStore();
      return localeStore.t;
    },

    customRolesStripped: (state: GrimoireState) => {
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
      const customKeys = Object.keys(customRoleBase);
      const strippedProps = [
        "firstNightReminder",
        "otherNightReminder",
        "isCustom",
      ] as const;

      state.roles.forEach((role) => {
        if (role.isCustom) {
          const strippedRole: Record<string, unknown> = {};
          const roleObj = role as unknown as Record<string, unknown>;
          const customObj = customRoleBase as unknown as Record<
            string,
            unknown
          >;
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
        } else {
          customRoles.push({ id: role.id });
        }
      });
      return customRoles;
    },
  },

  actions: {
    async initialize() {
      const localeStore = useLocaleStore();
      await localeStore.initialize();

      this.updateRoles();

      localeStore.$subscribe((_mutation, _localeState) => {
        this.updateRoles();
      });
    },

    updateRoles() {
      const localeStore = useLocaleStore();

      this.rolesJSONbyId = new Map<string, Role>(
        localeStore.rolesJSON.default.map(
          (role: Role) => [role.id, role] as const,
        ),
      );

      this.roles.forEach((role: Role) => {
        this.roles.set(role.id, this.rolesJSONbyId.get(role.id) as Role);
      });

      this.jinxes = new Map<string, Map<string, string>>();
      localeStore.jinxesJSON.default.forEach(
        (jinx: { id: string; hatred: HatredEntry[] }) => {
          if (!this.jinxes.has(jinx.id)) {
            this.jinxes.set(jinx.id, new Map<string, string>());
          }
          jinx.hatred.forEach((j: HatredEntry) => {
            this.jinxes.get(jinx.id)?.set(j.id, j.reason);
          });
        },
      );

      this.fabled = new Map<string, Role>(
        localeStore.fabledJSON.default.map(
          (role: Role) => [role.id, role] as const,
        ),
      );

      if (this.edition) {
        this.setEdition(this.edition);
      } else {
        this.setEdition(defaultEdition());
      }
    },
    toggleModal(modal: Modals) {
      const session = useSessionStore();
      if (
        modal === "voteHistory" &&
        !this.isVoteHistoryAllowed &&
        session.isPlayerOrSpectator
      ) {
        this.modal = null;
        return;
      }
      this.modal = this.modal === modal ? null : modal;
    },
    setTimer(timer: { name?: string; duration?: number }) {
      this.timer = timer as Timer;
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator)
        socket.send("setTimer", this.timer);
    },

    setEdition(edition: Edition) {
      this.edition = edition;
      if (edition.isOfficial) {
        this.roles.clear();
      }
      if (edition.roles && edition.roles.length > 0) {
        edition.roles.forEach((roleId: string) => {
          let role = this.rolesJSONbyId.get(roleId);
          if (role) {
            this.roles.set(role.id, role);
          } else {
            console.warn(`Role not found for ID: ${roleId}`);
          }
        });
      } else {
        this.rolesJSONbyId.forEach((role: Role) => {
          if (role.edition === edition.id) {
            this.roles.set(role.id, role);
          }
        });
      }

      // Populate othertravelers with travelers NOT in the current edition
      this.othertravelers = new Map<string, Role>(
        Array.from<Role>(this.rolesJSONbyId.values())
          .filter((r: Role) => r.team === "traveler" && !this.roles.has(r.id))
          .map((role: Role) => [role.id, role] as const),
      );

      this.modal = null;
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.sendEdition();
    },

    setCustomRoles(roles: Array<Role>) {
      const customRoleBase: Role = {
        id: "",
        name: "",
        image: "",
        ability: "",
        edition: "custom",
        firstNight: 0,
        otherNight: 0,
        otherNightReminder: "",
        reminders: [],
        remindersGlobal: [],
        setup: false,
        team: "townsfolk",
        isCustom: true,
      };

      const customKeys = Object.keys(customRoleBase);

      const processedRoles = roles
        .map((role) => {
          if (Array.isArray(role) && (role as unknown[])[0]) {
            // Handle array format [name, id, ...] if applicable, or just map keys
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
          // Don't modify ID here, just cast
          return role as unknown as Role;
        })
        .map((role) => {
          // Try exact match first
          let found = this.rolesJSONbyId.get(role.id);

          // If found (either exact or resolved), return it
          if (found) return found;

          // If existing in current roles, return it
          if (this.roles.get(role.id)) return this.roles.get(role.id)!;

          // Otherwise, it's a custom role, use original ID
          return { ...customRoleBase, ...role };
        })
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

      this.roles = new Map<string, Role>(
        processedRoles
          .filter((role) => role.team !== "fabled" && role.team !== "loric")
          .map((role) => [role.id, role] as const),
      );

      this.fabled = new Map<string, Role>([
        ...processedRoles
          .filter((r: Role) => r.team === "fabled" || r.team === "loric")
          .map((r: Role) => [r.id, r] as const),
        ...Array.from(this.fabled.entries()),
      ] as ReadonlyArray<readonly [string, Role]>);

      // Re-add custom fabled to the map
      processedRoles
        .filter((r: Role) => r.team === "fabled" || r.team === "loric")
        .forEach((r: Role) => this.fabled.set(r.id, r));

      this.othertravelers = new Map<string, Role>(
        Array.from<Role>(this.rolesJSONbyId.values())
          .filter((r: Role) => r.team === "traveler" && !this.roles.has(r.id))
          .map((role: Role) => [role.id, role] as const),
      );
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.sendEdition();
    },

    setAllowSelfNaming(allowSelfNaming: boolean) {
      const sessionStore = useSessionStore();
      this.allowSelfNaming = allowSelfNaming;
      if (!sessionStore.isPlayerOrSpectator)
        socket.send("allowSelfNaming", this.allowSelfNaming);
    },

    setVoteHistoryAllowed(isVoteHistoryAllowed: boolean) {
      const sessionStore = useSessionStore();
      this.isVoteHistoryAllowed = isVoteHistoryAllowed;
      if (!sessionStore.isPlayerOrSpectator) {
        socket.send("isVoteHistoryAllowed", this.isVoteHistoryAllowed);
        const votingStore = useVotingStore();
        votingStore.syncVoteHistory();
      }
    },

    setSecretVote(isSecretVote: boolean) {
      const sessionStore = useSessionStore();
      this.isSecretVote = isSecretVote;
      if (!sessionStore.isPlayerOrSpectator) {
        socket.send("isSecretVote", this.isSecretVote);
      }
    },

    setAllowTextChat(isTextChatAllowed: boolean) {
      const sessionStore = useSessionStore();
      this.isTextChatAllowed = isTextChatAllowed;
      if (!sessionStore.isPlayerOrSpectator) {
        socket.send("isTextChatAllowed", this.isTextChatAllowed);
      }
    },

    setGamePhase(gamePhase: GamePhase) {
      if (this.gamePhase === gamePhase) return; // Avoids triggering things when host refreshes
      const sessionStore = useSessionStore();
      const soundboard = useSoundboardStore();
      const votingStore = useVotingStore();

      this.gamePhase = gamePhase;
      if (!sessionStore.isPlayerOrSpectator)
        socket.send("gamePhase", gamePhase);
      if (gamePhase === "day") {
        soundboard.playSound({ sound: "rooster" });
      } else if (gamePhase === "firstNight") {
        votingStore.setMarkedPlayer(-1);
        this.setDayCount(1);
      } else if (gamePhase === "otherNight") {
        votingStore.setMarkedPlayer(-1);
        this.setDayCount(this.dayCount + 1);
      }
      this.showParchment = true;
    },

    newGame() {
      const locale = useLocaleStore();
      const playersStore = usePlayersStore();
      const session = useSessionStore();
      const votingStore = useVotingStore();
      const t = locale.t;

      if (session.isPlayerOrSpectator) return;
      if (!confirm(t("prompt.newGame"))) return;
      playersStore.clearRoles(true);
      playersStore.randomize();
      votingStore.setMarkedPlayer(-1);
      votingStore.clearVoteHistory();
      this.setGamePhase("pregame");
      this.setDayCount(0);
    },

    endGame() {
      const locale = useLocaleStore();
      const session = useSessionStore();
      const t = locale.t;

      if (session.isPlayerOrSpectator) return;
      if (!confirm(t("prompt.endGame"))) return;
      this.setGamePhase("postgame");
    },

    setDayCount(dayCount: number) {
      if (dayCount < 0) return;
      this.dayCount = dayCount;
      const sessionStore = useSessionStore();
      if (!sessionStore.isPlayerOrSpectator) socket.send("dayCount", dayCount);
    },

    toggleNight() {
      const sessionStore = useSessionStore();
      if (sessionStore.isPlayerOrSpectator) return;

      if (this.gamePhase === "pregame") {
        this.setGamePhase("firstNight");
      } else if (
        this.gamePhase === "firstNight" ||
        this.gamePhase === "otherNight"
      ) {
        this.setGamePhase("day");
      } else if (this.gamePhase === "day") {
        this.setGamePhase("otherNight");
      }
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
        outsider = playerCount % 2 ? 0 : 1;
      }
      townsfolk = playerCount - demon - minion - outsider;

      return {
        townsfolk,
        outsider,
        minion,
        demon,
      };
    },
  },
  persist: {
    paths: [
      "edition",
      "roles",
      "fabled",
      "othertravelers",
      "allowSelfNaming",
      "isVoteHistoryAllowed",
      "isSecretVote",
      "gamePhase",
    ],
    serializer: {
      serialize: (state: GrimoireState): string => {
        const s = state;
        return JSON.stringify({
          ...s,
          roles: Array.from(s.roles.entries()),
          fabled: Array.from(s.fabled.entries()),
          othertravelers: Array.from(s.othertravelers.entries()),
        });
      },
      deserialize: (value: string): GrimoireState => {
        const state = JSON.parse(value);
        return {
          ...state,
          roles: new Map<string, Role>(state.roles),
          fabled: new Map<string, Role>(state.fabled),
          othertravelers: new Map<string, Role>(state.othertravelers),
        };
      },
    },
  } as Persist<GrimoireState>,
});
