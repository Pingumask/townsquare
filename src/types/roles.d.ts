import type { Player } from "./players";
export interface Role {
  id: string;
  alternates?: string[]; // Alternate ids for roles that used to have a different official name
  name?: string;
  team?: TeamType;
  ability?: string;
  isCustom?: boolean;
  edition?: string;
  firstNight?: number;
  otherNight?: number;
  firstNightEdition?: number;
  otherNightEdition?: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  image?: string|string[];
  imageAlt?: string;
  special?: SpecialFeature|SpecialFeature[];
}

// Extended role interfaces
export interface NightOrderRole extends Role {
  players: Player[];
  firstNightReminder?: string;
  otherNightReminder?: string;
}

export interface SelectableRole extends Role {
  selected: number;
  multiple?: boolean;
}

export interface ToggleableRole extends Role {
  selected?: boolean;
}

export interface RoleGroup {
  [team: string]: SelectableRole[];
}

export interface ParsedRole {
  id: string;
  edition?: string;
  image?: string|string[];
}

export interface JinxInfo {
  first: Role;
  second: Role;
  reason: string;
}

export type TeamType =
  | "default"
  | "townsfolk"
  | "outsider"
  | "minion"
  | "demon"
  | "traveler"
  | "fabled"
  | "loric";

export interface SpecialFeature {
  name: FeatureNameType;
  type: FeatureCategoryType;
  value?: number|string;
  // NB: Due to the differences with the official app, probably no need to use "time"
}

export type FeatureNameType =
  | "bag-disabled"      // This character can't be selected to go into the bag. (to be distributed to the players)
  | "bag-duplicate"     // This character can be added more than once to the bag. (to be distributed to the players)
  | "good-duplicate"    // ** TO DO ** This character allows any good character to be added more than once to the bag. If it's on an NPC in play, it also allows duplicate bluffs.
  | "evil-duplicate"    // ** TO DO ** This character allows any evil character to be added more than once to the bag. [UNOFICIAL]
  | "pointing"          // ** TO DO ** Starts a "point at a player" type of special vote, which allows some or all players to democratically choose a player.
  // NB: Due to the differences with the official app, no need to use "ghost-votes" (This ability returns all spent ghost votes to dead players.)
  // NB: Due to the differences with the official app, no need to use "distribute-roles" (This ability sends out the currently assigned characters to all players.)
  | "open-eyes"         // ** TO DO ** Lets the player with this character open their eyes at night. (assuming time: "night" is used in combination with this) The player can either fully open their eyes or have them half open (called 'peeking') with different effects. Fully opened eyes will allow the player to see all night informations that are being sent, while posing a small risk to be discovered by the player that has received the night signal. Opening their eyes only half-way allows them to see who received the night signal, but not the content. Both modes also allow the player to send and receive private text messages to any non-neighbouring player.
  | "hidden"            // ** CAN BE UPDATED? ** The vote may be run in secret. (in this case, only the Storyteller can see the results)
  | "multiplier"        // ** TO DO ** Assigning any reminder token of this character to a player will modify their vote count with a multiplier. Requires a value to define the multiplier.
  | "need-token"        // Even if this player is alive, they cannot vote, unless the Storyteller gives them a vote token. [UNOFICIAL]
  | "free-dead-vote"    // If this character is alive, dead players can freely vote, even without token. (NB: Possibly only works on Travelers) [UNOFICIAL]
  | "two-hands"         // ** TO DO ** Assingning the first reminder token to a player will allow them to raise two hands instead of one during votes [UNOFICIAL]
  | "replace-character" // ** TO DO ** Assigning the first remindersGlobal reminder token (e.g. "Is the Philosopher") to a player will replace their current character with this one when the game ends. Also used for the night order, from the Storyteller's point of vue.

export type FeatureCategoryType =
  | "selection"       // bag-disabled, bag-duplicate, good-duplicate or evil-duplicate
  | "ability"         // pointing. Also ghost-votes and distribute-roles on the official app
  | "player"          // open-eyes
  /* NB: Due to the differences with the official app, no need to use the type "signal", unless there is a complete update of all the website and how messages are sent to players:
          - grimoire: Send a copy of the Grimoire to the player. The grimoire copy can be modified before being sent.
          - card: Send a pre-defined custom Storyteller card to a player with this character. Requires a value to contain the card text.
          - player: Allows a player with this character to send a pre-defined custom response to the Storyteller. Requires a value to contain the response text.
  */
  | "vote"            // hidden, multiplier, need-token, free-dead-vote or two-hands
  | "reveal"          // replace-character
  
