<template>
  <div id="parchment" :class="{ show: showContainer, hide: hideContainer }">
    <img src="../assets/parchment.png" style="height: 10em" :class="{ show: showParchment }">
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
import { ref } from "vue";
import { useGrimoireStore, useLocaleStore } from "@/stores";

const grimoire = useGrimoireStore();
const locale = useLocaleStore();
const t = locale.t;

const dayCount = grimoire.dayCount;
let gamePhase = grimoire.gamePhase;
if (gamePhase=="firstNight") {gamePhase = "otherNight";}
const showContainer = ((gamePhase=="day") || (gamePhase=="otherNight")) && dayCount>0;

const text = t("townsquare.gamephase."+gamePhase)+" "+dayCount;
const letters = text.split("");
const letterSpeed = 120;

const visibleCount = ref(0);
const showParchment = ref(false);
const hideContainer = ref(false);

if(showContainer) {
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
      grimoire.showParchment = false;
    }, 600);
  }, totalTime);
} else {
  grimoire.showParchment = false;
}

const startText = () => {
  const interval = setInterval(() => {
    if (visibleCount.value < letters.length) {
      visibleCount.value++;
    } else {
      clearInterval(interval);
    }
  }, letterSpeed);
};


</script>

<style lang="scss" scoped>
@use "../vars.scss" as *;

#parchment {
  position: absolute;
  margin: auto;
  width: 20vw;
  z-index: 30;
  display: flex;
  align-items: center;
  align-content: center;
  justify-content: center;
  transition: opacity 0.6s ease;
  opacity: 1;
}

#parchment.hide {
  opacity: 0;
}


#parchment img {
  height: 10em;
  display: block;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
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
  position: absolute;
  font-family: "Papyrus";
  font-size: 4em;
  color : black;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  white-space: pre;
}

</style>

