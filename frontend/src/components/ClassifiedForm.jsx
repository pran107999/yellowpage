import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function ClassifiedForm({ cities, initialData, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      category: '',
      contact_email: '',
      contact_phone: '',
      visibility: 'all_cities',
      status: 'draft',
      cityIds: [],
    },
  });

  const visibility = watch('visibility');

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((k) => setValue(k, initialData[k]));
      if (initialData.selected_cities && Array.isArray(initialData.selected_cities)) {
        setValue('cityIds', initialData.selected_cities.map((c) => c.id));
      }
    }
  }, [initialData, setValue]);

  const toggleCity = (cityId) => {
    const current = watch('cityIds') || [];
    const next = current.includes(cityId) ? current.filter((id) => id !== cityId) : [...current, cityId];
    setValue('cityIds', next);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-slate-300 mb-2 font-medium">Title *</label>
        <input
          {...register('title', {
            required: 'Title is required',
            maxLength: { value: 500, message: 'Max 500 chars' },
          })}
          className="input-base"
        />
        {errors.title && (
          <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="block text-slate-300 mb-2 font-medium">Description *</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={6}
          className="input-base resize-y min-h-[140px]"
        />
        {errors.description && (
          <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>
      <div>
        <label className="block text-slate-300 mb-2 font-medium">Category *</label>
        <input
          {...register('category', { required: 'Category is required' })}
          placeholder="e.g. Services, Real Estate, Automotive"
          className="input-base"
        />
        {errors.category && (
          <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Contact Email</label>
          <input
            type="email"
            {...register('contact_email')}
            className="input-base"
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Contact Phone</label>
          <input {...register('contact_phone')} className="input-base" />
        </div>
      </div>
      <div>
        <label className="block text-slate-300 mb-2 font-medium">Visibility</label>
        <select {...register('visibility')} className="input-base">
          <option value="all_cities">All cities</option>
          <option value="selected_cities">Selected cities only</option>
        </select>
      </div>
      {visibility === 'selected_cities' && (
        <div>
          <label className="block text-slate-300 mb-2 font-medium">
            Select cities where this ad will be visible
          </label>
          <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            {cities.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(watch('cityIds') || []).includes(c.id)}
                  onChange={() => toggleCity(c.id)}
                  className="rounded border-slate-500 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 focus:ring-2"
                />
                <span className="text-sm">{c.name}, {c.state}</span>
              </label>
            ))}
          </div>
          {visibility === 'selected_cities' &&
            (!watch('cityIds') || watch('cityIds').length === 0) && (
              <p className="text-amber-400 text-sm mt-2">
                Select at least one city for selected cities visibility.
              </p>
            )}
        </div>
      )}
      {initialData && (
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Status</label>
          <select {...register('status')} className="input-base">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
