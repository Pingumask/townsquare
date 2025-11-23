import { useGrimoireStore } from "@/stores";
import { Role } from "@/types";

export const getRoleImage = (role: Role): string => {
    const grimoireStore = useGrimoireStore();

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
    if (role.image && grimoireStore.isImageOptIn) {
        return role.image;
    }
    if (role.image && !grimoireStore.isImageOptIn) {
        return new URL(`../assets/icons/${role.team}.png`, import.meta.url).href;
    }
    return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
};
