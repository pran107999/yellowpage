import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ClassifiedForm from '../components/ClassifiedForm';
import { queryKeys } from '../lib/queryKeys';

export default function EditClassified() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: () => api.get('/cities').then((res) => res.data),
  });

  const { data: myClassifieds = [], isLoading: fetching } = useQuery({
    queryKey: queryKeys.classifiedsMy(),
    queryFn: () => api.get('/classifieds/my').then((res) => res.data),
  });

  const initialData = myClassifieds.find((c) => c.id === id) || null;

  const updateMutation = useMutation({
    mutationFn: (data) =>
      api.put(`/classifieds/${id}`, {
        ...data,
        cityIds: data.visibility === 'selected_cities' ? data.cityIds : undefined,
      }),
    onSuccess: () => {
      toast.success('Classified updated!');
      navigate('/my-classifieds');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to update');
    },
  });

  const onSubmit = (data) => {
    if (data.visibility === 'selected_cities' && (!data.cityIds || data.cityIds.length === 0)) {
      toast.error('Select at least one city');
      return;
    }
    updateMutation.mutate(data);
  };

  if (fetching)
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  if (!initialData)
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center text-slate-500">
        Classified not found.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl text-amber-400 mb-2">Edit Classified</h1>
      <p className="text-slate-400 mb-10">Update your ad details</p>
      <ClassifiedForm
        cities={cities}
        initialData={initialData}
        onSubmit={onSubmit}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
