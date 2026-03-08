import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migrate events without userId to the current user
 * This assigns all events without a userId field to the specified user
 * 
 * @param {string} userId - The user ID to assign events to
 * @returns {Promise<number>} - Number of events migrated
 */
export async function migrateEventsToUser(userId) {
  try {
    // Get all events without userId field
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const eventsWithoutUser = eventsSnapshot.docs.filter(doc => !doc.data().userId);
    
    if (eventsWithoutUser.length === 0) {
      return 0;
    }
    
    // Firebase batch has a limit of 500 operations
    const batchSize = 500;
    let migratedCount = 0;
    
    for (let i = 0; i < eventsWithoutUser.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = eventsWithoutUser.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        const eventRef = doc(db, 'events', docSnapshot.id);
        batch.update(eventRef, { userId: userId });
      });
      
      await batch.commit();
      migratedCount += batchDocs.length;
    }
    return migratedCount;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete all events without a userId
 * This removes all orphaned events that don't belong to any user
 * 
 * @returns {Promise<number>} - Number of events deleted
 */
export async function deleteEventsWithoutUser() {
  try {
    // Get all events without userId field
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const eventsWithoutUser = eventsSnapshot.docs.filter(doc => !doc.data().userId);
    
    if (eventsWithoutUser.length === 0) {
      return 0;
    }
    
    // Firebase batch has a limit of 500 operations
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < eventsWithoutUser.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = eventsWithoutUser.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        const eventRef = doc(db, 'events', docSnapshot.id);
        batch.delete(eventRef);
      });
      
      await batch.commit();
      deletedCount += batchDocs.length;
    }
    return deletedCount;
  } catch (error) {
    throw error;
  }
}

/**
 * Count events without a userId
 * Useful for checking if migration is needed
 * 
 * @returns {Promise<number>} - Number of events without userId
 */
export async function countEventsWithoutUser() {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const eventsWithoutUser = eventsSnapshot.docs.filter(doc => !doc.data().userId);
    return eventsWithoutUser.length;
  } catch (error) {
    throw error;
  }
}

