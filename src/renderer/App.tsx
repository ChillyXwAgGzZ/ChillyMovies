import { useCallback, useState } from "react";
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomeView from "./views/HomeView";
import DownloadsView from "./views/DownloadsView";
import LibraryView from "./views/LibraryView";
import SettingsView from "./views/SettingsView";
import MovieDetailView from "./views/MovieDetailView";
import TVDetailView from "./views/TVDetailView";
import { metadataApi, debounce, type MediaMetadata } from "./services/api";
import { ToastProvider } from "./components/Toast";

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await metadataApi.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(error instanceof Error ? error.message : "Search failed");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    },
    [performSearch]
  );

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header searchQuery={searchQuery} onSearch={handleSearch} />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <HomeView 
                  searchResults={searchResults}
                  isSearching={isSearching}
                  searchError={searchError}
                  searchQuery={searchQuery}
                />
              } 
            />
            <Route path="/movie/:id" element={<MovieDetailView />} />
            <Route path="/tv/:id" element={<TVDetailView />} />
            <Route path="/downloads" element={<DownloadsView />} />
            <Route path="/library" element={<LibraryView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
