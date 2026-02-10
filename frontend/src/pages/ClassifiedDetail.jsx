import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';

export default function ClassifiedDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: classified, isLoading, isError } = useQuery({
    queryKey: queryKeys.classified(id),
    queryFn: () => api.get(`/classifieds/${id}`).then((res) => res.data),
    retry: false,
  });

  if (isLoading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  if (isError || !classified)
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500">
        Classified not found.
      </div>
    );

  const isOwner = user && classified.user_id === user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to="/classifieds"
          className="text-amber-400 hover:text-amber-300 transition-colors duration-200 text-sm font-medium"
        >
          ← Back to Classifieds
        </Link>
        {isOwner && (
          <Link to={`/classifieds/${id}/edit`} className="btn-primary !py-2">
            Edit
          </Link>
        )}
      </div>

      <article className="card p-8 md:p-10">
        <span className="text-amber-400 uppercase tracking-wider text-sm font-medium">
          {classified.category}
        </span>
        <h1 className="font-display text-3xl md:text-4xl text-slate-100 mt-2 mb-6 leading-tight">
          {classified.title}
        </h1>
        {classified.images?.length > 0 && (
          <div
            className={`mb-8 gap-3 ${
              classified.images.length === 1
                ? 'flex justify-center'
                : classified.images.length === 2
                ? 'grid grid-cols-2'
                : 'grid grid-cols-2 md:grid-cols-3'
            }`}
          >
            {classified.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt=""
                className={`aspect-[4/3] object-cover rounded-xl border border-slate-700/50 ${
                  classified.images.length === 1 ? 'max-w-xl w-full' : 'w-full'
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-slate-300 whitespace-pre-wrap mb-8 leading-relaxed">
          {classified.description}
        </p>

        <div className="border-t border-slate-700/80 pt-6 space-y-4">
          <p className="text-slate-400 text-sm">
            <strong className="text-slate-300">Visibility:</strong>{' '}
            {classified.visibility === 'all_cities'
              ? 'All cities'
              : Array.isArray(classified.selected_cities) && classified.selected_cities.length > 0
              ? classified.selected_cities.map((x) => `${x.name}, ${x.state}`).join(' • ')
              : 'Selected cities'}
          </p>
          {classified.contact_email && (
            <p className="text-slate-400 text-sm">
              <strong className="text-slate-300">Email:</strong>{' '}
              <a
                href={`mailto:${classified.contact_email}`}
                className="text-amber-400 hover:text-amber-300 hover:underline transition-colors"
              >
                {classified.contact_email}
              </a>
            </p>
          )}
          {classified.contact_phone && (
            <p className="text-slate-400 text-sm">
              <strong className="text-slate-300">Phone:</strong>{' '}
              <a
                href={`tel:${classified.contact_phone}`}
                className="text-amber-400 hover:text-amber-300 hover:underline transition-colors"
              >
                {classified.contact_phone}
              </a>
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
