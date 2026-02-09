export const queryKeys = {
  classifieds: (filters = {}) => ['classifieds', filters],
  classifiedsMy: () => ['classifieds', 'my'],
  classified: (id) => ['classifieds', id],
  cities: () => ['cities'],
  adminStats: () => ['admin', 'stats'],
  adminUsers: () => ['admin', 'users'],
  adminClassifieds: () => ['admin', 'classifieds'],
};
