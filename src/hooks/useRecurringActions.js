import dayjs from 'dayjs';
import { useEventContext } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { EVENT_ACTIONS, PLANT_ACTIONS, TODO_ACTIONS } from '../constants';
import { 
  generateRecurringToDos, 
  shouldGenerateRecurringTodos,
  parseRecurringInterval
} from '../utils/recurringActions';

/** True if the event carries a to-do (field or legacy title-only). Used before recurring recalculation. */
function eventHasTodoContent(evt) {
  if (!evt) return false;
  const td = evt.toDo;
  if (td) {
    if (Array.isArray(td)) return td.length > 0;
    return Boolean(String(td).trim());
  }
  return (
    evt.title &&
    typeof evt.title === 'string' &&
    evt.title.trim().startsWith('TO DO:')
  );
}

/**
 * Calendar day (start) of inclusive "repeat until" end, or null if series does not use until-date.
 * Aligns with {@link parseRecurringInterval} (count end type ignores untilDate).
 */
function getUserRecurringUntilStartOfDay(userRecurringConfig) {
  if (!userRecurringConfig?.enabled || userRecurringConfig.untilDate == null) {
    return null;
  }
  if (userRecurringConfig.endType === 'count') {
    return null;
  }
  return dayjs(userRecurringConfig.untilDate).startOf('day');
}

/**
 * Custom hook for managing recurring actions and TO DO completion
 */
