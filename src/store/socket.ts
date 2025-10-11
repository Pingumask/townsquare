import type { StoreLike, RootState, Player, Role, Nomination } from "@/types";

// Lightweight, typed WebSocket plugin ported from the JS implementation.
// Maintains parity with the original behavior while avoiding explicit any.

class LiveSession {
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
  private _store: StoreLike<RootState>;
  private _pingInterval: number;
  private _pingTimer: ReturnType<typeof setTimeout> | null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null;
  private _players: Record<string, number>;
  private _pings: Record<string, number>;

  constructor(store: StoreLike<RootState>) {
    // Use environment variable if available, otherwise default to production server
    this._wss =
      import.meta.env["VITE_SERVER_URL"] ||
      "wss://live.clocktower.online:8080/";
    this._socket = null;
    this._isSpectator = true;
    this._gamestate = [];
    this._store = store;
    this._pingInterval = 30 * 1000; // 30 seconds between pings
    this._pingTimer = null;
    this._reconnectTimer = null;
    this._players = {}; // map of players connected to a session
    this._pings = {}; // map of player IDs to ping
    // reconnect to previous session
    if (this._store.state.session.sessionId) {
      this.connect(this._store.state.session.sessionId);
    }
  }

  /**
   * Open a new session for the passed channel.
   * @param channel
   * @private
   */
  _open(channel: string) {
    this.disconnect();
    this._socket = new WebSocket(
      this._wss +
        channel +
        "/" +
        (this._isSpectator ? this._store.state.session.playerId : "host"),
    );
    this._socket.addEventListener("message", this._handleMessage.bind(this));
    this._socket.onopen = this._onOpen.bind(this);
    this._socket.onclose = (err: CloseEvent) => {
      this._socket = null;
      if (this._pingTimer) clearInterval(this._pingTimer);
      this._pingTimer = null;
      if (err.code !== 1000) {
        // connection interrupted, reconnect after 3 seconds
        this._store.commit("session/setReconnecting", true);
        this._reconnectTimer = setTimeout(
          () => this.connect(channel),
          3 * 1000,
        );
      } else {
        this._store.commit("session/setSessionId", "");
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
    params: unknown,
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
    if (this._isSpectator) {
      this._sendDirect(
        "host",
        "getGamestate",
        this._store.state.session.playerId,
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
    this._handlePing();
    this._send("ping", [
      this._isSpectator
        ? this._store.state.session.playerId
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
            edition: RootState["edition"];
            roles?: Array<Role | Record<string, unknown>>;
          },
        );
        break;
      case "fabled":
        this._updateFabled(
          params as Array<Role | { id: string; isCustom?: boolean }>,
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
          },
        );
        break;
      case "claim":
        this._updateSeat(params as [number, string]);
        break;
      case "ping":
        this._handlePing(
          params as [(number | undefined)?, unknown?] | undefined,
        );
        break;
      case "nomination":
        if (!this._isSpectator) return;
        if (!params) {
          // create vote history record
          this._store.commit("session/addHistory", {
            players: this._store.state.players.players,
            isOrganVoteMode: this._store.state.grimoire.isOrganVoteMode,
            localeTexts: {
              exile: (this._store.getters["t"] as (key: string) => string)(
                "modal.voteHistory.exile",
              ),
              execution: (this._store.getters["t"] as (key: string) => string)(
                "modal.voteHistory.execution",
              ),
            },
          });
        }
        this._store.commit("session/nomination", {
          nomination: params as Nomination | null,
        });
        break;
      case "swap":
        if (!this._isSpectator) return;
        this._store.commit("players/swap", params);
        break;
      case "move":
        if (!this._isSpectator) return;
        this._store.commit("players/move", params);
        break;
      case "remove":
        if (!this._isSpectator) return;
        this._store.commit("players/remove", params);
        break;
      case "marked":
        if (!this._isSpectator) return;
        this._store.commit("session/setMarkedPlayer", params);
        break;
      case "isNight":
        if (!this._isSpectator) return;
        this._store.commit("toggleNight", !!params);
        break;
      case "isOrganVoteMode":
        if (!this._isSpectator) return;
        this._store.commit("toggleOrganVoteMode", params);
        break;
      case "isRinging":
        if (!this._isSpectator) return;
        this._store.commit("toggleRinging", params);
        break;
      case "isRooster":
        if (!this._isSpectator) return;
        this._store.commit("toggleRooster", params);
        break;
      case "setTimer":
        if (!this._isSpectator) return;
        this._store.commit("setTimer", params);
        break;
      case "isVoteHistoryAllowed":
        if (!this._isSpectator) return;
        this._store.commit("session/setVoteHistoryAllowed", params);
        this._store.commit("session/clearVoteHistory");
        break;
      case "votingSpeed":
        if (!this._isSpectator) return;
        this._store.commit("session/setVotingSpeed", params);
        break;
      case "clearVoteHistory":
        if (!this._isSpectator) return;
        this._store.commit("session/clearVoteHistory");
        break;
      case "isVoteInProgress":
        if (!this._isSpectator) return;
        this._store.commit("session/setVoteInProgress", params);
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
    }
  }

  /**
   * Connect to a new live session, either as host or spectator.
   * Set a unique playerId if there isn't one yet.
   * @param channel
   */
  connect(channel: string) {
    if (!this._store.state.session.playerId) {
      this._store.commit(
        "session/setPlayerId",
        Math.random().toString(36).substr(2),
      );
    }
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._isSpectator = this._store.state.session.isSpectator;
    this._open(channel);
  }

  /**
   * Close the current session, if any.
   */
  disconnect() {
    this._pings = {};
    this._store.commit("session/setPlayerCount", 0);
    this._store.commit("session/setPing", 0);
    this._store.commit("session/setReconnecting", false);
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._socket) {
      if (this._isSpectator) {
        this._sendDirect("host", "bye", this._store.state.session.playerId);
      }
      this._socket.close(1000);
      this._socket = null;
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
    this._gamestate = this._store.state.players.players.map((player) => ({
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
      const { session, grimoire } = this._store.state;
      const { fabled } = this._store.state.players;
      this.sendEdition(playerId);
      this._sendDirect(playerId, "gs", {
        gamestate: this._gamestate,
        isNight: grimoire.isNight,
        isRinging: grimoire.isRinging,
        isRooster: grimoire.isRooster,
        timer: grimoire.timer,
        isVoteHistoryAllowed: session.isVoteHistoryAllowed,
        isOrganVoteMode: grimoire.isOrganVoteMode,
        nomination: session.nomination,
        votingSpeed: session.votingSpeed,
        lockedVote: session.lockedVote,
        isVoteInProgress: session.isVoteInProgress,
        markedPlayer: session.markedPlayer,
        fabled: fabled.map((f) => (f.isCustom ? f : { id: f.id })),
        ...(session.nomination ? { votes: session.votes } : {}),
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
    const {
      gamestate,
      isLightweight,
      isNight,
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
      isNight?: boolean;
      isVoteHistoryAllowed?: boolean;
      isRinging?: boolean;
      isOrganVoteMode?: boolean;
      timer?: RootState["grimoire"]["timer"];
      nomination: Nomination | null;
      votingSpeed?: number;
      votes?: boolean[];
      lockedVote?: number;
      isVoteInProgress?: boolean;
      markedPlayer?: number;
      fabled: Array<{ id: string; isCustom?: boolean }>;
    };
    const players = this._store.state.players.players;
    // adjust number of players
    if (players.length < gamestate.length) {
      for (let x = players.length; x < gamestate.length; x++) {
        this._store.commit("players/add", String(gamestate[x]?.name ?? ""));
      }
    } else if (players.length > gamestate.length) {
      for (let x = players.length; x > gamestate.length; x--) {
        this._store.commit("players/remove", x - 1);
      }
    }
    // update status for each player
    gamestate.forEach((st, x) => {
      // Get fresh reference to players array after potential additions/removals
      const currentPlayers = this._store.state.players.players;
      const player = currentPlayers[x];
      const { roleId } = st;
      (["name", "id", "isDead", "voteToken", "pronouns"] as const).forEach(
        (property) => {
          const value = st[property];
          if (
            player &&
            (player as unknown as Record<string, unknown>)[property] !== value
          ) {
            this._store.commit("players/update", { player, property, value });
          }
        },
      );
      if (player && roleId && player.role.id !== roleId) {
        const role =
          this._store.state.roles.get(roleId) ||
          (this._store.getters["rolesJSONbyId"] as Map<string, Role>).get(
            roleId,
          );
        if (role)
          this._store.commit("players/update", {
            player,
            property: "role",
            value: role,
          });
      } else if (player && !roleId && player.role.team === "traveler") {
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {},
        });
      }
    });
    if (!isLightweight) {
      this._store.commit("timer", timer);
      this._store.commit("toggleRinging", !!isRinging);
      this._store.commit("toggleNight", !!isNight);
      this._store.commit("session/setVoteHistoryAllowed", isVoteHistoryAllowed);
      this._store.commit("toggleOrganVoteMode", !!isOrganVoteMode);
      this._store.commit("session/nomination", {
        nomination,
        votes,
        votingSpeed,
        lockedVote,
        isVoteInProgress,
      });
      this._store.commit("session/setMarkedPlayer", markedPlayer);
      this._store.commit("players/setFabled", {
        fabled: fabled.map((f) => this._store.state.fabled.get(f.id) || f),
      });
    }
  }

  /**
   * Publish an edition update. ST only
   * @param playerId
   */
  sendEdition(playerId = "") {
    if (this._isSpectator) return;
    const { edition } = this._store.state;
    let roles;
    if (edition && !edition.isOfficial) {
      roles = this._store.getters["customRolesStripped"];
    }
    this._sendDirect(playerId, "edition", {
      edition: edition && edition.isOfficial ? { id: edition.id } : edition,
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
    edition: RootState["edition"];
    roles?: Array<Role | Record<string, unknown>>;
  }) {
    if (!this._isSpectator) return;
    this._store.commit("setEdition", edition);
    if (roles) {
      this._store.commit("setCustomRoles", roles);
      if (this._store.state.roles.size !== roles.length) {
        const missing: string[] = [];
        roles.forEach((r) => {
          const id =
            (r as Role).id ||
            ((r as unknown as Record<string, unknown>)["id"] as string);
          if (!this._store.state.roles.get(id)) missing.push(id);
        });
        alert(
          `This session contains custom characters that can't be found. ` +
            `Please load them before joining! ` +
            `Missing roles: ${missing.join(", ")}`,
        );
        this.disconnect();
        this._store.commit("toggleModal", "edition");
      }
    }
  }

  /**
   * Publish a fabled update. ST only
   */
  sendFabled() {
    if (this._isSpectator) return;
    const { fabled } = this._store.state.players;
    this._send(
      "fabled",
      fabled.map((f) => (f.isCustom ? f : { id: f.id })),
    );
  }

  /**
   * Update fabled roles.
   * @param fabled
   * @private
   */
  _updateFabled(fabled: Array<Role | { id: string; isCustom?: boolean }>) {
    if (!this._isSpectator) return;
    this._store.commit("players/setFabled", {
      fabled: fabled.map((f) => this._store.state.fabled.get(f.id) || f),
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
    if (this._isSpectator || property === "reminders") return;
    const index = this._store.state.players.players.indexOf(player);
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
  }: {
    index: number;
    property: keyof Player | "role";
    value: unknown;
  }) {
    if (!this._isSpectator) return;
    const player = this._store.state.players.players[index];
    if (!player) return;
    // special case where a player stops being a traveler
    if (property === "role") {
      if (!value && player.role.team === "traveler") {
        // reset to an unknown role
        this._store.commit("players/update", {
          player,
          property: "role",
          value: {},
        });
      } else {
        // load role, first from session, the global, then fail gracefully
        const role =
          this._store.state.roles.get(value as string) ||
          (this._store.getters["rolesJSONbyId"] as Map<string, Role>).get(
            value as string,
          ) ||
          {};
        this._store.commit("players/update", {
          player,
          property: "role",
          value: role,
        });
      }
    } else {
      // just update the player otherwise
      this._store.commit("players/update", { player, property, value });
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
    isFromSockets,
  }: {
    player: Player;
    value: string;
    isFromSockets: boolean;
  }) {
    //send pronoun only for the seated player or storyteller
    //Do not re-send pronoun data for an update that was recieved from the sockets layer
    if (
      isFromSockets ||
      (this._isSpectator && this._store.state.session.playerId !== player.id)
    )
      return;
    const index = this._store.state.players.players.indexOf(player);
    this._send("pronouns", [index, value]);
  }

  /**
   * Update a pronouns based on incoming data.
   * @param index
   * @param value
   * @private
   */
  _updatePlayerPronouns([index, value]: [number, string]) {
    const player = this._store.state.players.players[index];

    this._store.commit("players/update", {
      player,
      property: "pronouns",
      value,
      isFromSockets: true,
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
    unknown?,
  ] = []) {
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
      this._store.state.players.players.forEach((player) => {
        if (player.id && !this._players[player.id]) {
          this._store.commit("players/update", {
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
          this._store.commit(
            "session/setPing",
            Math.round(pings.reduce((a, b) => a + b, 0) / pings.length),
          );
        }
      }
    } else if (latency) {
      // ping to ST
      this._store.commit("session/setPing", parseInt(latency as string, 10));
    }
    // update player count
    if (!this._isSpectator || playerIdOrCount) {
      this._store.commit(
        "session/setPlayerCount",
        this._isSpectator ? playerIdOrCount : Object.keys(this._players).length,
      );
    }
  }

  /**
   * Handle a player leaving the sessions. ST only
   * @param playerId
   * @private
   */
  _handleBye(playerId: string) {
    if (this._isSpectator) return;
    delete this._players[playerId];
    this._store.commit(
      "session/setPlayerCount",
      Object.keys(this._players).length,
    );
  }

  /**
   * Claim a seat, needs to be confirmed by the Storyteller.
   * Seats already occupied can't be claimed.
   * @param seat either -1 to vacate or the index of the seat claimed
   */
  claimSeat(seat: number) {
    if (!this._isSpectator) return;
    const players = this._store.state.players.players;
    if (players.length > seat && (seat < 0 || !players[seat]?.id)) {
      this._send("claim", [seat, this._store.state.session.playerId]);
    }
  }

  /**
   * Update a player id associated with that seat.
   * @param index seat index or -1
   * @param value playerId to add / remove
   * @private
   */
  _updateSeat([index, value]: [number, string]) {
    if (this._isSpectator) return;
    const property = "id";
    const players = this._store.state.players.players;
    // remove previous seat
    const oldIndex = players.findIndex(({ id }) => id === value);
    if (oldIndex >= 0 && oldIndex !== index) {
      this._store.commit("players/update", {
        player: players[oldIndex],
        property,
        value: "",
      });
    }
    // add playerId to new seat
    if (index >= 0) {
      const player = players[index];
      if (!player) return;
      this._store.commit("players/update", { player, property, value });
    }
    // update player session list as if this was a ping
    this._handlePing([1, value]);
  }

  /**
   * Distribute player roles to all seated players in a direct message.
   * This will be split server side so that each player only receives their own (sub)message.
   */
  distributeRoles() {
    if (this._isSpectator) return;
    const messageRole: Record<string, unknown[]> = {};
    const messageAlignment: Record<string, unknown[]> = {};
    this._store.state.players.players.forEach((player, index) => {
      if (player.id && player.role) {
        messageRole[player.id] = [
          "player",
          { index, property: "role", value: player.role.id },
        ];
        messageAlignment[player.id] = [
          "player",
          { index, property: "alignment", value: player.alignment },
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
    const nomination = payload
      ? (payload as unknown as { nomination?: Nomination }).nomination ||
        payload
      : payload;
    const players = this._store.state.players.players;
    if (
      !nomination ||
      ((typeof nomination.nominator !== "number" ||
        players.length > nomination.nominator) &&
        (typeof nomination.nominee !== "number" ||
          players.length > nomination.nominee))
    ) {
      this.setVotingSpeed(this._store.state.session.votingSpeed);
      this._send("nomination", nomination);
    }
  }

  /**
   * Set the isVoteInProgress status. ST only
   */
  setVoteInProgress() {
    if (this._isSpectator) return;
    this._send("isVoteInProgress", this._store.state.session.isVoteInProgress);
  }

  /**
   * Send the isNight status. ST only
   */
  setIsNight() {
    if (this._isSpectator) return;
    this._send("isNight", this._store.state.grimoire.isNight);
  }

  /**
   * Send the isRinging status. ST only
   */
  setIsRinging() {
    if (this._isSpectator) return;
    this._send("isRinging", this._store.state.grimoire.isRinging);
  }

  /**
   * Send the isRooster status. ST only
   */
  setIsRooster() {
    if (this._isSpectator) return;
    this._send("isRooster", this._store.state.grimoire.isRooster);
  }

  /**
   * Send the isOrganVoteMode status. ST only
   */
  setIsOrganVoteMode() {
    if (this._isSpectator) return;
    this._send("isOrganVoteMode", this._store.state.grimoire.isOrganVoteMode);
  }

  /**
   * Start or stop a timer
   */
  setTimer() {
    if (this._isSpectator) return;
    this._send("setTimer", this._store.state.grimoire.timer);
  }

  /**
   * Send the isVoteHistoryAllowed state. ST only
   */
  setVoteHistoryAllowed() {
    if (this._isSpectator) return;
    this._send(
      "isVoteHistoryAllowed",
      this._store.state.session.isVoteHistoryAllowed,
    );
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
   * @param sync Flag whether to sync this vote with others or not
   */
  vote([index]: [number]) {
    const player = this._store.state.players.players[index];
    if (
      this._store.state.session.playerId === player?.id ||
      !this._isSpectator
    ) {
      // send vote only if it is your own vote or you are the storyteller
      this._send("vote", [
        index,
        this._store.state.session.votes[index],
        !this._isSpectator,
      ]);
    }
  }

  /**
   * Handle an incoming vote, but only if it is from ST or unlocked.
   * @param index
   * @param vote
   * @param fromST
   */
  _handleVote([index, vote, fromST]: [number, boolean, boolean]) {
    const { session, players } = this._store.state;
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
      this._store.commit("session/vote", [index, vote]);
    }
  }

  /**
   * Lock a vote. ST only
   */
  lockVote() {
    if (this._isSpectator) return;
    const { lockedVote, votes, nomination } = this._store.state.session;
    const { players } = this._store.state.players;
    const index =
      ((typeof nomination?.nominee == "number"
        ? nomination.nominee
        : (nomination?.nominator as number) || 0) +
        lockedVote -
        1) %
      players.length;
    this._send("lock", [this._store.state.session.lockedVote, votes[index]]);
  }

  /**
   * Update vote lock and the locked vote, if it differs. Player only
   * @param lock
   * @param vote
   * @private
   */
  _handleLock([lock, vote]: [number, boolean]) {
    if (!this._isSpectator) return;
    this._store.commit("session/lockVote", lock);
    if (lock > 1) {
      const { lockedVote, nomination } = this._store.state.session;
      const { players } = this._store.state.players;
      const index =
        ((typeof nomination?.nominee == "number"
          ? nomination.nominee
          : (nomination?.nominator as number) || 0) +
          lockedVote -
          1) %
        players.length;
      if (this._store.state.session.votes[index] !== vote) {
        this._store.commit("session/vote", [index, vote]);
      }
    }
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

export default (store: StoreLike<RootState>) => {
  // setup
  const session = new LiveSession(store);

  // listen to mutations
  store.subscribe(
    (
      { type, payload }: { type: string; payload?: unknown },
      state: RootState,
    ) => {
      switch (type) {
        case "session/setSessionId":
          if (state.session.sessionId) {
            session.connect(state.session.sessionId);
          } else {
            window.location.hash = "";
            session.disconnect();
          }
          break;
        case "session/claimSeat":
          session.claimSeat(payload as number);
          break;
        case "session/distributeRoles":
          if (payload) {
            session.distributeRoles();
          }
          break;
        case "session/nomination":
        case "session/setNomination":
          session.nomination(payload as Nomination | null);
          break;
        case "session/setVoteInProgress":
          session.setVoteInProgress();
          break;
        case "session/voteSync":
          session.vote(payload as [number]);
          break;
        case "session/lockVote":
          session.lockVote();
          break;
        case "session/setVotingSpeed":
          session.setVotingSpeed(payload as number);
          break;
        case "session/clearVoteHistory":
          session.clearVoteHistory();
          break;
        case "session/setVoteHistoryAllowed":
          session.setVoteHistoryAllowed();
          break;
        case "toggleNight":
          session.setIsNight();
          break;
        case "toggleOrganVoteMode":
          session.setIsOrganVoteMode();
          break;
        case "toggleRinging":
          session.setIsRinging();
          break;
        case "toggleRooster":
          session.setIsRooster();
          break;
        case "setTimer":
          session.setTimer();
          break;
        case "setEdition":
          session.sendEdition();
          break;
        case "players/setFabled":
          session.sendFabled();
          break;
        case "session/setMarkedPlayer":
          session.setMarked(payload as number);
          break;
        case "players/swap":
          session.swapPlayer(payload as [number, number]);
          break;
        case "players/move":
          session.movePlayer(payload as [number, number]);
          break;
        case "players/remove":
          session.removePlayer(payload as number);
          break;
        case "players/set":
        case "players/clear":
        case "players/add":
          session.sendGamestate("", true);
          break;
        case "players/update": {
          const updatePayload = payload as {
            property: string;
            player: Player;
            value: unknown;
            isFromSockets?: boolean;
          };
          if (updatePayload.property === "pronouns") {
            session.sendPlayerPronouns(
              updatePayload as {
                player: Player;
                value: string;
                isFromSockets: boolean;
              },
            );
          } else {
            session.sendPlayer(
              updatePayload as {
                player: Player;
                property: keyof Player | "role";
                value: unknown;
              },
            );
          }
          break;
        }
      }
    },
  );

  // check for session Id in hash
  const sessionId = window.location.hash.slice(1);
  if (sessionId) {
    store.commit("session/setSpectator", true);
    store.commit("session/setSessionId", sessionId);
    store.commit("toggleGrimoire", false);
  }
};
