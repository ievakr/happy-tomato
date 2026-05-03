import { useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEvents } from '../services/eventsService';
import errorLogger from '../utils/errorLogger';

/**
 * TanStack Query hook for fetching user events from Firestore.
 */
export function useEventsQuery(userId, { onError, showError } = {}) {
  const queryClient = useQueryClient();
  const queryHealAttemptedRef = useRef(false);
  const queryKey = useMemo(() => ['events', userId], [userId]);

  useEffect(() => {
    queryHealAttemptedRef.current = false;
  }, [userId]);

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

  useEffect(() => {
    if (!userId || !query.data?.length) return;
    const hasBadId = query.data.some(
      (e) => !e || typeof e !== 'object' || e.id == null || String(e.id).trim() === ''
    );
    if (!hasBadId) {
      queryHealAttemptedRef.current = false;
      return;
    }
    if (queryHealAttemptedRef.current) return;
    queryHealAttemptedRef.current = true;
    errorLogger.logError(
      new Error('events query contained entries without a document id'),
      null,
      'Events Query',
      { userId, eventCount: query.data.length }
    );
    void queryClient.invalidateQueries({ queryKey });
  }, [userId, query.data, queryClient, queryKey]);

  const savedEvents = useMemo(() => {
    if (!userId) return [];
    const raw = query.data || [];
    return raw.map((e) =>
      e && typeof e === 'object' && e.id != null && String(e.id).trim() !== ''
        ? { ...e, id: String(e.id).trim() }
        : e
    );
  }, [userId, query.data]);
  const isInitialLoading = !!userId && query.isLoading;

  return {
    savedEvents,
    isInitialLoading,
    queryKey,
    query,
  };
}
