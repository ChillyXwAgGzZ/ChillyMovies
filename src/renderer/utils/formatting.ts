/**
 * Utility functions for formatting metadata values
 * Phase 3: Detail Pages Enhancement
 */

/**
 * Format currency in millions or billions
 * @example formatCurrency(50000000) => "$50M"
 * @example formatCurrency(1500000000) => "$1.5B"
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Format runtime in hours and minutes
 * @example formatRuntime(135) => "2h 15m"
 * @example formatRuntime(45) => "45m"
 */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Format array of episode runtimes (TV shows)
 * @example formatEpisodeRuntime([45, 50]) => "~45-50m"
 * @example formatEpisodeRuntime([30]) => "~30m"
 */
export function formatEpisodeRuntime(runtimes: number[]): string {
  if (!runtimes || runtimes.length === 0) return "N/A";
  if (runtimes.length === 1) return `~${runtimes[0]}m`;
  const min = Math.min(...runtimes);
  const max = Math.max(...runtimes);
  if (min === max) return `~${min}m`;
  return `~${min}-${max}m`;
}
