import { computed } from "vue";
import { useStore } from "vuex";
import { Role } from "../types";

export function useRolePath() {
  const store = useStore();
  const grimoire = computed(() => store.state.grimoire);

  const rolePath = (role: Role) => {
    if (role.image && grimoire.value.isImageOptIn) {
      return role.image;
    }
    if (role.image && !grimoire.value.isImageOptIn) {
      return new URL(`../assets/icons/${role.team}.png`, import.meta.url).href;
    }
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
    return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
  };
  return { rolePath };
}
