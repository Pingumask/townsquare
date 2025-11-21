import { computed } from "vue";
import { useGrimoireStore } from "@/stores";
import { Role } from "../types";

export function useRolePath() {
  const grimoireStore = useGrimoireStore();
  const grimoire = computed(() => grimoireStore);

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
      return role.image;
    }
    if (role.image && !grimoire.value.isImageOptIn) {
      return new URL(`../assets/icons/${role.team}.png`, import.meta.url).href;
    }
    return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
  };
  return { rolePath };
}
