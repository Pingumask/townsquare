// Minimal Root-like shape for persistence use; we avoid tight coupling
import type { StoreLike, RootState, Role, Player } from "@/types";

function parseJSON<T>(raw: string | null): T | null {
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export default (store: StoreLike<RootState>) => {
  const updatePagetitle = (isPublic: boolean) =>
    (document.title = `Blood on the Clocktower ${isPublic ? "Town Square" : "Grimoire"}`);

  // initialize data
  const bg = localStorage.getItem("background");
  if (bg) {
    store.commit("setBackground", bg);
  }
  if (localStorage.getItem("muted")) {
    store.commit("toggleMuted", true);
  }
  if (localStorage.getItem("static")) {
    store.commit("toggleStatic", true);
  }
  if (localStorage.getItem("imageOptIn")) {
    store.commit("toggleImageOptIn", true);
  }
  if (localStorage.getItem("streamerMode")) {
    store.commit("toggleStreamerMode", true);
  }
  if (localStorage.getItem("organVoteMode")) {
    store.commit("toggleOrganVoteMode", true);
  }
  if (localStorage.getItem("nightOrder")) {
    store.commit("toggleNightOrder", true);
  }
  if (localStorage.getItem("playersMenu.changePronouns") === "1") {
    store.commit("togglePlayersMenu", "changePronouns");
  }
  if (localStorage.getItem("playersMenu.swapPlayers") === "1") {
    store.commit("togglePlayersMenu", "swapPlayers");
  }
  if (localStorage.getItem("playersMenu.swapAlignment") === "1") {
    store.commit("togglePlayersMenu", "swapAlignment");
  }
  if (localStorage.getItem("playersMenu.specialVote") === "1") {
    store.commit("togglePlayersMenu", "specialVote");
  }
  if (localStorage.getItem("playersMenu.changeName") === "0") {
    store.commit("togglePlayersMenu", "changeName");
  }
  if (localStorage.getItem("playersMenu.movePlayer") === "0") {
    store.commit("togglePlayersMenu", "movePlayer");
  }
  if (localStorage.getItem("playersMenu.removePlayer") === "0") {
    store.commit("togglePlayersMenu", "removePlayer");
  }
  const zoom = localStorage.getItem("zoom");
  if (zoom) {
    store.commit("setZoom", parseFloat(zoom));
  }
  if (localStorage.getItem("isGrimoire")) {
    store.commit("toggleGrimoire", false);
    updatePagetitle(false);
  }
  const rolesRaw = localStorage.getItem("roles");
  if (rolesRaw !== null) {
    store.commit("setCustomRoles", parseJSON(rolesRaw) ?? []);
    store.commit("setEdition", { id: "custom" });
  }
  const edRaw = localStorage.getItem("edition");
  if (edRaw !== null) {
    // this will initialize state.roles for official editions
    store.commit("setEdition", JSON.parse(edRaw));
  }
  const bluffsRaw = localStorage.getItem("bluffs");
  if (bluffsRaw !== null) {
    (parseJSON<string[]>(bluffsRaw) ?? []).forEach((roleId, index) => {
      const role = store.state.roles.get(roleId) ?? ({ id: "" } as Role);
      store.commit("players/setBluff", { index, role });
    });
  }
  const fabledRaw = localStorage.getItem("fabled");
  if (fabledRaw !== null) {
    const list =
      parseJSON<Array<{ id: string; isCustom?: boolean }>>(fabledRaw) ?? [];
    store.commit("players/setFabled", {
      fabled: list.map(
        (f) => store.state.fabled.get(f.id) ?? (f as unknown as Role),
      ),
    });
  }
  const playersRaw = localStorage.getItem("players");
  if (playersRaw) {
    const parsed =
      parseJSON<Array<Player & { role: string }>>(playersRaw) ?? [];
    const rolesJSONbyId = store.getters["rolesJSONbyId"] as Map<string, Role>;
    const players = parsed.map((player) => ({
      ...player,
      role:
        store.state.roles.get(player.role) ||
        rolesJSONbyId.get(player.role) ||
        ({ id: "" } as Role),
    }));
    store.commit("players/set", players);
  }
  /**** Session related data *****/
  const playerId = localStorage.getItem("playerId");
  if (playerId) {
    store.commit("session/setPlayerId", playerId);
  }
  const sessionRaw = localStorage.getItem("session");
  if (sessionRaw && !window.location.hash.slice(1)) {
    const data = parseJSON<[boolean, string]>(sessionRaw);
    if (data) {
      const [spectator, sessionId] = data;
      store.commit("session/setSpectator", spectator);
      store.commit("session/setSessionId", sessionId);
    }
  }

  // listen to mutations
  store.subscribe(({ type, payload }, state) => {
    switch (type) {
      case "toggleGrimoire":
        if (!state.grimoire.isPublic) {
          localStorage.setItem("isGrimoire", "1");
        } else {
          localStorage.removeItem("isGrimoire");
        }
        updatePagetitle(state.grimoire.isPublic);
        break;
      case "setBackground":
        if (payload) {
          localStorage.setItem("background", String(payload));
        } else {
          localStorage.removeItem("background");
        }
        break;
      case "toggleMuted":
        if (state.grimoire.isMuted) {
          localStorage.setItem("muted", "1");
        } else {
          localStorage.removeItem("muted");
        }
        break;
      case "toggleStatic":
        if (state.grimoire.isStatic) {
          localStorage.setItem("static", "1");
        } else {
          localStorage.removeItem("static");
        }
        break;
      case "toggleImageOptIn":
        if (state.grimoire.isImageOptIn) {
          localStorage.setItem("imageOptIn", "1");
        } else {
          localStorage.removeItem("imageOptIn");
        }
        break;
      case "toggleStreamerMode":
        if (state.grimoire.isStreamerMode) {
          localStorage.setItem("streamerMode", "1");
        } else {
          localStorage.removeItem("streamerMode");
        }
        break;
      case "toggleOrganVoteMode":
        if (state.grimoire.isOrganVoteMode) {
          localStorage.setItem("organVoteMode", "1");
        } else {
          localStorage.removeItem("organVoteMode");
        }
        break;
      case "toggleNightOrder":
        if (state.grimoire.isNightOrder) {
          localStorage.setItem("nightOrder", "1");
        } else {
          localStorage.removeItem("nightOrder");
        }
        break;
      case "togglePlayersMenu": {
        const menuKey = `playersMenu.${payload as string}`;
        const menuValue =
          state.playersMenu[payload as keyof typeof state.playersMenu];
        if (menuValue) {
          localStorage.setItem(menuKey, "1");
        } else {
          localStorage.setItem(menuKey, "0");
        }
        break;
      }
      case "setZoom":
        if (payload !== 0) {
          localStorage.setItem("zoom", String(payload));
        } else {
          localStorage.removeItem("zoom");
        }
        break;
      case "setEdition":
        localStorage.setItem("edition", JSON.stringify(payload));
        if (state.edition?.isOfficial) {
          localStorage.removeItem("roles");
        }
        break;
      case "setCustomRoles":
        if (!Array.isArray(payload) || payload.length === 0) {
          localStorage.removeItem("roles");
        } else {
          localStorage.setItem("roles", JSON.stringify(payload));
        }
        break;
      case "players/setBluff":
        localStorage.setItem(
          "bluffs",
          JSON.stringify(state.players.bluffs.map(({ id }) => id)),
        );
        break;
      case "players/setFabled":
        localStorage.setItem(
          "fabled",
          JSON.stringify(
            state.players.fabled.map((fabled) =>
              fabled.isCustom ? fabled : { id: fabled.id },
            ),
          ),
        );
        break;
      case "players/add":
      case "players/update":
      case "players/remove":
      case "players/clear":
      case "players/set":
      case "players/swap":
      case "players/move":
        if (state.players.players.length) {
          localStorage.setItem(
            "players",
            JSON.stringify(
              state.players.players.map((player) => ({
                ...player,
                // simplify the stored data
                role: player.role.id || {},
              })),
            ),
          );
        } else {
          localStorage.removeItem("players");
        }
        break;
      case "session/setSessionId":
        if (payload) {
          localStorage.setItem(
            "session",
            JSON.stringify([state.session.isSpectator, payload as string]),
          );
        } else {
          localStorage.removeItem("session");
        }
        break;
      case "session/setPlayerId":
        if (payload) {
          localStorage.setItem("playerId", String(payload));
        } else {
          localStorage.removeItem("playerId");
        }
        break;
    }
  });
};
