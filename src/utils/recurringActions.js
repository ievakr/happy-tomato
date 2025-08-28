import dayjs from 'dayjs';

/**
 * Parse dosage text to extract recurring interval information
 * @param {string} dosageText - Text like "Use every 7 days" or "Use every 14 days"
 * @returns {Object} - {interval: number, unit: string, maxOccurrences: number}
 */
export const parseRecurringInterval = (dosageText) => {
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
    return { interval: 0, unit: 'once', maxOccurrences: 1 };
  }
  
  // Handle max occurrences pattern
  const maxOccurrencesMatch = dosageText.match(/use every (\d+) days?, (\d+) times max/i);
  if (maxOccurrencesMatch) {
    return {
      interval: parseInt(maxOccurrencesMatch[1]),
      unit: 'days',
      maxOccurrences: parseInt(maxOccurrencesMatch[2])
    };
  }
  
  // Handle regular recurring pattern
  const intervalMatch = dosageText.match(/use every (\d+) days?/i);
  if (intervalMatch) {
    return {
      interval: parseInt(intervalMatch[1]),
      unit: 'days',
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
 * @returns {Array} - Array of TO DO events to be created
 */
export const generateRecurringToDos = (actionEvent, dosageText, futureMonths = 6, existingEvents = []) => {
  const recurringInfo = parseRecurringInterval(dosageText);
  
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
    console.log(`🚫 Recurring series appears to be cancelled by user for action: ${actionToMatch}`);
    return []; // Don't regenerate cancelled series
  }
  
  const todos = [];
  const startDate = dayjs(actionEvent.day);
  const endDate = startDate.add(futureMonths, 'months');
  
  let currentDate = startDate.add(recurringInfo.interval, recurringInfo.unit);
  let occurrenceCount = 0;
  
  // The original event counts as the first occurrence, so we generate (maxOccurrences - 1) additional todos
  const additionalOccurrences = recurringInfo.maxOccurrences - 1;
  
  while (currentDate.isBefore(endDate) && occurrenceCount < additionalOccurrences) {
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
      
      const todoEvent = {
        // Don't pre-assign ID - let Firebase generate it to avoid ID conflicts
        title: title,
        actions: actionEvent.actions || [],
        toDo: actionEvent.toDo || '',
        description: actionEvent.description || '',
        labels: actionEvent.labels || [],
        day: currentDate.valueOf(),
        isRecurringTodo: true,
        originalActionId: actionEvent.originalActionId || actionEvent.id, // Preserve original action reference
        recurringInterval: recurringInfo.interval,
        recurringUnit: recurringInfo.unit,
        completed: false,
        createdFromAction: true
      };
      
      todos.push(todoEvent);
    } else {
      console.log(`⏭️ Skipping TODO creation for ${currentDateStr} - TODO already exists:`, existingTodoForDate.title);
    }
    
    currentDate = currentDate.add(recurringInfo.interval, recurringInfo.unit);
    occurrenceCount++;
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
 * @returns {boolean}
 */
export const shouldGenerateRecurringTodos = (actionName, dosageText) => {
  if (!dosageText) return false;
  
  // Don't generate for one-time actions
  if (dosageText.toLowerCase().includes('use once')) return false;
  
  // Generate for actions with recurring patterns
  return /use every \d+ days?/i.test(dosageText);
};
