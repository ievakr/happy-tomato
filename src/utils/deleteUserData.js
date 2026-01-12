import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Delete all events belonging to a specific user
 * 
 * @param {string} userId - The user ID whose events should be deleted
 * @returns {Promise<number>} - Number of events deleted
 */
export async function deleteUserEvents(userId) {
  try {
    console.log('🗑️ Deleting all events for user:', userId);
    
    // Query events for this user
    const eventsQuery = query(
      collection(db, 'events'),
      where('userId', '==', userId)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const userEvents = eventsSnapshot.docs;
    
    console.log(`Found ${userEvents.length} events to delete`);
    
    if (userEvents.length === 0) {
      console.log('✅ No events to delete');
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
      console.log(`Deleted ${deletedCount}/${userEvents.length} events`);
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} events for user ${userId}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error deleting user events:', error);
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
export async function deleteAllUserData(userId) {
  try {
    console.log('🗑️ Deleting all data for user:', userId);
    
    const eventsDeleted = await deleteUserEvents(userId);
    
    // Add other data deletion here if needed in the future
    // e.g., user preferences, settings, etc.
    
    const summary = {
      eventsDeleted,
      totalDeleted: eventsDeleted
    };
    
    console.log('✅ User data deletion summary:', summary);
    return summary;
  } catch (error) {
    console.error('❌ Error deleting user data:', error);
    throw error;
  }
}




