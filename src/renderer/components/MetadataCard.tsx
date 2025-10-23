import React from "react";

interface MetadataCardProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * MetadataCard - Reusable glass morphism card for displaying metadata
 * Used in MovieDetailView and TVDetailView for showing runtime, budget, etc.
 * Phase 3: Detail Pages Enhancement
 * Phase 4: Fixed light mode visibility
 */
export const MetadataCard: React.FC<MetadataCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-white dark:bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-white/20 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/15 transition-all shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-gray-600 dark:text-gray-300">{icon}</div>}
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {label}
        </h3>
      </div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
};

export default MetadataCard;
