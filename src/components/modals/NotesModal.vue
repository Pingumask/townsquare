<template>
  <Modal v-if="grimoire.modal === 'notes'" class="notes" @close="grimoire.toggleModal(null)">
    <h3>
      {{ t('modal.notes.title') }}
      <font-awesome-icon icon="sticky-note" class="fa fa-sticky-note" />
    </h3>
    <div class="content">
      <textarea v-model="userPreferences.notes" :placeholder="t('modal.notes.placeholder')"></textarea>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { Modal } from '@/components';
import {
  useGrimoireStore,
  useLocaleStore,
  useUserPreferencesStore,
} from "@/stores";

const locale = useLocaleStore();
const grimoire = useGrimoireStore();
const userPreferences = useUserPreferencesStore();
const t = locale.t;
</script>

<style lang="scss" scoped>
@use "../../vars.scss" as *;

h3 {
  margin-bottom: 1rem;
  svg {
    margin-left: 0.5rem;
    color: var(--townsfolk);
  }
}

.content {
  width: 100%;
  height: 60vh;
  min-height: 300px;
  display: flex;

  textarea {
    flex-grow: 1;
    background: rgba(245, 245, 220, 0.9);
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1.5rem;
    font-family: 'Papyrus', 'Roboto Condensed', sans-serif;
    font-size: 1.2rem;
    line-height: 1.6;
    resize: none;
    outline: none;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);

    &:focus {
      border-color: var(--townsfolk);
      background: rgba(255, 255, 240, 1);
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
    }
  }
}
</style>
