import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats');
  const [newCity, setNewCity] = useState({ name: '', state: '' });

  const { data: stats } = useQuery({
    queryKey: queryKeys.adminStats(),
    queryFn: () => api.get('/admin/stats').then((res) => res.data),
    enabled: tab === 'stats',
  });

  const { data: users = [] } = useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: () => api.get('/admin/users').then((res) => res.data),
    enabled: tab === 'users',
  });

  const { data: classifieds = [] } = useQuery({
    queryKey: queryKeys.adminClassifieds(),
    queryFn: () => api.get('/admin/classifieds').then((res) => res.data),
    enabled: tab === 'classifieds',
  });

  const { data: cities = [] } = useQuery({
    queryKey: queryKeys.cities(),
    queryFn: () => api.get('/cities').then((res) => res.data),
    enabled: tab === 'cities',
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      api.put(`/admin/classifieds/${id}/status`, { status }),
    onSuccess: () => toast.success('Status updated'),
    onError: () => toast.error('Failed to update'),
  });

  const deleteClassifiedMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/classifieds/${id}`),
    onSuccess: () => toast.success('Deleted'),
    onError: () => toast.error('Failed to delete'),
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/cities/${id}`),
    onSuccess: () => toast.success('City deleted'),
    onError: () => toast.error('Failed to delete'),
  });

  const createCityMutation = useMutation({
    mutationFn: (city) => api.post('/admin/cities', city),
    onSuccess: () => {
      setNewCity({ name: '', state: '' });
      toast.success('City added');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed');
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      api.put(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => toast.success('Role updated'),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const updateClassifiedStatus = (id, status) => {
    updateStatusMutation.mutate({ id, status });
  };

  const deleteClassified = (id) => {
    if (!confirm('Delete this classified?')) return;
    deleteClassifiedMutation.mutate(id);
  };

  const deleteCity = (id) => {
    if (!confirm('Delete this city?')) return;
    deleteCityMutation.mutate(id);
  };

  const createCity = (e) => {
    e.preventDefault();
    if (!newCity.name || !newCity.state) {
      toast.error('Name and state required');
      return;
    }
    createCityMutation.mutate(newCity);
  };

  const updateUserRole = (userId, role) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const tabs = [
    { id: 'stats', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'classifieds', label: 'Classifieds' },
    { id: 'cities', label: 'Cities' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl text-amber-400 mb-2">Admin Dashboard</h1>
      <p className="text-slate-400 mb-10">Manage users, classifieds, and cities</p>

      <div className="flex gap-1 mb-10 p-1 bg-slate-900/50 rounded-xl w-fit border border-slate-700/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? 'bg-amber-500 text-slate-950 shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <p className="text-slate-500 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-display text-amber-400">{stats.totalUsers}</p>
          </div>
          <div className="card p-6">
            <p className="text-slate-500 text-sm mb-1">Total Classifieds</p>
            <p className="text-3xl font-display text-amber-400">{stats.totalClassifieds}</p>
          </div>
          <div className="card p-6">
            <p className="text-slate-500 text-sm mb-1">Published</p>
            <p className="text-3xl font-display text-emerald-400">{stats.publishedClassifieds}</p>
          </div>
          <div className="card p-6">
            <p className="text-slate-500 text-sm mb-1">Cities</p>
            <p className="text-3xl font-display text-amber-400">{stats.totalCities}</p>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-700/80">
                  <th className="pb-4 pt-6 px-6 font-medium">Name</th>
                  <th className="pb-4 pt-6 px-6 font-medium">Email</th>
                  <th className="pb-4 pt-6 px-6 font-medium">Role</th>
                  <th className="pb-4 pt-6 px-6 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-800/80 last:border-0">
                    <td className="py-4 px-6 text-slate-200">{u.name}</td>
                    <td className="py-4 px-6 text-slate-400">{u.email}</td>
                    <td className="py-4 px-6">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="input-base !py-2 !px-3 text-sm max-w-[120px]"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'classifieds' && (
        <div className="space-y-4">
          {classifieds.map((c) => (
            <div
              key={c.id}
              className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-display text-lg text-amber-400">{c.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">
                  {c.author_name} • {c.category}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={c.status}
                  onChange={(e) => updateClassifiedStatus(c.id, e.target.value)}
                  className="input-base !py-2 !px-3 text-sm max-w-[140px]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <button
                  onClick={() => deleteClassified(c.id)}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'cities' && (
        <div>
          <form onSubmit={createCity} className="flex flex-wrap gap-3 mb-8">
            <input
              type="text"
              placeholder="City name"
              value={newCity.name}
              onChange={(e) => setNewCity((p) => ({ ...p, name: e.target.value }))}
              className="input-base max-w-[200px]"
            />
            <input
              type="text"
              placeholder="State"
              value={newCity.state}
              onChange={(e) => setNewCity((p) => ({ ...p, state: e.target.value }))}
              className="input-base w-24"
            />
            <button
              type="submit"
              disabled={createCityMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              Add City
            </button>
          </form>
          <div className="flex flex-wrap gap-3">
            {cities.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-4 py-2.5 card-static"
              >
                <span className="text-slate-200">{c.name}, {c.state}</span>
                <button
                  onClick={() => deleteCity(c.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium ml-1 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
