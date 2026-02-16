<template>
  <MovableDialog class="notes modal" :position="userPreferences.notes.position" :isOpen="userPreferences.notes.opened"
    :title="t('modal.notes.title')" @toggle="handleToggle">
    <textarea ref="textAreaRef" v-model="userPreferences.notes.content"
      :placeholder="t('modal.notes.placeholder')"></textarea>
  </MovableDialog>
</template>

<script setup lang="ts">
import { MovableDialog } from "@/components";
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useLocaleStore, useUserPreferencesStore } from "@/stores";

const locale = useLocaleStore();
const userPreferences = useUserPreferencesStore();
const t = locale.t;

const textAreaRef = ref<HTMLTextAreaElement>();

const width = computed(() => `${userPreferences.notes.sizing.width}px`);
const height = computed(() => `${userPreferences.notes.sizing.height}px`);

let resizeObserver: ResizeObserver | null = null;

watch(
  textAreaRef,
  (el) => {
    if (el) {
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            userPreferences.notes.sizing.width = width;
            userPreferences.notes.sizing.height = height;
          }
        });
      }
      resizeObserver.observe(el);
    } else {
      resizeObserver?.disconnect();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

const fontSize = computed(() => {
  return `calc(0.9rem * ${(100 + userPreferences.zoom * 10) / 100})`;
});

const handleToggle = () => {
  userPreferences.notes.opened = !userPreferences.notes.opened;
};
</script>

<style lang="scss" scoped>
@use "@/vars.scss" as *;

.notes {
  max-width: 95vw;

  .content {
    textarea {
      flex-grow: 1;
      background: rgba(245, 245, 220, 0.9);
      color: #333;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.75rem;
      font-family: "Papyrus", "Roboto Condensed", sans-serif;
      font-size: v-bind(fontSize);
      line-height: 1.2;
      resize: both;
      outline: none;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
      width: v-bind(width);
      max-width: calc(95vw - 5rem);
      height: v-bind(height);
      max-height: calc(95vh - 6rem);
      margin-top: 0.75em;
      box-sizing: content-box;

      &:focus {
        border-color: var(--townsfolk);
        background: rgba(245, 245, 220, 1);
      }

      &::placeholder {
        color: rgba(0, 0, 0, 0.4);
        font-style: italic;
      }
    }
  }
}
</style>

<style lang="scss">
dialog.notes h3 svg:hover path {
  fill: url(#demon);
  stroke-width: 30px;
  stroke: white;
}
</style>
