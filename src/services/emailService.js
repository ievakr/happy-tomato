/**
 * Email Service for TODO Reminders
 * Using EmailJS for client-side email sending
 */

import emailjs from '@emailjs/browser';

class EmailService {
  constructor() {
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    this.templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    this.isConfigured = false;
    
    this.checkConfiguration();
  }

  checkConfiguration() {
    this.isConfigured = !!(this.serviceId && this.templateId && this.publicKey);
    
    if (!this.isConfigured) {
      console.warn('EmailJS not configured. Please set environment variables:');
      console.warn('- REACT_APP_EMAILJS_SERVICE_ID');
      console.warn('- REACT_APP_EMAILJS_TEMPLATE_ID');
      console.warn('- REACT_APP_EMAILJS_PUBLIC_KEY');
    } else {
      // Initialize EmailJS
      emailjs.init(this.publicKey);
    }
  }

  /**
   * Send TODO reminder email
   * @param {Object} params - Email parameters
   * @param {string} params.userEmail - Recipient email address
   * @param {string} params.userName - Recipient name (optional)
   * @param {Array} params.todos - Array of due TODOs
   * @param {string} params.reminderType - Type of reminder (daily, due_today, overdue)
   * @returns {Promise<boolean>} Success status
   */
  async sendTodoReminder(params) {
    if (!this.isConfigured) {
      console.error('EmailJS not configured - cannot send email');
      return false;
    }

    try {
      const templateParams = {
        to_email: params.userEmail,
        to_name: params.userName || 'Garden Friend',
        reminder_type: params.reminderType || 'TODO Reminder',
        todo_count: params.todos.length,
        todo_list: this.formatTodoList(params.todos, params.reminderType),
        today_date: new Date().toLocaleDateString(),
        app_name: 'Happy Tomato Garden Planner'
      };

      console.log('Sending email with params:', templateParams);

      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
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
      const dueDate = new Date(todo.day).toLocaleDateString();
      const plantLabels = todo.labels && todo.labels.length > 0 
        ? ` (${todo.labels.join(', ')})` 
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
      
      return `${statusEmoji} ${todo.title}${plantLabels} - Due: ${dueDate}${statusText}`;
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
   * @returns {boolean} Configuration status
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Get configuration status with details
   * @returns {Object} Configuration details
   */
  getConfigurationStatus() {
    return {
      isConfigured: this.isConfigured,
      serviceId: !!this.serviceId,
      templateId: !!this.templateId,
      publicKey: !!this.publicKey,
      missingVars: [
        !this.serviceId && 'REACT_APP_EMAILJS_SERVICE_ID',
        !this.templateId && 'REACT_APP_EMAILJS_TEMPLATE_ID',
        !this.publicKey && 'REACT_APP_EMAILJS_PUBLIC_KEY'
      ].filter(Boolean)
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
