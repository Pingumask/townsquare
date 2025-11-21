import { useGrimoireStore, usePlayersStore, useSessionStore, usePlayersMenuStore } from "@/stores";
import type { Player, Role, GamePhase, MutationPayload, GrimoireState, PlayersMenuState, SessionState, TimerDurations } from "@/types";

function parseJSON<T>(raw: string | null): T | null {
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const initPersistence = () => {
  const grimoireStore = useGrimoireStore();
  const playersStore = usePlayersStore();
  const sessionStore = useSessionStore();
  const playersMenuStore = usePlayersMenuStore();

  const updatePagetitle = (isPublic: boolean) =>
  (document.title = `Blood on the Clocktower ${isPublic ? "Town Square" : "Grimoire"
    }`);

  // --- Hydration ---

  // Grimoire
  const bg = localStorage.getItem("background");
  if (bg) grimoireStore.setBackground(bg);

  if (localStorage.getItem("muted")) grimoireStore.toggleMuted(true);
  if (localStorage.getItem("static")) grimoireStore.toggleStatic(true);
  if (localStorage.getItem("imageOptIn")) grimoireStore.toggleImageOptIn(true);
  if (localStorage.getItem("streamerMode")) grimoireStore.toggleStreamerMode(true);
  if (localStorage.getItem("nightOrder")) grimoireStore.toggleNightOrder(true);

  const zoom = localStorage.getItem("zoom");
  if (zoom) grimoireStore.setZoom(parseFloat(zoom));

  if (localStorage.getItem("isGrimoire")) {
    grimoireStore.toggleGrimoire(false);
    updatePagetitle(false);
  }

  const timerDurationsRaw = localStorage.getItem("timerDurations");
  if (timerDurationsRaw) {
    const timerDurations = parseJSON(timerDurationsRaw);
    if (timerDurations) {
      grimoireStore.setTimerDurations(timerDurations as TimerDurations);
    }
  }

  const edRaw = localStorage.getItem("edition");
  if (edRaw !== null) {
    grimoireStore.setEdition(JSON.parse(edRaw));
  }

  const rolesRaw = localStorage.getItem("roles");
  if (rolesRaw !== null) {
    grimoireStore.setCustomRoles(parseJSON(rolesRaw) ?? []);
  }

  // Players Menu
  if (localStorage.getItem("playersMenu.changePronouns") === "1") playersMenuStore.changePronouns = true;
  if (localStorage.getItem("playersMenu.swapPlayers") === "1") playersMenuStore.swapPlayers = true;
  if (localStorage.getItem("playersMenu.swapAlignment") === "1") playersMenuStore.swapAlignment = true;
  if (localStorage.getItem("playersMenu.specialVote") === "1") playersMenuStore.specialVote = true;
  if (localStorage.getItem("playersMenu.changeName") === "0") playersMenuStore.changeName = false;
  if (localStorage.getItem("playersMenu.movePlayer") === "0") playersMenuStore.movePlayer = false;
  if (localStorage.getItem("playersMenu.removePlayer") === "0") playersMenuStore.removePlayer = false;

  // Session
  if (localStorage.getItem("organVoteMode")) sessionStore.toggleSecretVote(true);

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

  // Players
  const bluffsRaw = localStorage.getItem("bluffs");
  if (bluffsRaw !== null) {
    const bluffIds = parseJSON<string[]>(bluffsRaw) ?? [];
    bluffIds.forEach((roleId, index) => {
      const role = grimoireStore.roles.get(roleId) || ({ id: "" } as Role);
      playersStore.setBluff({ index, role });
    });
  }

  const fabledRaw = localStorage.getItem("fabled");
  if (fabledRaw !== null) {
    const list = parseJSON<Array<{ id: string; isCustom?: boolean }>>(fabledRaw) ?? [];
    const fabledRoles = list.map(
      (f) => grimoireStore.fabled.get(f.id) ?? (f as unknown as Role)
    );
    playersStore.setFabled({ fabled: fabledRoles });
  }

  const playersRaw = localStorage.getItem("players");
  if (playersRaw) {
    const parsed = parseJSON<Array<Player & { role: string }>>(playersRaw) ?? [];
    const rolesJSONbyId = grimoireStore.rolesJSONbyId;
    const players = parsed.map((player) => ({
      ...player,
      role:
        grimoireStore.roles.get(player.role) ||
        rolesJSONbyId.get(player.role) ||
        ({ id: "" } as Role),
    }));
    playersStore.set(players);
  }


  // --- Subscriptions ---

  // --- Subscriptions ---

  grimoireStore.$subscribe((_mutation: MutationPayload, state: GrimoireState) => {
    if (state.isPublic) localStorage.removeItem("isGrimoire");
    else localStorage.setItem("isGrimoire", "1");
    updatePagetitle(state.isPublic);

    if (state.background) localStorage.setItem("background", state.background);
    else localStorage.removeItem("background");

    if (state.isMuted) localStorage.setItem("muted", "1");
    else localStorage.removeItem("muted");

    if (state.isStatic) localStorage.setItem("static", "1");
    else localStorage.removeItem("static");

    if (state.isImageOptIn) localStorage.setItem("imageOptIn", "1");
    else localStorage.removeItem("imageOptIn");

    if (state.isStreamerMode) localStorage.setItem("streamerMode", "1");
    else localStorage.removeItem("streamerMode");

    if (state.isNightOrder) localStorage.setItem("nightOrder", "1");
    else localStorage.removeItem("nightOrder");

    if (state.zoom !== 0) localStorage.setItem("zoom", String(state.zoom));
    else localStorage.removeItem("zoom");

    localStorage.setItem("timerDurations", JSON.stringify(state.timerDurations));

    if (state.edition) {
      localStorage.setItem("edition", JSON.stringify(state.edition));
      if (state.edition.isOfficial) localStorage.removeItem("roles");
    }

    // Custom roles handling
    if (state.edition && !state.edition.isOfficial) {
      const roles = Array.from(state.roles.values()).map((role) =>
        role.isCustom ? role : { id: role.id }
      );
      localStorage.setItem("roles", JSON.stringify(roles));
    }
  });

  playersMenuStore.$subscribe((_mutation: MutationPayload, state: PlayersMenuState) => {
    Object.entries(state).forEach(([key, value]) => {
      const menuKey = `playersMenu.${key}`;
      // Default values check
      if (key === 'changeName' || key === 'movePlayer' || key === 'removePlayer') {
        if (!value) localStorage.setItem(menuKey, "0");
        else localStorage.removeItem(menuKey);
      } else {
        if (value) localStorage.setItem(menuKey, "1");
        else localStorage.removeItem(menuKey);
      }
    });
  });

  sessionStore.$subscribe((_mutation: MutationPayload, state: SessionState) => {
    if (state.isSecretVote) localStorage.setItem("organVoteMode", "1");
    else localStorage.removeItem("organVoteMode");

    localStorage.setItem("gamePhase", state.gamePhase);

    if (state.playerId) localStorage.setItem("playerId", state.playerId);
    else localStorage.removeItem("playerId");

    if (state.sessionId) {
      localStorage.setItem("session", JSON.stringify([state.isSpectator, state.sessionId]));
    } else {
      localStorage.removeItem("session");
    }
  });

  playersStore.$subscribe((_mutation: MutationPayload, state: { bluffs: Role[], fabled: Role[], players: Player[] }) => {
    localStorage.setItem("bluffs", JSON.stringify(state.bluffs.map(({ id }: { id: string }) => id)));

    localStorage.setItem(
      "fabled",
      JSON.stringify(
        state.fabled.map((fabled: Role) =>
          fabled.isCustom ? fabled : { id: fabled.id }
        )
      )
    );

    if (state.players.length) {
      localStorage.setItem(
        "players",
        JSON.stringify(
          state.players.map((player: Player) => ({
            ...player,
            role: player.role.id || {},
          }))
        )
      );
    } else {
      localStorage.removeItem("players");
    }
  });
};
