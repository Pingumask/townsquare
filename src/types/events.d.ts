// Event interfaces (reusable across components)
export interface PlayerUpdateEvent {
  property: string;
  value: unknown;
}

export interface TriggerEvent {
  action: string;
  params?: unknown;
}

// Socket message types
export interface SocketMessage {
  command: string;
  params: unknown;
}
