import dayjs from 'dayjs';

/** Match display after manual "Complete" — same as useRecurringActions.completeTodo */
function stripTodoPrefixForCompleted(title) {
  if (!title || typeof title !== 'string') return title;
  return title.replace(/^TO DO:\s*/i, '').trim() || title;
}

/**
 * Parse dosage text or user config to extract recurring interval information
 * @param {string} dosageText - Text like "Use every 7 days" or "Use every 14 days"
 * @param {Object} userRecurringConfig - User-defined recurring configuration
 * @returns {Object} - { interval, unit, endType?, maxOccurrences?, untilDate? }
 */
export const parseRecurringInterval = (dosageText, userRecurringConfig = null) => {
  // Priority 1: Use user-defined configuration if available
  if (userRecurringConfig && userRecurringConfig.enabled) {
    const interval = userRecurringConfig.interval || 7;
    const unit = userRecurringConfig.unit || 'days';
    if (userRecurringConfig.endType === 'count') {
      return {
        interval,
        unit,
        endType: 'count',
        maxOccurrences: userRecurringConfig.maxOccurrences || 12,
      };
    }
    if (
      userRecurringConfig.untilDate != null &&
      (userRecurringConfig.endType === 'until' || userRecurringConfig.endType == null)
    ) {
      return {
        interval,
        unit,
        endType: 'until',
        untilDate: userRecurringConfig.untilDate,
        maxOccurrences: 9999,
      };
    }
    return {
      interval,
      unit,
      endType: 'count',
      maxOccurrences: userRecurringConfig.maxOccurrences || 12,
    };
  }
  
  // Priority 2: Fall back to parsing dosage text for backward compatibility
  if (!dosageText) return null;
  
  const patterns = [
    // "Use every 7 days"
    /use every (\d+) days?/i,
    // "Use every 14 days"
    /use every (\d+) days?/i,
    // "Use every 7 days, 3 times max"
    /use every (\d+) days?, (\d+) times max/i,
    // "Use once"
    /use once/i
  ];
  
  // Handle "Use once" case
  if (patterns[3].test(dosageText)) {
    return { interval: 0, unit: 'once', endType: 'count', maxOccurrences: 1 };
  }
  
  // Handle max occurrences pattern
  const maxOccurrencesMatch = dosageText.match(/use every (\d+) days?, (\d+) times max/i);
  if (maxOccurrencesMatch) {
    return {
      interval: parseInt(maxOccurrencesMatch[1]),
      unit: 'days',
      endType: 'count',
      maxOccurrences: parseInt(maxOccurrencesMatch[2])
    };
  }
  
  // Handle regular recurring pattern
  const intervalMatch = dosageText.match(/use every (\d+) days?/i);
  if (intervalMatch) {
    return {
      interval: parseInt(intervalMatch[1]),
      unit: 'days',
      endType: 'count',
      maxOccurrences: 12 // Default max occurrences to prevent infinite events
    };
  }
  
  return null;
};

/**
 * Generate recurring TO DO events based on action and dosage
 * @param {Object} actionEvent - The original action event
 * @param {string} dosageText - The dosage/recurring instruction
 * @param {number} futureMonths - How many months ahead to generate events (default: 6)
 * @param {Array} existingEvents - Optional array of existing events to avoid duplicates
 * @param {boolean} generateAllOccurrences - If true, generate all occurrences including the first one (for user-created TODOs). If false, generate maxOccurrences-1 (for actions that spawn TODOs)
 * @returns {Array} - Array of TO DO events to be created
 */
