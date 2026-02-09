import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ClassifiedForm from '../components/ClassifiedForm';
import { queryKeys } from '../lib/queryKeys';

export default function CreateClassified() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: () => api.get('/cities').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      api.post('/classifieds', {
        ...data,
        cityIds: data.visibility === 'selected_cities' ? data.cityIds : undefined,
      }),
    onSuccess: () => {
      toast.success('Classified created! You can publish it from My Ads.');
      navigate('/my-classifieds');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create');
    },
  });

  const onSubmit = (data) => {
    if (data.visibility === 'selected_cities' && (!data.cityIds || data.cityIds.length === 0)) {
      toast.error('Select at least one city');
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl text-amber-400 mb-2">Post New Ad</h1>
      <p className="text-slate-400 mb-10">Create a new classified listing</p>
      <ClassifiedForm
        cities={cities}
        onSubmit={onSubmit}
        loading={createMutation.isPending}
      />
    </div>
  );
}
