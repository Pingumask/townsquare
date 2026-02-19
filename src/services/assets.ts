import { useUserPreferencesStore } from "@/stores";
import { Alignment, Role, TeamType } from "@/types";

function defaultAlignment(team: TeamType | undefined, alignment: Alignment) {
  if (alignment === "good") {
    return (team === "townsfolk" || team === "outsider");
  }
  else if (alignment === "evil") {
    return (team === "minion" || team === "demon");
  }
  return true;
}

function teamIcon(team: TeamType | undefined, alignment: Alignment) {
  if (!defaultAlignment(team, alignment)) {
    return new URL(`../assets/icons/${team}_${alignment}.png`, import.meta.url).href;
  }

  return new URL(`../assets/icons/${team}.png`, import.meta.url).href;
}

export const getRoleImage = (role: Role, alignment?: Alignment): string => {
  const userPreferences = useUserPreferencesStore();
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
  if (role.image && userPreferences.isImageOptIn) {
    if (Array.isArray(role.image)) {
      switch (role.image.length) {
        case 0:
          return teamIcon(role.team, alignment);
        case 1:
          return role.image[0]!;
        case 2:
          if (defaultAlignment(role.team, alignment)) {
            return role.image[0]!;
          }
          else {
            return role.image[1]!;
          }
        default:
          if (alignment === "good") {
            return role.image[1]!;
          }
          else if (alignment === "evil") {
            return role.image[2]!;
          }
          else {
            return role.image[0]!;
          }
      }
    }
    else {
      return role.image;
    }
  }
  if (role.image && !userPreferences.isImageOptIn) {
    return teamIcon(role.team, alignment);
  }
  return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
};
