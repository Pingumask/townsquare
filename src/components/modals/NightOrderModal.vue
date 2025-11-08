<template>
  <Modal v-if="modals.nightOrder && roles.size" class="night-reference" @close="toggleModal('nightOrder')">
    <font-awesome-icon icon="address-card" class="fa fa-address-card toggle" :title="t('modal.nightOrder.reference')"
      @click="toggleModal('reference')" />
    <h3>
      {{ t('modal.nightOrder.title') }}
      <font-awesome-icon icon="cloud-moon" class="fa fa-cloud-moon" />
      {{ edition.name || t('modal.nightOrder.custom') }}
    </h3>
    <div class="night">
      <NightOrderTable night-type="firstNight" />
      <NightOrderTable night-type="otherNight" />
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { useTranslation } from '@/composables';
import { Modal, NightOrderTable } from '@/components';

const { t } = useTranslation();
const store = useStore();


const edition = computed(() => store.state.edition);
const modals = computed(() => store.state.modals);
const roles = computed(() => store.state.roles);

const toggleModal = (modal: string) => {
  store.commit("toggleModal", modal);
};
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

.toggle {
  position: absolute;
  left: 20px;
  top: 15px;
  cursor: pointer;

  &:hover {
    color: red;
  }
}

h3 {
  margin: 0 40px;

  svg {
    vertical-align: middle;
  }
}

h4 {
  text-transform: capitalize;
  display: flex;
  align-items: center;
  height: 20px;

  &:before,
  &:after {
    content: " ";
    width: 100%;
    height: 1px;
    border-radius: 2px;
  }

  &:before {
    margin-right: 15px;
  }

  &:after {
    margin-left: 15px;
  }
}

.fabled {
  --blend: normal;
  --color: #ffe91f;

  .name {
    background: linear-gradient(90deg, $fabled, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $fabled, transparent 35%);
    }
  }
}

.loric {
  --blend: normal;
  --color: #4fda66;

  .name {
    background: linear-gradient(90deg, $loric, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $loric, transparent 35%);
    }
  }
}

.townsfolk {
  --blend: normal;
  --color: #1f65ff;

  .name {
    background: linear-gradient(90deg, $townsfolk, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $townsfolk, transparent 35%);
    }
  }
}

.outsider {
  --blend: normal;
  --color: #46d5ff;

  .name {
    background: linear-gradient(90deg, $outsider, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $outsider, transparent 35%);
    }
  }
}

.minion {
  --blend: normal;
  --color: #ff6900;

  .name {
    background: linear-gradient(90deg, $minion, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $minion, transparent 35%);
    }
  }
}

.demon {
  --blend: normal;
  --color: #ce0100;

  .name {
    background: linear-gradient(90deg, $demon, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $demon, transparent 35%);
    }
  }
}

.traveler {
  .name {
    background: linear-gradient(90deg, $traveler, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $traveler, transparent 35%);
    }
  }
}

.default {
  .name {
    background: linear-gradient(90deg, $default, transparent 35%);

    .night .other & {
      background: linear-gradient(-90deg, $default, transparent 35%);
    }
  }
}

ul {
  li {
    display: flex;
    width: 100%;
    margin-bottom: 3px;
    filter: unset;

    .icon {
      max-width: 5vh;
      max-height: 5vh;
      background-size: 100% auto;
      background-position: center center;
      background-repeat: no-repeat;
      flex-grow: 0;
      flex-shrink: 0;
      text-align: center;
      margin: 0 2px;

      img,
      svg {
        max-width: 100%;
        max-height: 100%;
      }

      &:after {
        content: " ";
        display: block;
        padding-top: 66%;
      }
    }

    .name {
      flex-grow: 0;
      flex-shrink: 0;
      width: 5%;
      text-align: right;
      font-size: 110%;
      padding: 5px;
      border-left: 1px solid rgba(255, 255, 255, 0.4);
      border-right: 1px solid rgba(255, 255, 255, 0.4);

      small {
        color: #888;
        margin-right: 5px;

        &.dead {
          text-decoration: line-through;
        }
      }
    }

    .reminder {
      position: fixed;
      padding: 5px 10px;
      left: auto;
      right: auto;
      width: 50ch;
      min-width: 50ch;
      bottom: 10%;
      z-index: 25;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 10px;
      border: 3px solid black;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
      text-align: left;
      pointer-events: none;
      opacity: 0;
      transition: opacity 200ms ease-in-out;
      margin-left: -150px;
    }

    &:hover .reminder {
      opacity: 1;
    }
  }

  &.legend {
    font-weight: bold;
    height: 20px;
    margin-top: 10px;

    li span {
      background: none;
      height: auto;
      font-family: inherit;
      font-size: inherit;
    }

    .icon:after {
      padding-top: 0;
    }
  }
}

.night {
  display: flex;
  align-items: flex-start;
  justify-content: center;

  >*:first-child {
    margin-right: 2vh;
  }

  >* {
    flex-grow: 0;
    flex-wrap: nowrap;
    flex-direction: column;
  }

  .headline {
    display: block;
    font-weight: bold;
    border-bottom: 1px solid rgba(255, 255, 255, 0.4);
    padding: 5px 10px;
    border-radius: 0;
    text-align: center;
  }

  .name {
    flex-grow: 1;
  }

  .first {
    .name {
      border-left: 0;
    }
  }

  .other {
    li .name {
      text-align: left;
      border-right: 0;
    }
  }
}

/** hide players when town square is set to "public" **/
#townsquare.public~.night-reference .modal .player {
  display: none;
}
</style>
