import type { StateTree } from "pinia";
import type { Persistence } from "pinia-plugin-persistedstate";
export type PersistenceOptions<State extends StateTree = StateTree> = Partial<
  Omit<Persistence<State>, "key">
> & {
  key?: ((s: string) => string) | string;
};
export type Persist<State extends StateTree = StateTree> =
  | boolean
  | PersistenceOptions<State>
  | PersistenceOptions<State>[];
