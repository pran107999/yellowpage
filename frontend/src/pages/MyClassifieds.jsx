import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export default function MyClassifieds() {
  const queryClient = useQueryClient();

  const { data: classifieds = [], isLoading } = useQuery({
    queryKey: queryKeys.classifiedsMy(),
    queryFn: () => api.get('/classifieds/my').then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/classifieds/${id}`),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.classifiedsMy() });
      const previous = queryClient.getQueryData(queryKeys.classifiedsMy());
      queryClient.setQueryData(queryKeys.classifiedsMy(), (old = []) =>
        old.filter((c) => c.id !== deletedId)
      );
      return { previous };
    },
    onError: (err, _deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.classifiedsMy(), context.previous);
      }
      toast.error('Failed to delete');
    },
    onSuccess: () => {
      toast.success('Classified deleted');
    },
  });

  const handleDelete = (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl text-amber-400 mb-1">My Classifieds</h1>
          <p className="text-slate-400">Manage your ads</p>
        </div>
        <Link to="/classifieds/create" className="btn-primary shrink-0">
          Post New Ad
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-slate-500">Loading your ads...</p>
        </div>
      ) : classifieds.length === 0 ? (
        <div className="card-static p-16 text-center">
          <p className="text-slate-500 mb-4">You haven&apos;t posted any classifieds yet.</p>
          <Link
            to="/classifieds/create"
            className="text-amber-400 hover:text-amber-300 hover:underline font-medium"
          >
            Post your first ad →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {classifieds.map((c) => (
            <div
              key={c.id}
              className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    to={`/classifieds/${c.id}`}
                    className="font-display text-xl text-amber-400 hover:text-amber-300 truncate transition-colors"
                  >
                    {c.title}
                  </Link>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      c.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  {c.category} •{' '}
                  {c.visibility === 'all_cities' ? 'All cities' : 'Selected cities'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/classifieds/${c.id}/edit`}
                  className="btn-secondary !py-2 !px-4 text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(c.id, c.title)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
