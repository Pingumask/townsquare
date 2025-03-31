# Release Notes

## Upcomming Version
- Using official "safe" reminded instead of "protected"
- Printing default image on reminders (bug correction)
- Updating Organ Grinder's ability text
- Replacing the icons "dawn.png" and "dusk.png"
- Updating some custom scripts
- When sending roles, checking if all roles can be sent to a player
- Ignoring out of date characters in the script builder
- French Translation updates :
  - Dawn
  - Dusk
  - "Safe" in reminders (already changed earlier in abilities)
  - "Has ability" reminders
  - Evil twin ability 
  - Noble ability
  - Bounty hunter ability
  - King ability
  - Cult Leader ability
  - Amnesiac ability
  - Huntsman ability
  - Atheist ability
  - Cannibal ability
  - Shugenja ability
  - Organ grinder ability
  - Fang gu reminders
  - Devil's advocate reminder
  - Zombuul reminder

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

### Version 3.25.1
- Fixed custom scripts background path
- Updating the night order

### Version 3.25.0
- Replacing the icon custom.png
- Changing the order of the three editions, to match the official order
- Minor ability rephrasing in the French version (mainly in Sects & Violets)
- Fixing a bug with the print of the jinxes
- If Voudon is in play, allowing dead players to vote without vote token.

### Version 3.24.4
- Bugfix missing images
- Bugfix custom scripts loading
- Bugfix inverted booleans

### Version 3.24.0

- Adding a system of roles in multiple copies
- Adding the Banshee
- Correcting a colour bug with the icon for number of Townsfolk
- Updating the jinxes
- Updating unofficial scripts and giving them local logos
- Adding new scripts
- Deleting some out-of-date scripts
- Using local path instead of URLs for saved scripts

### Version 3.23.2

- BUGFIX Broken reminder images

### Version 3.23.1

- BUGFIX : styles incorectly applied to fontawesome icones after library upgrade

### Version 3.23.0

- Upgraded from node 18 to node 22
- Replaced vue-cli with Vite
- Set up for docker watch
- Adding tokens to some characters
- Updating the icon for "Demon info & bluffs"
- Minor ability rephrasing in the French version (mainly in Trouble Brewing)

### Version 3.22.0

- Official abilities rebalances :
  - Lil' Monsta
  - Balloonist
  - Harpy
  - Plague Doctor
  - Organ Grinder
  - Lycantrope
  - Boomdandy
  - Alchemist
  - Al-Hadikhia
  - Riot
- New characters :
  - Ogre
  - Alsaahir
  - Zealot
  - Lord of Typhon
  - Boffin
  - Gnome
  - Xaan
- Several minor rephrasing of abilities
- MAINT update dependencies

### Version 3.21.0
- Renaming the "edition" folder and reorganizing its files
- Clearer and more efficient print for the votes hidden by Organ Grinder
- Using official generic icons as default custom icons
- Adding the reminder tokens "Townsfolk", "Outsider", "Minion" and "Demon"
- Unique night order bubble for each player with the same role
- Adding some special votes
- Automatic Djinn and Bootlegger
- Updating night order
- Updating jinxes
- Showing pertinent Fabled during setup
- Script building feature

### Version 3.20.1
- Inconsistancies in french translations for "Power" & "Character"

### Version 3.20.0
- MAINT: Upgrade caniuselite
- Various corrections in the French version
- Minor corrections in the English version
- Translatable night description bubbles

### Version 3.19.0
- MAINT: Updating King description
- MAINT: Update of the icons
- MAINT: chnged french translation for Minions from Serviteurs to sbrires
- MAINT: changed french name for Fibbin from Mensonge to Menteur
- MAINT: french translation inconcistancy for snake charmer
- MAINT: changed french name for Baloonist from Montgolfier to Aéronaute
- MAINT: adjustment to nomination messages
- BUGFIX: missing translation in Roles modal
- BUGFIX: missing translation in Night order modal
- BUGFIX: reminder modal title from translation

### Version 3.18.0
- Adding a missing jinx
- Updating night order (and its print)
- Correcting automatic adding/deletion of Fabled
- Adding all missing roles (up to Summoner)
- Correcting Dawn night order

### Version 3.17.0
- Updating english jinxes
- Adding an asterisk in the roles reference
- Correcting the message when someone wants to exile a Traveller
- Correcting Leviathan's english description
- Correcting "Late Night Drive By"'s name
- Adding a token "Used" to the Doomsayer
- Updated packages & Dockerfile for node >=18

### Version 3.16.0 (merged upstream 2.16.2)
- fixed custom script format to support new script tool JSON
- updated packages to be compatible with Node >= 18 again

### Version 3.15.0
- Night order bubbles always on for storyteller
- Optional night order bubbles for players

### Version 3.14.0
Reworked script selection UI

### Version 3.13.2
Malformed JSON breaking compilation

### Version 3.13.1
Some corrections in the reminders tokens:
- Correcting some french names
- Putting some tokens in "remindersGlobal"
- Deleting some useless tokens, or adding some other

### Version 3.13.0
- Correcting the print when ST assigns roles (adding spaces)
- Changing the default value of "isNightOrder"

### Version 3.12.0
- Printing the number of alive non-Travellers
- Adding the picture leaf-top6.png
- Some corrections in the jinxes (in French)
- Correcting Atheist's french description

### Version 3.11.4
- Correcting the print of new scripts' names

### Version 3.11.3
- Changing default vote duration (3s -> 1s)

### Version 3.11.2
- Various corrections in the french version

### Version 3.11.1
- Small UI tweeks to custom scripts selection

### Version 3.11.0
- Add several included custom scripts

### Version 3.10.2
- Corrected french description for Minstrel

### Version 3.10.1
- Correct some french descriptions (Magician, Acrobat, Riot, Legion, Pixie)

### Version 3.10.0
- Add the Organ Grinder
- Add new option to hide votes if there is an Organ Grinder

### Version 3.9.0
- Upgrade node engine to version 16

### Version 3.8.1
- Several translation correction in french version

### Version 3.8.0
- Corrected several misleading french translations

### Version 3.7.1
- Renamed some gambler & moonchild in french translation

### Version 3.7.0
- Additional reminders for Buddhist & Deviant

### Version 3.6.4
- Menu reorganization

### Version 3.6.3
- Small UI adjustments

### Version 3.6.2
- Dockerization of development environment

### Version 3.6.1
- Gitignore update to ignore some log files

### Version 3.6.0
- Timer presets

### Version 3.5.0
- Better design responsiveness for lower screen resolutions

### Version 3.4.1
- Fixed night order in french version

### Version 3.4.0
- Add Streamer mode

### Version 3.3.0
- Add Narrator tools panel and timers

### Version 3.2.0
- Add more scripts to the "Popular custom scripts" tab

### Version 3.1.0
- Add ring bell option

### Version 3.0.0
- Add localization capabilities and french translation
