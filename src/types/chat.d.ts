export interface ChatMessage {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  to?: string;
  text: string;
}

export type ChatChannel = "left" | "right" | "global" | "host" | "whispers"
