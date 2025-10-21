import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const SETTINGS_STORAGE_KEY = "userSettings";

function getInitialLanguage(): "en" | "sw" {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.language === "en" || parsed?.language === "sw") {
        return parsed.language;
      }
    }

    const browserLang = window.navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === "sw") return "sw";
  } catch (err) {
    console.warn("Failed to read stored language preference", err);
  }

  return "en";
}

const resources = {
  en: {
    translation: {
      // App
      "app.title": "ChillyMovies",

      // Navigation
      "nav.home": "Home",
      "nav.movies": "Movies",
      "nav.tvSeries": "TV Series",
      "nav.discovery": "Discovery",
      "nav.library": "Library",
      "nav.downloads": "Downloads",
      "nav.settings": "Settings",

      // Sidebar
      "sidebar.languageLabel": "Language",
      "sidebar.collapse": "Collapse",
      "sidebar.expand": "Expand",
      "sidebar.mainNavigation": "Main navigation",
      "sidebar.primaryNavigation": "Primary navigation",
      "languages.english": "English",
      "languages.swahili": "Kiswahili",
      "sidebar.tagline": "Offline cinema experience",

      // Header
      "header.searchPlaceholder": "Search for movies, series...",
      "header.themeToggle": "Toggle theme",

      // Discovery / Home view
      "home.featuredHeading": "Featured",
      "home.discoveryHeading": "Discover",
      "home.loading": "Loading recommendations...",
      "home.error": "Unable to load recommendations",
      "home.empty": "No results yet. Try searching for a title.",
      "home.popularMovies": "Popular Movies",
      "home.popularTV": "Popular TV Series",
      "home.searchResults": "Search Results",
      "home.searching": "Searching...",
      "home.searchError": "Search failed. Please try again.",
      "home.noResults": "No results found",
      "discovery.title": "Discover Movies & TV Shows",
      "discovery.search": "Search for titles...",
      "discovery.loading": "Loading...",
      "discovery.findTorrents": "Find Torrents",
      "discovery.watchTrailer": "Watch Trailer",

      // Library view
      "library.title": "My Library",
      "library.empty": "Your library is empty",
      "library.addContent": "Add content to get started",
      "library.emptyStateTitle": "Your library is empty",
      "library.emptyStateDescription": "Add movies to your library from Discover or import existing files.",
      "library.item": "item",
      "library.items": "items",
      "library.play": "Play",
      "library.delete": "Delete",
      "library.browseMovies": "Browse Movies",
      "library.playNotImplemented": "Video player not yet implemented",
      "library.deleteNotImplemented": "Delete functionality not yet implemented",
      "library.confirmDelete": "Are you sure you want to delete this item? This will remove the file from your library.",
      "library.deleteError": "Failed to delete item",
      "library.deleteSuccess": "Media Deleted",
      "library.playing": "Now Playing",

      // Downloads view
      "downloads.title": "Downloads",
      "downloads.active": "Active",
      "downloads.completed": "Completed",
      "downloads.paused": "Paused",
      "downloads.empty": "No downloads",
      "downloads.emptyStateTitle": "No downloads yet",
      "downloads.emptyStateDescription": "Start a download from Discover to see progress here.",
      "downloads.status.downloading": "Downloading",
      "downloads.status.paused": "Paused",
      "downloads.status.completed": "Completed",
      "downloads.status.error": "Error",
      "downloads.speed": "Speed",
      "downloads.eta": "ETA",
      "downloads.actions.pause": "Pause",
      "downloads.actions.resume": "Resume",
      "downloads.actions.cancel": "Cancel",
      "downloads.actions.pauseError": "Failed to pause download",
      "downloads.actions.resumeError": "Failed to resume download",
      "downloads.actions.cancelError": "Failed to cancel download",

      // Download actions
      "download.start": "Download",
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
      "settings.downloadSection": "Downloads",
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
      "settings.saveSuccess": "Settings saved",
      "Settings": "Settings",
      "Appearance": "Appearance",
      "Theme": "Theme",
      "Light": "Light",
      "Dark": "Dark",
      "System": "System",
      "Downloads": "Downloads",
      "Download Location": "Download Location",
      "Browse": "Browse",
      "Download Speed Limit (KB/s)": "Download Speed Limit (KB/s)",
      "Upload Speed Limit (KB/s)": "Upload Speed Limit (KB/s)",
      "Privacy": "Privacy",
      "Enable anonymous usage statistics": "Enable anonymous usage statistics",
      "Help us improve ChillyMovies by sending anonymous usage data. We will never collect personal information.": "Help us improve ChillyMovies by sending anonymous usage data. We will never collect personal information.",
      "Save Settings": "Save Settings",
      "settings.electronRequired": "Feature Not Available",
      "settings.electronRequiredMessage": "This feature requires the desktop app. In development mode, you can manually enter the path.",
      "settings.pathUpdated": "Path Updated",
      "settings.pathError": "Selection Failed",
      "settings.pathErrorMessage": "Failed to select directory. Please try again.",
      "settings.selecting": "Selecting...",

      // Common
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.close": "Close",
      "common.error": "Error",
      "common.success": "Success",
      "common.browse": "Browse",
      "common.loading": "Loading...",
      "common.retry": "Retry",
      "common.back": "Back",
      "common.goBack": "Go Back",
      "common.selectAll": "Select All",
      "common.deselectAll": "Deselect All",
      "common.backToHome": "Back to Home",

      // Movie Details
      "movie.releaseDate": "Release Date",

      // TV Details
      "tv.firstAirDate": "First Air Date",
      "tv.selectEpisodes": "Select Episodes to Download",
      "tv.seasons": "Seasons",
      "tv.episodes": "episodes",
      "tv.selected": "selected",

      // Download
      "download.starting": "Starting...",
      "download.started": "Download Started!",
      "download.error": "Failed to start download",
      "download.button": "Download",
      "download.selectQuality": "Select Download Quality",
      "download.quality": "Quality",
      "download.noTorrents": "No torrents found for this quality. Try a different quality.",
      "download.searchError": "Failed to search for torrents. Please try again.",
      "download.searching": "Searching for torrents...",
      "download.availableTorrents": "Available Torrents",
      "download.provider": "Provider",
      "download.seeders": "seeders",
      "download.leechers": "leechers",
      "download.excellent": "Excellent",
      "download.good": "Good",
      "download.slow": "Slow",
      "download.selected": "Selected",
      "download.redirecting": "Download started! Redirecting to Downloads...",
      "download.noSelection": "No Episodes Selected",
      "download.queueing": "Queueing Downloads",
      "download.notFound": "Torrent Not Found",
      "download.complete": "Queue Complete",      // Trailer
      "trailer.title": "Trailers",
      "trailer.watchTrailer": "Watch Trailer",
      "trailer.selectTrailer": "Select Trailer",
      "trailer.noTrailers": "No trailers available for this title",
      "trailer.offlineMessage": "Trailers require an internet connection",
      "trailer.networkError": "Network error. Please check your connection.",
      "trailer.fetchError": "Failed to load trailers",
    },
  },
  sw: {
    translation: {
      // App
      "app.title": "ChillyMovies",

      // Navigation
      "nav.home": "Nyumbani",
      "nav.movies": "Filamu",
      "nav.tvSeries": "Vipindi vya Runinga",
      "nav.discovery": "Gundua",
      "nav.library": "Maktaba",
      "nav.downloads": "Upakuaji",
      "nav.settings": "Mipangilio",

      // Sidebar
      "sidebar.languageLabel": "Lugha",
      "sidebar.collapse": "Kunja",
      "sidebar.expand": "Panua",
      "sidebar.mainNavigation": "Urambazaji mkuu",
      "sidebar.primaryNavigation": "Urambazaji wa msingi",
      "languages.english": "Kiingereza",
      "languages.swahili": "Kiswahili",
      "sidebar.tagline": "Uzoefu wa sinema bila mtandao",

      // Header
      "header.searchPlaceholder": "Tafuta filamu, vipindi...",
      "header.themeToggle": "Badilisha mandhari",

      // Discovery / Home view
      "home.featuredHeading": "Iliyopendekezwa",
      "home.discoveryHeading": "Gundua",
      "home.loading": "Inapakia mapendekezo...",
      "home.error": "Imeshindwa kupakia mapendekezo",
      "home.empty": "Hakuna matokeo bado. Jaribu kutafuta kichwa.",
      "home.popularMovies": "Filamu Maarufu",
      "home.popularTV": "Vipindi Maarufu vya Runinga",
      "home.searchResults": "Matokeo ya Utafutaji",
      "home.searching": "Inatafuta...",
      "home.searchError": "Utafutaji umeshindwa. Tafadhali jaribu tena.",
      "home.noResults": "Hakuna matokeo yalipatikana",
      "discovery.title": "Gundua Filamu na Vipindi",
      "discovery.search": "Tafuta kichwa...",
      "discovery.loading": "Inapakia...",
      "discovery.findTorrents": "Tafuta Torrent",
      "discovery.watchTrailer": "Tazama Tangazo",

      // Library view
      "library.title": "Maktaba Yangu",
      "library.empty": "Maktaba yako ni tupu",
      "library.addContent": "Ongeza maudhui kuanza",
      "library.emptyStateTitle": "Maktaba yako ni tupu",
      "library.emptyStateDescription": "Ongeza filamu kwenye maktaba kupitia Gundua au leta faili zilizopo.",
      "library.item": "kipengee",
      "library.items": "vipengee",
      "library.play": "Cheza",
      "library.delete": "Futa",
      "library.browseMovies": "Vinjari Filamu",
      "library.playNotImplemented": "Kichezeshi video bado hakijatekelezwa",
      "library.deleteNotImplemented": "Utendaji wa kufuta bado haujapatikana",
      "library.confirmDelete": "Una uhakika unataka kufuta kipengee hiki? Hii itaondoa faili kutoka maktaba yako.",
      "library.deleteError": "Imeshindwa kufuta kipengee",
      "library.deleteSuccess": "Media Imefutwa",
      "library.playing": "Inacheza Sasa",

      // Downloads view
      "downloads.title": "Upakuaji",
      "downloads.active": "Inaendelea",
      "downloads.completed": "Imekamilika",
      "downloads.paused": "Imesitishwa",
      "downloads.empty": "Hakuna upakuaji",
      "downloads.emptyStateTitle": "Hakuna upakuaji bado",
      "downloads.emptyStateDescription": "Anza kupakua kutoka Gundua uone maendeleo hapa.",
      "downloads.status.downloading": "Inapakuliwa",
      "downloads.status.paused": "Imesitishwa",
      "downloads.status.completed": "Imekamilika",
      "downloads.status.error": "Hitilafu",
      "downloads.speed": "Kasi",
      "downloads.eta": "Muda uliobaki",
      "downloads.actions.pause": "Sitisha",
      "downloads.actions.resume": "Endelea",
      "downloads.actions.cancel": "Ghairi",
      "downloads.actions.pauseError": "Imeshindwa kusitisha upakuaji",
      "downloads.actions.resumeError": "Imeshindwa kuendelea upakuaji",
      "downloads.actions.cancelError": "Imeshindwa kughairi upakuaji",

      // Download actions
      "download.start": "Pakua",
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
      "settings.downloadSection": "Upakuaji",
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
      "settings.saveSuccess": "Mipangilio imehifadhiwa",
      "Settings": "Mipangilio",
      "Appearance": "Muonekano",
      "Theme": "Mandhari",
      "Light": "Mwanga",
      "Dark": "Giza",
      "System": "Mfumo",
      "Downloads": "Upakuaji",
      "Download Location": "Mahali pa Kupakua",
      "Browse": "Tafuta",
      "Download Speed Limit (KB/s)": "Kikomo cha Kasi ya Kupakua (KB/s)",
      "Upload Speed Limit (KB/s)": "Kikomo cha Kasi ya Kupakia (KB/s)",
      "Privacy": "Faragha",
      "Enable anonymous usage statistics": "Wezesha takwimu za matumizi zisizo za kibinafsi",
      "Help us improve ChillyMovies by sending anonymous usage data. We will never collect personal information.": "Tusaidie kuboresha ChillyMovies kwa kutuma data ya matumizi isiyo ya kibinafsi. Hatutakusanya taarifa za kibinafsi kamwe.",
      "Save Settings": "Hifadhi Mipangilio",
      "settings.electronRequired": "Kipengele Hakipatikani",
      "settings.electronRequiredMessage": "Kipengele hiki kinahitaji programu ya kompyuta. Katika hali ya maendeleo, unaweza kuingiza njia mwenyewe.",
      "settings.pathUpdated": "Njia Imesasishwa",
      "settings.pathError": "Uchaguzi Umeshindwa",
      "settings.pathErrorMessage": "Imeshindwa kuchagua saraka. Tafadhali jaribu tena.",
      "settings.selecting": "Inachagua...",

      // Common
      "common.save": "Hifadhi",
      "common.cancel": "Ghairi",
      "common.close": "Funga",
      "common.error": "Hitilafu",
      "common.success": "Imefanikiwa",
      "common.browse": "Tafuta",
      "common.loading": "Inapakia...",
      "common.retry": "Jaribu Tena",
      "common.back": "Rudi",
      "common.goBack": "Rudi Nyuma",
      "common.selectAll": "Chagua Zote",
      "common.deselectAll": "Ondoa Zote",
      "common.backToHome": "Rudi Nyumbani",

      // Movie Details
      "movie.releaseDate": "Tarehe ya Kutolewa",

      // TV Details
      "tv.firstAirDate": "Tarehe ya Kuanza",
      "tv.selectEpisodes": "Chagua Vipindi vya Kupakua",
      "tv.seasons": "Vipindi",
      "tv.episodes": "vipindi",
      "tv.selected": "vimechaguliwa",

      // Download
      "download.starting": "Inaanza...",
      "download.started": "Upakuaji Umeanza!",
      "download.error": "Imeshindwa kuanza upakuaji",
      "download.button": "Pakua",
      "download.selectQuality": "Chagua ubora wa upakuaji",
      "download.quality": "Ubora",
      "download.noTorrents": "Hakuna torenti zilizopatikana kwa ubora huu. Jaribu ubora mwingine.",
      "download.searchError": "Imeshindwa kutafuta torenti. Tafadhali jaribu tena.",
      "download.searching": "Inatafuta torenti...",
      "download.availableTorrents": "Torenti Zinazopatikana",
      "download.provider": "Mtoa huduma",
      "download.seeders": "wasambazaji",
      "download.leechers": "wapakuaji",
      "download.excellent": "Bora sana",
      "download.good": "Nzuri",
      "download.slow": "Polepole",
      "download.selected": "Imeteuliwa",
      "download.redirecting": "Upakuaji umeanza! Inahamia kwenye Upakuaji...",
      "download.noSelection": "Hakuna Vipindi Vilivyochaguliwa",
      "download.queueing": "Inaweka kwenye Foleni...",
      "download.notFound": "Torrent Haipatikani",
      "download.complete": "Foleni Imekamilika",      // Trailer
      "trailer.title": "Matangazo",
      "trailer.watchTrailer": "Tazama Tangazo",
      "trailer.selectTrailer": "Chagua Tangazo",
      "trailer.noTrailers": "Hakuna tangazo kwa kichwa hiki",
      "trailer.offlineMessage": "Matangazo yanahitaji muunganisho wa mtandao",
      "trailer.networkError": "Hitilafu ya mtandao. Tafadhali angalia muunganisho wako.",
      "trailer.fetchError": "Imeshindwa kupakia tangazo",
    },
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (lng) => {
    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...current, language: lng })
      );
    } catch (err) {
      console.warn("Failed to persist language preference", err);
    }
  });
}

export default i18n;
