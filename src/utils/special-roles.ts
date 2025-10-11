import type { Role } from "@/types";

// Special roles used for system reminders
export const SPECIAL_REMINDER_ROLES = {
  good: {
    id: "good",
    name: "Good",
    team: "townsfolk",
  } as Role,

  evil: {
    id: "evil",
    name: "Evil",
    team: "minion",
  } as Role,

  townsfolk: {
    id: "townsfolk",
    name: "Townsfolk",
    team: "townsfolk",
    image: new URL("@/assets/icons/townsfolk.png", import.meta.url).href,
  } as Role,

  outsider: {
    id: "outsider",
    name: "Outsider",
    team: "outsider",
    image: new URL("@/assets/icons/outsider.png", import.meta.url).href,
  } as Role,

  minion: {
    id: "minion",
    name: "Minion",
    team: "minion",
    image: new URL("@/assets/icons/minion.png", import.meta.url).href,
  } as Role,

  demon: {
    id: "demon",
    name: "Demon",
    team: "demon",
    image: new URL("@/assets/icons/demon.png", import.meta.url).href,
  } as Role,

  custom: {
    id: "custom",
    name: "Custom",
    team: "default",
  } as Role,
};
