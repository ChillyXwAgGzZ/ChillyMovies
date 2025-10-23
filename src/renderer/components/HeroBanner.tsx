import React, { useState, useEffect, useCallback } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaMetadata } from "../services/api";

interface HeroBannerProps {
  movies: MediaMetadata[];
  autoSlideInterval?: number; // Milliseconds, default: 4000
  onMovieClick?: (movie: MediaMetadata) => void;
}

/**
 * HeroBanner - Netflix-style hero carousel for homepage
 * Features:
 * - Auto-sliding every 5 seconds
 * - Manual navigation (left/right arrows)
 * - Navigation dots
 * - Pause on hover
 * - Smooth transitions
 * - Responsive design
 * - Theme-aware
 * Phase 4: Homepage Enhancement
 */
const HeroBanner: React.FC<HeroBannerProps> = ({ 
  movies, 
  autoSlideInterval = 4000,
  onMovieClick 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentMovie = movies[currentIndex];

  // Auto-slide functionality
  useEffect(() => {
    if (movies.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, movies.length, autoSlideInterval]);

  // Smooth transition handler
  const handleTransition = useCallback((newIndex: number) => {
    if (isTransitioning || movies.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700); // Match CSS transition duration
  }, [isTransitioning, movies.length]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % movies.length;
    handleTransition(nextIndex);
  }, [currentIndex, movies.length, handleTransition]);

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex === 0 ? movies.length - 1 : currentIndex - 1;
    handleTransition(prevIndex);
  }, [currentIndex, movies.length, handleTransition]);

  const handleDotClick = useCallback((index: number) => {
    if (index !== currentIndex) {
      handleTransition(index);
    }
  }, [currentIndex, handleTransition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  if (!currentMovie || movies.length === 0) {
    return null;
  }

  const backdropUrl = currentMovie.backdrop || currentMovie.poster || "";
  const year = currentMovie.year || new Date(currentMovie.releaseDate || "").getFullYear();
  const rating = currentMovie.voteAverage?.toFixed(1) || "N/A";

  return (
    <div 
      className="relative w-full h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden rounded-xl mb-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured Movies Carousel"
    >
      {/* Backdrop Images (Stacked with transitions) */}
      <div className="absolute inset-0">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{
              backgroundImage: `url(${movie.backdrop || movie.poster || ""})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden={index !== currentIndex}
          >
            {/* Gradient Overlay for text readability and smooth transition to content below */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            {/* Bottom fade effect for seamless transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-black/95" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12 lg:p-16 pb-12 md:pb-16">
        <div className="max-w-3xl">
          {/* Movie Title */}
          <h1 
            className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg transition-all duration-700 line-clamp-2 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
          >
            {currentMovie.title}
          </h1>

          {/* Year & Rating */}
          <div 
            className={`flex items-center gap-4 mb-3 transition-all duration-700 delay-100 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <span className="text-base md:text-lg text-gray-300">{year}</span>
            <span className="flex items-center gap-1 text-base md:text-lg text-yellow-400">
              <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              {rating}
            </span>
          </div>

          {/* Overview */}
          {currentMovie.overview && (
            <p 
              className={`text-sm md:text-base text-gray-200 mb-5 line-clamp-2 md:line-clamp-3 transition-all duration-700 delay-200 ${
                isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
              }`}
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {currentMovie.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div 
            className={`flex flex-wrap gap-3 transition-all duration-700 delay-300 ${
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <button
              onClick={() => onMovieClick?.(currentMovie)}
              className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg text-sm md:text-base"
              aria-label={`More info about ${currentMovie.title}`}
            >
              <Info size={18} className="md:w-5 md:h-5" />
              <span>More Info</span>
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-lg font-semibold hover:bg-white/30 transition-all shadow-lg text-sm md:text-base"
              aria-label={`Play trailer for ${currentMovie.title}`}
            >
              <Play size={18} className="md:w-5 md:h-5" />
              <span>Watch Trailer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Previous movie"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm border border-white/20 hover:scale-110"
            aria-label="Next movie"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {movies.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {movies.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white w-8 shadow-lg shadow-white/50"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroBanner;
