import { defineStore } from "pinia";
import type { LocaleModule, RolesJSON, JinxesJSON, FabledJSON } from "@/types";

interface LocaleState {
    locale: LocaleModule;
    rolesJSON: RolesJSON;
    jinxesJSON: JinxesJSON;
    fabledJSON: FabledJSON;
    currentLanguage: string;
}

export const useLocaleStore = defineStore("locale", {
    state: (): LocaleState => ({
        locale: { default: {} },
        rolesJSON: { default: [] },
        jinxesJSON: { default: [] },
        fabledJSON: { default: [] },
        currentLanguage: "en",
    }),

    getters: {
        t: (state) => (key: string) => {
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

            return result !== null ? result : key;
        },
    },

    actions: {
        async initialize() {
            const supportedLanguages = ["en", "fr"];
            const MASTER_LANGUAGE = "en";
            const userLanguages = window.navigator.languages;
            let usedLanguage = null;

            for (let lang of userLanguages) {
                if (supportedLanguages.includes(lang)) {
                    usedLanguage = lang;
                    break;
                }
            }
            if (!usedLanguage) {
                for (let lang of userLanguages) {
                    const short = lang.substring(0, 2);
                    if (supportedLanguages.includes(short)) {
                        usedLanguage = short;
                        break;
                    }
                }
            }
            if (!usedLanguage) {
                usedLanguage = MASTER_LANGUAGE;
            }

            this.currentLanguage = usedLanguage;

            // Dynamic imports relative to this file (src/stores/useLocaleStore.ts)
            // Locales are in src/locale/
            const p1 = import(`../locale/${usedLanguage}/ui.json`);
            const p2 = import(`../locale/${usedLanguage}/roles.json`);
            const p3 = import(`../locale/${usedLanguage}/hatred.json`);
            const p4 = import(`../locale/${usedLanguage}/fabled.json`);

            const [ui, roles, jinxes, fabled] = await Promise.all([p1, p2, p3, p4]);

            this.locale = ui as LocaleModule;
            this.rolesJSON = roles as RolesJSON;
            this.jinxesJSON = jinxes as JinxesJSON;
            this.fabledJSON = fabled as FabledJSON;
        },
    },
});
