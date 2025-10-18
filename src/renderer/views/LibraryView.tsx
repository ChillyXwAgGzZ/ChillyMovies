// src/renderer/views/LibraryView.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import MovieCard from '../components/MovieCard';

const libraryMovies = [
  { title: 'Inception', year: '2010', posterUrl: 'https://image.tmdb.org/t/p/w500/oYuPnu92hJ84zAbvjOBW0sa4u2p.jpg', rating: 8.8 },
  { title: 'The Dark Knight', year: '2008', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', rating: 9.0 },
  { title: 'Pulp Fiction', year: '1994', posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', rating: 8.9 },
  { title: 'Forrest Gump', year: '1994', posterUrl: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', rating: 8.8 },
];

const LibraryView = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{t('My Library')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {libraryMovies.map((movie) => (
          <MovieCard
            key={movie.title}
            title={movie.title}
            year={movie.year}
            posterUrl={movie.posterUrl}
            rating={movie.rating}
          />
        ))}
      </div>
    </div>
  );
};

export default LibraryView;
