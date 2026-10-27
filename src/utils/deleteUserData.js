import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  emailPreferencesDocId,
  legacyEmailPreferencesDocId,
} from './emailPreferencesDoc';

const BATCH_SIZE = 500;

/** @deprecated Use legacyEmailPreferencesDocId. Kept for callers that still import this name. */
export function emailPreferencesDocIdFromEmail(email) {
  return legacyEmailPreferencesDocId(email);
}

function prefsBelongToCaller(data, userId, email) {
  if (!data || typeof data !== 'object') return false;
  const ownerId = typeof data.userId === 'string' ? data.userId : '';
  if (ownerId) return ownerId === userId;
  const ownerEmail = typeof data.userEmail === 'string' ? data.userEmail.trim().toLowerCase() : '';
  const callerEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  return Boolean(ownerEmail && callerEmail && ownerEmail === callerEmail);
}

function uniqueTokens(...groups) {
  const tokens = [];
  groups.flat().forEach((token) => {
    if (typeof token === 'string' && token && !tokens.includes(token)) {
      tokens.push(token);
    }
  });
  return tokens.slice(0, 20);
}

/**
 * Move notification settings onto the account id, and onto the new email, after an email change.
 * The sign-in token still has the old email until `onBeforeWrite` refreshes it, so the old
 * document is read and removed first.
 * @param {string} oldEmail
 * @param {string} newEmail
 * @param {{ onBeforeWrite?: () => Promise<void>, userId?: string }} [options]
 * @returns {Promise<boolean>} whether a document was migrated
 */
export async function migrateEmailPreferencesDoc(oldEmail, newEmail, options = {}) {
  const { onBeforeWrite } = options;
  const oldId = legacyEmailPreferencesDocId(oldEmail);
  const newId = legacyEmailPreferencesDocId(newEmail);
  const uid = options.userId || auth.currentUser?.uid || null;
  const accountId = emailPreferencesDocId(uid);

  let carried = null;
  if (oldId) {
    const oldSnap = await getDoc(doc(db, 'emailPreferences', oldId));
    if (oldSnap.exists() && prefsBelongToCaller(oldSnap.data(), uid, oldEmail)) {
      carried = oldSnap.data();
    }
  }

  let accountData = null;
  if (accountId) {
    const accountSnap = await getDoc(doc(db, 'emailPreferences', accountId));
    if (accountSnap.exists()) accountData = accountSnap.data();
  }

  if (!carried && !accountData) return false;

  if (oldId && carried) {
    await deleteDoc(doc(db, 'emailPreferences', oldId));
  }

  if (onBeforeWrite) await onBeforeWrite();

  const tokens = uniqueTokens(accountData?.fcmTokens, carried?.fcmTokens);
  const targetId = accountId || newId;
  if (!targetId) return false;

  await setDoc(
    doc(db, 'emailPreferences', targetId),
    {
      ...(carried || {}),
      ...(accountData || {}),
      ...(uid ? { userId: uid } : {}),
      userEmail: newEmail,
      updatedAt: new Date().toISOString(),
      ...(tokens.length ? { fcmTokens: tokens } : {}),
    },
    { merge: true },
  );

  if (accountId && newId && newId !== accountId) {
    await deleteDocIfExists(doc(db, 'emailPreferences', newId));
  }
  return true;
}

/**
 * Read settings from the account document. If they still live under the old email id, move them.
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<{id: string, data: Object}|null>}
 */
export async function readEmailPreferences(userId, email) {
  const accountId = emailPreferencesDocId(userId);
  if (!accountId) return null;

  const accountRef = doc(db, 'emailPreferences', accountId);
  const accountSnap = await getDoc(accountRef);
  if (accountSnap.exists()) {
    return { id: accountId, data: accountSnap.data() };
  }

  const legacyId = legacyEmailPreferencesDocId(email);
  if (!legacyId || legacyId === accountId) return null;

  const legacySnap = await getDoc(doc(db, 'emailPreferences', legacyId));
  if (!legacySnap.exists() || !prefsBelongToCaller(legacySnap.data(), userId, email)) {
    return null;
  }

  const data = {
    ...legacySnap.data(),
    userId,
    userEmail: typeof email === 'string' && email.trim() ? email.trim() : legacySnap.data().userEmail,
    updatedAt: new Date().toISOString(),
  };
  if (Array.isArray(data.fcmTokens)) {
    data.fcmTokens = uniqueTokens(data.fcmTokens);
  }
  await setDoc(accountRef, data);
  await deleteDocIfExists(doc(db, 'emailPreferences', legacyId));
  return { id: accountId, data };
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
 * Known documents are removed before the userId query, so a rejected query cannot
 * run after the calendar has already been deleted.
 * @param {string} userId
 * @param {string} [userEmail]
 * @returns {Promise<number>}
 */
export async function deleteUserEmailPreferences(userId, userEmail) {
  const refs = new Map();
  const accountId = emailPreferencesDocId(userId);
  if (accountId) refs.set(accountId, doc(db, 'emailPreferences', accountId));
  const legacyId = legacyEmailPreferencesDocId(userEmail);
  if (legacyId) refs.set(legacyId, doc(db, 'emailPreferences', legacyId));

  let deleted = 0;
  for (const [id, ref] of refs) {
    try {
      deleted += await deleteDocIfExists(ref);
    } catch (error) {
      // A colliding email id can belong to someone else. Leave it, and keep going.
      if (id === legacyId && error?.code === 'permission-denied') continue;
      throw error;
    }
  }

  const byUserId = await getDocs(
    query(collection(db, 'emailPreferences'), where('userId', '==', userId))
  );
  const extras = byUserId.docs.filter((snap) => !refs.has(snap.id));
  deleted += await deleteDocSnapshots(extras);
  return deleted;
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
 * Notification settings go first. If that step fails, events and plants are still there.
 * @param {string} userId
 * @param {{ userEmail?: string }} [options]
 * @returns {Promise<Object>}
 */
export async function deleteAllUserData(userId, options = {}) {
  if (!userId) {
    throw new Error('userId is required to delete account data');
  }

  const { userEmail } = options;

  const emailPreferencesDeleted = await deleteUserEmailPreferences(userId, userEmail);
  const savedTodosDeleted = await deleteUserSavedTodos(userId);
  const eventsDeleted = await deleteUserEvents(userId);
  const plantsDeleted = await deleteUserPlants(userId);

  return {
    eventsDeleted,
    plantsDeleted,
    emailPreferencesDeleted,
    savedTodosDeleted,
    totalDeleted:
      eventsDeleted +
      plantsDeleted +
      emailPreferencesDeleted +
      savedTodosDeleted,
  };
}