export const generateRecurringToDos = (actionEvent, dosageText, futureMonths = 6, existingEvents = [], generateAllOccurrences = false) => {
  const recurringInfo = parseRecurringInterval(dosageText, actionEvent.userRecurringConfig);
  
  if (!recurringInfo || recurringInfo.interval === 0) {
    return []; // No recurring events for "use once" or invalid patterns
  }
  
  // Check if this recurring series has been cancelled by the user
  // If there are no future recurring TODOs for this action/label combination,
  // but there should be based on the date, it means the user cancelled the series
  const actionToMatch = actionEvent.actions && actionEvent.actions.length > 0 
    ? actionEvent.actions[0] 
    : (Array.isArray(actionEvent.toDo) ? actionEvent.toDo[0] : actionEvent.toDo);
    
  const today = dayjs();
  const futureRecurringTodos = existingEvents.filter(evt => {
    if (!evt.isRecurringTodo || evt.completed) return false;
    
    const eventDate = dayjs(evt.day);
    if (!eventDate.isAfter(today)) return false;
    
    // Check if this is the same action/todo
    const hasMatchingAction = actionToMatch && (
      (evt.actions && evt.actions.includes(actionToMatch)) ||
      (evt.toDo && evt.toDo.includes(actionToMatch)) ||
      evt.title.includes(actionToMatch)
    );
    
    // Check if labels match (flexible matching)
    const hasMatchingLabels = 
      (!actionEvent.labels || actionEvent.labels.length === 0) ||
      (!evt.labels || evt.labels.length === 0) ||
      (actionEvent.labels && evt.labels && actionEvent.labels.some(label => evt.labels.includes(label)));
    
    return hasMatchingAction && hasMatchingLabels;
  });
  
  // If this action is older than a recurring interval and has no future TODOs,
  // it means the user has cancelled this recurring series
  const actionDate = dayjs(actionEvent.day);
  const expectedNextDate = actionDate.add(recurringInfo.interval, recurringInfo.unit);
  if (expectedNextDate.isBefore(today) && futureRecurringTodos.length === 0) {
    return []; // Don't regenerate cancelled series
  }
  
  const todos = [];
  const startDate = dayjs(actionEvent.day);
  const isUserConfig = !!(actionEvent.userRecurringConfig && actionEvent.userRecurringConfig.enabled);
  const untilMode =
    recurringInfo.endType === 'until' &&
    recurringInfo.untilDate != null;

  if (untilMode) {
    const untilEnd = dayjs(recurringInfo.untilDate).endOf('day');
    if (untilEnd.isBefore(startDate, 'day')) {
      return [];
    }
  }

  let generationEnd;
  if (untilMode) {
    generationEnd = dayjs(recurringInfo.untilDate).endOf('day');
    const cap = startDate.add(10, 'year');
    if (generationEnd.isAfter(cap)) {
      generationEnd = cap;
    }
  } else if (isUserConfig) {
    generationEnd = startDate.add(10, 'year');
  } else {
    generationEnd = startDate.add(futureMonths, 'months');
  }

  // For user-created TODOs with recurring, generate ALL occurrences starting from the selected date
  // For actions that spawn TODOs, generate maxOccurrences-1 (the action itself is occurrence #1)
  let currentDate;
  let todosToGenerate;

  if (generateAllOccurrences) {
    currentDate = startDate;
    todosToGenerate = untilMode ? 5000 : recurringInfo.maxOccurrences;
  } else {
    currentDate = startDate.add(recurringInfo.interval, recurringInfo.unit);
    todosToGenerate = untilMode ? 5000 : recurringInfo.maxOccurrences - 1;
  }

  let todosCreated = 0;

  const isOnOrBeforeEnd = (d) => !d.isAfter(generationEnd, 'day');

  while (isOnOrBeforeEnd(currentDate) && todosCreated < todosToGenerate) {
    // Check if a TODO already exists for this date and action combination
    const currentDateStr = currentDate.format("DD-MM-YY");
    const actionToMatch = actionEvent.actions && actionEvent.actions.length > 0 
      ? actionEvent.actions[0] 
      : (Array.isArray(actionEvent.toDo) ? actionEvent.toDo[0] : actionEvent.toDo);
    
    const existingTodoForDate = existingEvents.find(evt => {
      if (!evt.isRecurringTodo || evt.completed) return false;
      
      const eventDateStr = dayjs(evt.day).format("DD-MM-YY");
      if (eventDateStr !== currentDateStr) return false;
      
      // Check if action/todo matches
      const hasMatchingAction = actionToMatch && (
        (evt.actions && evt.actions.includes(actionToMatch)) ||
        (evt.toDo && evt.toDo.includes(actionToMatch)) ||
        (evt.title && evt.title.includes(actionToMatch))
      );
      
      // Check if labels match (if both have labels)
      const hasMatchingLabels = 
        (!actionEvent.labels || actionEvent.labels.length === 0) ||
        (!evt.labels || evt.labels.length === 0) ||
        (actionEvent.labels && evt.labels && actionEvent.labels.some(label => evt.labels.includes(label)));
      
      return hasMatchingAction && hasMatchingLabels;
    });
    
    // Only create TODO if one doesn't already exist for this date
    if (!existingTodoForDate) {
      // Generate title based on what type of event this is
      let title;
      if (actionEvent.actions && actionEvent.actions.length > 0) {
        // For plant actions: "TO DO: Fertilized"
        title = `TO DO: ${actionEvent.actions.join(', ')}`;
      } else if (actionEvent.toDo) {
        // For todo items: already prefixed like "TO DO: Fertilize"
        const todoText = Array.isArray(actionEvent.toDo) ? actionEvent.toDo.join(', ') : actionEvent.toDo;
        title = todoText;
      } else {
        // Fallback for other event types
        title = `TO DO: ${actionEvent.title}`;
      }
      
      const isPastDate = currentDate.isBefore(dayjs().startOf("day"));
      const todoEvent = {
        // Don't pre-assign ID - let Firebase generate it to avoid ID conflicts
        title: isPastDate ? stripTodoPrefixForCompleted(title) : title,
        actions: actionEvent.actions || [],
        toDo: actionEvent.toDo || '',
        description: actionEvent.description || '',
        labels: actionEvent.labels || [],
        day: currentDate.valueOf(),
        isRecurringTodo: true,
        recurringInterval: recurringInfo.interval,
        recurringUnit: recurringInfo.unit,
        completed: isPastDate,
        createdFromAction: true,
        ...(isPastDate && { completedAt: Date.now() }),
        // Only include userRecurringConfig if it exists
        ...(actionEvent.userRecurringConfig && { userRecurringConfig: actionEvent.userRecurringConfig })
      };
      
      // Only add originalActionId if it exists (for legacy recurring TODOs generated from actions)
      // For user-created recurring TODOs, this field is not needed
      if (actionEvent.originalActionId || (actionEvent.id && !generateAllOccurrences)) {
        todoEvent.originalActionId = actionEvent.originalActionId || actionEvent.id;
      }
      
      todos.push(todoEvent);
      todosCreated++;
    }
    
    currentDate = currentDate.add(recurringInfo.interval, recurringInfo.unit);
  }
  return todos;
};

