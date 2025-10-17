import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable EmptyState component for displaying empty content areas
 * Prepared for design system integration
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      <p className="empty-state-description">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary empty-state-action">
          {action.label}
        </button>
      )}
    </div>
  );
};
