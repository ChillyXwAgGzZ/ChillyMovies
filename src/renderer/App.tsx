import { useCallback, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomeView from "./views/HomeView";
import DownloadsView from "./views/DownloadsView";
import LibraryView from "./views/LibraryView";
import SettingsView from "./views/SettingsView";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header searchQuery={searchQuery} onSearch={handleSearch} />
          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/downloads" element={<DownloadsView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
