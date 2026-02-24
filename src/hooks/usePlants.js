import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, getDocsFromCache, addDoc, query, where } from 'firebase/firestore';
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
 * @returns {Object} plants, addPlant, isLoading, labelsMapping
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
        mutationFn: async ({ name, icon }) => {
            const plantData = {
                userId,
                name: name.trim(),
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

    const plants = plantsQuery.data || [];
    const labelsMapping = plants.reduce((acc, p) => ({ ...acc, [p.icon]: p.name }), {});

    const addPlant = async (name, icon) => {
        await addPlantMutation.mutateAsync({ name, icon });
    };

    return {
        plants,
        addPlant,
        isLoading: plantsQuery.isLoading,
        labelsMapping,
        addPlantMutation,
    };
}
