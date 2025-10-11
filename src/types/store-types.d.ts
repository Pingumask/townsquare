import type { RootState } from './store';

// Minimal Vuex-like interfaces used to type JS plugins without explicit any
export type Commit = (type: string, payload?: unknown) => void;

export interface MutationPayload {
  type: string;
  payload?: unknown;
}

export type SubscribeHandler = (
  mutation: MutationPayload,
  state: RootState,
) => void;

export interface StoreLike<State> {
  state: State;
  commit: Commit;
  getters: Record<string, unknown>;
  subscribe: (handler: SubscribeHandler) => void;
}
