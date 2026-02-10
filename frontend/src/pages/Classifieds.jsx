import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export default function Classifieds() {
  const [cityId, setCityId] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: () => api.get('/cities').then((res) => res.data),
  });

  const filters = { cityId, category, search };
  const { data: classifieds = [], isLoading } = useQuery({
    queryKey: queryKeys.classifieds(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (cityId) params.set('cityId', cityId);
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      return api.get(`/classifieds?${params}`).then((res) => res.data);
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl text-amber-400 mb-2">Classifieds</h1>
      <p className="text-slate-400 mb-10">Find local ads in your area</p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-10 p-6 card-static">
        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="input-base sm:max-w-[200px]"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.state}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-base sm:max-w-[180px]"
        />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base flex-1 min-w-[200px]"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-slate-500">Loading classifieds...</p>
        </div>
      ) : classifieds.length === 0 ? (
        <div className="card-static p-16 text-center">
          <p className="text-slate-500 text-lg">No classifieds found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classifieds.map((c) => (
            <Link
              key={c.id}
              to={`/classifieds/${c.id}`}
              className="card block p-6 group"
            >
              {c.images?.[0] ? (
                <img
                  src={c.images[0].url}
                  alt=""
                  className="w-full h-40 object-cover rounded-xl mb-4 border border-slate-700/50"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%23334155"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2374758b" font-size="12">No image</text></svg>';
                  }}
                />
              ) : (
                <div className="w-full h-40 rounded-xl mb-4 bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-600 text-sm">No image</span>
                </div>
              )}
              <span className="text-xs text-amber-400/90 uppercase tracking-wider font-medium">
                {c.category}
              </span>
              <h3 className="font-display text-xl text-slate-100 mt-2 mb-2 line-clamp-2 group-hover:text-amber-400/90 transition-colors duration-200">
                {c.title}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                {c.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700/50">
                <span>
                  {c.visibility === 'all_cities'
                    ? 'All cities'
                    : Array.isArray(c.selected_cities) && c.selected_cities.length > 0
                    ? c.selected_cities.map((x) => x.name).join(', ')
                    : 'Selected cities'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
