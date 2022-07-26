<template>
  <div class="intro">
    <img src="static/apple-icon.png" alt="" class="logo" />
    <div>
      Bienvenue sur la version Française (non officielle) du<br/>
      <b>Centre-Ville Virtuel</b> pour <strong>Blood on the Clocktower</strong>® !<br/>
      Veuillez Ajouter des joueurs via le 
      <span class="button" @click="toggleMenu">
        <font-awesome-icon icon="cog" /> Menu
      </span>
      en haut à droite ou en appuyant sur <b>[A]</b>. Vous pouvez également rejoindre une partie en tant que joueur en appuyant sur
      <b>[J]</b>.<br />
      <div class="footer">
        Ce projet est en Sources et License Libres. Le code Source de cette version est disponible sur
        <a href="https://github.com/pingumask/townsquare" target="_blank">La page GitHub de Pingumask</a>.<br/>
        La version originale anglaise est disponible sur 
        <a href="https://github.com/bra1n/townsquare" target="_blank">La page Github de Bra1n</a>.<br/>
        Ce site n'est d'aucune façon affilié à The Pandemonium Institute.<br/>
        "Blood on the Clocktower" est une marque déposée de Steven Medway & The Pandemonium Institute.
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";

export default {
  data() {
    return {
      language: window.navigator.userLanguage || window.navigator.language
    };
  },
  methods: mapMutations(["toggleMenu"])
};
</script>

<style scoped lang="scss">
// Intro
.intro {
  text-align: center;
  width: 50%;
  font-size: 120%;
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
