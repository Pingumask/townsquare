<template>
  <dialog ref="dialogRef" class="movable-dialog" open @mousedown="startDrag">
    <h3 class="drag-handle">
      <span>{{ props.title }}</span>
      <font-awesome-icon v-if="props.isOpen" icon="times-circle" class="top-right-button fa fa-times-circle"
        @click="emit('toggle')" />
      <font-awesome-icon v-else icon="fa-plus-circle" class="top-right-button fa fa-fa-plus-circle"
        @click="emit('toggle')" />
    </h3>
    <div class="content" :class="{ open: isOpen }">
      <slot />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Position } from "@/types";

const emit = defineEmits(["position", "toggle"]);

const dialogRef = ref<HTMLDialogElement>();
const isDragging = ref<boolean>(false);
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const props = defineProps<{
  position: Position;
  isOpen: boolean;
  title: string;
}>();

const left = computed(() => `${props.position.x}px`);
const top = computed(() => `${props.position.y}px`);

const startDrag = (e: MouseEvent) => {
  if (!(e.target as Element).closest(".drag-handle")) return;

  isDragging.value = true;
  const rect = dialogRef.value!.getBoundingClientRect();
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  let newPosition: Position = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y,
  };
  emit("position", newPosition);

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
  e.preventDefault();
};

const drag = (e: MouseEvent) => {
  if (!isDragging.value || !dialogRef.value) return;
  let newPosition = props.position;
  newPosition.x = e.clientX - dragOffset.value.x;
  newPosition.y = e.clientY - dragOffset.value.y;
  if (newPosition.x < 0) newPosition.x = 0;
  if (
    newPosition.x + dialogRef.value!.getBoundingClientRect().width >
    window.innerWidth
  )
    newPosition.x =
      window.innerWidth - dialogRef.value!.getBoundingClientRect().width;
  if (newPosition.y < 0) newPosition.y = 0;
  if (
    newPosition.y + dialogRef.value!.getBoundingClientRect().height >
    window.innerHeight
  )
    newPosition.y =
      window.innerHeight - dialogRef.value!.getBoundingClientRect().height;
  emit("position", newPosition);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
};
</script>

<style lang="scss" scoped>
@use "@/vars.scss" as *;

.movable-dialog {
  height: min-content;
  max-height: 95vh;
  width: min-content;
  max-width: 95vw;
  padding-inline: 1rem;
  position: fixed;
  z-index: 100;
  left: v-bind(left);
  top: v-bind(top);
  margin: 0;
  display: flex;

  .content {
    height: 0;
    width: 0;
    overflow: clip;

    &.open {
      height: min-content;
      width: min-content;
      padding-bottom: 1rem;
      overflow: auto;
    }
  }
}

h3 {
  cursor: move;
  user-select: none;
  margin: 0 0 0.75rem 0;
  line-height: 1;

  span {
    margin-right: 1.5em;
  }

  svg {
    position: absolute;
    top: 0;
    right: 0;

    &:hover path {
      fill: url(#demon);
      stroke-width: 30px;
      stroke: white;
    }
  }

  .top-right-button {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
  }
}
</style>

<style lang="scss">
dialog.movable-dialog h3 svg:hover path {
  fill: url(#demon);
  stroke-width: 30px;
  stroke: white;
}
</style>
