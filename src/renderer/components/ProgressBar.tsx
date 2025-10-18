import React from "react";

export interface ProgressBarProps {
  percent: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
  ariaLabel?: string;
}

/**
 * Cinematic ProgressBar Component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  showLabel = true,
  size = "md",
  variant = "primary",
  className = "",
  ariaLabel = "Progress",
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  const sizeStyles: Record<string, string> = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantStyles: Record<string, string> = {
    primary: "from-neon-cyan to-neon-blue",
    success: "from-green-400 to-green-600",
    warning: "from-yellow-400 to-orange-500",
    danger: "from-red-400 to-red-600",
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`relative bg-cinema-gray rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className={`h-full bg-gradient-to-r ${variantStyles[variant]} transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${clampedPercent}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-[shimmer_2s_infinite]" style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}></div>
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-sm font-semibold text-neon-cyan">
          {clampedPercent.toFixed(1)}%
        </div>
      )}
    </div>
  );
};
