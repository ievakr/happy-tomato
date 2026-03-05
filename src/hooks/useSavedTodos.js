import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc, getDocFromCache } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'saved-todo-items';
const MAX_ITEMS = 50;

async function fetchSavedTodos(userId) {
  if (!userId) return [];
  const ref = doc(db, 'savedTodos', userId);
  try {
    const snap = await getDoc(ref);
    const data = snap.data();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    if (!navigator.onLine) {
      try {
        const cacheSnap = await getDocFromCache(ref);
        const data = cacheSnap.data();
        return Array.isArray(data?.items) ? data.items : [];
      } catch {
        // ignore
      }
    }
    throw error;
  }
}

async function saveSavedTodosToFirestore(userId, items) {
  if (!userId) return;
  const ref = doc(db, 'savedTodos', userId);
  await setDoc(ref, { userId, items }, { merge: true });
}

export function useSavedTodos() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['savedTodos', currentUser?.uid], [currentUser?.uid]);
  const hasMigratedFromStorage = useRef(false);

  const { data: firestoreItems = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchSavedTodos(currentUser.uid),
    enabled: !!currentUser?.uid,
  });

  const saveMutation = useMutation({
    mutationFn: (items) => saveSavedTodosToFirestore(currentUser?.uid, items),
    onSuccess: (_, items) => {
      queryClient.setQueryData(queryKey, items);
    },
  });

  const [localItems, setLocalItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const savedItems = currentUser ? firestoreItems : localItems;

  // Migrate localStorage → Firestore when user logs in (one-time)
  useEffect(() => {
    if (!currentUser?.uid || hasMigratedFromStorage.current || isLoading) return;

    const stored = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    if (Array.isArray(stored) && stored.length > 0 && firestoreItems.length === 0) {
      hasMigratedFromStorage.current = true;
      const merged = [...new Map(stored.map((s) => [s.toLowerCase(), s])).values()].slice(0, MAX_ITEMS);
      saveSavedTodosToFirestore(currentUser.uid, merged).then(() => {
        queryClient.setQueryData(queryKey, merged);
        localStorage.removeItem(STORAGE_KEY);
      }).catch((e) => {
        console.warn('Failed to migrate saved todos to account:', e);
        hasMigratedFromStorage.current = false;
      });
    }
  }, [currentUser?.uid, firestoreItems.length, isLoading, queryClient, queryKey]);

  const persist = useCallback((items) => {
    const next = items.slice(0, MAX_ITEMS);
    if (currentUser) {
      queryClient.setQueryData(queryKey, next);
      saveMutation.mutate(next);
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save todo items to localStorage:', e);
      }
      setLocalItems(next);
    }
  }, [currentUser, queryClient, queryKey, saveMutation]);

  const addItem = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const normalized = trimmed.toLowerCase();
    const prev = currentUser ? firestoreItems : localItems;
    if (prev.some((item) => item.toLowerCase() === normalized)) return;

    const next = [trimmed, ...prev].slice(0, MAX_ITEMS);
    persist(next);
  }, [currentUser, firestoreItems, localItems, persist]);

  const removeItem = useCallback((text) => {
    const normalized = text.toLowerCase();
    const prev = currentUser ? firestoreItems : localItems;
    const next = prev.filter((item) => item.toLowerCase() !== normalized);
    persist(next);
  }, [currentUser, firestoreItems, localItems, persist]);

  const setItems = useCallback((items) => {
    const next = items.slice(0, MAX_ITEMS);
    persist(next);
  }, [persist]);

  return { savedItems, addItem, removeItem, setItems, isLoading };
}
