import type {
  Player,
  Role,
  Nomination,
  GamePhase,
  Edition,
} from "@/types";
import { watch } from "vue";
import { useSessionStore, usePlayersStore, useGrimoireStore } from "@/stores";

// Lightweight, typed WebSocket plugin ported from the JS implementation.
// Maintains parity with the original behavior while avoiding explicit any.

export class LiveSession {
  private _wss: string;
  private _socket: WebSocket | null;
  private _isSpectator: boolean;
  private _gamestate: Array<{
    name: string;
    id: string;
    isDead: boolean;
    voteToken: boolean;
    pronouns: string;
    roleId?: string;
  }>;
  private _pingInterval: number;
  private _pingTimer: ReturnType<typeof setTimeout> | null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null;
  private _players: Record<string, number>;
  private _pings: Record<string, number>;

  constructor() {
    // Use environment variable if available, otherwise default to production server
    this._wss =
      import.meta.env["VITE_SERVER_URL"] ||
      "wss://live.clocktower.online:8080/";
    this._socket = null;
    this._isSpectator = true;
    this._gamestate = [];
    this._pingInterval = 30 * 1000; // 30 seconds between pings
    this._pingTimer = null;
    this._reconnectTimer = null;
    this._players = {}; // map of players connected to a session
    this._pings = {}; // map of player IDs to ping
  }

  initialize() {
    const sessionStore = useSessionStore();
    // reconnect to previous session
    if (sessionStore.sessionId) {
      this.connect(sessionStore.sessionId);
    }

    watch(
      () => sessionStore.sessionId,
      (newId) => {
        if (newId) {
          this.connect(newId);
        } else {
          this.disconnect();
        }
      }
    );

    this.subscribeToStores();
  }

  subscribeToStores() {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const grimoireStore = useGrimoireStore();

    sessionStore.$onAction(({ name, args, after }) => {
      after(() => {
        switch (name) {
          case "claimSeat":
            this.claimSeat(args[0] as number);
            break;
          case "distributeRoles":
            if (this._isSpectator) return;
            if (args[0]) this.distributeRoles();
            break;
          case "setNomination":
            if (this._isSpectator) return;
            this.nomination(args[0] as Nomination | null);
            break;
          case "setVoteInProgress":
            if (this._isSpectator) return;
            this.setVoteInProgress();
            break;
          case "voteSync":
            this.vote(args[0] as unknown as [number]);
            break;
          case "lockVote":
            if (this._isSpectator) return;
            this.lockVote();
            break;
          case "setVotingSpeed":
            if (this._isSpectator) return;
            this.setVotingSpeed(args[0] as number);
            break;
          case "clearVoteHistory":
            if (this._isSpectator) return;
            this.clearVoteHistory();
            break;
          case "setAllowSelfNaming":
            if (this._isSpectator) return;
            this.setAllowSelfNaming();
            break;
          case "setVoteHistoryAllowed":
            if (this._isSpectator) return;
            this.setVoteHistoryAllowed();
            break;
          case "toggleSecretVote":
            if (this._isSpectator) return;
            this.setIsSecretVote();
            break;
          case "setGamePhase":
            if (this._isSpectator) return;
            this.setGamePhase(args[0] as GamePhase);
            break;
          case "setMarkedPlayer":
            if (this._isSpectator) return;
            this.setMarked(args[0] as number);
            break;
        }
      });
    });

    playersStore.$onAction(({ name, args, after }) => {
      after(() => {
        switch (name) {
          case "swap":
            if (this._isSpectator) return;
            this.swapPlayer(args[0] as [number, number]);
            break;
          case "move":
            if (this._isSpectator) return;
            this.movePlayer(args[0] as [number, number]);
            break;
          case "remove":
            if (this._isSpectator) return;
            this.removePlayer(args[0] as number);
            break;
          case "set":
          case "clear":
          case "add":
            if (this._isSpectator) return;
            this.sendGamestate("", true);
            break;
          case "update": {
            const payload = args[0] as {
              player: Player;
              property: keyof Player;
              value: unknown;
              isFromSocket?: boolean;
            };
            if (payload.isFromSocket) return;
            if (payload.property === "pronouns") {
              this.sendPlayerPronouns({
                player: payload.player,
                value: payload.value as string,
                isFromSocket: false,
              });
            } else if (payload.property === "name") {
              this.sendPlayerName({
                player: payload.player,
                value: payload.value as string,
                isFromSocket: false,
              });
            } else {
              this.sendPlayer({
                player: payload.player,
                property: payload.property,
                value: payload.value,
              });
            }
            break;
          }
          case "setFabled":
            if (this._isSpectator) return;
            this.sendFabled();
            break;
        }
      });
    });

    grimoireStore.$onAction(({ name, after }) => {
      after(() => {
        if (this._isSpectator) return;
        switch (name) {
          case "toggleRinging":
            this.setIsRinging();
            break;
          case "toggleRooster":
            this.setIsRooster();
            break;
          case "toggleGavel":
            this.setIsGavel();
            break;
          case "setTimer":
            this.setTimer();
            break;
          case "setCustomRoles":
          case "setEdition":
            this.sendEdition();
            break;
        }
      });
    });
  }

