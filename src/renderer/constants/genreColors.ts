/**
 * Genre color mapping for visual badges
 * Maps TMDB genre IDs to Tailwind color classes
 * Phase 3 - T-DETAIL-006
 */

export const GENRE_COLORS: Record<number, string> = {
  // Movie Genres
  28: "bg-red-500/80",        // Action
  12: "bg-amber-500/80",      // Adventure
  16: "bg-purple-500/80",     // Animation
  35: "bg-yellow-500/80",     // Comedy
  80: "bg-gray-700/80",       // Crime
  99: "bg-teal-500/80",       // Documentary
  18: "bg-blue-500/80",       // Drama
  10751: "bg-green-500/80",   // Family
  14: "bg-indigo-500/80",     // Fantasy
  27: "bg-red-800/80",        // Horror
  10402: "bg-pink-600/80",    // Music
  9648: "bg-purple-800/80",   // Mystery
  10749: "bg-pink-500/80",    // Romance
  878: "bg-cyan-500/80",      // Science Fiction
  10770: "bg-blue-600/80",    // TV Movie
  53: "bg-orange-700/80",     // Thriller
  10752: "bg-gray-600/80",    // War
  37: "bg-amber-700/80",      // Western

  // TV Genres
  10759: "bg-red-600/80",     // Action & Adventure
  10762: "bg-green-400/80",   // Kids
  10763: "bg-blue-400/80",    // News
  10764: "bg-orange-500/80",  // Reality
  10765: "bg-purple-600/80",  // Sci-Fi & Fantasy
  10766: "bg-pink-400/80",    // Soap
  10767: "bg-yellow-600/80",  // Talk
  10768: "bg-red-700/80",     // War & Politics
};

/**
 * Get color for a genre ID
 * @param genreId - TMDB genre ID
 * @returns Tailwind color class (defaults to gray if unknown)
 */
export function getGenreColor(genreId: number): string {
  return GENRE_COLORS[genreId] || "bg-gray-500/80";
}
