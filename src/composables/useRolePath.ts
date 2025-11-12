import { computed } from "vue";
import { useStore } from "vuex";
import { Role } from "../types";

export function useRolePath() {
  const store = useStore();
  const grimoire = computed(() => store.state.grimoire);

  const rolePath = (role: Role) => {
    if (
      [
        "dusk",
        "dawn",
        "townsfolk",
        "outsider",
        "minion",
        "demon",
        "custom",
      ].includes(role.id)
    ) {
      return new URL(`../assets/icons/${role.id}.png`, import.meta.url).href;
    }
    if (role.image && grimoire.value.isImageOptIn) {
      // Handle both string and string[] types
      return Array.isArray(role.image) ? role.image[0] : role.image;
    }
    if (role.image && !grimoire.value.isImageOptIn) {
      return new URL(`../assets/icons/${role.team}.png`, import.meta.url).href;
    }
    return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
  };
  return { rolePath };
}
