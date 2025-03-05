import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const faIcons = [
  "AddressCard",
  "ArrowsRotate",
  "Bell",
  "BookOpen",
  "BookDead",
  "Chair",
  "CheckSquare",
  "CloudMoon",
  "Cog",
  "Copy",
  "Clipboard",
  "Dice",
  "Dragon",
  "ExchangeAlt",
  "ExclamationTriangle",
  "FileCode",
  "FileUpload",
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
  "StarHalfStroke",
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
];
const fabIcons = ["Github", "Discord"];
library.add(
  ...faIcons.map((i) => fas["fa" + i]),
  ...fabIcons.map((i) => fab["fa" + i]),
);
const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon);
app.use(store);

app.mount("#app");
