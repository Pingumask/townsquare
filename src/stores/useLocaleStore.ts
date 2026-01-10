import { defineStore } from "pinia";
import { useGrimoireStore } from "@/stores";
import type { FabledJSON, JinxesJSON, LocaleModule, RolesJSON } from "@/types";

const supportedLanguages = new Set(["en", "fr", "es"]);
const MASTER_LANGUAGE = "en";

interface LocaleState {
  locale: LocaleModule;
  fallbackLocale: LocaleModule;
  rolesJSON: RolesJSON;
  jinxesJSON: JinxesJSON;
  fabledJSON: FabledJSON;
  currentLanguage: string;
  userLanguage: string;
}

export const useLocaleStore = defineStore("locale", {
  state: (): LocaleState => ({
    locale: { default: {} },
    fallbackLocale: { default: {} },
    rolesJSON: { default: [] },
    jinxesJSON: { default: [] },
    fabledJSON: { default: [] },
    currentLanguage: "en",
    userLanguage: "en",
  }),

  getters: {
    t: (state) => (key: string) => {
      if (!key || typeof key !== "string") return key;

      const keys = key.split(".");
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

      let result = traverse(state.locale.default, keys);
      if (!result) {
        result = traverse(state.fallbackLocale.default, keys);
      }

      return result ?? key;
    },
    supportedLanguages: () => Array.from(supportedLanguages),
  },

  actions: {
    async initialize() {
      const userLanguages = globalThis.navigator.languages;
      let usedLanguage = null;

      for (let lang of userLanguages) {
        if (supportedLanguages.has(lang)) {
          usedLanguage = lang;
          break;
        }
      }
      if (!usedLanguage) {
        for (let lang of userLanguages) {
          const short = lang.substring(0, 2);
          if (supportedLanguages.has(short)) {
            usedLanguage = short;
            break;
          }
        }
      }
      if (!usedLanguage) {
        usedLanguage = MASTER_LANGUAGE;
      }

      this.userLanguage = usedLanguage;

      const p1 = import(`@/locale/${usedLanguage}/ui.json`);
      const p2 = import(`@/locale/${usedLanguage}/roles.json`);
      const p3 = import(`@/locale/${usedLanguage}/hatred.json`);
      const p4 = import(`@/locale/${usedLanguage}/fabled.json`);

      const [ui, roles, jinxes, fabled] = await Promise.all([p1, p2, p3, p4]);

      this.locale = ui as LocaleModule;
      this.rolesJSON = roles as RolesJSON;
      this.jinxesJSON = jinxes as JinxesJSON;
      this.fabledJSON = fabled as FabledJSON;

      const m1 = import(`@/locale/${MASTER_LANGUAGE}/ui.json`);

      const [mUi] = await Promise.all([m1]);

      this.fallbackLocale = mUi as LocaleModule;

      this.updateHeadMetadata();
    },

    async forceLocale(locale: string) {
      this.currentLanguage = locale;
      const p1 = await import(`@/locale/${locale}/ui.json`);
      const p2 = await import(`@/locale/${locale}/roles.json`);
      const p3 = await import(`@/locale/${locale}/hatred.json`);
      const p4 = await import(`@/locale/${locale}/fabled.json`);

      const [ui, roles, jinxes, fabled] = await Promise.all([p1, p2, p3, p4]);

      this.locale = ui as LocaleModule;
      this.rolesJSON = roles as RolesJSON;
      this.jinxesJSON = jinxes as JinxesJSON;
      this.fabledJSON = fabled as FabledJSON;
      const grimoireStore = useGrimoireStore();
      grimoireStore.updateRoles();

      this.updateHeadMetadata();
    },

    async revertLocale() {
      await this.forceLocale(this.userLanguage);
    },

    updateHeadMetadata() {
      document.title =
        (this.locale.default.head?.title as string) ||
        "Blood on the Clocktower Town Square";
      const description =
        (this.locale.default.head?.description as string) ||
        "A free, virtual Blood on the Clocktower Town Square and Grimoire to help you run (online) games both as a storyteller and player.";
      document
        .querySelector("meta[name='language']")
        ?.setAttribute("content", this.currentLanguage);
      document
        .querySelector("html")
        ?.setAttribute("lang", this.currentLanguage);
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", description);
      document
        .querySelector('meta[property="og:title"]')
        ?.setAttribute("content", document.title);
      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute("content", description);
    },
  },
});
