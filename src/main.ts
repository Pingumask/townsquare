import {
  library,
  type IconDefinition,
} from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { createApp } from "vue";
import App from "./App.vue";
import getStore from "./store";

const faIcons = [
  "AddressCard",
  "Bell",
  "BookOpen",
  "BookDead",
  "Bug",
  "Chair",
  "CkeckDouble",
  "CheckSquare",
  "CloudMoon",
  "Cog",
  "Copy",
  "Clipboard",
  "Dice",
  "Dragon",
  "ExchangeAlt",
  "ExclamationTriangle",
  "Eye",
  "EyeSlash",
  "FileCode",
  "FileUpload",
  "Gavel",
  "HandPaper",
  "HandPointRight",
  "Heartbeat",
  "HouseUser",
  "Image",
  "Link",
  "MinusCircle",
  "MinusSquare",
  "Music",
  "PeopleArrows",
  "Play",
  "PlusCircle",
  "Question",
  "Random",
  "RedoAlt",
  "SearchMinus",
  "SearchPlus",
  "Skull",
  "Square",
  "TheaterMasks",
  "Times",
  "TimesCircle",
  "TowerBroadcast",
  "TrashAlt",
  "Undo",
  "User",
  "UserEdit",
  "UserFriends",
  "Users",
  "VenusMars",
  "VolumeUp",
  "VolumeMute",
  "VoteYea",
  "WindowMaximize",
  "WindowMinimize",
  "YinYang",
];
const fabIcons = ["Github", "Discord", "Docker"];

const fasMap = fas as unknown as Record<string, IconDefinition>;
const fabMap = fab as unknown as Record<string, IconDefinition>;

library.add(
  ...(faIcons.map((i) => fasMap["fa" + i]).filter(Boolean) as IconDefinition[]),
  ...(fabIcons
    .map((i) => fabMap["fa" + i])
    .filter(Boolean) as IconDefinition[]),
);

// Initialize the app asynchronously
const initApp = async () => {
  const store = await getStore();
  const app = createApp(App);
  app.component("FontAwesomeIcon", FontAwesomeIcon);
  app.use(store as unknown as import("vue").Plugin);
  app.mount("#app");
};

initApp().catch(console.error);
