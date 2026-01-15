import { defineStore } from "pinia";
import { useGrimoireStore, useSessionStore, useSoundboardStore, useUserPreferencesStore } from "@/stores";
import socket from "@/services/socket";

interface DiscordState {
    currentRoom: string;
    roomState: Record<string, string[]>; // RoomName -> PlayerID[]
    privateRequests: Record<string, string>; // PlayerID -> RequesterDiscordUsername
    activePrivateRoom: string | null;
    activePrivatePartnerUsername: string | null; // Discord username of the other person in private call
    isSelectingForChat: boolean;
}

export const useDiscordStore = defineStore("discord", {
    state: (): DiscordState => ({
        currentRoom: "Main Hall",
        roomState: {
            "Main Hall": [],
            "Potion Shop": [],
            "Library": [],
        },
        privateRequests: {},
        activePrivateRoom: null,
        activePrivatePartnerUsername: null,
        isSelectingForChat: false,
    }),

    actions: {
        // --- Actions called by UI ---

        toggleSelection() {
            this.isSelectingForChat = !this.isSelectingForChat;
        },

        moveToRoom(roomName: string, options: { skipWebhook?: boolean } = {}) {
            if (this.currentRoom === roomName) return;

            const session = useSessionStore();

            let returnTriggered = false;
            // If leaving a private room, use RETURN to move both players back to Main Hall
            if (this.activePrivateRoom && this.activePrivateRoom !== roomName) {
                const occupants = this.roomState[this.activePrivateRoom] || [];
                const otherId = occupants.find(id => id !== session.playerId);

                if (otherId) {
                    socket.send("direct", {
                        [otherId]: ["discordForceMove", { roomName: "Main Hall" }]
                    });
                }

                // Trigger RETURN webhook to move both players back to Main Hall
                if (this.activePrivatePartnerUsername && !options.skipWebhook) {
                    this.triggerPrivateWebhook("RETURN", this.activePrivatePartnerUsername);
                    returnTriggered = true;
                }

                if (!roomName.startsWith("private-")) {
                    this.activePrivateRoom = null;
                    this.activePrivatePartnerUsername = null;
                }
            }

            this.currentRoom = roomName;

            this.sendMove(roomName);

            // Skip individual MOVE if RETURN already moved us to Main Hall
            if (!options.skipWebhook && !(returnTriggered && roomName === "Main Hall")) {
                this.triggerWebhook("MOVE", roomName);
            }
        },

        requestPrivateChat(targetPlayerId: string) {
            const session = useSessionStore();
            const prefs = useUserPreferencesStore();
            if (!session.playerId) return;

            this.isSelectingForChat = false;

            // Include discordUsername so the accepter has it for MOVEPRIVATE webhook
            socket.send("direct", {
                [targetPlayerId]: ["discordRequest", {
                    from: session.playerId,
                    to: targetPlayerId,
                    discordUsername: prefs.discordUsername
                }]
            });
        },

        async callAllToMainHall() {
            const session = useSessionStore();
            const grimoire = useGrimoireStore();

            if (session.isPlayerOrSpectator) return;

            if (!grimoire.isDiscordIntegrationEnabled) return;
            if (!grimoire.discordWebhookUrl) return;

            socket.send("discordMoveAll", { roomName: "Main Hall" });

            await fetch(grimoire.discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: JSON.stringify({
                        type: "MOVEALL"
                    })
                })
            });

            this.moveToRoom("Main Hall", { skipWebhook: true });
        },

        async acceptPrivateChat(requesterId: string) {
            const session = useSessionStore();
            const prefs = useUserPreferencesStore();
            const myId = session.playerId;

            // Get the requester's discord username from the stored request
            const requesterDiscordUsername = this.privateRequests[requesterId];
            if (!requesterDiscordUsername) {
                console.error("No discord username found for requester");
                return;
            }

            let i = 1;
            let roomName = "";
            while (true) {
                const name = `private-room-${i}`;
                if (!this.roomState[name] || this.roomState[name].length === 0) {
                    roomName = name;
                    break;
                }
                i++;
            }

            this.currentRoom = roomName;
            this.sendMove(roomName);
            this.activePrivateRoom = roomName;
            this.activePrivatePartnerUsername = requesterDiscordUsername;

            delete this.privateRequests[requesterId];

            // Include accepter's discord username so requester can store it for RETURN webhook
            socket.send("direct", {
                [requesterId]: ["discordAccept", {
                    from: myId,
                    to: requesterId,
                    roomName,
                    discordUsername: prefs.discordUsername
                }]
            });

            // Use MOVEPRIVATE to move both players to an empty private room
            this.triggerPrivateWebhook("MOVEPRIVATE", requesterDiscordUsername);
        },

        async triggerWebhook(type: string, channelName: string) {
            const grimoire = useGrimoireStore();
            const prefs = useUserPreferencesStore();
            if (!grimoire.isDiscordIntegrationEnabled) return;
            if (!grimoire.discordWebhookUrl) return;

            try {
                await fetch(grimoire.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: JSON.stringify({
                            type: type,
                            discordUsername: prefs.discordUsername,
                            channelName: channelName
                        })
                    })
                });
            } catch (e) {
                console.error("Failed to send discord webhook", e);
            }
        },

        // Webhook for private calls (MOVEPRIVATE, RETURN) that involve two users
        async triggerPrivateWebhook(type: "MOVEPRIVATE" | "RETURN", otherDiscordUsername: string) {
            const grimoire = useGrimoireStore();
            const prefs = useUserPreferencesStore();
            if (!grimoire.isDiscordIntegrationEnabled) return;
            if (!grimoire.discordWebhookUrl) return;

            try {
                await fetch(grimoire.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: JSON.stringify({
                            type: type,
                            discordUsername: prefs.discordUsername,
                            discordUsername2: otherDiscordUsername
                        })
                    })
                });
            } catch (e) {
                console.error("Failed to send discord private webhook", e);
            }
        },

        // --- Actions called by Socket Handlers ---

        handleRequest(fromPlayerId: string, discordUsername: string) {
            // Store the requester's discord username so we have it when accepting
            this.privateRequests[fromPlayerId] = discordUsername;
            // Play a short ring sound to notify of incoming request
            const soundboard = useSoundboardStore();
            soundboard.playSound({ sound: "ring" });
        },

        handleAccept(roomName: string, partnerDiscordUsername: string) {
            // Just update UI - the accepter already triggered MOVEPRIVATE which moves both users
            this.currentRoom = roomName;
            this.sendMove(roomName);
            this.activePrivateRoom = roomName;
            this.activePrivatePartnerUsername = partnerDiscordUsername;
        },

        // Called when we receive full state update from Host
        updateRoomState(newState: Record<string, string[]>) {
            this.roomState = newState;
        },

        // --- Networking helpers ---

        sendMove(roomName: string) {
            const prefs = useUserPreferencesStore();
            const session = useSessionStore();

            const payload = {
                type: "MOVE",
                discordUsername: prefs.discordUsername,
                channelName: roomName,
                playerId: session.playerId,
            };

            // If I am host, I update my state directly AND broadcast.
            // If I am player, I send to host to update his state map.
            if (!session.isPlayerOrSpectator) {
                this.processHostMove(session.playerId, roomName);
            } else {
                socket.send("discordMove", payload);
            }
        },

        // Host only: Process a move from anyone (including self) to update the Map
        async processHostMove(playerId: string, roomName: string) {
            // Update local state Map
            // Remove from old rooms
            for (const r in this.roomState) {
                const roomParams = this.roomState[r];
                if (roomParams) {
                    this.roomState[r] = roomParams.filter(id => id !== playerId);
                }
            }
            // Add to new room
            if (!this.roomState[roomName]) {
                this.roomState[roomName] = [];
            }
            this.roomState[roomName].push(playerId);

            // Broadcast new state to everyone
            socket.send("discordState", this.roomState);
        }

    }
});
