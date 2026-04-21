import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Delete all events belonging to a specific user
 * 
 * @param {string} userId - The user ID whose events should be deleted
 * @returns {Promise<number>} - Number of events deleted
 */
export async function deleteUserEvents(userId) {
  try {
    // Query events for this user
    const eventsQuery = query(
      collection(db, 'events'),
      where('userId', '==', userId)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const userEvents = eventsSnapshot.docs;
    
    if (userEvents.length === 0) {
      return 0;
    }
    
    // Firebase batch has a limit of 500 operations
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < userEvents.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = userEvents.slice(i, i + batchSize);
      
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
 * Delete all data associated with a user
 * This includes events and any other user-specific data
 * 
 * @param {string} userId - The user ID whose data should be deleted
 * @returns {Promise<Object>} - Summary of deleted data
 */
/**
 * Delete all yearly garden plan docs for a user.
 * @param {string} userId
 * @returns {Promise<number>} number of year docs removed
 */
export async function deleteUserGardenPlans(userId) {
  const yearsSnap = await getDocs(collection(db, 'gardenPlans', userId, 'years'));
  if (yearsSnap.empty) {
    return 0;
  }
  const batchSize = 500;
  const docs = yearsSnap.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    docs.slice(i, i + batchSize).forEach((d) => {
      batch.delete(doc(db, 'gardenPlans', userId, 'years', d.id));
    });
    await batch.commit();
  }
  return docs.length;
}

export async function deleteAllUserData(userId) {
  try {
    const eventsDeleted = await deleteUserEvents(userId);

    let gardenPlansDeleted = 0;
    try {
      gardenPlansDeleted = await deleteUserGardenPlans(userId);
    } catch {
      // Subcollection may be empty or rules may block in some contexts
    }

    try {
      const savedTodosRef = doc(db, 'savedTodos', userId);
      await deleteDoc(savedTodosRef);
    } catch {
      // Saved todos may not exist
    }
    
    return {
      eventsDeleted,
      gardenPlansDeleted,
      totalDeleted: eventsDeleted + gardenPlansDeleted
    };
  } catch (error) {
    throw error;
  }
}




