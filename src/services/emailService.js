/**
 * Email Service for TODO Reminders
 * Uses Firebase Cloud Functions with SendGrid for server-side email sending
 */

import { functions, httpsCallable } from '../firebase';

class EmailService {
  constructor() {
    this.sendTodoReminderEmail = httpsCallable(functions, 'sendTodoReminderEmail');
  }

  isValidEmail(email) {
    if (typeof email !== 'string') {
      return false;
    }
    const trimmed = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  normalizeReminderType(reminderType) {
    if (typeof reminderType !== 'string') {
      return 'TODO Reminder';
    }
    const trimmed = reminderType.trim();
    return trimmed.length > 0 ? trimmed : 'TODO Reminder';
  }

  sanitizeTodos(todos) {
    if (!Array.isArray(todos)) {
      return [];
    }

    return todos.filter(todo => {
      if (!todo || typeof todo !== 'object') {
        return false;
      }
      const date = new Date(todo.day);
      return !Number.isNaN(date.getTime());
    });
  }

  /**
   * Send TODO reminder email via Firebase Cloud Function
   * @param {Object} params - Email parameters
   * @param {string} params.userEmail - Recipient email address
   * @param {string} params.userName - Recipient name (optional)
   * @param {Array} params.todos - Array of due TODOs
   * @param {string} params.reminderType - Type of reminder (daily, due_today, overdue)
   * @returns {Promise<boolean>} Success status
   */
  async sendTodoReminder(params) {
    try {
      if (!params || typeof params !== 'object') {
        console.error('❌ Invalid email parameters - expected an object');
        return false;
      }

      if (!this.isValidEmail(params.userEmail)) {
        console.error('❌ Invalid user email address for reminder');
        return false;
      }

      const sanitizedTodos = this.sanitizeTodos(params.todos);
      if (sanitizedTodos.length === 0) {
        console.error('❌ No valid TODOs provided for reminder');
        return false;
      }

      const reminderType = this.normalizeReminderType(params.reminderType);
      const userName = typeof params.userName === 'string' && params.userName.trim().length > 0
        ? params.userName.trim()
        : 'Garden Friend';

      const { data } = await this.sendTodoReminderEmail({
        userEmail: params.userEmail.trim(),
        userName,
        todos: sanitizedTodos,
        reminderType
      });

      return data?.success === true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Format TODO list for email template
   * @param {Array} todos - Array of TODO objects
   * @param {string} reminderType - Type of reminder for context
   * @returns {string} Formatted HTML string
   */
  formatTodoList(todos, reminderType = '') {
    if (!todos || todos.length === 0) {
      return 'No TODOs found.';
    }

    return todos.map(todo => {
      const dueDateValue = new Date(todo.day);
      const dueDate = Number.isNaN(dueDateValue.getTime())
        ? 'Unknown date'
        : dueDateValue.toLocaleDateString();
      
      // Get action name from various possible sources
      let actionName = '';
      
      // First, try the actions array
      if (todo.actions && todo.actions.length > 0) {
        actionName = todo.actions.join(', ');
      }
      // Then, try the toDo field (strip "TO DO: " prefix if present)
      else if (todo.toDo) {
        const todoText = Array.isArray(todo.toDo) ? todo.toDo.join(', ') : todo.toDo;
        actionName = todoText.replace(/^TO DO:\s*/i, '');
      }
      // Finally, try the title (strip "TO DO: " prefix if present)
      else if (todo.title) {
        actionName = todo.title.replace(/^TO DO:\s*/i, '');
      }
      
      // Get plant labels
      const plantLabels = todo.labels && todo.labels.length > 0 
        ? todo.labels.join(', ')
        : '';
      
      const status = this.getTodoStatus(todo);
      let statusEmoji = '📝';
      let statusText = '';
      
      // Determine emoji and status text based on todo status and reminder type
      if (status === 'overdue') {
        statusEmoji = '⚠️';
        statusText = ' - OVERDUE';
      } else if (status === 'due_today') {
        statusEmoji = '📅';
        statusText = ' - Due Today';
      } else if (reminderType.includes('Advance')) {
        statusEmoji = '🔔';
        statusText = ' - Coming Up';
      }
      
      // Build the todo line with action and plant info
      let todoLine = `${statusEmoji} `;
      
      if (actionName) {
        todoLine += actionName;
        if (plantLabels) {
          todoLine += ` (${plantLabels})`;
        }
      } else {
        // Fallback if we couldn't extract action name
        todoLine += 'Unnamed TODO';
        if (plantLabels) {
          todoLine += ` (${plantLabels})`;
        }
      }
      
      todoLine += ` - Due: ${dueDate}${statusText}`;
      
      return todoLine;
    }).join('\n');
  }

  /**
   * Get TODO status based on due date
   * @param {Object} todo - TODO object
   * @returns {string} Status (due_today, overdue, upcoming)
   */
  getTodoStatus(todo) {
    const today = new Date();
    const dueDate = new Date(todo.day);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'due_today';
    } else {
      return 'upcoming';
    }
  }

  /**
   * Test email configuration
   * @param {string} testEmail - Test email address
   * @returns {Promise<boolean>} Success status
   */
  async testEmailConfiguration(testEmail) {
    if (!this.isValidEmail(testEmail)) {
      console.error('❌ Invalid test email address');
      return false;
    }

    const testTodos = [{
      id: 'test',
      title: 'Test TODO: Water plants',
      day: new Date().toISOString(),
      labels: ['Tomatoes'],
      isRecurringTodo: true
    }];

    return await this.sendTodoReminder({
      userEmail: testEmail,
      userName: 'Test User',
      todos: testTodos,
      reminderType: 'Configuration Test'
    });
  }

  /**
   * Check if email service is configured and ready
   * Uses Firebase Cloud Functions with SendGrid - no client-side config needed
   * @returns {boolean} Configuration status
   */
  isReady() {
    return true;
  }

  /**
   * Get configuration status with details
   * @returns {Object} Configuration details
   */
  getConfigurationStatus() {
    return {
      isConfigured: true,
      provider: 'SendGrid via Firebase Cloud Functions',
      missingVars: []
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
