// Plant and garden labels
export const PLANT_LABELS = {
  "rose": "Roses",
  "tomato": "Tomatoes",
  "leafy-green": "Salad",
  "cucumber": "Cucumbers",
  "radish": "Radishes",
  "onion": "Onions",
  "garlic-alt": "Garlic",
  "pepper-alt": "Bell Peppers",
  "carrot": "Carrots",
  "broccoli": "Broccoli",
  "watermelon": "Watermelon",
  "strawberry": "Strawberries",
  "pumpkin": "Squash",
  "flower": "Flowers"
};

// Plant action configurations
export const PLANT_ACTIONS = {
  "Planted seeds": "",
  "Transplanted": "",
  "Watered": "",
  "Fertilized": "Use every 7 days",
  "NeemAzal": "Use every 7 days, 3 times max",
  "Kytos": "Use every 14 days",
  "Copfort": "Use every 14 days",
  "Altozan B/Zn": "Use every 7 days",
  "TerraSorb Foliar": "Use every 7 days",
  "Carial Star": "Use every 10 days, 3 times max",
};

// To-do list items - these are manual TO DOs that users can select
export const TODO_ITEMS = [
  "TO DO: Plant seeds", 
  "TO DO: Transplant",
  "TO DO: Water",
  "TO DO: Fertilize", 
  "TO DO: Kytos",
  "TO DO: Copfort",
  "TO DO: Altozan B/Zn",
  "TO DO: TerraSorb Foliar",
  "TO DO: NeemAzal",
  "TO DO: Carial Star"
];

// TO DO action configurations - recurring patterns for todo items
export const TODO_ACTIONS = {
  "TO DO: Plant seeds": "",
  "TO DO: Transplant": "",
  "TO DO: Water": "Use every 2 days",
  "TO DO: Fertilize": "Use every 7 days", 
  "TO DO: Kytos": "Use every 14 days",
  "TO DO: Copfort": "Use every 14 days",
  "TO DO: Altozan B/Zn": "Use every 7 days",
  "TO DO: TerraSorb Foliar": "Use every 7 days",
  "TO DO: NeemAzal": "Use every 7 days, 3 times max",
  "TO DO: Carial Star": "Use every 10 days, 3 times max"
};

// TO DO event statuses
export const TODO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue'
};

// Event types
export const EVENT_TYPES = {
  ACTION: 'action',
  TODO: 'todo',
  RECURRING_TODO: 'recurring_todo',
  COMPLETED_ACTION: 'completed_action'
};

// UI Constants
export const UI_CONSTANTS = {
  EVENTS_PER_DAY_MOBILE: 3,
  MAX_ICONS_PER_EVENT: 3,
  DROPDOWN_MAX_HEIGHT: 200,
  MODAL_Z_INDEX: 1055,
  DROPDOWN_Z_INDEX: 9999,
  SIDEBAR_WIDTH: {
    MOBILE: 300,
    TABLET: 250,
    DESKTOP: 300
  }
};

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1025
};

// Date formats
export const DATE_FORMATS = {
  DAY_MONTH_YEAR: "DD-MM-YY",
  FULL_MONTH_YEAR: "MMMM YYYY",
  SHORT_MONTH_YEAR: "MMM YYYY",
  DAY_ABBR: "ddd"
};

// Event action types
export const EVENT_ACTIONS = {
  PUSH: 'push',
  UPDATE: 'update',
  DELETE: 'delete',
  LOAD: 'load'
};

// Colors
export const COLORS = {
  PRIMARY: '#dc3545',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#e91e63',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  
  // Custom app colors
  TITLE_DARK: '#2c3e50',
  TITLE_LIGHT: '#6c757d',
  GRADIENT_START: '#ff6b6b',
  GRADIENT_END: '#4ecdc4'
};

// Animation durations
export const ANIMATIONS = {
  FAST: '0.2s',
  NORMAL: '0.3s',
  SLOW: '0.6s'
}; 