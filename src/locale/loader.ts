const supportedLanguages = ["en", "fr"] as string[];
const MASTER_LANGUAGE = "en" as string;
const userLanguages = window.navigator.languages as string[];
let usedLanguage = null as string | null;

for (let lang of userLanguages) {
  if (supportedLanguages.includes(lang)) {
    console.log(`setting to ${lang} locale`);
    usedLanguage = lang; // use first fully supported locale found in the user's browser's settings
    break;
  }
}
if (usedLanguage === null) {
  for (let lang of userLanguages) {
    if (supportedLanguages.includes(lang.substring(0, 2))) {
      console.log(`setting to ${lang.substring(0, 2)} language`);
      usedLanguage = lang.substring(0, 2); // use first supported language found in the user's browser's settings
      break;
    }
  }
}
if (!usedLanguage) {
  usedLanguage = MASTER_LANGUAGE; // set to master language if no language is supported by both the user and the application
}

export const locale = await import(`./${usedLanguage}/ui.json`);
export const rolesJSON = await import(`./${usedLanguage}/roles.json`);
export const jinxesJSON = await import(`./${usedLanguage}/hatred.json`);
export const fabledJSON = await import(`./${usedLanguage}/fabled.json`);
