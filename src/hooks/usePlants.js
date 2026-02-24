import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, getDocsFromCache, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

async function fetchPlants(userId) {
    if (!userId) return [];
    
    const plantsQuery = query(
        collection(db, 'plants'),
        where('userId', '==', userId)
    );

    try {
        const snapshot = await getDocs(plantsQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        if (!navigator.onLine) {
            try {
                const cacheSnapshot = await getDocsFromCache(plantsQuery);
                return cacheSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (cacheError) {
                console.warn('Offline cache read failed for plants:', cacheError);
            }
        }
        throw error;
    }
}

/**
 * Hook to fetch and manage user plants
 * @param {string} userId - Current user ID
 * @returns {Object} plants, addPlant, plantNames, plantsById, displayNameToPlantId, plantIdToDisplayName
 */
export function usePlants(userId) {
    const queryClient = useQueryClient();
    const plantsQueryKey = ['plants', userId];

    const plantsQuery = useQuery({
        queryKey: plantsQueryKey,
        queryFn: () => fetchPlants(userId),
        enabled: !!userId,
    });

    const addPlantMutation = useMutation({
        mutationFn: async ({ category, variety, icon }) => {
            const plantData = {
                userId,
                category: category.trim(),
                variety: variety.trim(),
                icon,
            };
            const docRef = await addDoc(collection(db, 'plants'), plantData);
            return { id: docRef.id, ...plantData };
        },
        onSuccess: (newPlant) => {
            queryClient.setQueryData(plantsQueryKey, (existing = []) => [...existing, newPlant]);
            queryClient.invalidateQueries({ queryKey: plantsQueryKey });
        },
    });

    const updatePlantMutation = useMutation({
        mutationFn: async ({ id, category, variety, icon }) => {
            const updates = {
                category: category.trim(),
                variety: (variety || '').trim(),
                icon,
            };
            await updateDoc(doc(db, 'plants', id), updates);
            return { id, ...updates };
        },
        onSuccess: (updatedPlant) => {
            queryClient.setQueryData(plantsQueryKey, (existing = []) =>
                existing.map(p => p.id === updatedPlant.id ? { ...p, ...updatedPlant } : p)
            );
            queryClient.invalidateQueries({ queryKey: plantsQueryKey });
        },
    });

    const deletePlantMutation = useMutation({
        mutationFn: async (plantId) => {
            await deleteDoc(doc(db, 'plants', plantId));
            return plantId;
        },
        onSuccess: (plantId) => {
            queryClient.setQueryData(plantsQueryKey, (existing = []) =>
                existing.filter(p => p.id !== plantId)
            );
            queryClient.invalidateQueries({ queryKey: plantsQueryKey });
        },
    });

    const plantsData = plantsQuery.data;
    // Memoize derived values to prevent infinite loops in consumers (e.g. EventModal useEffect)
    const { normalizedPlants, plantsById, plantNames, displayNameToPlantId, plantIdToDisplayName } = useMemo(() => {
        const plants = plantsData || [];
        const normalized = plants.map(p => {
            if (p.category !== undefined) return { ...p, variety: p.variety ?? '' };
            const name = p.name || '';
            return { ...p, category: name, variety: '' };
        });
        const plantDisplayName = (p) => p.variety ? `${p.category} - ${p.variety}` : p.category;
        return {
            normalizedPlants: normalized,
            plantsById: Object.fromEntries(normalized.map(p => [p.id, p])),
            plantNames: normalized.map(p => plantDisplayName(p)),
            displayNameToPlantId: Object.fromEntries(normalized.map(p => [plantDisplayName(p), p.id])),
            plantIdToDisplayName: Object.fromEntries(normalized.map(p => [p.id, plantDisplayName(p)])),
        };
    }, [plantsData]);

    const addPlant = async (category, variety, icon) => {
        await addPlantMutation.mutateAsync({ category, variety, icon });
    };

    const updatePlant = async (id, category, variety, icon) => {
        await updatePlantMutation.mutateAsync({ id, category, variety, icon });
    };

    const deletePlant = async (plantId) => {
        await deletePlantMutation.mutateAsync(plantId);
    };

    return {
        plants: normalizedPlants,
        addPlant,
        updatePlant,
        deletePlant,
        isLoading: plantsQuery.isLoading,
        plantNames,
        plantsById,
        displayNameToPlantId,
        plantIdToDisplayName,
        addPlantMutation,
        updatePlantMutation,
        deletePlantMutation,
    };
}
