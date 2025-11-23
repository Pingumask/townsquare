<template>
    <audio preload="auto">
        <source src="../assets/sounds/countdown.mp3">
        <source src="../assets/sounds/rooster.mp3">
        <source src="../assets/sounds/gavel.mp3">
    </audio>
    <ul>
        <li v-if="grimoire.isRinging">
            <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
                <source src="../assets/sounds/countdown.mp3">
            </audio>
            <font-awesome-icon :icon="['fas', 'music']" />
            <font-awesome-icon :icon="['fas', 'bell']" />
            <font-awesome-icon :icon="['fas', 'music']" />
        </li>
        <li v-if="grimoire.isRooster">
            <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
                <source src="../assets/sounds/rooster.mp3">
            </audio>
            <img src="../assets/icons/dawn.png" alt="dawn" style="height: 2em">
        </li>
        <li v-if="grimoire.isGavel">
            <audio :autoplay="!grimoire.isMuted" :muted="grimoire.isMuted">
                <source src="../assets/sounds/gavel.mp3">
            </audio>
            <font-awesome-icon :icon="['fas', 'gavel']" />
        </li>
    </ul>
</template>

<script setup lang="ts">
import { useGrimoireStore } from "@/stores";
const grimoire = useGrimoireStore();
</script>

<style scoped></style>
