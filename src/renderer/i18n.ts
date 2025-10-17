import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Translation resources
const resources = {
  en: {
    translation: {
      // App navigation
      "nav.discovery": "Discovery",
      "nav.library": "Library",
      "nav.downloads": "Downloads",
      "nav.settings": "Settings",
      
      // Discovery view
      "discovery.title": "Discover Movies & TV Shows",
      "discovery.search": "Search for titles...",
      "discovery.loading": "Loading...",
      
      // Library view
      "library.title": "My Library",
      "library.empty": "Your library is empty",
      "library.addContent": "Add content to get started",
      
      // Downloads view
      "downloads.title": "Downloads",
      "downloads.active": "Active",
      "downloads.completed": "Completed",
      "downloads.paused": "Paused",
      "downloads.empty": "No downloads",
      
      // Download actions
      "download.start": "Start",
      "download.pause": "Pause",
      "download.resume": "Resume",
      "download.cancel": "Cancel",
      
      // Player
      "player.play": "Play",
      "player.pause": "Pause",
      "player.subtitles": "Subtitles",
      "player.audio": "Audio",
      
      // Settings
      "settings.title": "Settings",
      "settings.language": "Language",
      "settings.storage": "Storage Location",
      "settings.bandwidth": "Bandwidth Limit",
      "settings.sections.language": "Language Preferences",
      "settings.sections.storage": "Storage & Downloads",
      "settings.sections.bandwidth": "Bandwidth Limits",
      "settings.sections.appearance": "Appearance",
      "settings.sections.privacy": "Privacy & Telemetry",
      "settings.downloadLimit": "Download Speed Limit",
      "settings.uploadLimit": "Upload Speed Limit",
      "settings.theme": "Theme",
      "settings.themes.light": "Light",
      "settings.themes.dark": "Dark",
      "settings.themes.system": "System Default",
      "settings.telemetry": "Enable telemetry (helps improve the app)",
      "settings.telemetryDescription": "Anonymous usage data to help us improve the app. No personal information is collected.",
      "settings.storageDescription": "Location where media files will be downloaded and stored",
      "settings.bandwidthDescription": "Set to 0 for unlimited. Applies to all downloads.",
      "settings.saved": "Settings saved successfully",
      
      // Common
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.close": "Close",
      "common.error": "Error",
      "common.success": "Success",
      "common.browse": "Browse",
    },
  },
  sw: {
    translation: {
      // App navigation
      "nav.discovery": "Gundua",
      "nav.library": "Maktaba",
      "nav.downloads": "Upakuaji",
      "nav.settings": "Mipangilio",
      
      // Discovery view
      "discovery.title": "Gundua Filamu na Vipindi",
      "discovery.search": "Tafuta kichwa...",
      "discovery.loading": "Inapakia...",
      
      // Library view
      "library.title": "Maktaba Yangu",
      "library.empty": "Maktaba yako ni tupu",
      "library.addContent": "Ongeza maudhui kuanza",
      
      // Downloads view
      "downloads.title": "Upakuaji",
      "downloads.active": "Inaendelea",
      "downloads.completed": "Imekamilika",
      "downloads.paused": "Imesitishwa",
      "downloads.empty": "Hakuna upakuaji",
      
      // Download actions
      "download.start": "Anza",
      "download.pause": "Sitisha",
      "download.resume": "Endelea",
      "download.cancel": "Ghairi",
      
      // Player
      "player.play": "Cheza",
      "player.pause": "Sitisha",
      "player.subtitles": "Tafsiri",
      "player.audio": "Sauti",
      
      // Settings
      "settings.title": "Mipangilio",
      "settings.language": "Lugha",
      "settings.storage": "Mahali pa Kuhifadhi",
      "settings.bandwidth": "Kikomo cha Bandwidth",
      "settings.sections.language": "Upendeleo wa Lugha",
      "settings.sections.storage": "Uhifadhi & Upakuaji",
      "settings.sections.bandwidth": "Vikomo vya Bandwidth",
      "settings.sections.appearance": "Muonekano",
      "settings.sections.privacy": "Faragha & Telemetry",
      "settings.downloadLimit": "Kikomo cha Kasi ya Kupakua",
      "settings.uploadLimit": "Kikomo cha Kasi ya Kupakia",
      "settings.theme": "Mandhari",
      "settings.themes.light": "Mwanga",
      "settings.themes.dark": "Giza",
      "settings.themes.system": "Chaguo-msingi la Mfumo",
      "settings.telemetry": "Wezesha telemetry (inasaidia kuboresha programu)",
      "settings.telemetryDescription": "Data ya matumizi isiyo ya kibinafsi kusaidia kuboresha programu. Hakuna taarifa binafsi zinazokusanywa.",
      "settings.storageDescription": "Mahali ambapo faili za media zitapakuliwa na kuhifadhiwa",
      "settings.bandwidthDescription": "Weka 0 kwa bila kikomo. Inatumika kwa upakuaji wote.",
      "settings.saved": "Mipangilio imehifadhiwa",
      
      // Common
      "common.save": "Hifadhi",
      "common.cancel": "Ghairi",
      "common.close": "Funga",
      "common.error": "Hitilafu",
      "common.success": "Imefanikiwa",
      "common.browse": "Tafuta",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
