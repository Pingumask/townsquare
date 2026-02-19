# Release Notes

## Upcoming Version
- Features:
  - Renaming some roles' variables, to use the same terminology as the official app (only the features already previously coded work)
  - Adding more informations on the roles' reference sheet (script version, Bootlegger rule, Stormcaught character)
- Fixes:
  - Sounds during a vote have been changed to be less disturbing
  - Host refreshing the page during a game with custom character does not give a blank screen anymore (but still requires reloading the script. Additional fix needed to fix completely the issue)
  - Avoid raising hand when pressing space in an input field
- Localization:

- Maintenance:
  - Small code quality refactoring and indentation changes

## 6.4.0
- Features:
  - Raise hand out of votes
  - Check everyone is seated before a vote
- Fixes:
  - Allow soundboard during postgame
  - Notes modal: fix max size
  - Forbid language change for players
  - Clear notes when starting a new game
  - Display error when host tries to whisper to unseated player
  - Chat & Notes moved behind modals and menus
- Localization:
  - Fr : Correcting a typo in the Ventriloquist's description
  - Es : Missing translations for Riot and Plaguedoctor night descriptions

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
- Replaced Vuex with Pinia stores
- Added persistence plugin to Pinia for automated persistence of most stores
- Lots of code refactoring (generally simpler and more maintainable)
- Updated dependencies

## 5.0.0
- Migrated whole project from Javascript to Typescript

### Version 4.0.0
- Upgraded to vue 3