/**
 * Convert a TO DO event to a completed action event
 * @param {Object} todoEvent - The TO DO event to complete
 * @returns {Object} - The completed action event
 */
export const convertTodoToAction = (todoEvent) => {
  return {
    ...todoEvent,
    id: `action-${todoEvent.id}-completed`,
    title: todoEvent.actions ? todoEvent.actions.join(', ') : todoEvent.title.replace('TO DO: ', ''),
    completed: true,
    isRecurringTodo: false,
    completedAt: Date.now(),
    originalTodoId: todoEvent.id
  };
};

/**
 * Check if an action should generate recurring TO DOs
 * @param {string} actionName - Name of the action
 * @param {string} dosageText - The dosage text
 * @param {Object} userRecurringConfig - User-defined recurring configuration
 * @returns {boolean}
 */
export const shouldGenerateRecurringTodos = (actionName, dosageText, userRecurringConfig = null) => {
  // If user explicitly configured recurring settings, use that
  if (userRecurringConfig && userRecurringConfig.enabled) {
    return true;
  }
  
  // If user explicitly disabled recurring
  if (userRecurringConfig && !userRecurringConfig.enabled) {
    return false;
  }
  
  // Fall back to legacy dosage text parsing for backward compatibility
  if (!dosageText) return false;
  
  // Don't generate for one-time actions
  if (dosageText.toLowerCase().includes('use once')) return false;
  
  // Generate for actions with recurring patterns
  return /use every \d+ days?/i.test(dosageText);
};
