<template>
  <Modal v-if="modals.specialVote" @close="toggleModal('specialVote')">
    <h3>{{ locale.modal.specialvote.title }}</h3>
    <div class="allTheButtons">
      <template>
        <button @click="bishopVote()">
          <img src="../../assets/icons/bishop.png" />
          <span>{{ locale.modal.specialvote.bishop }}</span>
        </button>
        <button @click="atheistVote()">
          <img src="../../assets/icons/atheist.png" />
          <span>{{ locale.modal.specialvote.atheist }}</span>
        </button>
        <button @click="cultleaderVote()">
          <img src="../../assets/icons/cultleader.png" />
          <span>{{ locale.modal.specialvote.cultleader }}</span>
        </button>
        <button @click="customVote()">
          <img src="../../assets/icons/custom.png" />
          <span>{{ locale.modal.specialvote.custom }}</span>
        </button>
      </template>
    </div>
  </Modal>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import Modal from "./Modal.vue";

export default {
  components: {
    Modal,
  },
  computed: {
    ...mapState(["modals", "locale", "grimoire", "session"]),
    ...mapState("players", ["players"]),
  },
  methods: {
    launchVote(nomination) {
      this.$store.commit("session/nomination", { nomination });
      this.$store.commit("toggleModal", "specialVote");
    },
    bishopVote() {
      this.launchVote([
        this.locale.modal.specialvote.st,
        this.session.playerForSpecialVote,
      ]);
    },
    atheistVote() {
      this.launchVote([
        this.session.playerForSpecialVote,
        this.locale.modal.specialvote.st,
      ]);
    },
    cultleaderVote() {
      this.launchVote([
        this.session.playerForSpecialVote,
        this.locale.modal.specialvote.cultleaderMessages,
      ]);
    },
    customVote() {
      let playerName = this.players[this.session.playerForSpecialVote].name;
      let input = prompt(
        this.locale.modal.specialvote.complete +
          playerName +
          " ____________________" +
          this.locale.vote.exclam,
      );
      if (input) {
        let messages = this.locale.modal.specialvote.customMessages;
        messages[0] = input;
        this.launchVote([this.session.playerForSpecialVote, messages]);
      }
    },
    ...mapMutations(["toggleModal"]),
  },
};
</script>

<style scoped lang="scss">
ul {
  width: 100%;
}

div.allTheButtons {
  margin-top: 30px;
}

button {
  background-color: #66027f;
  border: none;
  border-radius: 10px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 35%;
  margin-top: 15px;
  display: flex;
  align-items: center;
}

button:hover {
  background-color: #9903bf;
}

button:focus {
  background-color: #cc04ff;
}

span {
  font-family: PiratesBay, sans-serif;
  font-size: 22px;
  color: white;
  flex: 1;
  text-align: center;
}

img {
  width: 80px;
  display: block;
  margin-left: auto;
}

template {
  margin-top: 30px;
}
</style>
