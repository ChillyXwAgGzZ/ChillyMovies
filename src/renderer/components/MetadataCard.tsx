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
 */
export const MetadataCard: React.FC<MetadataCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-white/5 dark:bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 dark:hover:bg-white/15 transition-all">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-gray-300">{icon}</div>}
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
          {label}
        </h3>
      </div>
      <div className="text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
};

export default MetadataCard;
