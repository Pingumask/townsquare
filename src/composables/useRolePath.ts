import { computed } from "vue";
import { useStore } from "vuex";
import { Role } from "../types";


function default_alignment(team, alignment) {
  if (alignment == "good") {
    return (team == "townsfolk" || team == "outsider");
  }
  else if (alignment == "evil") {
    return (team == "minion" || team == "demon");
  }
  return true;
}


function teamIcon(team, alignment) {  
  
  if (!default_alignment(team, alignment)) {
    return new URL(`../assets/icons/${team}_${alignment}.png`, import.meta.url).href;
  }
  
  return new URL(`../assets/icons/${team}.png`, import.meta.url).href;
}

export function useRolePath() {
  const store = useStore();
  const grimoire = computed(() => store.state.grimoire);

  const rolePath = (role: Role, alignment=null) => {
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
      if (Array.isArray(role.image)) {
        switch(role.image.length) {
          case 0 :
            return teamIcon(role.team, alignment);
          case 1 :
            return role.image[0];
          case 2 :
            if (default_alignment(role.team, alignment)) {
              return role.image[0];
            }
            else {
              return role.image[1];
            }
          default :
            if (alignment == "good") {
              return role.image[1];
            }
            else if(alignment == "evil") {
              return role.image[2];
            }
            else {
              return role.image[0];
            }
        }
      } 
      else {
        return role.image; 
      }
    }
    if (role.image && !grimoire.value.isImageOptIn) {
      return teamIcon(role.team, alignment);
    }
    return new URL(`../assets/icons/${role.id}.svg`, import.meta.url).href;
  };
  return { rolePath };
}
