<template>
  <dialog ref="dialogRef" class="notes modal" open @mousedown="startDrag">
    <h3 class="drag-handle">
      <span>{{ t("modal.notes.title") }}</span>
      <font-awesome-icon v-if="userPreferences.notes.opened" icon="times-circle"
        class="top-right-button fa fa-times-circle" @click="userPreferences.notes.opened = false" />
      <font-awesome-icon v-else icon="sticky-note" class="top-right-button fa fa-sticky-note"
        @click="userPreferences.notes.opened = true" />
    </h3>
    <div class="content">
      <textarea v-if="userPreferences.notes.opened" ref="textAreaRef" v-model="userPreferences.notes.content"
        :placeholder="t('modal.notes.placeholder')"></textarea>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useLocaleStore, useUserPreferencesStore } from "@/stores";

const locale = useLocaleStore();
const userPreferences = useUserPreferencesStore();
const t = locale.t;

const dialogRef = ref<HTMLDialogElement>();
const textAreaRef = ref<HTMLTextAreaElement>();
const isDragging = ref<boolean>(false);
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const left = computed(() => `${userPreferences.notes.position.x}px`);
const top = computed(() => `${userPreferences.notes.position.y}px`);
const width = computed(() => `${userPreferences.notes.position.width}px`);
const height = computed(() => `${userPreferences.notes.position.height}px`);

const startDrag = (e: MouseEvent) => {
  if (!(e.target as Element).closest(".drag-handle")) return;

  isDragging.value = true;
  const rect = dialogRef.value!.getBoundingClientRect();
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  userPreferences.notes.position.x = e.clientX - dragOffset.value.x;
  userPreferences.notes.position.y = e.clientY - dragOffset.value.y;

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
  e.preventDefault();
};

const drag = (e: MouseEvent) => {
  if (!isDragging.value || !dialogRef.value) return;

  userPreferences.notes.position.x = e.clientX - dragOffset.value.x;
  userPreferences.notes.position.y = e.clientY - dragOffset.value.y;
  if (userPreferences.notes.position.x < 0) userPreferences.notes.position.x = 0;
  if (userPreferences.notes.position.x + dialogRef.value!.getBoundingClientRect().width > window.innerWidth) userPreferences.notes.position.x = window.innerWidth - dialogRef.value!.getBoundingClientRect().width;
  if (userPreferences.notes.position.y < 0) userPreferences.notes.position.y = 0;
  if (userPreferences.notes.position.y + dialogRef.value!.getBoundingClientRect().height > window.innerHeight) userPreferences.notes.position.y = window.innerHeight - dialogRef.value!.getBoundingClientRect().height;
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
};

let resizeObserver: ResizeObserver | null = null;

watch(
  textAreaRef,
  (el) => {
    if (el) {
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            userPreferences.notes.position.width = width;
            userPreferences.notes.position.height = height;
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
</script>

<style lang="scss" scoped>
@use "@/vars.scss" as *;

h3 {
  cursor: move;
  user-select: none;
  margin: 0;

  span {
    margin-right: 2em;
  }

  svg {
    margin-top: 0.25rem;
    margin-left: 0.5rem;

    &:hover path {
      fill: url(#demon);
      stroke-width: 30px;
      stroke: white;
    }
  }
}

dialog.notes {
  height: min-content;
  width: min-content;
  display: none;
  padding-inline: 1rem;
  position: fixed;
  z-index: 100;
  left: v-bind(left);
  top: v-bind(top);
  margin: 0;

  .top-right-button {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
  }

  .content {
    height: 0;
    width: 0;
    display: flex;

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
      height: v-bind(height);
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

  &[open] {
    display: flex;

    .content {
      height: min-content;
      width: min-content;
      padding-bottom: 1rem;

      textarea {
        min-height: 80px;
        min-width: 10ch;
        max-height: 80vh;
        max-width: 80vw;
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
