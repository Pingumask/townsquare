<template>
  <div class="intro">
    <img src="/apple-icon.png" alt="" class="logo">
    <div>
      {{ t('intro.header') }}
      <button @click="userPreferences.isMenuOpen = !userPreferences.isMenuOpen">
        <font-awesome-icon icon="cog" class="fa fa-cog" /> {{ t('intro.menu') }}
      </button>
      {{ t('intro.body') }}
      <div class="footer">
        {{ t('intro.footerStart') }}
        <a href="https://github.com/Pingumask/townsquare" target="_blank">GitHub</a>
        {{ t('intro.footerEnd') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useLocaleStore,
  useUserPreferencesStore,
} from '@/stores';
const locale = useLocaleStore();
const userPreferences = useUserPreferencesStore();
const t = locale.t;
</script>

<style scoped lang="scss">
// Intro
.intro {
  text-align: center;
  width: 50%;
  font-size: clamp(16px, calc(-1.1429rem + 4.2857vw), 28px);
  position: absolute;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  z-index: 3;
  display: flex;
  justify-content: center;

  a {
    color: white;
  }

  a.redirect {
    display: block;
    text-decoration: none;
    position: absolute;
    top: 100%;
    margin-top: 2vh;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    border-radius: 10px;

    &:hover {
      color: red;
    }

    img {
      width: 120px;
      display: block;
      margin: auto;
      margin-bottom: 1vh;
    }
  }

  img.logo {
    position: absolute;
    bottom: 100%;
    width: 25vh;
    margin-bottom: 2vh;
    max-width: 192px;
    border-radius: 50%;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
  }

  .footer {
    font-size: 60%;
    opacity: 0.75;
  }
}
</style>
