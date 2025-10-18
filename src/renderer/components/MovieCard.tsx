// src/renderer/components/MovieCard.tsx
import React from 'react';

interface MovieCardProps {
  title: string;
  year: string;
  poster: string;
  rating: number;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, year, poster, rating, onClick }) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-indigo-500/50 transition-shadow duration-300 cursor-pointer transform hover:scale-105 transition-transform"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick();
        }
      }}
    >
      <img 
        src={poster || 'https://via.placeholder.com/500x750?text=No+Poster'} 
        alt={title} 
        className="w-full h-64 object-cover" 
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/500x750?text=No+Poster';
        }}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold text-white truncate" title={title}>{title}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-400">{year}</p>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <p className="text-sm text-white">{rating.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
