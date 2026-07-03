import { eventMatchesAction, labelsMatch } from '../utils/recurringTodos';

/**
 * Fetch all events for a user directly from Firestore (bypasses React Query cache).
 */
export async function fetchUserFirebaseEvents(userId) {
  if (!userId) return [];

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const { db } = await import('../firebase');

  const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
  const snapshot = await getDocs(eventsQuery);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/** Delete event documents from Firestore by id. */
export async function deleteFirebaseEventDocs(events) {
  if (!events?.length) return;

  const { deleteDoc, doc } = await import('firebase/firestore');
  const { db } = await import('../firebase');

  await Promise.all(events.map((evt) => deleteDoc(doc(db, 'events', evt.id))));
}

/**
 * Targeted delete for recurring to-dos by pattern matching in Firebase.
 */
export async function deleteRecurringTodosByPatternFromFirebase(userId, actionName, labels = []) {
  const allFirebaseEvents = await fetchUserFirebaseEvents(userId);

  const recurringTodosToDelete = allFirebaseEvents.filter(
    (evt) =>
      evt.isRecurringTodo &&
      !evt.completed &&
      eventMatchesAction(evt, actionName) &&
      labelsMatch(labels, evt.labels)
  );

  if (recurringTodosToDelete.length === 0) {
    return 0;
  }

  await deleteFirebaseEventDocs(recurringTodosToDelete);
  return recurringTodosToDelete.length;
}

/**
 * Delete all pending recurring to-dos for a user directly from Firebase.
 * @param {string} userId
 * @param {(actionName: string, labels: string[]) => Promise<void>} [onCancelSeries]
 */
export async function nukeAllRecurringTodosFromFirebase(userId, onCancelSeries) {
  const allFirebaseEvents = await fetchUserFirebaseEvents(userId);

  const recurringTodosInFirebase = allFirebaseEvents.filter(
    (evt) => evt.isRecurringTodo === true && evt.completed !== true
  );

  if (recurringTodosInFirebase.length === 0) {
    return 0;
  }

  await deleteFirebaseEventDocs(recurringTodosInFirebase);

  if (onCancelSeries) {
    const actionsCancelled = new Set();
    for (const todo of recurringTodosInFirebase) {
      const actionToCancel =
        todo.actions?.length > 0
          ? todo.actions[0]
          : todo.toDo || todo.title.replace('TO DO: ', '');

      if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
        actionsCancelled.add(actionToCancel);
        try {
          await onCancelSeries(actionToCancel, todo.labels);
        } catch {
          // Failed to cancel series
        }
      }
    }
  }

  return recurringTodosInFirebase.length;
}
