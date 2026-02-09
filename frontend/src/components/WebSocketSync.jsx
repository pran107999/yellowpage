import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';
import { queryKeys } from '../lib/queryKeys';

export default function WebSocketSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onClassifiedsChanged = () => {
      queryClient.refetchQueries({ queryKey: queryKeys.classifiedsMy() });
      queryClient.refetchQueries({ queryKey: ['classifieds'] });
      queryClient.refetchQueries({ queryKey: queryKeys.adminClassifieds() });
      queryClient.refetchQueries({ queryKey: queryKeys.adminStats() });
    };

    const onAdminChanged = () => {
      queryClient.refetchQueries({ queryKey: queryKeys.adminStats() });
      queryClient.refetchQueries({ queryKey: queryKeys.adminUsers() });
      queryClient.refetchQueries({ queryKey: queryKeys.cities() });
      queryClient.refetchQueries({ queryKey: queryKeys.adminClassifieds() });
    };

    socket.on('classifieds:changed', onClassifiedsChanged);
    socket.on('admin:changed', onAdminChanged);

    return () => {
      socket.off('classifieds:changed', onClassifiedsChanged);
      socket.off('admin:changed', onAdminChanged);
    };
  }, [queryClient]);

  return null;
}
