import { useContext } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { EVENT_ACTIONS, PLANT_ACTIONS, TODO_ACTIONS } from '../constants';
import { 
  generateRecurringToDos, 
  shouldGenerateRecurringTodos,
  parseRecurringInterval
} from '../utils/recurringActions';

/**
 * Custom hook for managing recurring actions and TO DO completion
 */
export const useRecurringActions = () => {
  const { dispatchCallEvent, filteredEvents } = useContext(GlobalContext);
  const { currentUser } = useAuth();

  /**
   * Create an action and generate recurring TO DOs if applicable
   * @param {Object} actionEvent - The action event to create
   */
  const createActionWithRecurringTodos = async (actionEvent) => {
    try {
      // First create the main action event
      await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: actionEvent });
      
      // Check if we should generate recurring TO DOs for both actions and todos
      const firstAction = actionEvent.actions && actionEvent.actions.length > 0 
        ? actionEvent.actions[0] 
        : actionEvent.title;
      
      const firstTodo = actionEvent.toDo && Array.isArray(actionEvent.toDo) 
        ? actionEvent.toDo[0] 
        : actionEvent.toDo;
      
      // Check PLANT_ACTIONS first
      let dosageText = PLANT_ACTIONS[firstAction];
      let sourceItem = firstAction;
      
      // If no plant action dosage found, check TODO_ACTIONS
      if (!dosageText && firstTodo) {
        dosageText = TODO_ACTIONS[firstTodo];
        sourceItem = firstTodo;
      }
      
      if (shouldGenerateRecurringTodos(sourceItem, dosageText)) {
        // Check if this action has been marked as having its recurring series cancelled
        if (actionEvent.recurringCancelled) {
          console.log(`🚫 Skipping recurring TODO generation - series was cancelled for: ${sourceItem}`);
          return;
        }
        
        // Generate recurring TO DO events, passing existing events to avoid duplicates
        const recurringTodos = generateRecurringToDos(actionEvent, dosageText, 6, filteredEvents);
        
        // Create each TO DO event (Firebase will assign IDs)
        for (const todo of recurringTodos) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
        }
        
        console.log(`Created "${sourceItem}" with ${recurringTodos.length} recurring TO DOs`);
      }
    } catch (error) {
      console.error('Failed to create action with recurring TOs DOs:', error);
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
      
      console.log(`Completed TO DO: ${todoEvent.title}`);
    } catch (error) {
      console.error('Failed to complete TO DO:', error);
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
      console.log(`Marked TO DO as completed: ${todoEvent.title}`);
    } catch (error) {
      console.error('Failed to mark TO DO as completed:', error);
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
    // Enhanced detection: check for both createdFromAction and toDo property
    return (event.createdFromAction && event.completed) || (event.toDo && event.completed);
  };

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
    console.log(`📊 getAllPendingTodos: Found ${pendingTodos.length} pending todos out of ${filteredEvents.length} total events`);
    console.log(`📝 Pending todos:`, pendingTodos.map(t => `${t.title} (ID: ${t.id}, isRecurringTodo: ${t.isRecurringTodo || 'manual'}, completed: ${t.completed})`));
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
      
      console.log(`🔍 BULK DELETE DEBUG: Found ${todosToDelete.length} pending todos to potentially delete`);
      console.log(`📋 All pending todos:`, todosToDelete.map(t => `${t.title} on ${dayjs(t.day).format('YYYY-MM-DD')} (ID: ${t.id})`));
      
      // Apply filters if provided
      if (filterAction) {
        todosToDelete = todosToDelete.filter(evt => 
          evt.actions && evt.actions.includes(filterAction)
        );
        console.log(`🔍 After action filter: ${todosToDelete.length} todos remaining`);
      }
      
      if (filterLabels && filterLabels.length > 0) {
        todosToDelete = todosToDelete.filter(evt =>
          evt.labels && filterLabels.some(label => evt.labels.includes(label))
        );
        console.log(`🔍 After label filter: ${todosToDelete.length} todos remaining`);
      }
      
      console.log(`🗑️ BULK DELETE: Deleting ${todosToDelete.length} recurring TO DO events...`);
      console.log(`🗑️ Todos to delete:`, todosToDelete.map(t => `${t.title} on ${dayjs(t.day).format('YYYY-MM-DD')} (ID: ${t.id})`));
      
      // Delete all todos in parallel for better performance
      const deletePromises = todosToDelete.map((todo, index) => {
        console.log(`🗑️ [${index + 1}/${todosToDelete.length}] Deleting: ${todo.title} (ID: ${todo.id})`);
        return dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo });
      });
      
      await Promise.all(deletePromises);
      
      console.log(`✅ BULK DELETE COMPLETED: Successfully deleted ${todosToDelete.length} recurring TO DO events`);
      
      // Cancel the recurring series to prevent regeneration
      console.log('🚫 Cancelling recurring series to prevent regeneration...');
      const actionsCancelled = new Set();
      
      for (const todo of todosToDelete) {
        const actionToCancel = todo.actions && todo.actions.length > 0 
          ? todo.actions[0] 
          : (todo.toDo || todo.title.replace('TO DO: ', ''));
        
        if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
          actionsCancelled.add(actionToCancel);
          try {
            await cancelRecurringSeries(actionToCancel, todo.labels);
            console.log(`✅ Cancelled recurring series for: ${actionToCancel}`);
          } catch (cancelError) {
            console.warn(`⚠️ Failed to cancel series for ${actionToCancel}:`, cancelError);
          }
        }
      }
      
      console.log(`🚫 Cancelled ${actionsCancelled.size} recurring series`);
      return todosToDelete.length;
    } catch (error) {
      console.error('❌ BULK DELETE FAILED:', error);
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
        console.log(`Deleting ${todosToDelete.length} recurring todos for updated event...`);
        
        const deletePromises = todosToDelete.map(todo => 
          dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: todo })
        );
        
        await Promise.all(deletePromises);
        console.log(`✅ Deleted ${todosToDelete.length} old recurring todos`);
      }
      
      return todosToDelete.length;
    } catch (error) {
      console.error('Failed to delete recurring todos for event:', error);
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
      // Safety check: ensure we have the original event
      if (!originalEvent || !originalEvent.id) {
        console.warn('⚠️ No original event provided, falling back to normal update');
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
        return;
      }

      console.log(`🔄 Updating event: ${originalEvent.id}`);
      
      // Check if this event has recurring potential
      const hasActions = updatedEvent.actions && updatedEvent.actions.length > 0;
      const hasTodos = updatedEvent.toDo && (Array.isArray(updatedEvent.toDo) ? updatedEvent.toDo.length > 0 : updatedEvent.toDo);
      
      // Handle recurring todo events differently - they can still trigger recalculation
      const isRecurringTodo = originalEvent.isRecurringTodo === true;
      
      if (!hasActions && !hasTodos) {
        // No recurring potential, just update normally
        console.log('📝 Regular event update (no recurring patterns)');
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
        return;
      }
      
      // Check if the date changed
      const originalDate = dayjs(originalEvent.day);
      const newDate = dayjs(updatedEvent.day);
      const dateChanged = !originalDate.isSame(newDate, 'day');
      
      if (dateChanged) {
        console.log(`📅 Date changed from ${originalDate.format('YYYY-MM-DD')} to ${newDate.format('YYYY-MM-DD')} - recalculating recurring events...`);
        
        try {
          const firstAction = updatedEvent.actions && updatedEvent.actions.length > 0 ? updatedEvent.actions[0] : null;
          const firstTodo = Array.isArray(updatedEvent.toDo) ? updatedEvent.toDo[0] : updatedEvent.toDo;
          const sourceItem = firstAction || firstTodo;
          
          if (isRecurringTodo) {
            
            // For recurring TODOs: Delete OTHER recurring todos in the same series (but not this one)
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
            
            if (shouldGenerateRecurringTodos(sourceItem, dosageText)) {
              
              // This updated TODO becomes the new "base" for the remaining sequence
              // Exclude the current updated event from existing events to avoid confusion
              const existingEventsExcludingCurrent = filteredEvents.filter(evt => evt.id !== updatedEvent.id);
              
              // For recurring TODOs, we need to account for the original action event
              // So we should generate fewer TODOs than for a fresh action
              const recurringTodos = generateRecurringToDos(updatedEvent, dosageText, 6, existingEventsExcludingCurrent);
              
              // Filter out TODOs that would exceed the max count when including existing events
              const recurringInfo = parseRecurringInterval(dosageText);
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
              
              console.log(`📊 Counting for recurring series: ${existingEventCount} existing events (max: ${maxTotalEvents}), will create ${maxAdditionalTodos} more`);
              
              const recurringTodosToCreate = recurringTodos.slice(0, maxAdditionalTodos);
              
              for (const todo of recurringTodosToCreate) {
                await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
              }
              
            }
            
          } else {
            console.log('🔄 Updating original action event - will recalculate all recurring todos');
            
            // For original action events: Delete ALL recurring todos that match this event
            if (firstAction || firstTodo) {
              const actionToMatch = firstAction || firstTodo;
              console.log(`🗑️ Cleaning up ALL recurring todos for action: ${actionToMatch}`);
              await deleteRecurringTodosForEvent(originalEvent.id, actionToMatch, updatedEvent.labels);
            }
            
            // Update the main event
            console.log('💾 Updating main action event...');
            await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
            
            // Generate new recurring todos if applicable
            let dosageText = PLANT_ACTIONS[firstAction];
            if (!dosageText && firstTodo) {
              dosageText = TODO_ACTIONS[firstTodo];
            }
            
            if (shouldGenerateRecurringTodos(sourceItem, dosageText)) {
              console.log(`🔄 Generating new recurring todos with pattern: ${dosageText}`);
              const recurringTodos = generateRecurringToDos(updatedEvent, dosageText, 6, filteredEvents);
              
              for (const todo of recurringTodos) {
                console.log(`➕ Creating new recurring todo: ${todo.title} on ${dayjs(todo.day).format('YYYY-MM-DD')} (Firebase will assign ID)`);
                await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: todo });
              }
              
              console.log(`✅ Generated ${recurringTodos.length} new recurring todos based on updated date`);
            }
          }
          
        } catch (recalcError) {
          console.error('❌ Error during recurring event recalculation:', recalcError);
          // If recalculation fails, at least try to save the main event
          console.log('🛡️ Fallback: attempting to save main event only');
          await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
          throw recalcError;
        }
      } else {
        // Date didn't change, just update normally
        console.log('📝 Date unchanged - performing normal update');
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedEvent });
      }
    } catch (error) {
      console.error('❌ Failed to update event with recurring recalculation:', error);
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
      console.log(`🚫 Cancelling recurring series for action: ${actionName}`);
      
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
      
      console.log(`📝 Found ${originalActions.length} original actions to mark as cancelled`);
      
      // Mark each original action as having its recurring series cancelled
      for (const action of originalActions) {
        const updatedAction = {
          ...action,
          recurringCancelled: true,
          recurringCancelledAt: Date.now()
        };
        
        await dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: updatedAction });
        console.log(`✅ Marked action as cancelled: ${action.title || action.actions?.join(', ')}`);
      }
      
      return originalActions.length;
    } catch (error) {
      console.error('Failed to cancel recurring series:', error);
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
      console.log(`🎯 TARGETED DELETE: Looking for recurring todos with action "${actionName}" and labels:`, labels);
      
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
      
      console.log(`📊 Scanning ${allFirebaseEvents.length} total events in Firebase`);
      
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
      
      console.log(`🎯 Found ${recurringTodosToDelete.length} matching recurring todos in Firebase to delete:`);
      console.log(recurringTodosToDelete.map(t => `${t.title} (Firebase ID: ${t.id})`));
      
      if (recurringTodosToDelete.length === 0) {
        console.log('✅ No matching recurring todos found in Firebase');
        return 0;
      }
      
      // Delete each matching todo from Firebase
      const deletePromises = recurringTodosToDelete.map(async (todo) => {
        console.log(`🗑️ Deleting from Firebase: ${todo.title} (ID: ${todo.id})`);
        await deleteDoc(doc(db, "events", todo.id));
      });
      
      await Promise.all(deletePromises);
      
      console.log(`🎯 TARGETED DELETE COMPLETED: Deleted ${recurringTodosToDelete.length} matching recurring todos from Firebase`);
      
      return recurringTodosToDelete.length;
    } catch (error) {
      console.error('❌ TARGETED DELETE FAILED:', error);
      throw error;
    }
  };

  /**
   * Nuclear option: Delete ALL recurring todos directly from Firebase by scanning all documents
   * Use this when local IDs don't match Firebase IDs
   */
  const nukeAllRecurringTodosFromFirebase = async () => {
    try {
      console.log('🧨 NUCLEAR DELETE: Scanning Firebase for all recurring todos...');
      
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
      
      console.log(`📊 Found ${allFirebaseEvents.length} total events in Firebase`);
      
      // Find recurring todos in Firebase
      const recurringTodosInFirebase = allFirebaseEvents.filter(evt => 
        evt.isRecurringTodo === true && evt.completed !== true
      );
      
      console.log(`🎯 Found ${recurringTodosInFirebase.length} recurring todos in Firebase to delete:`);
      console.log(recurringTodosInFirebase.map(t => `${t.title} (Firebase ID: ${t.id})`));
      
      if (recurringTodosInFirebase.length === 0) {
        console.log('✅ No recurring todos found in Firebase');
        return 0;
      }
      
      // Delete each one from Firebase
      const deletePromises = recurringTodosInFirebase.map(async (todo) => {
        console.log(`🗑️ Deleting from Firebase: ${todo.title} (ID: ${todo.id})`);
        await deleteDoc(doc(db, "events", todo.id));
      });
      
      await Promise.all(deletePromises);
      
      console.log(`🧨 NUCLEAR DELETE COMPLETED: Deleted ${recurringTodosInFirebase.length} recurring todos from Firebase`);
      
      // Also mark the original actions as having their recurring series cancelled
      // to prevent regeneration
      console.log('🚫 Marking original actions as cancelled to prevent regeneration...');
      const actionsCancelled = new Set();
      
      for (const todo of recurringTodosInFirebase) {
        const actionToCancel = todo.actions && todo.actions.length > 0 
          ? todo.actions[0] 
          : (todo.toDo || todo.title.replace('TO DO: ', ''));
        
        if (actionToCancel && !actionsCancelled.has(actionToCancel)) {
          actionsCancelled.add(actionToCancel);
          try {
            await cancelRecurringSeries(actionToCancel, todo.labels);
            console.log(`✅ Cancelled recurring series for: ${actionToCancel}`);
          } catch (cancelError) {
            console.warn(`⚠️ Failed to cancel series for ${actionToCancel}:`, cancelError);
          }
        }
      }
      
      console.log(`🚫 Cancelled ${actionsCancelled.size} recurring series to prevent regeneration`);
      
      return recurringTodosInFirebase.length;
    } catch (error) {
      console.error('❌ NUCLEAR DELETE FAILED:', error);
      throw error;
    }
  };

  return {
    createActionWithRecurringTodos,
    completeTodo,
    markTodoCompleted,
    getPendingTodosForDay,
    getCompletedActionsForDay,
    isTodoEvent,
    isCompletedTodoAction,
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
