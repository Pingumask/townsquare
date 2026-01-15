import { defineStore } from "pinia";
import { useGrimoireStore, useSessionStore, useSoundboardStore, useUserPreferencesStore } from "@/stores";
import socket from "@/services/socket";

interface DiscordState {
    currentRoom: string;
    roomState: Record<string, string[]>;
    privateRequests: Record<string, string>;
    activePrivateRoom: string | null;
    activePrivatePartnerUsername: string | null;
    isSelectingForChat: boolean;
    isMuted: boolean;
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
        isMuted: false,
    }),

    actions: {
        toggleSelection() {
            this.isSelectingForChat = !this.isSelectingForChat;
        },

        moveToRoom(roomName: string, options: { skipWebhook?: boolean } = {}) {
            if (this.currentRoom === roomName) return;

            const session = useSessionStore();
            let returnTriggered = false;

            if (this.activePrivateRoom && this.activePrivateRoom !== roomName) {
                const occupants = this.roomState[this.activePrivateRoom] || [];
                const otherId = occupants.find(id => id !== session.playerId);

                if (otherId) {
                    socket.send("direct", {
                        [otherId]: ["discordForceMove", { roomName: "Main Hall" }]
                    });
                }

                if (this.activePrivatePartnerUsername && !options.skipWebhook) {
                    this.sendWebhook({ type: "RETURN", discordUsername2: this.activePrivatePartnerUsername });
                    returnTriggered = true;
                }

                if (!roomName.startsWith("private-")) {
                    this.activePrivateRoom = null;
                    this.activePrivatePartnerUsername = null;
                }
            }

            this.currentRoom = roomName;
            this.sendMove(roomName);

            if (!options.skipWebhook && !(returnTriggered && roomName === "Main Hall")) {
                this.sendWebhook({ type: "MOVE", channelName: roomName });
            }
        },

        requestPrivateChat(targetPlayerId: string) {
            const session = useSessionStore();
            const prefs = useUserPreferencesStore();
            if (!session.playerId) return;

            this.isSelectingForChat = false;
            socket.send("direct", {
                [targetPlayerId]: ["discordRequest", {
                    from: session.playerId,
                    to: targetPlayerId,
                    discordUsername: prefs.discordUsername
                }]
            });
        },

        checkHostPrivileges() {
            const session = useSessionStore();
            const grimoire = useGrimoireStore();
            return !session.isPlayerOrSpectator && grimoire.isDiscordIntegrationEnabled && !!grimoire.discordWebhookUrl;
        },

        async callAllToMainHall() {
            if (!this.checkHostPrivileges()) return;

            socket.send("discordMoveAll", { roomName: "Main Hall" });
            await this.sendWebhook({ type: "MOVEALL" });
            this.moveToRoom("Main Hall", { skipWebhook: true });
        },

        async toggleMute() {
            if (!this.checkHostPrivileges()) return;

            this.isMuted = !this.isMuted;
            await this.sendWebhook({ type: this.isMuted ? "MUTE" : "UNMUTE" });
        },

        async acceptPrivateChat(requesterId: string) {
            const session = useSessionStore();
            const prefs = useUserPreferencesStore();

            const requesterDiscordUsername = this.privateRequests[requesterId];
            if (!requesterDiscordUsername) return;

            const roomName = this.findEmptyPrivateRoom();
            this.enterPrivateRoom(roomName, requesterDiscordUsername);
            delete this.privateRequests[requesterId];

            socket.send("direct", {
                [requesterId]: ["discordAccept", {
                    from: session.playerId,
                    to: requesterId,
                    roomName,
                    discordUsername: prefs.discordUsername
                }]
            });

            this.sendWebhook({ type: "MOVEPRIVATE", discordUsername2: requesterDiscordUsername });
        },

        findEmptyPrivateRoom(): string {
            let i = 1;
            while ((this.roomState[`private-room-${i}`]?.length ?? 0) > 0) i++;
            return `private-room-${i}`;
        },

        enterPrivateRoom(roomName: string, partnerUsername: string) {
            this.currentRoom = roomName;
            this.sendMove(roomName);
            this.activePrivateRoom = roomName;
            this.activePrivatePartnerUsername = partnerUsername;
        },

        async sendWebhook(payload: { type: string; channelName?: string; discordUsername2?: string }) {
            const grimoire = useGrimoireStore();
            const prefs = useUserPreferencesStore();
            if (!grimoire.isDiscordIntegrationEnabled || !grimoire.discordWebhookUrl) return;

            try {
                await fetch(grimoire.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: JSON.stringify({
                            type: payload.type,
                            discordUsername: prefs.discordUsername,
                            ...(payload.channelName && { channelName: payload.channelName }),
                            ...(payload.discordUsername2 && { discordUsername2: payload.discordUsername2 })
                        })
                    })
                });
            } catch (e) {
                console.error("Failed to send discord webhook", e);
            }
        },

        handleRequest(fromPlayerId: string, discordUsername: string) {
            this.privateRequests[fromPlayerId] = discordUsername;
            useSoundboardStore().playSound({ sound: "ring" });
        },

        handleAccept(roomName: string, partnerDiscordUsername: string) {
            this.enterPrivateRoom(roomName, partnerDiscordUsername);
        },

        updateRoomState(newState: Record<string, string[]>) {
            this.roomState = newState;
        },

        sendMove(roomName: string) {
            const session = useSessionStore();

            if (!session.isPlayerOrSpectator) {
                this.processHostMove(session.playerId, roomName);
            } else {
                socket.send("discordMove", {
                    playerId: session.playerId,
                    channelName: roomName,
                });
            }
        },

        processHostMove(playerId: string, roomName: string) {
            for (const r in this.roomState) {
                if (this.roomState[r]) {
                    this.roomState[r] = this.roomState[r].filter(id => id !== playerId);
                }
            }
            if (!this.roomState[roomName]) {
                this.roomState[roomName] = [];
            }
            this.roomState[roomName].push(playerId);
            socket.send("discordState", this.roomState);
        }
    }
});
