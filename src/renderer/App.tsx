import { useCallback, useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomeView from "./views/HomeView";
import MoviesView from "./views/MoviesView";
import TVSeriesView from "./views/TVSeriesView";
import DownloadsView from "./views/DownloadsView";
import LibraryView from "./views/LibraryView";
import SettingsView from "./views/SettingsView";
import MovieDetailView from "./views/MovieDetailView";
import TVDetailView from "./views/TVDetailView";
import { metadataApi, debounce, type MediaMetadata } from "./services/api";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<MediaMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get search query from URL params
  const searchQuery = searchParams.get("q") || "";

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

  // Perform search when query param changes
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, performSearch]);

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      
      if (trimmedQuery) {
        // Navigate to home with search query
        if (location.pathname !== "/") {
          navigate(`/?q=${encodeURIComponent(trimmedQuery)}`);
        } else {
          setSearchParams({ q: trimmedQuery });
        }
      } else {
        // Clear search
        if (location.pathname === "/") {
          setSearchParams({});
        }
        setSearchResults([]);
        setIsSearching(false);
      }
    },
    [navigate, location.pathname, setSearchParams]
  );

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header searchQuery={searchQuery} onSearch={handleSearch} />
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
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
            <Route path="/movies" element={<MoviesView />} />
            <Route path="/tv-series" element={<TVSeriesView />} />
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
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
