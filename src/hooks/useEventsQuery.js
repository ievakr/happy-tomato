import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../services/eventsService';
import errorLogger from '../utils/errorLogger';

/**
 * TanStack Query hook for fetching user events from Firestore.
 */
export function useEventsQuery(userId, { onError, showError } = {}) {
  const queryKey = ['events', userId];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchEvents(userId),
    enabled: !!userId,
    retry: 2,
    retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
    onError: (error) => {
      errorLogger.logError(error, null, 'Initial Data Load', {
        operation: 'initial_load',
        userId,
        timestamp: new Date().toISOString(),
      });
      if (showError) {
        showError('Failed to load your events. Please check your internet connection and refresh the page.', 8000);
      }
      onError?.(error);
    },
  });

  const savedEvents = useMemo(() => (userId ? (query.data || []) : []), [userId, query.data]);
  const isInitialLoading = !!userId && query.isLoading;

  return {
    savedEvents,
    isInitialLoading,
    queryKey,
    query,
  };
}
