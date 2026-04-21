import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, getDocFromCache, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { defaultGardenPlan, normalizeGardenPlan, sanitizePlanForFirestore } from '../utils/gardenPlan';

async function fetchGardenPlan(userId, yearStr) {
  const ref = doc(db, 'gardenPlans', userId, 'years', yearStr);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return defaultGardenPlan(Number(yearStr));
    }
    return normalizeGardenPlan(snap.data(), yearStr);
  } catch (error) {
    if (!navigator.onLine) {
      try {
        const cacheSnap = await getDocFromCache(ref);
        if (!cacheSnap.exists()) {
          return defaultGardenPlan(Number(yearStr));
        }
        return normalizeGardenPlan(cacheSnap.data(), yearStr);
      } catch {
        // fall through
      }
    }
    throw error;
  }
}

/**
 * Load and persist a yearly garden plan for the current user.
 * @param {string} userId
 * @param {number|string} year
 */
export function useGardenPlan(userId, year) {
  const yearStr = String(year);
  const queryClient = useQueryClient();
  const queryKey = ['gardenPlan', userId, yearStr];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGardenPlan(userId, yearStr),
    enabled: !!userId && yearStr.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (plan) => {
      const ref = doc(db, 'gardenPlans', userId, 'years', yearStr);
      await setDoc(ref, sanitizePlanForFirestore(plan));
      return sanitizePlanForFirestore(plan);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, (prev) =>
        normalizeGardenPlan({ ...(prev || defaultGardenPlan(yearStr)), ...saved }, yearStr),
      );
    },
  });

  const savePlan = useCallback(
    async (planToSave) => {
      await saveMutation.mutateAsync(planToSave);
    },
    [saveMutation],
  );

  return {
    plan: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    savePlan,
    isSaving: saveMutation.isPending,
    refetch: query.refetch,
  };
}
