import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Cinematic EmptyState Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="mb-6 text-gray-600 opacity-50">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-base max-w-md mb-8">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          variant="neon"
          size="lg"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};