import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  deleteField,
  FieldValue,
} from 'firebase/firestore';
import errorLogger from '../utils/errorLogger';

/** Client-safe event object: Firestore rejects `undefined`; omit those keys for cache/UI. */
function clientPayloadFromEventPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

/**
 * Firestore rejects `undefined` at any depth (e.g. inside `userRecurringConfig`).
 * Preserves FieldValue sentinels, Date, and Firestore Timestamp-like objects.
 */
function omitUndefinedDeep(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object') return value;
  if (value instanceof FieldValue) return value;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function' && typeof value.seconds === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => omitUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      const nested = omitUndefinedDeep(v);
      if (nested !== undefined) out[k] = nested;
    }
    return out;
  }
  return value;
}

/** New documents: omit undefined and `id` (server-generated). */
function eventPayloadToFirestoreCreateFields(payload) {
  const fields = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'id') continue;
    if (v === undefined) continue;
    fields[k] = omitUndefinedDeep(v);
  }
  return fields;
}

/**
 * Updates: `undefined` must not be sent to Firestore. For `completedAt`, use deleteField()
 * so an incomplete todo clears any stored completion timestamp.
 */
function eventPayloadToFirestoreUpdateFields(payload) {
  const fields = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'id') continue;
    if (v === undefined) {
      if (k === 'completedAt') fields[k] = deleteField();
    } else {
      fields[k] = omitUndefinedDeep(v);
    }
  }
  return fields;
}

function getErrorMessage(error, operation) {
  if (error?.code) {
    const messages = {
      'permission-denied': 'Permission denied. Please check your authentication.',
      unavailable: 'Service temporarily unavailable. Please try again later.',
      'not-found': 'The requested data was not found.',
      'already-exists': 'This item already exists.',
      'resource-exhausted': 'Too many requests. Please wait a moment and try again.',
      'failed-precondition': 'Operation failed due to system constraints.',
      aborted: 'Operation was aborted. Please try again.',
      'out-of-range': 'Invalid data range provided.',
      unauthenticated: 'Authentication required. Please sign in.',
      'deadline-exceeded': 'Request timed out. Please check your connection and try again.',
    };
    if (messages[error.code]) return messages[error.code];
  }

  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  const operationMessages = {
    push: 'Failed to create event. Please check your internet connection and try again.',
    update: 'Failed to update event. Please check your internet connection and try again.',
    delete: 'Failed to delete event. Please check your internet connection and try again.',
  };
  return operationMessages[operation] || 'An unexpected error occurred. Please try again.';
}

async function retryOperation(operation, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Hook for Firebase event CRUD operations with retry, serialized writes, and cache updates.
 */
export function useEventOperations({ currentUser, queryKey, showError }) {
  const queryClient = useQueryClient();
  /** Serializes Firebase event writes: React state is async; a ref + promise chain avoids overlapping mutations from Promise.all / rapid taps. */
  const dispatchChainRef = useRef(Promise.resolve());
  const dispatchInFlightRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState(null);

  const updateEventCache = useCallback(
    (type, payload) => {
      if (!currentUser) return;
      queryClient.setQueryData(queryKey, (existing = []) => {
        const idStr = (v) => (v != null && v !== '' ? String(v) : '');
        switch (type) {
          case 'push':
            return [...existing, payload];
          case 'update':
            return existing.map((evt) =>
              idStr(evt.id) === idStr(payload.id) ? payload : evt
            );
          case 'delete':
            return existing.filter((evt) => idStr(evt.id) !== idStr(payload.id));
          default:
            return existing;
        }
      });
    },
    [currentUser, queryKey, queryClient]
  );

  const mutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      return retryOperation(async () => {
        switch (type) {
          case 'push': {
            const eventWithUserId = { ...payload, userId: currentUser.uid };
            const fields = eventPayloadToFirestoreCreateFields(eventWithUserId);
            const addDocRef = await addDoc(collection(db, 'events'), fields);
            return {
              type,
              payload: clientPayloadFromEventPayload({
                ...eventWithUserId,
                id: addDocRef.id,
              }),
            };
          }
          case 'update': {
            const updateId =
              payload.id != null && payload.id !== '' ? String(payload.id).trim() : '';
            if (!updateId) {
              throw new Error('Cannot update event: missing event ID');
            }
            const fields = eventPayloadToFirestoreUpdateFields(payload);
            await updateDoc(doc(db, 'events', updateId), fields);
            return {
              type,
              payload: clientPayloadFromEventPayload({ ...payload, id: updateId }),
            };
          }
          case 'delete': {
            const deleteId = payload?.id != null && payload.id !== '' ? String(payload.id).trim() : '';
            if (!deleteId) {
              throw new Error('Cannot delete event: missing event ID');
            }
            const deleteDocRef = doc(db, 'events', deleteId);
            const docSnap = await getDoc(deleteDocRef);
            if (docSnap.exists()) {
              await deleteDoc(deleteDocRef);
            }
            return { type, payload: { ...payload, id: deleteId } };
          }
          default:
            return { type, payload };
        }
      });
    },
  });

  const dispatchCallEvent = useCallback(
    ({ type, payload }) => {
      const run = async () => {
        if (!currentUser) {
          showError?.('Please sign in to manage events.', 6000);
          throw new Error('Not signed in');
        }

        dispatchInFlightRef.current += 1;
        if (dispatchInFlightRef.current === 1) {
          setIsLoading(true);
        }
        setLoadingOperation(type);

        try {
          const result = await mutation.mutateAsync({ type, payload });
          const updatedPayload = result?.payload || payload;
          updateEventCache(type, updatedPayload);
          queryClient.invalidateQueries({ queryKey });
          return result;
        } catch (error) {
          errorLogger.logError(error, null, 'Event Operation', {
            operation: type,
            payload,
            timestamp: new Date().toISOString(),
          });
          const errorMessage = getErrorMessage(error, type);
          showError?.(`${errorMessage}. If this problem persists, try refreshing the page.`, 8000);
          if (type !== 'delete') {
            updateEventCache(type, clientPayloadFromEventPayload(payload));
          }
          throw error;
        } finally {
          dispatchInFlightRef.current -= 1;
          if (dispatchInFlightRef.current <= 0) {
            dispatchInFlightRef.current = 0;
            setIsLoading(false);
            setLoadingOperation(null);
          }
        }
      };

      const chained = dispatchChainRef.current.then(run, run);
      dispatchChainRef.current = chained.catch(() => {});
      return chained;
    },
    [currentUser, mutation, updateEventCache, queryClient, queryKey, showError]
  );

  return {
    dispatchCallEvent,
    isLoading,
    loadingOperation,
    setIsLoading,
  };
}
