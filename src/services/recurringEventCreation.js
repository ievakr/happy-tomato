import { EVENT_ACTIONS, PLANT_ACTIONS } from '../constants';
import {
  generateRecurringToDos,
  shouldGenerateRecurringTodos,
} from '../utils/recurringActions';

/**
 * Create an action and generate recurring TO DOs when applicable.
 */
export async function createActionWithRecurringTodos(
  actionEvent,
  { dispatchCallEvent, filteredEvents }
) {
  const isUserTodoWithRecurring =
    actionEvent.userRecurringConfig &&
    actionEvent.userRecurringConfig.enabled &&
    actionEvent.toDo;

  if (isUserTodoWithRecurring) {
    const recurringTodos = generateRecurringToDos(actionEvent, '', 6, filteredEvents, true);

    for (const todo of recurringTodos) {
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
    }

    return;
  }

  await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: actionEvent });

  const firstAction =
    actionEvent.actions && actionEvent.actions.length > 0
      ? actionEvent.actions[0]
      : actionEvent.title;

  const firstTodo =
    actionEvent.toDo && Array.isArray(actionEvent.toDo)
      ? actionEvent.toDo[0]
      : actionEvent.toDo;

  const hasPlantAction = !!firstAction && !!PLANT_ACTIONS[firstAction];
  if (!hasPlantAction && firstTodo && !isUserTodoWithRecurring) {
    return;
  }

  const dosageText = hasPlantAction ? PLANT_ACTIONS[firstAction] : null;
  const sourceItem = firstAction;

  if (shouldGenerateRecurringTodos(sourceItem, dosageText, actionEvent.userRecurringConfig)) {
    if (actionEvent.recurringCancelled) {
      return;
    }

    const recurringTodos = generateRecurringToDos(
      actionEvent,
      dosageText,
      6,
      filteredEvents,
      false
    );

    for (const todo of recurringTodos) {
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
    }
  }
}
