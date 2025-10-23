import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { metadataApi, type MediaMetadata, ApiError } from "../services/api";

interface SimilarContentProps {
  currentId: number;
  mediaType: "movie" | "tv";
  title?: string;
}

/**
 * Similar Content Carousel Component
 * Displays horizontal scrollable list of similar movies/TV shows
 * Phase 3 - T-DETAIL-007
 */
const SimilarContent: React.FC<SimilarContentProps> = ({ currentId, mediaType, title }) => {
  const navigate = useNavigate();
  const [similar, setSimilar] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await metadataApi.getSimilar(currentId, mediaType);
        setSimilar(data);
      } catch (err) {
        console.error("Failed to fetch similar content:", err);
        setError(err as ApiError);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentId, mediaType]);

  const handleNavigate = (id: number) => {
    const path = mediaType === "movie" ? `/movie/${id}` : `/tv/${id}`;
    navigate(path);
    // Scroll to top when navigating to new detail page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("similar-content-scroll");
    if (!container) return;

    const scrollAmount = 400;
    const newScrollLeft = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {title || `Similar ${mediaType === "movie" ? "Movies" : "TV Shows"}`}
        </h3>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-72 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || similar.length === 0) {
    return null; // Don't show section if no similar content
  }

  return (
    <div className="mb-8 relative">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        {title || `Similar ${mediaType === "movie" ? "Movies" : "TV Shows"}`}
      </h3>

      {/* Scroll Navigation Buttons */}
      <button
        onClick={() => scrollContainer("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all hidden md:block"
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => scrollContainer("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all hidden md:block"
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>

      {/* Horizontal Scroll Container */}
      <div
        id="similar-content-scroll"
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {similar.map((item) => {
          // Ensure id is a number
          const itemId = typeof item.id === 'number' ? item.id : parseInt(String(item.id));
          
          return (
            <div
              key={item.id}
              onClick={() => handleNavigate(itemId)}
              className="flex-shrink-0 w-48 snap-start cursor-pointer group"
            >
            {/* Poster Image */}
            <div className="relative overflow-hidden rounded-lg mb-2 shadow-lg group-hover:shadow-2xl transition-shadow">
              <img
                src={item.poster || "https://via.placeholder.com/300x450?text=No+Poster"}
                alt={item.title}
                className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/300x450?text=No+Poster";
                }}
              />
              
              {/* Rating Badge */}
              {item.voteAverage && item.voteAverage > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded-full backdrop-blur-sm">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-xs font-semibold">
                    {item.voteAverage.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {item.title}
            </h4>

            {/* Year */}
            {item.year && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.year}
              </p>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimilarContent;
