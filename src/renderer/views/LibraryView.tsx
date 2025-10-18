import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Film, Play, Trash2, FolderOpen } from "lucide-react";
import { libraryApi } from "../services/api";

interface LibraryItem {
  id: string;
  title: string;
  metadata: {
    tmdbId?: number;
    mediaType?: "movie" | "tv";
    poster?: string;
    backdrop?: string;
    year?: string;
    voteAverage?: number;
    overview?: string;
  };
  createdAt: string;
}

const LibraryView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await libraryApi.getAll();
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to load library:", err);
        setError(err instanceof Error ? err.message : "Failed to load library");
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, []);

  const handlePlay = (item: LibraryItem) => {
    // TODO: Implement video player
    console.log("Play item:", item);
    alert(t("library.playNotImplemented") || "Video player not yet implemented");
  };

  const handleDelete = async (item: LibraryItem) => {
    const confirmed = window.confirm(
      t("library.confirmDelete") || `Are you sure you want to delete "${item.title}"?`
    );
    
    if (!confirmed) return;

    try {
      // TODO: Implement delete endpoint
      console.log("Delete item:", item);
      alert(t("library.deleteNotImplemented") || "Delete functionality not yet implemented");
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert(t("library.deleteError") || "Failed to delete item");
    }
  };

  const handleCardClick = (item: LibraryItem) => {
    // Navigate to detail page if we have metadata
    if (item.metadata?.tmdbId && item.metadata?.mediaType) {
      navigate(`/${item.metadata.mediaType}/${item.metadata.tmdbId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
          >
            {t("common.retry") || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <FolderOpen className="h-24 w-24 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("library.emptyStateTitle") || "Your library is empty"}
        </h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {t("library.emptyStateDescription") || "Add movies to your library from Discover or import existing files."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition"
        >
          {t("library.browseMovies") || "Browse Movies"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {t("library.title") || "My Library"}
        </h2>
        <span className="text-gray-400 text-sm">
          {items.length} {items.length === 1 ? t("library.item") || "item" : t("library.items") || "items"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:scale-105"
          >
            {/* Poster */}
            <div
              className="aspect-[2/3] bg-gray-900 cursor-pointer"
              onClick={() => handleCardClick(item)}
            >
              {item.metadata?.poster ? (
                <img
                  src={item.metadata.poster}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/300x450?text=No+Poster";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-16 w-16 text-gray-600" />
                </div>
              )}
            </div>

            {/* Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
              
              {item.metadata?.year && (
                <p className="text-gray-300 text-xs mb-3">{item.metadata.year}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(item);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-xs font-semibold transition"
                  title={t("library.play") || "Play"}
                >
                  <Play size={14} />
                  <span>{t("library.play") || "Play"}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition"
                  title={t("library.delete") || "Delete"}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Rating Badge */}
            {item.metadata?.voteAverage && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-yellow-400">
                ⭐ {item.metadata.voteAverage.toFixed(1)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryView;
