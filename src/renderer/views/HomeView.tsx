// src/renderer/views/HomeView.tsx
import React from 'react';
import MovieCard from '../components/MovieCard';
import { useTranslation } from 'react-i18next';

const featuredMovie = {
  title: 'Inception',
  year: '2010',
  posterUrl: 'https://image.tmdb.org/t/p/w500/oYuPnu92hJ84zAbvjOBW0sa4u2p.jpg',
  rating: 8.8,
  description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
};

const discoveryMovies = [
  { title: 'The Dark Knight', year: '2008', posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', rating: 9.0 },
  { title: 'Pulp Fiction', year: '1994', posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', rating: 8.9 },
  { title: 'Forrest Gump', year: '1994', posterUrl: 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', rating: 8.8 },
  { title: 'The Matrix', year: '1999', posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', rating: 8.7 },
  { title: 'Interstellar', year: '2014', posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', rating: 8.6 },
  { title: 'Parasite', year: '2019', posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', rating: 8.6 },
];

const HomeView = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">{t('Featured Movie')}</h2>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img className="h-48 w-full object-cover md:w-48" src={featuredMovie.posterUrl} alt={featuredMovie.title} />
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{featuredMovie.year}</div>
              <h3 className="mt-1 text-2xl font-bold text-white">{featuredMovie.title}</h3>
              <p className="mt-2 text-gray-400">{featuredMovie.description}</p>
              <div className="mt-4 flex items-center">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <p className="text-lg text-white">{featuredMovie.rating.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">{t('Discover')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {discoveryMovies.map((movie) => (
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
    </div>
  );
};

export default HomeView;
