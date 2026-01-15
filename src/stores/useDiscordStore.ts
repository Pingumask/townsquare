import { defineStore } from "pinia";
import { useGrimoireStore, useSessionStore, useSoundboardStore, useUserPreferencesStore } from "@/stores";
import socket from "@/services/socket";

interface DiscordState {
    currentRoom: string;
    roomState: Record<string, string[]>; // RoomName -> PlayerID[]
    privateRequests: Record<string, string>; // PlayerID -> Status (sent/received)
    activePrivateRoom: string | null;
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
        isSelectingForChat: false,
    }),

    actions: {
        // --- Actions called by UI ---

        toggleSelection() {
            this.isSelectingForChat = !this.isSelectingForChat;
        },

        moveToRoom(roomName: string) {
            if (this.currentRoom === roomName) return;

            const session = useSessionStore();

            // If leaving a private room, force the other person back to Main Hall
            if (this.activePrivateRoom && this.activePrivateRoom !== roomName) {
                const occupants = this.roomState[this.activePrivateRoom] || [];
                const otherId = occupants.find(id => id !== session.playerId);

                if (otherId) {
                    socket.send("direct", {
                        [otherId]: ["discordForceMove", { roomName: "Main Hall" }]
                    });
                }

                if (!roomName.startsWith("private-")) {
                    this.activePrivateRoom = null;
                }
            }

            this.currentRoom = roomName;

            this.sendMove(roomName);

            this.triggerWebhook("MOVE", roomName);
        },

        requestPrivateChat(targetPlayerId: string) {
            const session = useSessionStore();
            if (!session.playerId) return;

            this.isSelectingForChat = false;

            socket.send("direct", {
                [targetPlayerId]: ["discordRequest", { from: session.playerId, to: targetPlayerId }]
            });

            // Trigger webhook for private call request
            this.triggerWebhook("REQUEST_CALL", targetPlayerId);
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

            this.moveToRoom("Main Hall");
        },

        async acceptPrivateChat(requesterId: string) {
            const session = useSessionStore();
            const myId = session.playerId;

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

            this.moveToRoom(roomName);
            this.activePrivateRoom = roomName;

            delete this.privateRequests[requesterId];

            socket.send("direct", {
                [requesterId]: ["discordAccept", { from: myId, to: requesterId, roomName }]
            });

            this.triggerWebhook("MOVE", roomName);
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

        // --- Actions called by Socket Handlers ---

        handleRequest(fromPlayerId: string) {
            this.privateRequests[fromPlayerId] = 'received';
            // Play a short ring sound to notify of incoming request
            const soundboard = useSoundboardStore();
            soundboard.playSound({ sound: "ring" });
        },

        handleAccept(roomName: string) {
            this.moveToRoom(roomName);
            this.activePrivateRoom = roomName;
            this.triggerWebhook("MOVE", roomName);
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