export const useRecurringActions = () => {
  const { dispatchCallEvent, filteredEvents } = useEventContext();
  const { currentUser } = useAuth();

  /**
   * Create an action and generate recurring TO DOs if applicable
   * @param {Object} actionEvent - The action event to create
   */
  const createActionWithRecurringTodos = async (actionEvent) => {
    try {
      // Determine if this is a user-created TODO with recurring config (not an action that generates TODOs)
      const isUserTodoWithRecurring = actionEvent.userRecurringConfig && 
                                      actionEvent.userRecurringConfig.enabled &&
                                      actionEvent.toDo;
      
      if (isUserTodoWithRecurring) {
        // For user-created TODOs with recurring enabled:
        // Generate ALL occurrences (including the first one) based on maxOccurrences
        // Don't create the original event separately
        const recurringTodos = generateRecurringToDos(actionEvent, '', 6, filteredEvents, true);
        
        // Create each TO DO event (Firebase will assign IDs)
        for (const todo of recurringTodos) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
        }
        
        return;
      }
      
      // Legacy behavior for actions and TODOs without explicit user recurring config
      // First create the main event itself
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: actionEvent });
      
      // Decide if we should auto-generate recurring TO DOs.
      // IMPORTANT:
      // - For plant actions, we still support legacy auto-recurring based on PLANT_ACTIONS.
      // - For user-created TODOs, we now ONLY recur when the user explicitly enables
      //   recurring via userRecurringConfig (handled in the block above).
      const firstAction = actionEvent.actions && actionEvent.actions.length > 0 
        ? actionEvent.actions[0] 
        : actionEvent.title;
      
      const firstTodo = actionEvent.toDo && Array.isArray(actionEvent.toDo) 
        ? actionEvent.toDo[0] 
        : actionEvent.toDo;
      
      // If this is a pure TODO (no plant action) and userRecurringConfig is not enabled,
      // do NOT auto-create a recurring series based on old hardcoded TODO_ACTIONS.
      const hasPlantAction = !!firstAction && !!PLANT_ACTIONS[firstAction];
      if (!hasPlantAction && firstTodo && !isUserTodoWithRecurring) {
        return;
      }
      
      // For plant actions, use PLANT_ACTIONS dosage text (legacy support)
      const dosageText = hasPlantAction ? PLANT_ACTIONS[firstAction] : null;
      const sourceItem = firstAction;
      
      if (shouldGenerateRecurringTodos(sourceItem, dosageText, actionEvent.userRecurringConfig)) {
        // Check if this action has been marked as having its recurring series cancelled
        if (actionEvent.recurringCancelled) {
          return;
        }
        
        // Generate recurring TO DO events, passing existing events to avoid duplicates
        const recurringTodos = generateRecurringToDos(actionEvent, dosageText, 6, filteredEvents, false);
        
        // Create each TO DO event (Firebase will assign IDs)
        for (const todo of recurringTodos) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Complete a TO DO event and convert it to an action
   * @param {Object} todoEvent - The TO DO event to complete
   */
  const completeTodo = async (todoEvent) => {
    try {
      // Convert the todo to a completed action by updating it in place
      // This avoids the duplication issue of delete + create
      const completedAction = {
        ...todoEvent,
        title: todoEvent.actions ? todoEvent.actions.join(', ') : todoEvent.title.replace('TO DO: ', ''),
        completed: true,
        isRecurringTodo: false,
        completedAt: Date.now(),
        originalTodoId: todoEvent.id,
        createdFromAction: true // Mark as a completed action for styling
      };
      
      // Update the existing event to mark it as completed
      await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: completedAction });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reverse {@link completeTodo}: restore pending TO DO fields and clear completion.
   */
  const uncompleteTodo = async (event) => {
    try {
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

      const restored = {
        ...event,
        title: toDoValue,
        toDo: toDoValue,
        completed: false,
        completedAt: undefined,
        createdFromAction: false,
        isRecurringTodo: recurring,
      };

      await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: restored });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Mark a TO DO as completed without deleting it (for UI feedback)
   * @param {Object} todoEvent - The TO DO event to mark as completed
   */
  const markTodoCompleted = async (todoEvent) => {
    try {
      const updatedTodo = {
        ...todoEvent,
        completed: true,
        completedAt: Date.now()
      };
      
      await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedTodo });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get all pending TO DOs for a specific day
   * @param {dayjs} day - The day to check
   * @returns {Array} - Array of pending TO DO events
   */
  const getPendingTodosForDay = (day) => {
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (evt.title && typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      return dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY") &&
             isTodoEvent &&
             !evt.completed;
    });
  };

  /**
   * Get all completed TO DOs that were converted to actions
   * @param {dayjs} day - The day to check
   * @returns {Array} - Array of completed action events
   */
  const getCompletedActionsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY") &&
      evt.createdFromAction &&
      evt.completed
    );
  };

  /**
   * Check if an event is a TO DO that can be completed
   * @param {Object} event - The event to check
   * @returns {boolean}
   */
  const isTodoEvent = (event) => {
    // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
    const isTodoEvent = event.isRecurringTodo || 
                       (event.title && typeof event.title === 'string' && event.title.startsWith("TO DO:")) ||
                       (typeof event.toDo === 'string' && event.toDo.startsWith("TO DO:"));
    return isTodoEvent && !event.completed;
  };

  /**
   * Check if an event is a completed action from a TO DO
   * @param {Object} event - The event to check
   * @returns {boolean}
   */
  const isCompletedTodoAction = (event) => {
    if (!event?.completed) return false;
    // Distinguish from generic completed events: todo/recurring markers or any saved to-do line
    if (event.createdFromAction) return true;
    if (event.isRecurringTodo) return true;
    if (typeof event.toDo === 'string' && event.toDo.trim().length > 0) return true;
    if (typeof event.title === 'string' && event.title.startsWith('TO DO:')) return true;
    return false;
  };

  /** Day list: show complete / uncomplete control for pending or completed to-dos */
  const supportsDayViewCompleteToggle = (event) =>
    Boolean(event && (isTodoEvent(event) || isCompletedTodoAction(event)));

  /**
   * Get upcoming TO DOs for a specific action and plant combination
   * @param {string} action - The action name
   * @param {Array} labels - The plant labels
   * @param {number} daysAhead - Number of days to look ahead (default: 30)
   * @returns {Array} - Array of upcoming TO DO events
   */
  const getUpcomingTodos = (action, labels, daysAhead = 30) => {
    const today = dayjs();
    const futureDate = today.add(daysAhead, 'days');
    
    return filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (evt.title && typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      const eventDate = dayjs(evt.day);
      return isTodoEvent &&
             !evt.completed &&
             eventDate.isAfter(today) &&
             eventDate.isBefore(futureDate) &&
             evt.actions && evt.actions.includes(action) &&
             labels.some(label => evt.labels && evt.labels.includes(label));
    });
  };

  /**
   * Get all pending TO DO events (both recurring and manual)
   * @returns {Array} - Array of all pending TO DO events
   */
  const getAllPendingTodos = () => {
    const pendingTodos = filteredEvents.filter(evt => {
      // Include both recurring TODOs and manually created TODOs (title starts with "TO DO:" OR toDo field starts with "TO DO:")
      const isTodoEvent = evt.isRecurringTodo || 
                         (evt.title && typeof evt.title === 'string' && evt.title.startsWith("TO DO:")) ||
                         (typeof evt.toDo === 'string' && evt.toDo.startsWith("TO DO:"));
      return isTodoEvent && !evt.completed;
    });
    return pendingTodos;
  };

  /**
   * Delete all auto-generated recurring TO DO events
   * @param {string} filterAction - Optional: Only delete todos for specific action
   * @param {Array} filterLabels - Optional: Only delete todos for specific plant labels
   * @returns {Promise} - Promise that resolves when all deletions complete
   */
  const deleteAllRecurringTodos = async (filterAction = null, filterLabels = null) => {
    try {
      let todosToDelete = getAllPendingTodos();
      
      // Apply filters if provided
      if (filterAction) {
        todosToDelete = todosToDelete.filter(evt => 
          evt.actions && evt.actions.includes(filterAction)
        );
      }
      
      if (filterLabels && filterLabels.length > 0) {
        todosToDelete = todosToDelete.filter(evt =>
          evt.labels && filterLabels.some(label => evt.labels.includes(label))
        );
      }
      
      // Delete all todos in parallel for better performance
      const deletePromises = todosToDelete.map((todo) =>
        dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo })
      );
      
      await Promise.all(deletePromises);
      
      // Cancel the recurring series to prevent regeneration
      const actionsCancelled = new Set();
      
      for (const todo of todosToDelete) {
        const actionToCancel = todo.actions && todo.actions.length > 0 
          ? todo.actions[0] 
          : (todo.toDo || todo.title.replace('TO DO: ', ''));
        
        if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
          actionsCancelled.add(actionToCancel);
          try {
            await cancelRecurringSeries(actionToCancel, todo.labels);
          } catch (cancelError) {
            // Failed to cancel series
          }
        }
      }
      
      return todosToDelete.length;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete recurring todos that were generated from a specific original event
   * @param {string} originalEventId - The ID of the original event
   * @param {string} originalAction - The action from the original event
   * @param {Array} originalLabels - The labels from the original event
   * @returns {Promise} - Promise that resolves when deletions complete
   */
  const deleteRecurringTodosForEvent = async (originalEventId, originalAction, originalLabels) => {
    try {
      // Find todos that match the original event's action and labels
      // We match by action/labels since todos don't store originalEventId
      // CRITICAL: Exclude the original event itself from deletion!
      const todosToDelete = filteredEvents.filter(evt => {
        if (!evt.isRecurringTodo || evt.completed) return false;
        
        // NEVER delete the original event itself
        if (evt.id === originalEventId) return false;
        
        // Match by action (either in actions array or title) - handle variations
        const hasMatchingAction = originalAction && (
          (evt.actions && evt.actions.includes(originalAction)) ||
          (evt.toDo && evt.toDo.includes(originalAction)) ||
          (evt.title && typeof evt.title === 'string' && evt.title.includes(originalAction)) ||
          // Also try matching the base action name (without "TO DO: " prefix)
          (originalAction.startsWith("TO DO: ") && (
            (evt.actions && evt.actions.includes(originalAction.replace("TO DO: ", ""))) ||
            (evt.title && evt.title.includes(originalAction.replace("TO DO: ", "")))
          )) ||
          // Try matching in reverse (if originalAction doesn't have "TO DO: " but event title does)
          (!originalAction.startsWith("TO DO: ") && evt.title && typeof evt.title === 'string' && evt.title.includes(`TO DO: ${originalAction}`))
        );
        
        // Match by labels - require exact matching to avoid deleting events from different plants
        // Both events must have the same labels for them to be considered part of the same series
        const hasMatchingLabels = 
          (originalLabels && evt.labels && 
           originalLabels.length === evt.labels.length &&
           originalLabels.every(label => evt.labels.includes(label))) ||
          ((!originalLabels || originalLabels.length === 0) && 
           (!evt.labels || evt.labels.length === 0));
        
        return hasMatchingAction && hasMatchingLabels;
      });
      
      if (todosToDelete.length > 0) {
        const deletePromises = todosToDelete.map(todo => 
          dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo })
        );
        
        await Promise.all(deletePromises);
      }
      
      return todosToDelete.length;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update an event and recalculate its recurring todos if the date changed
   * @param {Object} updatedEvent - The updated event data
   * @param {Object} originalEvent - The original event data before update
   */
  const updateEventWithRecurringRecalculation = async (updatedEvent, originalEvent) => {
    try {
      // Safety check: ensure we have valid event data
      if (!originalEvent || !originalEvent.id) {
        throw new Error('Cannot update event: missing original event or ID');
      }
      
      if (!updatedEvent || !updatedEvent.id) {
        throw new Error('Cannot update event: missing updated event ID');
      }
      
      // Check if this event has recurring potential
      const hasActions = updatedEvent.actions && updatedEvent.actions.length > 0;
      const hasTodos = eventHasTodoContent(updatedEvent);
      
      // Handle recurring todo events differently - they can still trigger recalculation
      const isRecurringTodo = originalEvent.isRecurringTodo === true;
      
      if (!hasActions && !hasTodos) {
        // No recurring potential, just update normally
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
        return;
      }
      
      // Check if the date changed
      const originalDate = dayjs(originalEvent.day);
      const newDate = dayjs(updatedEvent.day);
      const dateChanged = !originalDate.isSame(newDate, 'day');
      
      // Converting a one-off todo into a recurring series. Use `enabled`, not object truthiness:
      // `{}` or legacy partial configs are truthy but not enabled — `!userRecurringConfig` blocked bulk apply.
      const isConvertingToRecurring =
        !originalEvent.isRecurringTodo &&
        !originalEvent.userRecurringConfig?.enabled &&
        Boolean(updatedEvent.userRecurringConfig?.enabled);
      
      if (isConvertingToRecurring) {
        // Update the original event to mark it as recurring
        const recurringEvent = {
          ...updatedEvent,
          isRecurringTodo: true
        };
        
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: recurringEvent });
        
        // Generate the additional occurrences using the generateRecurringToDos function
        // Pass false for generateAllOccurrences since the first one already exists
        const additionalTodos = generateRecurringToDos(recurringEvent, '', 6, filteredEvents, false);
        
        for (const todo of additionalTodos) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
        }
        
        return;
      }
      
      if (dateChanged) {
        try {
          const firstAction = updatedEvent.actions && updatedEvent.actions.length > 0 ? updatedEvent.actions[0] : null;
          const firstTodo = Array.isArray(updatedEvent.toDo) ? updatedEvent.toDo[0] : updatedEvent.toDo;
          const sourceItem = firstAction || firstTodo;
          
          if (isRecurringTodo) {
            // Check if this is a user-created recurring TODO (with userRecurringConfig)
            const isUserRecurringTodo = updatedEvent.userRecurringConfig && updatedEvent.userRecurringConfig.enabled;
            
            if (isUserRecurringTodo) {
              // Calculate the date shift (how many days the event was moved)
              const dateShift = newDate.diff(originalDate, 'day');
              
              if (firstAction || firstTodo) {
                const actionToMatch = firstAction || firstTodo;
                
                // Find ALL recurring todos in this series
                const seriesEvents = filteredEvents.filter(evt => {
                  if (!evt.isRecurringTodo || evt.completed) return false;
                  
                  // Match action/todo
                  const hasMatchingAction = actionToMatch && (
                    (evt.actions && evt.actions.includes(actionToMatch)) ||
                    (evt.toDo && evt.toDo.includes(actionToMatch)) ||
                    (evt.title && evt.title.includes(actionToMatch)) ||
                    (actionToMatch.startsWith("TO DO: ") && (
                      (evt.actions && evt.actions.includes(actionToMatch.replace("TO DO: ", ""))) ||
                      (evt.title && evt.title.includes(actionToMatch.replace("TO DO: ", "")))
                    ))
                  );
                  
                  // Require exact label matching
                  const hasMatchingLabels = 
                    (updatedEvent.labels && evt.labels && 
                     updatedEvent.labels.length === evt.labels.length &&
                     updatedEvent.labels.every(label => evt.labels.includes(label))) ||
                    ((!updatedEvent.labels || updatedEvent.labels.length === 0) && 
                     (!evt.labels || evt.labels.length === 0));
                  
                  return hasMatchingAction && hasMatchingLabels;
                }).sort((a, b) => a.day - b.day); // Sort by date
                
                const untilDay = getUserRecurringUntilStartOfDay(updatedEvent.userRecurringConfig);
                const primaryPastUntil =
                  untilDay != null && newDate.startOf('day').isAfter(untilDay);

                if (primaryPastUntil) {
                  await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: originalEvent });
                } else {
                  await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
                }

                if (!primaryPastUntil) {
                  // Shift later occurrences; drop any that would fall after the "until" end date
                  const eventsToShift = seriesEvents.filter(
                    (evt) => evt.id !== updatedEvent.id && dayjs(evt.day).isAfter(originalDate)
                  );

                  for (const evt of eventsToShift) {
                    const shiftedDay = dayjs(evt.day).add(dateShift, 'day').startOf('day');
                    if (untilDay != null && shiftedDay.isAfter(untilDay)) {
                      await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
                    } else {
                      await dispatchCallEvent({
                        type: EVENT_ACTIONS.UPDATE,
                        payload: {
                          ...evt,
                          day: shiftedDay.valueOf(),
                        },
                      });
                    }
                  }
                }
              }
              
              return; // Exit early - we've handled the entire series
              
            } else {
              // Legacy behavior for recurring TODOs without userRecurringConfig
              
              // For legacy recurring TODOs: Delete OTHER recurring todos in the same series (but not this one)
              if (firstAction || firstTodo) {
                const actionToMatch = firstAction || firstTodo;

                
                // Delete other recurring todos that match this action/labels but exclude this event
                const todosToDelete = filteredEvents.filter(evt => {
                  if (!evt.isRecurringTodo || evt.completed || evt.id === originalEvent.id) return false;
                  
                  // More comprehensive matching for action/todo
                  const hasMatchingAction = actionToMatch && (
                    // Match in actions array
                    (evt.actions && evt.actions.includes(actionToMatch)) ||
                    // Match in toDo field
                    (evt.toDo && evt.toDo.includes(actionToMatch)) ||
                    // Match in title 
                    (evt.title && evt.title.includes(actionToMatch)) ||
                    // Also try matching the base action name (without "TO DO: " prefix)
                    (actionToMatch.startsWith("TO DO: ") && (
                      (evt.actions && evt.actions.includes(actionToMatch.replace("TO DO: ", ""))) ||
                      (evt.title && evt.title.includes(actionToMatch.replace("TO DO: ", "")))
                    ))
                  );
                  
                  // Require exact label matching to avoid deleting events from different plants
                  const hasMatchingLabels = 
                    (updatedEvent.labels && evt.labels && 
                     updatedEvent.labels.length === evt.labels.length &&
                     updatedEvent.labels.every(label => evt.labels.includes(label))) ||
                    ((!updatedEvent.labels || updatedEvent.labels.length === 0) && 
                     (!evt.labels || evt.labels.length === 0));
                  

                  
                  return hasMatchingAction && hasMatchingLabels;
                });
                
                if (todosToDelete.length > 0) {
                  const deletePromises = todosToDelete.map(todo => 
                    dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo })
                  );
                  await Promise.all(deletePromises);
                }
              }
              
              // Update this recurring TODO to the new date
              await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
              
              // Generate remaining recurring todos from this updated todo (to replace the deleted ones)
              let dosageText = PLANT_ACTIONS[firstAction];
              if (!dosageText && firstTodo) {
                dosageText = TODO_ACTIONS[firstTodo];
              }
              
              if (shouldGenerateRecurringTodos(sourceItem, dosageText, updatedEvent.userRecurringConfig)) {
                
                // This updated TODO becomes the new "base" for the remaining sequence
                // Exclude the current updated event from existing events to avoid confusion
                const existingEventsExcludingCurrent = filteredEvents.filter(evt => evt.id !== updatedEvent.id);
                
                // For recurring TODOs, we need to account for the original action event
                // So we should generate fewer TODOs than for a fresh action
                const recurringTodos = generateRecurringToDos(updatedEvent, dosageText, 6, existingEventsExcludingCurrent, false);
              
              // Filter out TODOs that would exceed the max count when including existing events
              const recurringInfo = parseRecurringInterval(dosageText, updatedEvent.userRecurringConfig);
              const maxTotalEvents = recurringInfo.maxOccurrences;
              
              // Count ACTUAL existing events related to this action/labels combination
              // Include: the updated event (1) + any remaining original action events + any other related events
              const existingRelatedEvents = filteredEvents.filter(evt => {
                // Don't count the updated event since it's already accounted for
                if (evt.id === updatedEvent.id) return false;
                
                // Check if this event is related to the same action/labels
                const hasMatchingAction = sourceItem && (
                  (evt.actions && evt.actions.includes(sourceItem)) ||
                  (evt.title && evt.title.includes(sourceItem)) ||
                  (!evt.isRecurringTodo && evt.title === sourceItem) // original action event
                );
                
                const hasMatchingLabels = 
                  (updatedEvent.labels && evt.labels && 
                   updatedEvent.labels.length === evt.labels.length &&
                   updatedEvent.labels.every(label => evt.labels.includes(label))) ||
                  ((!updatedEvent.labels || updatedEvent.labels.length === 0) && 
                   (!evt.labels || evt.labels.length === 0));
                
                return hasMatchingAction && hasMatchingLabels;
              });
              
              const existingEventCount = 1 + existingRelatedEvents.length; // 1 for the updated event + related events
              const maxAdditionalTodos = Math.max(0, maxTotalEvents - existingEventCount);
              
              const recurringTodosToCreate = recurringTodos.slice(0, maxAdditionalTodos);
              
              for (const todo of recurringTodosToCreate) {
                await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
              }
              
              }
            }
            
          } else {
            // For original action events: Delete ALL recurring todos that match this event
            if (firstAction || firstTodo) {
              const actionToMatch = firstAction || firstTodo;
              await deleteRecurringTodosForEvent(originalEvent.id, actionToMatch, updatedEvent.labels);
            }
            
            // Update the main event
            await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
            
            // Generate new recurring todos if applicable.
            // As with creation, we only auto-generate based on PLANT_ACTIONS for plant actions.
            const hasPlantActionForUpdate = !!firstAction && !!PLANT_ACTIONS[firstAction];
            const dosageText = hasPlantActionForUpdate ? PLANT_ACTIONS[firstAction] : null;
            
            if (hasPlantActionForUpdate && shouldGenerateRecurringTodos(sourceItem, dosageText, updatedEvent.userRecurringConfig)) {
              const recurringTodos = generateRecurringToDos(updatedEvent, dosageText, 6, filteredEvents, false);
              
              for (const todo of recurringTodos) {
                await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
              }
            }
          }
          
        } catch (recalcError) {
          // If recalculation fails, at least try to save the main event
          await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
          throw recalcError;
        }
      } else {
        // Date didn't change, just update normally
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Mark original action events as having their recurring series cancelled
   * This prevents regeneration of deleted recurring TODO series
   * @param {string} actionName - The action name to cancel
   * @param {Array} labels - The labels to match
   */
  const cancelRecurringSeries = async (actionName, labels = []) => {
    try {
      
      // Find original action events that generated this recurring series
      const originalActions = filteredEvents.filter(evt => {
        // Skip recurring TODOs and completed actions
        if (evt.isRecurringTodo || evt.completed || evt.createdFromAction) return false;
        
        // Match by action name
        const hasMatchingAction = (
          (evt.actions && evt.actions.includes(actionName)) ||
          (evt.title && evt.title.includes(actionName))
        );
        
        // Match by labels - require exact matching to avoid affecting events from different plants
        const hasMatchingLabels = 
          (labels && evt.labels && 
           labels.length === evt.labels.length &&
           labels.every(label => evt.labels.includes(label))) ||
          ((!labels || labels.length === 0) && 
           (!evt.labels || evt.labels.length === 0));
        
        return hasMatchingAction && hasMatchingLabels;
      });
      
      // Mark each original action as having its recurring series cancelled
      for (const action of originalActions) {
        const updatedAction = {
          ...action,
          recurringCancelled: true,
          recurringCancelledAt: Date.now()
        };
        
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedAction });
      }
      
      return originalActions.length;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Targeted delete for recurring todos by pattern matching in Firebase
   * Use this for old-style IDs that don't exist in Firebase but need targeted cleanup
   * @param {string} actionName - The action name to match
   * @param {Array} labels - The labels to match exactly
   */
  const deleteRecurringTodosByPatternFromFirebase = async (actionName, labels = []) => {
    try {
      
      // Import Firebase functions
      const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // Get documents from Firebase filtered by userId
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(eventsQuery);
      const allFirebaseEvents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Find recurring todos in Firebase that match the specific pattern
      const recurringTodosToDelete = allFirebaseEvents.filter(evt => {
        if (!evt.isRecurringTodo || evt.completed) return false;
        
        // Match by action name
        const hasMatchingAction = actionName && (
          (evt.actions && evt.actions.includes(actionName)) ||
          (evt.toDo && evt.toDo.includes(actionName)) ||
          (evt.title && evt.title.includes(actionName)) ||
          // Handle "TO DO: " prefix variations
          (actionName.startsWith("TO DO: ") && (
            (evt.actions && evt.actions.includes(actionName.replace("TO DO: ", ""))) ||
            (evt.title && evt.title.includes(actionName.replace("TO DO: ", "")))
          )) ||
          (!actionName.startsWith("TO DO: ") && evt.title && typeof evt.title === 'string' && evt.title.includes(`TO DO: ${actionName}`))
        );
        
        // Match by labels - require exact matching
        const hasMatchingLabels = 
          (labels && evt.labels && 
           labels.length === evt.labels.length &&
           labels.every(label => evt.labels.includes(label))) ||
          ((!labels || labels.length === 0) && 
           (!evt.labels || evt.labels.length === 0));
        
        return hasMatchingAction && hasMatchingLabels;
      });
      
      if (recurringTodosToDelete.length === 0) {
        return 0;
      }
      
      // Delete each matching todo from Firebase
      const deletePromises = recurringTodosToDelete.map(async (todo) => {
        await deleteDoc(doc(db, "events", todo.id));
      });
      
      await Promise.all(deletePromises);
      
      return recurringTodosToDelete.length;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Nuclear option: Delete ALL recurring todos directly from Firebase by scanning all documents
   * Use this when local IDs don't match Firebase IDs
   */
  const nukeAllRecurringTodosFromFirebase = async () => {
    try {
      
      // Import Firebase functions
      const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      // Get documents from Firebase filtered by userId
      const eventsQuery = query(
        collection(db, "events"),
        where("userId", "==", currentUser.uid)
      );
      const snapshot = await getDocs(eventsQuery);
      const allFirebaseEvents = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Find recurring todos in Firebase
      const recurringTodosInFirebase = allFirebaseEvents.filter(evt => 
        evt.isRecurringTodo === true && evt.completed !== true
      );
      
      if (recurringTodosInFirebase.length === 0) {
        return 0;
      }
      
      // Delete each one from Firebase
      const deletePromises = recurringTodosInFirebase.map(async (todo) => {
        await deleteDoc(doc(db, "events", todo.id));
      });
      
      await Promise.all(deletePromises);
      
      // Also mark the original actions as having their recurring series cancelled
      // to prevent regeneration
      const actionsCancelled = new Set();
      
      for (const todo of recurringTodosInFirebase) {
        const actionToCancel = todo.actions && todo.actions.length > 0 
          ? todo.actions[0] 
          : (todo.toDo || todo.title.replace('TO DO: ', ''));
        
        if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
          actionsCancelled.add(actionToCancel);
          try {
            await cancelRecurringSeries(actionToCancel, todo.labels);
          } catch (cancelError) {
            // Failed to cancel series
          }
        }
      }
      
      return recurringTodosInFirebase.length;
    } catch (error) {
      throw error;
    }
  };

  return {
    createActionWithRecurringTodos,
    completeTodo,
    uncompleteTodo,
    markTodoCompleted,
    getPendingTodosForDay,
    getCompletedActionsForDay,
    isTodoEvent,
    isCompletedTodoAction,
    supportsDayViewCompleteToggle,
    getUpcomingTodos,
    getAllPendingTodos,
    deleteAllRecurringTodos,
    deleteRecurringTodosForEvent,
    updateEventWithRecurringRecalculation,
    deleteRecurringTodosByPatternFromFirebase,
    nukeAllRecurringTodosFromFirebase,
    cancelRecurringSeries
  };
};
