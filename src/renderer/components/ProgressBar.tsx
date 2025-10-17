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
 * Reusable ProgressBar component
 * Prepared for design system integration
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

  const sizeClasses: Record<string, string> = {
    sm: "progress-bar-sm",
    md: "progress-bar-md",
    lg: "progress-bar-lg",
  };

  const variantClasses: Record<string, string> = {
    primary: "progress-bar-primary",
    success: "progress-bar-success",
    warning: "progress-bar-warning",
    danger: "progress-bar-danger",
  };

  return (
    <div
      className={`progress-bar ${sizeClasses[size]} ${className}`}
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={`progress-fill ${variantClasses[variant]}`}
        style={{ width: `${clampedPercent}%` }}
      />
      {showLabel && (
        <span className="progress-text">{clampedPercent.toFixed(1)}%</span>
      )}
    </div>
  );
};
