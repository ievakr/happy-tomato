import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const BATCH_SIZE = 500;

/** Doc id used for emailPreferences (matches usePushNotifications / ContextWrapper). */
export function emailPreferencesDocIdFromEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[.#$[\]]/g, '_');
}

async function deleteDocSnapshots(docSnapshots) {
  if (!docSnapshots.length) return 0;

  let deletedCount = 0;
  for (let i = 0; i < docSnapshots.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = docSnapshots.slice(i, i + BATCH_SIZE);
    chunk.forEach((snap) => batch.delete(snap.ref));
    await batch.commit();
    deletedCount += chunk.length;
  }
  return deletedCount;
}

async function deleteDocIfExists(ref) {
  try {
    await deleteDoc(ref);
    return 1;
  } catch (error) {
    if (error?.code === 'not-found') return 0;
    throw error;
  }
}

/**
 * Delete all events belonging to a specific user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function deleteUserEvents(userId) {
  const eventsSnapshot = await getDocs(
    query(collection(db, 'events'), where('userId', '==', userId))
  );
  return deleteDocSnapshots(eventsSnapshot.docs);
}

/**
 * Delete all plants belonging to a specific user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function deleteUserPlants(userId) {
  const plantsSnapshot = await getDocs(
    query(collection(db, 'plants'), where('userId', '==', userId))
  );
  return deleteDocSnapshots(plantsSnapshot.docs);
}

/**
 * Delete notification preference docs (FCM tokens, reminder settings).
 * @param {string} userId
 * @param {string} [userEmail]
 * @returns {Promise<number>}
 */
export async function deleteUserEmailPreferences(userId, userEmail) {
  const refs = new Map();

  const byUserId = await getDocs(
    query(collection(db, 'emailPreferences'), where('userId', '==', userId))
  );
  byUserId.docs.forEach((snap) => refs.set(snap.id, snap.ref));

  const emailDocId = emailPreferencesDocIdFromEmail(userEmail);
  if (emailDocId) {
    refs.set(emailDocId, doc(db, 'emailPreferences', emailDocId));
  }

  let deleted = 0;
  for (const ref of refs.values()) {
    deleted += await deleteDocIfExists(ref);
  }
  return deleted;
}

/**
 * Delete all yearly garden plan docs for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function deleteUserGardenPlans(userId) {
  const yearsSnap = await getDocs(collection(db, 'gardenPlans', userId, 'years'));
  return deleteDocSnapshots(yearsSnap.docs);
}

/**
 * Delete the user's saved to-do templates doc.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function deleteUserSavedTodos(userId) {
  return deleteDocIfExists(doc(db, 'savedTodos', userId));
}

/**
 * Delete all Firestore data associated with a user (call before Firebase Auth deleteUser).
 * @param {string} userId
 * @param {{ userEmail?: string }} [options]
 * @returns {Promise<Object>}
 */
export async function deleteAllUserData(userId, options = {}) {
  if (!userId) {
    throw new Error('userId is required to delete account data');
  }

  const { userEmail } = options;

  const eventsDeleted = await deleteUserEvents(userId);
  const plantsDeleted = await deleteUserPlants(userId);
  const gardenPlansDeleted = await deleteUserGardenPlans(userId);
  const emailPreferencesDeleted = await deleteUserEmailPreferences(userId, userEmail);
  const savedTodosDeleted = await deleteUserSavedTodos(userId);

  return {
    eventsDeleted,
    plantsDeleted,
    gardenPlansDeleted,
    emailPreferencesDeleted,
    savedTodosDeleted,
    totalDeleted:
      eventsDeleted +
      plantsDeleted +
      gardenPlansDeleted +
      emailPreferencesDeleted +
      savedTodosDeleted,
  };
}
