# Toast Notification System

This application now uses Material-UI's Snackbar component for elegant, non-blocking toast notifications instead of browser `alert()` dialogs.

## Features

- **Non-blocking**: Users can continue interacting with the app while notifications are visible
- **Auto-dismiss**: Notifications automatically disappear after a set duration
- **Color-coded severity levels**: Success (green), Error (red), Warning (orange), Info (blue)
- **User dismissible**: Users can manually close notifications with the close button
- **Accessible**: Built-in ARIA support from Material-UI

## Usage

### Import the hook

```javascript
import { useToast } from '../context/ToastContext';
```

### In your component

```javascript
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  // Show success message
  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };
  
  // Show error message with custom duration (8 seconds)
  const handleError = () => {
    showError('Something went wrong. Please try again.', 8000);
  };
  
  // Show warning message
  const handleWarning = () => {
    showWarning('Please be careful with this action.');
  };
  
  // Show info message
  const handleInfo = () => {
    showInfo('Here is some useful information.');
  };
  
  return (
    // Your component JSX
  );
}
```

## API Reference

### Methods

- `showSuccess(message, duration?)` - Display a success notification (green)
- `showError(message, duration?)` - Display an error notification (red)
- `showWarning(message, duration?)` - Display a warning notification (orange)
- `showInfo(message, duration?)` - Display an info notification (blue)
- `showToast(message, severity, duration?)` - Generic method with custom severity

### Parameters

- `message` (string, required): The text to display in the notification
- `severity` (string): 'success' | 'error' | 'warning' | 'info'
- `duration` (number, optional): How long to show the notification in milliseconds (default: 6000ms / 6 seconds)

## Migration from alert()

All `alert()` calls have been replaced with appropriate toast notifications:

### Before
```javascript
alert('Failed to delete event. Please try again.');
```

### After
```javascript
showError('Failed to delete event. Please try again.');
```

## Files Modified

1. **Created**: `src/context/ToastContext.js` - Toast context provider and hook
2. **Modified**: `src/index.js` - Added ToastProvider wrapper
3. **Modified**: `src/context/ContextWrapper.js` - Replaced 2 alert() calls
4. **Modified**: `src/components/forms/EventModal.js` - Replaced 1 alert() call
5. **Modified**: `src/components/settings/EmailNotificationSettings.js` - Replaced 5 alert() calls

## Positioning

Toast notifications appear at the bottom center of the screen by default. This can be adjusted in the `ToastContext.js` file by modifying the `anchorOrigin` prop:

```javascript
anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
```

Available positions:
- vertical: 'top' | 'bottom'
- horizontal: 'left' | 'center' | 'right'

## Customization

The toast appearance can be customized by modifying the Material-UI Alert component's `sx` prop in `ToastContext.js`.

