import { defineStore } from "pinia";

export interface Animation {
  id: string;
  from: number;
  to: number;
  emoji: string;
}

interface AnimationState {
  animations: Animation[];
}

export const useAnimationStore = defineStore("animation", {
  state: (): AnimationState => ({
    animations: [],
  }),

  actions: {
    addAnimation(animation: Omit<Animation, 'id'>) {
      const id = Date.now() + Math.random().toString();
      this.animations.push({ ...animation, id });
      setTimeout(() => {
        this.removeAnimation(id);
      }, 3000);
    },

    removeAnimation(id: string) {
      this.animations = this.animations.filter(a => a.id !== id);
    },
  },
});
