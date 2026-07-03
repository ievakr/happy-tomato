import dayjs from 'dayjs';

/** Parse todo text and title fields from a saved event. */
export function parseTodoFieldsFromEvent(selectedEvent) {
  if (!selectedEvent) {
    return { todoText: '', title: '' };
  }

  const isTodo =
    selectedEvent.isRecurringTodo ||
    (selectedEvent.title &&
      typeof selectedEvent.title === 'string' &&
      selectedEvent.title.startsWith('TO DO:')) ||
    selectedEvent.toDo;

  if (isTodo) {
    const todoValue = selectedEvent.toDo
      ? Array.isArray(selectedEvent.toDo)
        ? selectedEvent.toDo.join(', ')
        : selectedEvent.toDo
      : selectedEvent.title?.startsWith('TO DO:')
        ? selectedEvent.title
        : '';
    const displayTodo = todoValue.replace(/^TO DO:\s*/i, '').trim() || todoValue;
    return { todoText: displayTodo, title: selectedEvent.title || todoValue };
  }

  const legacyText = selectedEvent.actions?.length
    ? selectedEvent.actions.join(', ')
    : selectedEvent.title || '';
  return { todoText: legacyText, title: selectedEvent.title || legacyText };
}

/** Map plant display names to stored label ids. */
export function mapLabelsToSave(selectedLabels, displayNameToPlantId) {
  return (selectedLabels || []).map(
    (dn) => (displayNameToPlantId && displayNameToPlantId[dn]) || dn
  );
}

/** Build the calendar event payload from modal form state. */
export function buildCalendarEventPayload({
  selectedEvent,
  todoText,
  title,
  description,
  selectedLabels,
  selectedDate,
  userRecurringConfig,
  displayNameToPlantId,
}) {
  const rawTodo = todoText.trim();
  const toDoValue = rawTodo ? (rawTodo.startsWith('TO DO:') ? rawTodo : `TO DO: ${rawTodo}`) : null;
  const labelsToSave = mapLabelsToSave(selectedLabels, displayNameToPlantId);

  const eventDate = dayjs(selectedDate).startOf('day');
  const today = dayjs().startOf('day');
  const isPastDate = eventDate.isBefore(today);
  const isTodo = !!toDoValue;
  const rawTitle = toDoValue || title;
  const resolvedTitle =
    isTodo && isPastDate && toDoValue
      ? toDoValue.replace(/^TO DO:\s*/i, '').trim() || rawTitle
      : rawTitle;

  const recurringConfig = isTodo && isPastDate ? null : userRecurringConfig;
  const pastTodoFields =
    isTodo && isPastDate
      ? {
          completed: true,
          completedAt: selectedEvent?.completedAt || Date.now(),
          createdFromAction: true,
          isRecurringTodo: false,
        }
      : isTodo && !isPastDate
        ? {
            completed: false,
            completedAt: undefined,
            createdFromAction: false,
          }
        : {};

  if (selectedEvent) {
    return {
      ...selectedEvent,
      title: resolvedTitle,
      actions: [],
      description,
      labels: labelsToSave,
      toDo: toDoValue,
      day: selectedDate.valueOf(),
      id: selectedEvent.id,
      userRecurringConfig: recurringConfig,
      ...pastTodoFields,
    };
  }

  return {
    title: resolvedTitle,
    actions: [],
    description,
    labels: labelsToSave,
    toDo: toDoValue,
    day: selectedDate.valueOf(),
    completed: isTodo && isPastDate,
    ...(isTodo &&
      isPastDate && {
        completedAt: Date.now(),
        createdFromAction: true,
      }),
    userRecurringConfig: recurringConfig,
  };
}
