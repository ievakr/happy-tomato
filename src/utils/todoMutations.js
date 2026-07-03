/**
 * Build the payload for completing a TO DO in place (avoids delete + create duplication).
 */
export function buildCompletedTodoAction(todoEvent) {
  return {
    ...todoEvent,
    title: todoEvent.actions
      ? todoEvent.actions.join(', ')
      : todoEvent.title.replace('TO DO: ', ''),
    completed: true,
    isRecurringTodo: false,
    completedAt: Date.now(),
    originalTodoId: todoEvent.id,
    createdFromAction: true,
  };
}

/**
 * Build the payload for restoring a completed TO DO back to pending.
 */
export function buildRestoredTodoEvent(event) {
  const rawToDo = event.toDo
    ? Array.isArray(event.toDo)
      ? event.toDo.join(', ')
      : String(event.toDo)
    : '';
  const fromTitle = String(event.title || '').replace(/^TO DO:\s*/i, '').trim();
  const core = rawToDo.replace(/^TO DO:\s*/i, '').trim() || fromTitle;
  const toDoValue =
    rawToDo.trim().startsWith('TO DO:') && rawToDo.trim().length > 6
      ? rawToDo.trim()
      : core
        ? `TO DO: ${core}`
        : `TO DO: ${fromTitle || 'Task'}`;

  const recurring = Boolean(event.userRecurringConfig?.enabled);

  return {
    ...event,
    title: toDoValue,
    toDo: toDoValue,
    completed: false,
    completedAt: undefined,
    createdFromAction: false,
    isRecurringTodo: recurring,
  };
}

/**
 * Build the payload for marking a TO DO completed without converting it to an action.
 */
export function buildMarkedCompletedTodo(todoEvent) {
  return {
    ...todoEvent,
    completed: true,
    completedAt: Date.now(),
  };
}
