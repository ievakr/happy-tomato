import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'saved-todo-items';

export function useSavedTodos() {
  const [savedItems, setSavedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    } catch (e) {
      console.warn('Failed to save todo items to localStorage:', e);
    }
  }, [savedItems]);

  const addItem = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSavedItems((prev) => {
      const normalized = trimmed.toLowerCase();
      if (prev.some((item) => item.toLowerCase() === normalized)) {
        return prev;
      }
      const next = [trimmed, ...prev].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save todo items to localStorage:', e);
      }
      return next;
    });
  }, []);

  const removeItem = useCallback((text) => {
    setSavedItems((prev) => {
      const normalized = text.toLowerCase();
      const next = prev.filter((item) => item.toLowerCase() !== normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save todo items to localStorage:', e);
      }
      return next;
    });
  }, []);

  const setItems = useCallback((items) => {
    const next = items.slice(0, 50);
    setSavedItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save todo items to localStorage:', e);
    }
  }, []);

  return { savedItems, addItem, removeItem, setItems };
}