  /**
   * Open a new session for the passed channel.
   * @param channel
   * @private
   */
  _open(channel: string) {
    const sessionStore = useSessionStore();
    this.disconnect();
    this._socket = new WebSocket(
      this._wss +
      channel +
      "/" +
      (this._isSpectator ? sessionStore.playerId : "host")
    );
    this._socket.addEventListener("message", this._handleMessage.bind(this));
    this._socket.onopen = this._onOpen.bind(this);
    this._socket.onclose = (err: CloseEvent) => {
      this._socket = null;
      if (this._pingTimer) clearInterval(this._pingTimer);
      this._pingTimer = null;
      if (err.code !== 1000) {
        // connection interrupted, reconnect after 3 seconds
        sessionStore.setReconnecting(true);
        this._reconnectTimer = setTimeout(
          () => this.connect(channel),
          3 * 1000
        );
      } else {
        sessionStore.setSessionId("");
        if (err.reason) alert(err.reason);
      }
    };
  }

  /**
   * Send a message through the socket.
   * @param command
   * @param params
   * @private
   */
  _send(command: string, params: unknown) {
    if (this._socket && this._socket.readyState === 1) {
      this._socket.send(JSON.stringify([command, params]));
    }
  }

  /**
   * Send a message directly to a single playerId, if provided.
   * Otherwise broadcast it.
   * @param playerId player ID or "host", optional
   * @param command
   * @param params
   * @private
   */
  _sendDirect(
    playerId: string | undefined | null,
    command: string,
    params: unknown
  ) {
    if (playerId) {
      this._send("direct", { [playerId]: [command, params] });
    } else {
      this._send(command, params);
    }
  }

  /**
   * Open event handler for socket.
   * @private
   */
  _onOpen() {
    const sessionStore = useSessionStore();
    if (this._isSpectator) {
      this._sendDirect(
        "host",
        "getGamestate",
        sessionStore.playerId
      );
    } else {
      this.sendGamestate();
    }
    this._ping();
  }

  /**
   * Send a ping message with player ID and ST flag.
   * @private
   */
  _ping() {
    const sessionStore = useSessionStore();
    this._handlePing();
    this._send("ping", [
      this._isSpectator
        ? sessionStore.playerId
        : Object.keys(this._players).length,
      "latency",
    ]);
    if (this._pingTimer) clearTimeout(this._pingTimer);
    this._pingTimer = setTimeout(this._ping.bind(this), this._pingInterval);
  }

  /**
   * Handle an incoming socket message.
   * @param data
   * @private
   */
  _handleMessage({ data }: MessageEvent) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const grimoireStore = useGrimoireStore();

