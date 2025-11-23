import { useSessionStore } from "@/stores";
import type { GamePhase, MutationPayload, SessionState } from "@/types";

function parseJSON<T>(raw: string | null): T | null {
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const initPersistence = () => {
  const sessionStore = useSessionStore();

  // --- Hydration ---

  // Session
  if (localStorage.getItem("organVoteMode")) sessionStore.toggleSecretVote(true);
  if (localStorage.getItem("allowSelfNaming")) sessionStore.setAllowSelfNaming(true);

  const playerId = localStorage.getItem("playerId");
  if (playerId) sessionStore.setPlayerId(playerId);

  const sessionRaw = localStorage.getItem("session");
  if (sessionRaw) {
    const data = parseJSON<[boolean, string]>(sessionRaw);
    if (data) {
      const [spectator, sessionId] = data;
      sessionStore.setSpectator(spectator);
      sessionStore.setSessionId(sessionId);
    }
  }

  // Override with URL hash if present
  const hashSessionId = window.location.hash.slice(1);
  if (hashSessionId) {
    if (sessionStore.sessionId !== hashSessionId) {
      sessionStore.setSessionId(hashSessionId);
      // If joining via new link, default to spectator
      sessionStore.setSpectator(true);
    }
  }

  if (localStorage.getItem("gamePhase")) {
    sessionStore.setGamePhase(localStorage.getItem("gamePhase") as GamePhase);
  }

  // --- Subscriptions ---

  sessionStore.$subscribe((_mutation: MutationPayload, state: SessionState) => {
    if (state.isSecretVote) localStorage.setItem("organVoteMode", "1");
    else localStorage.removeItem("organVoteMode");

    if (state.allowSelfNaming) localStorage.setItem("allowSelfNaming", "1");
    else localStorage.removeItem("allowSelfNaming");

    localStorage.setItem("gamePhase", state.gamePhase);

    if (state.playerId) localStorage.setItem("playerId", state.playerId);
    else localStorage.removeItem("playerId");

    if (state.sessionId) {
      localStorage.setItem("session", JSON.stringify([state.isSpectator, state.sessionId]));
    } else {
      localStorage.removeItem("session");
    }
  });
};
