import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT_TYPES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';

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

  const [newImages, setNewImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const visibility = watch('visibility');

  const existingImages = (initialData?.images || []).filter(
    (img) => !removeImageIds.includes(img.id)
  );

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

  const onFileChange = (e) => {
    setImageError('');
    const files = Array.from(e.target.files || []);
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setImageError(`Some images exceed 10MB. Please choose smaller files.`);
      return;
    }
    setNewImages((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = '';
  };

  const removeNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (id) => {
    setRemoveImageIds((prev) => [...prev, id]);
  };

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, images: newImages, removeImageIds });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
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
        <label className="block text-slate-300 mb-2 font-medium">Images (optional)</label>
        <p className="text-slate-500 text-sm mb-2">JPEG, PNG, GIF or WebP. Max 10MB per image. Up to 10 images.</p>
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute inset-0 bg-red-900/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-red-200 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {newImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {newImages.map((file, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute inset-0 bg-red-900/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-red-200 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept={ACCEPT_TYPES}
          multiple
          onChange={onFileChange}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500/20 file:text-amber-400 file:font-medium hover:file:bg-amber-500/30 file:cursor-pointer"
        />
        {imageError && <p className="text-red-400 text-sm mt-1">{imageError}</p>}
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
