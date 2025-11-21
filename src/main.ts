import {
  library,
} from "@fortawesome/fontawesome-svg-core";
import {
  faAddressCard,
  faBell,
  faBookOpen,
  faBookDead,
  faBug,
  faChair,
  faCheckDouble,
  faCheckSquare,
  faCloudMoon,
  faCog,
  faCopy,
  faClipboard,
  faDice,
  faDragon,
  faExchangeAlt,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faFileCode,
  faFileUpload,
  faGavel,
  faHandPaper,
  faHandPointRight,
  faHeartbeat,
  faHouseUser,
  faImage,
  faLink,
  faMinusCircle,
  faMinusSquare,
  faMusic,
  faPeopleArrows,
  faPlay,
  faPlusCircle,
  faQuestion,
  faRandom,
  faRedoAlt,
  faSearchMinus,
  faSearchPlus,
  faSkull,
  faSquare,
  faTheaterMasks,
  faTimes,
  faTimesCircle,
  faTowerBroadcast,
  faTrashAlt,
  faUndo,
  faUser,
  faUserEdit,
  faUserFriends,
  faUsers,
  faVenusMars,
  faVolumeUp,
  faVolumeMute,
  faVoteYea,
  faWindowMaximize,
  faWindowMinimize,
  faYinYang,
} from "@fortawesome/free-solid-svg-icons";
import {
  faDocker,
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useGrimoireStore } from "@/stores";
import LiveSession from "./services/socket";

library.add(
  faAddressCard,
  faBell,
  faBookOpen,
  faBookDead,
  faBug,
  faChair,
  faCheckDouble,
  faCheckSquare,
  faCloudMoon,
  faCog,
  faCopy,
  faClipboard,
  faDice,
  faDragon,
  faExchangeAlt,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faFileCode,
  faFileUpload,
  faGavel,
  faHandPaper,
  faHandPointRight,
  faHeartbeat,
  faHouseUser,
  faImage,
  faLink,
  faMinusCircle,
  faMinusSquare,
  faMusic,
  faPeopleArrows,
  faPlay,
  faPlusCircle,
  faQuestion,
  faRandom,
  faRedoAlt,
  faSearchMinus,
  faSearchPlus,
  faSkull,
  faSquare,
  faTheaterMasks,
  faTimes,
  faTimesCircle,
  faTowerBroadcast,
  faTrashAlt,
  faUndo,
  faUser,
  faUserEdit,
  faUserFriends,
  faUsers,
  faVenusMars,
  faVolumeUp,
  faVolumeMute,
  faVoteYea,
  faWindowMaximize,
  faWindowMinimize,
  faYinYang,
  faGithub,
  faDiscord,
  faDocker
);

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.component("FontAwesomeIcon", FontAwesomeIcon);

// Initialize stores and persistence
const grimoireStore = useGrimoireStore();

import { initPersistence } from "./stores/persistence";

// Initialize Grimoire (loads locale etc)
grimoireStore.initialize().then(() => {
  // Initialize Persistence (hydrates state from localStorage)
  initPersistence();

  // Initialize Socket
  LiveSession.initialize();

  app.mount("#app");
});
