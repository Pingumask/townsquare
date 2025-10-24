# Release Notes

## Upcomming Version
- Feature :
  - Add link to github issues
- Bugfix
  - Changing the name of the option for hidden votes to be more generic
  - Fallback to master language for missing translation tags
- Translation:
  - French translation of "Something bad" reminder
- Technical :
  - Upgraded version of Vite (fixes 2 moderate vulnerabilities in dev environments)


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
