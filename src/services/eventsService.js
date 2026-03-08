import { db } from '../firebase';
import { collection, getDocs, getDocsFromCache, query, where } from 'firebase/firestore';
import errorLogger from '../utils/errorLogger';

/**
 * Fetch events for a user from Firestore, with offline cache fallback.
 */
export async function fetchEvents(userId) {
  const eventsQuery = query(
    collection(db, 'events'),
    where('userId', '==', userId)
  );

  try {
    const snapshot = await getDocs(eventsQuery);
    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return events;
  } catch (error) {
    if (!navigator.onLine) {
      try {
        const cacheSnapshot = await getDocsFromCache(eventsQuery);
        const cachedEvents = cacheSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return cachedEvents;
      } catch {
        // Offline cache read failed, will throw original error
      }
    }

    errorLogger.logError(error, null, 'Firebase Fetch Events', {
      operation: 'fetch',
      userId,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
