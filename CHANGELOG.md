# Release Notes

## Upcoming Version
- Features:

- Fixes:

- Localization:

- Maintenance:


## 6.3.0
- Features:
  - Chat enhancements :
    - Movable Window
    - Storyteller & Players can whisper to each other (ST can quickly switch target player by clicking a message from them or clicking their name from the night order)
    - Storyteller can Disable Neighbor whispers separately from Public chat and Storyteller whisper
    - Storyteller can snoop players whispers
  - Toggleable Filter to hide unattributed characters from night order
  - Toggle voting with space  
  - Added voting sounds and a death sound
  - Added a parchment which prints the current day/night at each game phase change and that announce the end of a game
  - Added a cutsene to announce the winners at the end of a game
  - New Loric : Ventriloquist
- Fixes:
  - Gamephase switch from menu or keybinding bug if current phase is endgame
  - Starting a new game didn't send players back to the "pregame" phase
- Maintenance:
  - Reusable MovableDialog component (used by chat and notes)
  - Updating night order

## 6.2.1
- Features:
  - Storyteller can manually change day counter
- Fixes:
  - Better contrast for Token tooltips in Roles attribution modal
  - Better contrast for Pronouns
  - Better contrast for Players Menu
  - Move text chat to top for mobile users

## 6.2.0
- Features:
  - Allow manual language selection (By default: follows ST language or uses browser's preferences when not playing)
  - Text messaging (global + whisper to neighbors) (can be disabled by storyteller) - credit to [@FerLuisxd](https://github.com/FerLuisxd)
  - Integrated Notepad (toggle with 'Q')
    - Base functionality by [@FerLuisxd](https://github.com/FerLuisxd)
    - Enhanced by [@Pingumask](https://github.com/Pingumask) (Resizable, Movable instead of UI blocking Modal)
  - Adding the Pope
  - More toggleable options in Players' menu
  - Allowing showing an alignment change on a custom role
- Fixes:
  - Send Characters button not visible to players anymore
- Maintenance:
  - Enforce strict equality in linter
  - Updated dependencies

## 6.1.0
- Features:
  - Adding the Hindu Loric
- Fixes:
  - Typo in english menu tabs ("Jeu" instead of "Gameplay")
  - Wrong composition (number of villagers/outsiders) for Teensyville scripts
  - Wrong ids in many included custom scripts
- Localization :
  - Added support for Spanish - credit to [@FerLuisxd](https://github.com/FerLuisxd)
- Maintenance :
  - Removed github actions deployment to github pages (https://pingumask.github.io is deprecated, use https://clocktower.tf instead)
  - Beta deployments managed by netlify (develop branch available at https://beta.clocktower.tf, temporary test versions deployed automatically on pull requests)
  - Updated dependencies

# 6.0.1
- Fixes:
  - nginx config to redirect all traffic to index.html (to fix 404 errors on join links)

# 6.0.0
- Features:
  - Token abilities are now displayed on side of the that has the most space
  - Darker Modals background for better readability
  - Force storyteller locale on players
  - Preference to show/hide night order bubbles saved separately as player and storyteller
  - Added roles filtering to fabled modal
  - Vote history is now persisted by the storyteller and broadcasted to players (if enabled) with anonymization if necessary (secret votes). Making pre-join history available. (made vote history not allowed for players by default)
  - Day count displayed in SideMenu and Vote History
  - Discord integration of join links includes the session ID
  - Clear Roles from storyteller propagates to players
  - Reorganized menu (more tabs regrouping actions that are usually accessed during the same game phase)
- Bugfixes:
  - Ongoing nomination is not lost if the storyteller refreshes the page
  - Soundboard buttons now work during nominations
  - Toggling gamephase to day now triggers the Rooster sound correctly when done via the "s" hotkey
  - Toggling gamephase to night now correctly removes the marked player when done via the "s" hotkey
  - PlayerMenu tab in the top menu was missing its focused state
  - Killing a player doesn't remove the death mark anymore (they can die before their execution but still have the majority upon them)
  - Hotkeys stayed disabled if the browser was refreshed while using the roles filter
  - Reverted unintended change to night order table design
  - Hiding the grimoire hides player names from the night order table in side menu
  - Sounds won't be cut before they end on slower connections
  - Official editions are now loaded correctly from GameStateModal
  - Button for side menu missing hover state
  - Long character names cut on tokens on some browsers (eg : "Charmeur de Serpents" was missing first and last letters on firefox)
- Localization :
  - Fixed typo in En UI :
    - "Pleas claim a seat to vote"
  - Changing some roles' French name:
    - Investigator: Enquêteur -> Détective
    - Fool: Fou -> Bouffon
    - Nightwatchman: Gardien de nuit -> Veilleur de nuit
    - Mastermind: Conspirateur -> Génie du mal
    - Lil' Monsta: Bébé monstre -> P'tit monstre
    - Big Wig: Magistrat -> Gros bonnet
- Technical:
  - Replaced Vuex with Pinia stores
  - Added persistence plugin to Pinia for automated persistence of most stores
  - Lots of code refactoring (generally simpler and more maintainable)
  - Updated dependencies

## 5.8.0
- Features:
  - Adding the Zenomancer
  - Display "beta" in version if in dev environment

## 5.7.0
- Features:
  - Handle Lorics in custom scripts
  - Add Tor & Big Wig Lorics
  - Added "copy link" button to the pregame side menu
- Bugfixes:
  - Gavel sound ending too soon
- Technical :
  - Updated dependencies (1 moderate vulnerability)

## 5.6.0
- Features:
  - Hide session ID in streamer mode
  - Night order in the side menu for both players and storyteller
  - Join/Host buttons in side menu when disconnected
  - Storyteller controlles for pregame in side menu (choose edition, add players, pick roles, send roles)
  - Soundboard in storyteller sidemenu (ringing, rooster, gavel)
  - Secret votes option toggleable from side menu for storyteller
- Bugfixes:
  - [P] Hotkey for adding multiple players
  - Missing message for add multiple players prompt

## 5.5.0
- Features:
  - Server : Configurable allowed origins for the websocket server in docker-compose file
  - Updating the jinxes
- Bugfixes:
  - Unwanted space at the bottom or reference role modal
  - Outsider ability misplaced in night order modal
  - Allowing alive players to vote even if Voudon is in play
- Localization :
  - FR : Changing Slayer's name from "Tueur" to "Pourfendeur"
  - FR : less ambiguous translation of "today" => "ce jour"
  - FR : shorter translation of "today or tonight" => "ce jour ou cette nuit"

## 5.4.0
- Features:
  - Moved hidden votes option to the session menu
  - Added hidden votes option to the storytelling tools
  - Making the Travelers icons two-colored
  - In the script builder, adding titles to the buttons
  - Adding customizable reminder tokens for Amnesiac, Wizard, Bootlegger and Djinn
  - Add several player seats at once (without names)
  - Allow self renames (Even if this option is unchecked, players are prompted for a name if they claim an unnamed seat)
  - Prompt for script name when starting a custom script from script builder
- Bugfixes:
  - Printing the "custom.png" icon on custom reminders in the reminders menu
  - Adding upper cases to "Fabled" and "Loric"
  - Updating order of the roles (for the script builder)
- Localization :
  - Updating messages of hidden votes
  - French translation of Spirit of Ivory's reminder

## 5.3.0
- Feature :
  - Add link to github issues
  - Handle Loric characters (moved Gardener, Stormcatcher, Bootlegger to Loric team). Loric characters are still loaded from fabled.json and handled in the same way as Fabled characters, the change is mainly visual.
  - Search bar in role picker (searches in character name, id, ability, first night reminder & other night reminder)
- Bugfix
  - Changing the name of the option for hidden votes to be more generic
  - Fallback to master language for missing translation tags
- Translation:
  - Fr:
    - Prédicateur reminder : Catastrophe -> Malédiction
    - Fabuleux -> Mythes
- Technical :
  - Upgraded version of Vite (fixes 2 moderate vulnerabilities in dev environments)
  - Added a .dockerignore file
  - Removed apk update from Dokerfile (useless as no apk install follows)

## 5.2.0
- Feature :
  - Timer duration is now saved for each timer type
  - Better Jinx display in the reference modal
  - Select all button in script builder
  - Better handling of roles that officially changed names (gipsy & mephit)
  - Better playerMenu positioning
- Bug fixes :
  - Reminders match the color of their role's team
  - Printing the correct type of the special votes (for now only CL) in the vote history
  - Role picker now correctly displays a scrollbar when needed (whalebuffet becomes playable)
- Code quality :
  - Moved functions from types folder to composables folder
  - Use full Role instead of Role['id'] for reminders
  - Modernized components imports
  - Better accessibility for background videos
- French Translation :
  - Correcting French Lord of Typhon's description to match recent rules clarifications
  - Uniformizing lower and upper cases to use the same logic as the original version

## 5.1.2
- Fixed : Generic icons in night order modal

## 5.1.1
- Further adjustments to token font sizes
- French translations role name changes :
  - Vendeur de jouets -> Fabricant de jouets
  - Libraire infernal -> Bibliothécaire de l'Enfer
  - Ami des corbeaux -> Gardien des corbeaux
  - Charmeur -> Charmeur de Serpents
  - Mercenaire -> Chasseur de primes
  - Maître de Typhon -> Seigneur de Typhon

## 5.1.0
- Removed copyrighted role icons and replaced with svg versions
- Reactive font sizes (smaller text on smaller screens)
  - Smaller text on mobile devices
  - Token name adjusts to role name length better
- Bug correction:
  - Now possible to launch Trouble Brewing Advanced

## 5.0.2
- Fixed : Missing translation for organ grinder votes
- Fixed : Custom role incorrectly formated when sent to players
- Fixed : Custom traveler roles not being automatically shown to players

## 5.0.1
- Fixed vote not being closeable due to a bug in the vote history recording
- Fixed the team names not being displayed correctly

## 5.0.0
- Migrated whole project from Javascript to Typescript
- Automatic rooster sound when we switch to day
- Adding new scripts from the Carousel Collection
- Alternative night order for the editions
- Adding new characters:
  - Deus ex Fiasco
  - Hermit
  - Princess
  - Wraith
  - Cacklejack
- Changes to French translation :
  - Outsiders renamed from "Étrangers" to "Marginaux"
  - Pit-hag renamed from "Chaudronniere" to "Guenaude"
  - Various abilities rephrased
  - Various reminders added and/or adjusted

## 4.2.0
- Using official "safe" reminded instead of "protected"
- Printing default image on reminders (bug correction)
- Updating Organ Grinder's ability text
- Replacing the icons "dawn.png" and "dusk.png"
- Updating some custom scripts
- When sending roles, checking if all roles can be sent to a player
- Ignoring out of date characters in the script builder
- Added "Wrong" reminder for the juggler
- Added "Changed" reminder for the engineer
- Correcting Banshee's night reminders
- Updating the jinxes
- Updating the Hatter's icon
- French Translation updates :
  - Dawn
  - Dusk
  - During
  - Day
  - "Safe" in reminders (already changed earlier in abilities)
  - "Has ability" reminders
  - "No ability" reminders
  - Fibbin renamed from "Menteur" to "Baratineur"
  - Various abilities rephrased
  - Various reminders added and/or adjusted

### Version 4.1.1
- Correcting a bug with the "give back token" update
- Allow voting delay to go down to 0 to lock everyone at once

### Version 4.1.0
- Allowing the Story Teller to give back vote token
- Adding the Wizard
- Adding a "dead" reminder token for the Pit-Hag
- Centering the icon "custom.png"
- French translation :
  - Uniformizing phrasing for "nominate"
  - Uniformizing phrasing for "alive"
  - Minor rephrasing (mainly shortening abilities in Sects & Violets and Bad Moon Rising)
    - Apprentice
    - Barber
    - Exorcist
    - Gossip
    - Judge
    - Mastermind
    - Matron
    - Vortox
    - Voudon
    - Zombuul
  - Character renames in French version
    - Boomdandy
    - Mastermind
    - Sweetheart

### Version 4.0.1
- Bugfix : close edition modal

### Version 4.0.0
- Upgraded to vue 3
