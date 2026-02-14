<template>
  <div v-if="grimoire.ShowCustomTextForParchment" id="win_background" :class="{ show: showWinBackground, hide: hideWinBackground }"></div>
  <img id="img_role_1" alt="Winning alignment icon" :src="img1Path" :class="{ show: showRoles, hide: hideContainer }">
  <img id="img_role_2" alt="Secondary winning alignement icon" :src="img2Path" :class="{ show: showRoles, hide: hideContainer }">
  <div id="parchment" :class="{ show: showContainer, hide: hideContainer }">
    <div id="win_announce" :class="{ show: showWinAnnounce, hide: hideWinAnnounce }">
      {{ t("postgame.theWinnersAre") }}
    </div>
    <img alt="parchment" src="../assets/parchment.png" :class="{ show: showParchment }">
    <div class="title">
      <span
        v-for="(char, i) in letters"
        :key="i"
        class="letter"
        :class="{ show: i < visibleCount }"
      >
        {{ char }}
      </span>
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useGrimoireStore, useLocaleStore } from "@/stores";
import demonIcon from "@/assets/icons/demon.png";
import minionIcon from "@/assets/icons/minion.png";
import townsfolkIcon from "@/assets/icons/townsfolk.png";
import outsiderIcon from "@/assets/icons/outsider.png";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;

const winner = grimoire.winner;
const dayCount = grimoire.dayCount;
let gamePhase = grimoire.gamePhase;

const letterSpeed = 120;

const letters = ref([""]);
const visibleCount = ref(0);
const showParchment = ref(false);
const showRoles = ref(false);
const hideContainer = ref(false);
const showWinBackground = ref(false);
const hideWinBackground = ref(true);
const showWinAnnounce = ref(false);
const hideWinAnnounce = ref(true);

const canBeHovered = ref(true);

const img1Path = ref("");
const img2Path = ref("");

const showContainer = (text: string) => {
  setTimeout(() => {
    showParchment.value = true;
  }, 1);
  setTimeout(() => {
    startText();
  }, 600);
  const totalTime =
    600 + text.length * letterSpeed + 3000;
  setTimeout(() => {
    hideContainer.value = true;
    setTimeout(() => {
      grimoire.ShowCustomTextForParchment = false;
      grimoire.showParchment = false;
    }, 600);
  }, totalTime);
};

const showContainerForWin = (text: string, winner: string) => {
  canBeHovered.value = false;
  if (winner === "evil") {
    img1Path.value = demonIcon;
    img2Path.value = minionIcon;
  }
  else if (winner === "good") {
    img1Path.value = outsiderIcon;
    img2Path.value = townsfolkIcon;
  }
  else {
    grimoire.ShowCustomTextForParchment = false;
    grimoire.showParchment = false;
  }
  setTimeout(() => {
    showWinBackground.value = true;
    hideWinBackground.value = false;
  }, 1);
  setTimeout(() => {
    showWinAnnounce.value = true;
    hideWinAnnounce.value = false;
  }, 200);
  setTimeout(() => {
    showParchment.value = true;
  }, 200+400);
  setTimeout(() => {
    startText();
    showRoles.value = true;
  }, 200+400+600);
  const totalTime =
    200 + 400 + 600 + text.length * letterSpeed + 6000;
  setTimeout(() => {
    hideContainer.value = true;
    showWinBackground.value = false;
    hideWinBackground.value = true;
    setTimeout(() => {
      grimoire.ShowCustomTextForParchment = false;
      grimoire.showParchment = false;
    }, 600);
  }, totalTime);
};

const startText = () => {
  const interval = setInterval(() => {
    if (visibleCount.value < letters.value.length) {
      visibleCount.value++;
    } else {
      clearInterval(interval);
    }
  }, letterSpeed);
};

const onMouseMove = (e: MouseEvent) => {
  const el = document.getElementById("parchment");
  if (!el || !canBeHovered.value) return;

  const rect = el.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (inside) {
    el.classList.add("hover");
  } else {
    el.classList.remove("hover");
  }
};

onMounted(() => {
  globalThis.addEventListener("mousemove", onMouseMove);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener("mousemove", onMouseMove);
});

if (grimoire.ShowCustomTextForParchment) {
  const text = t('postgame.'+winner)
  letters.value = text.split("");
  showContainerForWin(text, winner);
} else if (gamePhase==="day" && dayCount>0) {
  const text = `${t("townsquare.gamephase.day")} ${dayCount}`;
  letters.value = text.split("");
  showContainer(text);
} else if (gamePhase==="firstNight" || gamePhase==="otherNight") {
  const text = `${t("townsquare.gamephase.otherNight")} ${dayCount}`;
  letters.value = text.split("");
  showContainer(text);
} else if (gamePhase==="postgame") {
  const text = t("townsquare.gamephase.postgame");
  letters.value = text.split("");
  showContainer(text);
} else {
  grimoire.ShowCustomTextForParchment = false;
  grimoire.showParchment = false;
}
</script>

<style lang="scss" scoped>
@use "../vars.scss" as *;

#win_background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  background: black;
  transition: opacity 0.6s ease;
  opacity: 0;
}

#win_background.show {
  opacity: 0.8;
}

#win_background.hide {
  opacity: 0;
}

#parchment {
  position: absolute;
  margin: auto;
  width: auto;
  z-index: 102;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  transition: opacity 0.6s ease;
  opacity: 1;
  pointer-events: none;
}

#parchment.hover {
  transition: opacity 0.6s ease;
  opacity: 0.2;
}

#parchment.hide {
  opacity: 0;
}

#win_announce {
  position: absolute;
  font-size: 1.5rem;
  margin-bottom: 15em;
  font-family: "PiratesBay", sans-serif;
  transition: opacity 0.6s ease;
  opacity: 1;
}

#win_announce.hide {
  opacity: 0;
}

#parchment img {
  height: 10em;
  display: block;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;
}

#parchment img.show {
  opacity: 1;
  transform: translateY(0);
}

.letter {
  display: inline-block;
  opacity: 0;
  transform: scale(1.4);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.letter.show {
  opacity: 1;
  transform: scale(1);
}

#parchment .title {
  pointer-events: none;
  position: absolute;
  font-family: "Papyrus", sans-serif;
  font-size: 4em;
  color : black;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  white-space: pre;
}

#img_role_1 {
  position: absolute;
  margin-left: 30em;
  width: auto;
  z-index: 101;
  height: 30em;
  display: block;
  opacity: 0;
  transform: translateX(-100px) rotate(30deg);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;
}

#img_role_1.show {
  opacity: 1;
  transform: translateY(0) rotate(10deg);
}

#img_role_2 {
  position: absolute;
  margin-right: 30em;
  width: auto;
  z-index: 101;
  height: 30em;
  display: block;
  opacity: 0;
  transform: translateX(100px) rotate(-30deg);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;
}

#img_role_2.show {
  opacity: 1;
  transform: translateY(0) rotate(-10deg);
}

#img_role_1.hide, #img_role_2.hide {
  opacity: 0;
}
</style>
