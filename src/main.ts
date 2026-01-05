import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useGrimoireStore } from "@/stores";
import LiveSession from "./services/socket";
import FontAwesomePlugin from "./plugins/fontawesome";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(FontAwesomePlugin);

// Force loading order : grimoireStore -> persistence -> socket
const grimoireStore = useGrimoireStore();
await grimoireStore.initialize();
LiveSession.initialize();
app.mount("#app");