    let command: string = "",
      params: unknown;
    try {
      [command, params] = JSON.parse(data);
    } catch (err) {
      console.log("unsupported socket message", err, data);
      return;
    }
    switch (command) {
      case "getGamestate":
        this.sendGamestate(params as string | undefined, false);
        break;
      case "edition":
        this._updateEdition(
          params as {
            edition: Edition;
            roles?: Array<Role | Record<string, unknown>>;
          }
        );
        break;
      case "fabled":
        this._updateFabled(
          params as Array<Role | { id: string; isCustom?: boolean }>
        );
        break;
      case "gs":
        this._updateGamestate(params as Record<string, unknown>);
        break;
      case "player":
        this._updatePlayer(
          params as {
            index: number;
            property: keyof Player;
            value: unknown;
            isFromSocket: boolean;
          }
        );
        break;
      case "claim":
        this._updateSeat(params as [number, string]);
        break;
      case "ping":
        this._handlePing(
          params as [(number | undefined)?, unknown?] | undefined
        );
        break;
      case "nomination":
        if (!this._isSpectator) return;
        if (!params) {
          // create vote history record
          sessionStore.addHistory({
            players: playersStore.players,
            isOrganVoteMode: sessionStore.isSecretVote,
            localeTexts: {
              exile: grimoireStore.t("modal.voteHistory.exile"),
              execution: grimoireStore.t("modal.voteHistory.execution"),
            },
          });
        }
        sessionStore.updateNomination({
          nomination: params as Nomination | null,
        });
        break;
      case "swap":
        if (!this._isSpectator) return;
        playersStore.swap(params as [number, number]);
        break;
      case "move":
        if (!this._isSpectator) return;
        playersStore.move(params as [number, number]);
        break;
      case "remove":
        if (!this._isSpectator) return;
        playersStore.remove(params as number);
        break;
      case "marked":
        if (!this._isSpectator) return;
        sessionStore.setMarkedPlayer(params as number);
        break;
      case "gamePhase":
        if (!this._isSpectator) return;
        sessionStore.setGamePhase(params as GamePhase);
        break;
      case "allowSelfNaming":
        if (!this._isSpectator) return;
        sessionStore.setAllowSelfNaming(!!params);
        break;
      case "isOrganVoteMode":
      case "isSecretVote":
        if (!this._isSpectator) return;
        sessionStore.toggleSecretVote(params as boolean);
        break;
      case "isRinging":
        if (!this._isSpectator) return;
        grimoireStore.toggleRinging(params as boolean);
        break;
      case "isRooster":
        if (!this._isSpectator) return;
        grimoireStore.toggleRooster(params as boolean);
        break;
      case "isGavel":
        if (!this._isSpectator) return;
        grimoireStore.toggleGavel(params as boolean);
        break;
      case "setTimer":
        if (!this._isSpectator) return;
        grimoireStore.setTimer(params as { name?: string; duration?: number });
        break;
      case "isVoteHistoryAllowed":
        if (!this._isSpectator) return;
        sessionStore.setVoteHistoryAllowed(params as boolean);
        sessionStore.clearVoteHistory();
        break;
      case "votingSpeed":
        if (!this._isSpectator) return;
        sessionStore.setVotingSpeed(params as number);
        break;
      case "clearVoteHistory":
        if (!this._isSpectator) return;
        sessionStore.clearVoteHistory();
        break;
      case "isVoteInProgress":
        if (!this._isSpectator) return;
        sessionStore.setVoteInProgress(params as boolean);
        break;
      case "vote":
        this._handleVote(params as [number, boolean, boolean]);
        break;
      case "lock":
        this._handleLock(params as [number, boolean]);
        break;
      case "bye":
        this._handleBye(params as string);
        break;
      case "pronouns":
        this._updatePlayerPronouns(params as [number, string]);
        break;
      case "name":
        this._updatePlayerName(params as [number, string]);
        break;
    }
  }

  /**
   * Connect to a new live session, either as host or spectator.
   * Set a unique playerId if there isn't one yet.
   * @param channel
   */
  connect(channel: string) {
    const sessionStore = useSessionStore();
    if (!sessionStore.playerId) {
      sessionStore.setPlayerId(
        Math.random().toString(36).substr(2)
      );
    }
    this._pings = {};
    sessionStore.setPlayerCount(0);
    sessionStore.setPing(0);
    this._isSpectator = sessionStore.isSpectator;
    this._open(channel);
  }

  /**
   * Close the current session, if any.
   */
  disconnect() {
    const sessionStore = useSessionStore();
    this._pings = {};
    sessionStore.setPlayerCount(0);
    sessionStore.setPing(0);
    sessionStore.setReconnecting(false);
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._socket) {
      if (this._isSpectator) {
        this._sendDirect("host", "bye", sessionStore.playerId);
      }
      this._socket.close(1000);
      this._socket = null;
    }
  }

  /**
   * Request the current gamestate from the host.
   */
  requestGamestate() {
    const sessionStore = useSessionStore();
    if (this._isSpectator && sessionStore.sessionId) {
      this._sendDirect("host", "getGamestate", sessionStore.playerId);
    }
  }

  /**
   * Publish the current gamestate.
   * Optional param to reduce traffic. (send only player data)
   * @param playerId
   * @param isLightweight
   */
  sendGamestate(playerId = "", isLightweight = false) {
    if (this._isSpectator) return;
    const playersStore = usePlayersStore();
    const sessionStore = useSessionStore();
    const grimoireStore = useGrimoireStore();

    this._gamestate = playersStore.players.map((player) => ({
      name: player.name,
      id: player.id,
      isDead: player.isDead,
      voteToken: player.voteToken,
      pronouns: player.pronouns,
      ...(player.role && player.role.team === "traveler"
        ? { roleId: player.role.id }
        : {}),
    }));
    if (isLightweight) {
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isLightweight,
      });
    } else {
      this.sendEdition(playerId);
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        gamePhase: sessionStore.gamePhase,
        isRinging: grimoireStore.isRinging,
        isRooster: grimoireStore.isRooster,
        isGavel: grimoireStore.isGavel,
        timer: grimoireStore.timer,
        allowSelfNaming: sessionStore.allowSelfNaming,
        isVoteHistoryAllowed: sessionStore.isVoteHistoryAllowed,
        isOrganVoteMode: sessionStore.isSecretVote,
        nomination: sessionStore.nomination,
        votingSpeed: sessionStore.votingSpeed,
        lockedVote: sessionStore.lockedVote,
        isVoteInProgress: sessionStore.isVoteInProgress,
        markedPlayer: sessionStore.markedPlayer,
        fabled: playersStore.fabled.map((f) => (f.isCustom ? f : { id: f.id })),
        ...(sessionStore.nomination ? { votes: sessionStore.votes } : {}),
      });
    }
  }

  /**
   * Update the gamestate based on incoming data.
   * @param data
   * @private
   */
  _updateGamestate(data: Record<string, unknown>) {
    if (!this._isSpectator) return;
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const grimoireStore = useGrimoireStore();

    const {
      gamestate,
      isLightweight,
      gamePhase,
      allowSelfNaming,
      isVoteHistoryAllowed,
      isRinging,
      isOrganVoteMode,
      timer,
      nomination,
      votingSpeed,
      votes,
      lockedVote,
      isVoteInProgress,
      markedPlayer,
      fabled,
    } = data as {
      gamestate: Array<{
        name: string;
        id: string;
        isDead: boolean;
        voteToken: boolean;
        pronouns: string;
        roleId?: string;
      }>;
      isLightweight?: boolean;
      gamePhase?: GamePhase;
      allowSelfNaming?: boolean;
      isVoteHistoryAllowed?: boolean;
      isRinging?: boolean;
      isOrganVoteMode?: boolean;
      timer?: { name?: string; duration?: number };
      nomination: Nomination | null;
      votingSpeed?: number;
      votes?: boolean[];
      lockedVote?: number;
      isVoteInProgress?: boolean;
      markedPlayer?: number;
      fabled: Array<{ id: string; isCustom?: boolean }>;
    };
    const players = playersStore.players;
    // adjust number of players
    if (players.length < gamestate.length) {
      for (let x = players.length; x < gamestate.length; x++) {
        playersStore.add(String(gamestate[x]?.name ?? ""));
      }
    } else if (players.length > gamestate.length) {
      for (let x = players.length; x > gamestate.length; x--) {
        playersStore.remove(x - 1);
      }
    }
    // update status for each player
    gamestate.forEach((st, x) => {
      // Get fresh reference to players array after potential additions/removals
      const currentPlayers = playersStore.players;
      const player = currentPlayers[x];
      const { roleId } = st;
      (["name", "id", "isDead", "voteToken", "pronouns"] as const).forEach(
        (property) => {
          const value = st[property];
          if (
            player &&
            (player as unknown as Record<string, unknown>)[property] !== value
          ) {
            playersStore.update({ player, property, value });
          }
        }
      );
      if (player && roleId && player.role.id !== roleId) {
        const role =
          grimoireStore.roles.get(roleId) ||
          grimoireStore.rolesJSONbyId.get(roleId);
        if (role)
          playersStore.update({
            player,
            property: "role",
            value: role,
          });
      } else if (player && !roleId && player.role.team === "traveler") {
        playersStore.update({
          player,
          property: "role",
          value: {},
        });
      }
    });
    if (!isLightweight) {
      grimoireStore.setTimer(timer || {});
      grimoireStore.toggleRinging(!!isRinging);
      sessionStore.setAllowSelfNaming(!!allowSelfNaming);
      sessionStore.setVoteHistoryAllowed(!!isVoteHistoryAllowed);
      sessionStore.setSecretVote(!!isOrganVoteMode);
      sessionStore.updateNomination({
        nomination,
        votes: votes || [],
        votingSpeed: votingSpeed || 0,
        lockedVote: lockedVote || -1,
        isVoteInProgress: isVoteInProgress || false,
      });
      sessionStore.setMarkedPlayer(markedPlayer || -1);
      sessionStore.setGamePhase(gamePhase || "pregame");
      playersStore.setFabled({
        fabled: fabled.map((f) => grimoireStore.fabled.get(f.id) || f),
      });
    }
  }

  /**
   * Publish an edition update. ST only
   * @param playerId
   */
  sendEdition(playerId = "") {
    if (this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    const { edition } = grimoireStore;
    let roles;
    if (edition && !edition.isOfficial) {
      roles = Array.from(grimoireStore.roles.values()).map((role) =>
        role.isCustom ? role : { id: role.id }
      );
    }
    this._sendDirect(playerId, "edition", {
      edition,
      ...(roles ? { roles } : {}),
    });
  }

  /**
   * Update edition and roles for custom editions.
   * @param edition
   * @param roles
   * @private
   */
  _updateEdition({
    edition,
    roles,
  }: {
    edition: Edition;
    roles?: Array<Role | Record<string, unknown>>;
  }) {
    if (!this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    grimoireStore.setEdition(edition);
    if (roles) {
      grimoireStore.setCustomRoles(roles);
      if (grimoireStore.roles.size !== roles.length) {
        const missing: string[] = [];
        roles.forEach((r) => {
          const id =
            (r as Role).id ||
            ((r as unknown as Record<string, unknown>)["id"] as string);
          if (!grimoireStore.roles.get(id)) missing.push(id);
        });
        alert(
          `This session contains custom characters that can't be found. ` +
          `Please load them before joining! ` +
          `Missing roles: ${missing.join(", ")}`
        );
        this.disconnect();
        // grimoireStore.toggleModal("edition"); // Need to implement modal toggling in store
      }
    }
  }

  /**
   * Publish a fabled update. ST only
   */
  sendFabled() {
    if (this._isSpectator) return;
    const playersStore = usePlayersStore();
    const { fabled } = playersStore;
    this._send(
      "fabled",
      fabled.map((f) => (f.isCustom ? f : { id: f.id }))
    );
  }

  /**
   * Update fabled roles.
   * @param fabled
   * @private
   */
  _updateFabled(fabled: Array<Role | { id: string; isCustom?: boolean }>) {
    if (!this._isSpectator) return;
    const playersStore = usePlayersStore();
    const grimoireStore = useGrimoireStore();
    playersStore.setFabled({
      fabled: fabled.map((f) => grimoireStore.fabled.get(f.id) || f),
    });
  }

  /**
   * Publish a player update.
   * @param player
   * @param property
   * @param value
   */
  sendPlayer({
    player,
    property,
    value,
  }: {
    player: Player;
    property: keyof Player | "role";
    value: unknown;
  }) {
    if (
      (this._isSpectator && property !== "role") ||
      property === "reminders"
    )
      return;
    const playersStore = usePlayersStore();
    const index = playersStore.players.indexOf(player);
    if (index === -1) return;
    if (property === "role") {
      const role = value as Role;
      if (role.team && role.team === "traveler") {
        // update local gamestate to remember this player as a traveler
        if (this._gamestate[index]) this._gamestate[index].roleId = role.id;
        this._send("player", {
          index,
          property,
          value: role.id,
        });
      } else if (this._gamestate[index]?.roleId) {
        // player was previously a traveler
        delete this._gamestate[index].roleId;
        this._send("player", { index, property, value: "" });
      }
    } else {
      this._send("player", { index, property, value });
    }
  }

  /**
   * Update a player based on incoming data. Player only.
   * @param index
   * @param property
   * @param value
   * @private
   */
  _updatePlayer({
    index,
    property,
    value,
    isFromSocket,
  }: {
    index: number;
    property: keyof Player | "role";
    value: unknown;
    isFromSocket: boolean;
  }) {
    if (!this._isSpectator) return;
    const playersStore = usePlayersStore();
    const grimoireStore = useGrimoireStore();
    const player = playersStore.players[index];
    if (!player) return;
    // special case where a player stops being a traveler
    if (property === "role") {
      if (!value && player.role.team === "traveler") {
        // reset to an unknown role
        playersStore.update({
          player,
          property: "role",
          value: {},
          isFromSocket,
        });
      } else {
        // load role, first from session, the global, then fail gracefully
        const role =
          grimoireStore.roles.get(value as string) ||
          grimoireStore.rolesJSONbyId.get(value as string) ||
          {};
        playersStore.update({
          player,
          property: "role",
          value: role,
          isFromSocket
        });
      }
    } else {
      // just update the player otherwise
      playersStore.update({ player, property, value, isFromSocket: true });
    }
  }

  /**
   * Publish a player pronouns update
   * @param player
   * @param value
   * @param isFromSockets
   */
  sendPlayerPronouns({
    player,
    value,
    isFromSocket,
  }: {
    player: Player;
    value: string;
    isFromSocket: boolean;
  }) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    //send pronoun only for the seated player or storyteller
    //Do not re-send pronoun data for an update that was recieved from the sockets layer
    if (
      isFromSocket ||
      (this._isSpectator && sessionStore.playerId !== player.id)
    )
      return;
    const index = playersStore.players.indexOf(player);
    this._send("pronouns", [index, value]);
  }

  sendPlayerName({
    player,
    value,
    isFromSocket,
  }: {
    player: Player;
    value: string;
    isFromSocket: boolean;
  }): void {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    //send name only for the seated player or storyteller
    //Do not re-send name data for an update that was recieved from the sockets layer
    if (
      isFromSocket ||
      (this._isSpectator && sessionStore.playerId !== player.id)
    )
      return;
    const index = playersStore.players.indexOf(player);
    this._send("name", [index, value]);
  }

  /**
   * Update a pronouns based on incoming data.
   * @param index
   * @param value
   * @private
   */
  _updatePlayerPronouns([index, value]: [number, string]) {
    const playersStore = usePlayersStore();
    const player = playersStore.players[index];
    if (!player) return;

    playersStore.update({
      player,
      property: "pronouns",
      value,
      isFromSocket: true,
    });
  }

  _updatePlayerName([index, value]: [number, string]) {
    const playersStore = usePlayersStore();
    const player = playersStore.players[index];
    if (!player) return;

    playersStore.update({
      player,
      property: "name",
      value,
      isFromSocket: true,
    });
  }

  /**
   * Handle a ping message by another player / storyteller
   * @param playerIdOrCount
   * @param latency
   * @private
   */
  _handlePing([playerIdOrCount = 0, latency]: [
    (number | undefined)?,
    unknown?
  ] = []) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();

    const now = new Date().getTime();
    if (!this._isSpectator) {
      // remove players that haven't sent a ping in twice the timespan
      for (let player in this._players) {
        if (
          this._players[player] &&
          now - this._players[player] > this._pingInterval * 2
        ) {
          delete this._players[player];
          delete this._pings[player];
        }
      }
      // remove claimed seats from players that are no longer connected
      playersStore.players.forEach((player) => {
        if (player.id && !this._players[player.id]) {
          playersStore.update({
            player,
            property: "id",
            value: "",
          });
        }
      });
      // store new player data
      if (playerIdOrCount) {
        this._players[playerIdOrCount] = now;
        const ping = parseInt(latency as string, 10);
        if (ping && ping > 0 && ping < 30 * 1000) {
          // ping to Players
          this._pings[playerIdOrCount] = ping;
          const pings = Object.values(this._pings);
          sessionStore.setPing(
            Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
          );
        }
      }
    } else if (latency) {
      // ping to ST
      sessionStore.setPing(parseInt(latency as string, 10));
    }
    // update player count
    if (!this._isSpectator || playerIdOrCount) {
      sessionStore.setPlayerCount(
        this._isSpectator ? playerIdOrCount : Object.keys(this._players).length
      );
    }
  }

  /**
   * Handle a player leaving the sessions. ST only
   * @param playerId
   */
  _handleBye(playerId: string) {
    const playersStore = usePlayersStore();
    if (this._isSpectator) return;
    delete this._players[playerId];
    delete this._pings[playerId];
    const player = playersStore.players.find((p) => p.id === playerId);
    if (player) {
      playersStore.update({
        player,
        property: "id",
        value: "",
      });
    }
  }

  /**
   * Handle a seat claim by a player. ST only
   * @param seatIndex
   * @param playerId
   * @private
   */
  _updateSeat([seatIndex, playerId]: [number, string]) {
    const playersStore = usePlayersStore();
    if (this._isSpectator) return;
    const player = playersStore.players[seatIndex];
    if (player) {
      // check if player is already seated
      const oldSeat = playersStore.players.findIndex((p) => p.id === playerId);
      if (oldSeat > -1) {
        const oldPlayer = playersStore.players[oldSeat];
        if (oldPlayer) {
          playersStore.update({
            player: oldPlayer,
            property: "id",
            value: "",
          });
        }
      }
      playersStore.update({
        player,
        property: "id",
        value: playerId,
      });
    }
  }

  /**
   * Handle a vote by a player. ST only
   * @param seatIndex
   * @param vote
   * @param isForced
   * @private
   */
  _handleVote([index, vote, fromST]: [number, boolean, boolean]) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const { session, players } = { session: sessionStore, players: playersStore };
    const playerCount = players.players.length;
    const indexAdjusted =
      (index -
        1 +
        playerCount -
        (typeof session.nomination?.nominee == "number"
          ? session.nomination.nominee
          : (session.nomination?.nominator as number) || 0)) %
      playerCount;
    if (fromST || indexAdjusted >= session.lockedVote - 1) {
      sessionStore.handleVote([index, vote]);
    }
  }

  /**
   * Handle a lock by a player. ST only
   * @param seatIndex
   * @param isForced
   * @private
   */
  _handleLock([seatIndex, isForced]: [number, boolean]) {
    const sessionStore = useSessionStore();
    if (!this._isSpectator) return;
    sessionStore.lockVote(seatIndex);
    if (seatIndex > 1) {
      const { lockedVote, nomination, votes } = sessionStore;
      const playersStore = usePlayersStore();
      const { players } = playersStore;
      const index =
        ((typeof nomination?.nominee == "number"
          ? nomination.nominee
          : (nomination?.nominator as number) || 0) +
          lockedVote -
          1) %
        players.length;
      if (votes[index] !== isForced) {
        sessionStore.vote([index, isForced]);
      }
    }
  }

  /**
   * Claim a seat, needs to be confirmed by the Storyteller.
   * Seats already occupied can't be claimed.
   * @param seat either -1 to vacate or the index of the seat claimed
   */
  claimSeat(seat: number) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    if (!this._isSpectator) return;
    const players = playersStore.players;
    if (players.length > seat && (seat < 0 || !players[seat]?.id)) {
      this._send("claim", [seat, sessionStore.playerId]);
    }
  }

  /**
   * Distribute player roles to all seated players in a direct message.
   * This will be split server side so that each player only receives their own (sub)message.
   */
  distributeRoles() {
    if (this._isSpectator) return;
    const playersStore = usePlayersStore();
    const messageRole: Record<string, unknown[]> = {};
    const messageAlignment: Record<string, unknown[]> = {};
    playersStore.players.forEach((player, index) => {
      if (player.id && player.role) {
        messageRole[player.id] = [
          "player",
          { index, property: "role", value: player.role.id },
        ];
        const alignment =
          player.alignment ||
          (player.role.team === "townsfolk" || player.role.team === "outsider"
            ? "good"
            : player.role.team === "minion" || player.role.team === "demon"
              ? "evil"
              : null);

        messageAlignment[player.id] = [
          "player",
          { index, property: "alignment", value: alignment },
        ];
      }
    });
    if (Object.keys(messageRole).length) {
      this._send("direct", messageRole);
      this._send("direct", messageAlignment);
    }
  }

  /**
   * A player nomination. ST only
   * This also syncs the voting speed to the players.
   * Payload can be an object with {nomination} property or just the nomination itself, or undefined.
   * @param payload [nominator, nominee]|{nomination}
   */
  nomination(payload: Nomination | null) {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const nomination = payload
      ? (payload as unknown as { nomination?: Nomination }).nomination ||
      payload
      : payload;
    const players = playersStore.players;
    if (
      !nomination ||
      ((typeof nomination.nominator !== "number" ||
        players.length > nomination.nominator) &&
        (typeof nomination.nominee !== "number" ||
          players.length > nomination.nominee))
    ) {
      this.setVotingSpeed(sessionStore.votingSpeed);
      this._send("nomination", nomination);
    }
  }

  /**
   * Set the isVoteInProgress status. ST only
   */
  setVoteInProgress() {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    this._send("isVoteInProgress", sessionStore.isVoteInProgress);
  }

  /**
   * Send the isRinging status. ST only
   */
  setIsRinging() {
    if (this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    this._send("isRinging", grimoireStore.isRinging);
  }

  /**
   * Send the isRooster status. ST only
   */
  setIsRooster() {
    if (this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    this._send("isRooster", grimoireStore.isRooster);
  }

  /**
   * Send the isGavel status. ST only
   */
  setIsGavel() {
    if (this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    this._send("isGavel", grimoireStore.isGavel);
  }

  /**
   * Send the isSecretVote status. ST only
   */
  setIsSecretVote() {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    this._send("isSecretVote", sessionStore.isSecretVote);
  }

  setGamePhase(gamePhase: GamePhase) {
    if (this._isSpectator) return;
    this._send("gamePhase", gamePhase);
  }

  /**
   * Start or stop a timer
   */
  setTimer() {
    if (this._isSpectator) return;
    const grimoireStore = useGrimoireStore();
    this._send("setTimer", grimoireStore.timer);
  }

  /**
   * Send the isVoteHistoryAllowed state. ST only
   */
  setVoteHistoryAllowed() {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    this._send(
      "isVoteHistoryAllowed",
      sessionStore.isVoteHistoryAllowed
    );
  }

  setAllowSelfNaming() {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    this._send("allowSelfNaming", sessionStore.allowSelfNaming);
  }

  /**
   * Send the voting speed. ST only
   * @param votingSpeed voting speed in seconds, minimum 1
   */
  setVotingSpeed(votingSpeed: number) {
    if (this._isSpectator) return;
    if (votingSpeed) {
      this._send("votingSpeed", votingSpeed);
    }
  }

  /**
   * Set which player is on the block. ST only
   * @param playerIndex, player id or -1 for empty
   */
  setMarked(playerIndex: number) {
    if (this._isSpectator) return;
    this._send("marked", playerIndex);
  }

  /**
   * Clear the vote history for everyone. ST only
   */
  clearVoteHistory() {
    if (this._isSpectator) return;
    this._send("clearVoteHistory", null);
  }

  /**
   * Send a vote. Player or ST
   * @param index Seat of the player
   */
  vote([index]: [number]) {
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const player = playersStore.players[index];
    if (
      sessionStore.playerId === player?.id ||
      !this._isSpectator
    ) {
      // send vote only if it is your own vote or you are the storyteller
      this._send("vote", [
        index,
        sessionStore.votes[index],
        !this._isSpectator,
      ]);
    }
  }

  /**
   * Lock a vote. ST only
   */
  lockVote() {
    if (this._isSpectator) return;
    const sessionStore = useSessionStore();
    const playersStore = usePlayersStore();
    const { lockedVote, votes, nomination } = sessionStore;
    const { players } = playersStore;
    const index =
      ((typeof nomination?.nominee == "number"
        ? nomination.nominee
        : (nomination?.nominator as number) || 0) +
        lockedVote -
        1) %
      players.length;
    this._send("lock", [sessionStore.lockedVote, votes[index]]);
  }

  /**
   * Swap two player seats. ST only
   * @param payload
   */
  swapPlayer(payload: [number, number]) {
    if (this._isSpectator) return;
    this._send("swap", payload);
  }

  /**
   * Move a player to another seat. ST only
   * @param payload
   */
  movePlayer(payload: [number, number]) {
    if (this._isSpectator) return;
    this._send("move", payload);
  }

  /**
   * Remove a player. ST only
   * @param payload
   */
  removePlayer(payload: number) {
    if (this._isSpectator) return;
    this._send("remove", payload);
  }
}

export default new LiveSession();
