import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Badge, Spinner, Accordion, Table } from 'react-bootstrap';
import notificationService from '../../services/notificationService';

/**
 * Email Notification Settings Component
 * Allows users to configure email reminders for TODOs
 */
export default function EmailNotificationSettings({ show, onHide, emailNotifications }) {
  const {
    emailPreferences,
    updateEmailPreferences,
    resetEmailPreferences,
    forceUpdateReminderTime,
    testEmailConfiguration,
    isEmailServiceReady,
    getEmailServiceStatus,
    getTodoSummary
  } = emailNotifications;

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const emailServiceStatus = getEmailServiceStatus();
  const todoSummary = getTodoSummary();

  const handleInputChange = (field, value) => {
    updateEmailPreferences({ [field]: value });
    setTestResult(null); // Clear test result when settings change
  };

  const handleTestEmail = async () => {
    if (!emailPreferences.userEmail) {
      setTestResult({ success: false, message: 'Please enter your email address first' });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const success = await testEmailConfiguration();
      setTestResult({
        success,
        message: success 
          ? 'Test email sent successfully! Check your inbox.' 
          : 'Failed to send test email. Please check your configuration.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSaveAndClose = () => {
    if (emailPreferences.enabled && !emailPreferences.userEmail) {
      setTestResult({
        success: false,
        message: 'Please enter your email address before enabling notifications'
      });
      return;
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Email Notification Settings</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Service Configuration Status */}
        <Card className="mb-4">
          <Card.Header>
            <Row className="align-items-center">
              <Col>
                <h6 className="mb-0">Email Service Status</h6>
              </Col>
              <Col xs="auto">
                {isEmailServiceReady() ? (
                  <Badge bg="success">Ready</Badge>
                ) : (
                  <Badge bg="warning">Configuration Required</Badge>
                )}
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            {!isEmailServiceReady() && (
              <Alert variant="warning">
                <h6>Email service not configured</h6>
                <p className="mb-2">To enable email notifications, you need to set up EmailJS. Missing:</p>
                <ul className="mb-0">
                  {emailServiceStatus.missingVars.map(varName => (
                    <li key={varName}><code>{varName}</code></li>
                  ))}
                </ul>
                <small className="text-muted">
                  Please check the setup instructions in your project documentation.
                </small>
              </Alert>
            )}
            
            {isEmailServiceReady() && (
              <div className="text-success">
                ✅ Email service is properly configured and ready to send reminders.
              </div>
            )}
          </Card.Body>
        </Card>

        {/* TODO Summary */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Current TODOs</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-danger">{todoSummary.overdue}</div>
                  <small className="text-muted">Overdue</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-warning">{todoSummary.dueToday}</div>
                  <small className="text-muted">Due Today</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-primary">{todoSummary.advance}</div>
                  <small className="text-muted">In {emailPreferences.advanceDays} Days</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-info">{todoSummary.upcoming}</div>
                  <small className="text-muted">Upcoming</small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Email Settings Form */}
        <Form>
          {/* Enable/Disable Notifications */}
          <Form.Group className="mb-4">
            <Form.Check
              type="switch"
              id="enable-notifications"
              label="Enable email notifications"
              checked={emailPreferences.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              disabled={!isEmailServiceReady()}
            />
            <Form.Text className="text-muted">
              Receive email reminders for your garden TODOs
            </Form.Text>
          </Form.Group>

          {/* User Email */}
          <Form.Group className="mb-3">
            <Form.Label>Your Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email address"
              value={emailPreferences.userEmail}
              onChange={(e) => handleInputChange('userEmail', e.target.value)}
              disabled={!isEmailServiceReady()}
              required={emailPreferences.enabled}
            />
            <Form.Text className="text-muted">
              Where to send your TODO reminders
            </Form.Text>
          </Form.Group>

          {/* User Name (Optional) */}
          <Form.Group className="mb-3">
            <Form.Label>Your Name (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              value={emailPreferences.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              disabled={!isEmailServiceReady()}
            />
            <Form.Text className="text-muted">
              Used to personalize your emails
            </Form.Text>
          </Form.Group>

          {/* Daily Reminder */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="daily-reminder"
              label="Daily reminder email"
              checked={emailPreferences.dailyReminder}
              onChange={(e) => handleInputChange('dailyReminder', e.target.checked)}
              disabled={!emailPreferences.enabled}
            />
            <Form.Text className="text-muted">
              Get a daily email with your pending TODOs
            </Form.Text>
          </Form.Group>

          {/* Reminder Time */}
          {emailPreferences.dailyReminder && (
            <Form.Group className="mb-3">
              <Form.Label>Daily reminder time</Form.Label>
              <Form.Control
                type="time"
                value={emailPreferences.reminderTime}
                onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                disabled={!emailPreferences.enabled}
              />
              <Form.Text className="text-muted">
                What time to send your daily reminder
              </Form.Text>
            </Form.Group>
          )}

          {/* Advanced Settings Toggle */}
          <Button
            variant="link"
            className="p-0 mb-3"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Settings
          </Button>

          {/* Advance Reminders */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="advance-reminders"
              label="Advance reminder emails"
              checked={emailPreferences.advanceReminders}
              onChange={(e) => handleInputChange('advanceReminders', e.target.checked)}
              disabled={!emailPreferences.enabled}
            />
            <Form.Text className="text-muted">
              Get notified a few days before TODOs are due
            </Form.Text>
          </Form.Group>

          {/* Advance Days Setting */}
          {emailPreferences.advanceReminders && (
            <Form.Group className="mb-3">
              <Form.Label>How many days in advance?</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="14"
                value={emailPreferences.advanceDays}
                onChange={(e) => handleInputChange('advanceDays', parseInt(e.target.value) || 3)}
                disabled={!emailPreferences.enabled}
                style={{ width: '120px' }}
              />
              <Form.Text className="text-muted">
                Send reminders {emailPreferences.advanceDays} day(s) before TODOs are due
              </Form.Text>
            </Form.Group>
          )}

          {/* Advanced Settings */}
          {showAdvanced && (
            <Card className="mb-3">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="due-today-reminders"
                    label="Remind me of TODOs due today"
                    checked={emailPreferences.dueTodayReminders}
                    onChange={(e) => handleInputChange('dueTodayReminders', e.target.checked)}
                    disabled={!emailPreferences.enabled}
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Check
                    type="checkbox"
                    id="overdue-reminders"
                    label="Remind me of overdue TODOs"
                    checked={emailPreferences.overdueReminders}
                    onChange={(e) => handleInputChange('overdueReminders', e.target.checked)}
                    disabled={!emailPreferences.enabled}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          )}

          {/* Test Email */}
          <Card className="mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <h6 className="mb-1">Test Email Configuration</h6>
                  <small className="text-muted">
                    Send a test email to verify your settings
                  </small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="outline-primary"
                    onClick={handleTestEmail}
                    disabled={!isEmailServiceReady() || !emailPreferences.userEmail || isTestingEmail}
                  >
                    {isTestingEmail ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Test Email'
                    )}
                  </Button>
                </Col>
              </Row>
              
              {testResult && (
                <Alert variant={testResult.success ? 'success' : 'danger'} className="mt-3 mb-0">
                  {testResult.message}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Debug Panel */}
          <DebugPanel 
            emailPreferences={emailPreferences}
            todoSummary={todoSummary}
            isEmailServiceReady={isEmailServiceReady}
            updateEmailPreferences={updateEmailPreferences}
            resetEmailPreferences={resetEmailPreferences}
            forceUpdateReminderTime={forceUpdateReminderTime}
          />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSaveAndClose}>
          Save Settings
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * Debug Panel Component - helps troubleshoot email notification issues
 */
function DebugPanel({ emailPreferences, todoSummary, isEmailServiceReady, updateEmailPreferences, resetEmailPreferences, forceUpdateReminderTime }) {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);

  const loadDebugInfo = () => {
    setIsLoadingDebug(true);
    
    // Get notification service status
    const serviceStatus = notificationService.getStatus();
    
    // Get notification logs
    const notificationLogs = notificationService.getNotificationLogs().slice(0, 10); // Last 10 entries
    
    // Current time info for debugging timing issues
    const now = new Date();
    const currentTime = now.toLocaleTimeString();
    const currentDate = now.toLocaleDateString();
    
    // Parse reminder time
    const [reminderHour, reminderMinute] = emailPreferences.reminderTime.split(':').map(Number);
    const reminderDateTime = new Date();
    reminderDateTime.setHours(reminderHour, reminderMinute, 0, 0);
    
    // Check if it's past reminder time today
    const isPastReminderTime = now >= reminderDateTime;
    
    // Check last reminder sent
    const lastReminderSent = emailPreferences.lastReminderSent 
      ? new Date(emailPreferences.lastReminderSent).toLocaleString()
      : 'Never';
    const lastAdvanceReminderSent = emailPreferences.lastAdvanceReminderSent
      ? new Date(emailPreferences.lastAdvanceReminderSent).toLocaleString()
      : 'Never';

    // Determine why reminders might not be sending
    const issues = [];
    
    if (!emailPreferences.enabled) {
      issues.push("Email notifications are disabled");
    }
    if (!emailPreferences.userEmail) {
      issues.push("No email address configured");
    }
    if (!isEmailServiceReady()) {
      issues.push("Email service not configured (missing environment variables)");
    }
    if (!serviceStatus.isRunning) {
      issues.push("Notification service is not running");
    }
    if (todoSummary.dueToday === 0 && todoSummary.overdue === 0) {
      issues.push("No TODOs are due today or overdue");
    }
    if (!emailPreferences.dailyReminder) {
      issues.push("Daily reminders are disabled");
    }
    if (!isPastReminderTime) {
      issues.push(`Current time (${currentTime}) is before daily reminder time (${emailPreferences.reminderTime})`);
    }

    // Check localStorage directly for debugging
    const localStorageData = localStorage.getItem('email-preferences');
    const parsedLocalStorage = localStorageData ? JSON.parse(localStorageData) : null;

    const debugData = {
      serviceStatus: {
        ...serviceStatus,
        lastCheck: serviceStatus.lastCheck ? new Date(serviceStatus.lastCheck).toLocaleString() : 'Never'
      },
      notificationLogs,
      currentTime,
      currentDate,
      reminderTime: emailPreferences.reminderTime,
      isPastReminderTime,
      lastReminderSent,
      lastAdvanceReminderSent,
      issues,
      preferences: emailPreferences,
      localStorage: {
        raw: localStorageData,
        parsed: parsedLocalStorage,
        reminderTimeInStorage: parsedLocalStorage?.reminderTime,
        lastAutoAdvanceSentInStorage: parsedLocalStorage?.lastAutoAdvanceReminderSent
      },
      todos: {
        dueToday: todoSummary.dueToday,
        overdue: todoSummary.overdue,
        advance: todoSummary.advance,
        total: todoSummary.total,
        dueTodosList: todoSummary.dueTodos?.map(t => ({
          id: t.id,
          title: t.title,
          day: new Date(t.day).toLocaleDateString(),
          isRecurringTodo: t.isRecurringTodo,
          completed: t.completed
        })) || [],
        overdueTodosList: todoSummary.overdueTodos?.map(t => ({
          id: t.id,
          title: t.title,
          day: new Date(t.day).toLocaleDateString(),
          isRecurringTodo: t.isRecurringTodo,
          completed: t.completed
        })) || []
      }
    };
    
    setDebugInfo(debugData);
    setIsLoadingDebug(false);
  };

  const handleSendManualReminder = async (type = 'daily') => {
    try {
      const success = await notificationService.sendManualReminder(type);
      if (success) {
        alert(`Manual ${type} reminder sent successfully! Check your email.`);
        loadDebugInfo(); // Refresh debug info
      } else {
        alert(`Failed to send manual ${type} reminder. Check the debug info below for details.`);
      }
    } catch (error) {
      alert(`Error sending manual ${type} reminder: ${error.message}`);
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <h6 className="mb-0">🔧 Troubleshooting</h6>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => {
                setShowDebug(!showDebug);
                if (!showDebug && !debugInfo) {
                  loadDebugInfo();
                }
              }}
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </Button>
          </Col>
        </Row>
      </Card.Header>
      
      {showDebug && (
        <Card.Body>
          {isLoadingDebug ? (
            <div className="text-center">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading debug information...</span>
            </div>
          ) : debugInfo ? (
            <Accordion>
              {/* Issues Summary */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  🚨 Issues ({debugInfo.issues.length})
                </Accordion.Header>
                <Accordion.Body>
                  {debugInfo.issues.length === 0 ? (
                    <Alert variant="success">
                      ✅ No issues detected! Your email notifications should be working.
                    </Alert>
                  ) : (
                    <Alert variant="warning">
                      <strong>Potential issues preventing email reminders:</strong>
                      <ul className="mb-0 mt-2">
                        {debugInfo.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                  
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={loadDebugInfo}
                    >
                      🔄 Refresh Info
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => handleSendManualReminder('daily')}
                      disabled={!emailPreferences.enabled || !emailPreferences.userEmail}
                    >
                      📧 Manual Daily Reminder
                    </Button>
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => handleSendManualReminder('advance')}
                disabled={!emailPreferences.enabled || !emailPreferences.userEmail}
              >
                🔔 Manual Advance Reminder
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  resetEmailPreferences();
                  alert('Complete reset done! All preferences and timestamps cleared. Please re-configure your settings.');
                  loadDebugInfo();
                }}
                className="ms-2"
              >
                🔄 Complete Reset
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  updateEmailPreferences({
                    lastAutoReminderSent: null,
                    lastAutoAdvanceReminderSent: null
                  });
                  alert('Cleared only automatic reminder timestamps. Manual testing now allowed.');
                  loadDebugInfo();
                }}
                className="ms-1"
              >
                🧪 Clear Auto Timestamps
              </Button>
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
                  forceUpdateReminderTime(currentTime);
                  alert(`Force updated reminder time to current time: ${currentTime}`);
                  loadDebugInfo();
                }}
                className="ms-1"
              >
                ⏰ Fix Stuck Time
              </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              {/* TODO Details */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  📋 TODO Details
                </Accordion.Header>
                <Accordion.Body>
                  <Row className="mb-3">
                    <Col md={3}>
                      <strong>Due Today:</strong> {debugInfo.todos.dueToday}
                    </Col>
                    <Col md={3}>
                      <strong>Overdue:</strong> {debugInfo.todos.overdue}
                    </Col>
                    <Col md={3}>
                      <strong>In {emailPreferences.advanceDays} Days:</strong> {debugInfo.todos.advance}
                    </Col>
                    <Col md={3}>
                      <strong>Total:</strong> {debugInfo.todos.total}
                    </Col>
                  </Row>

                  {(debugInfo.todos.dueTodosList.length > 0 || debugInfo.todos.overdueTodosList.length > 0) ? (
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugInfo.todos.overdueTodosList.map(todo => (
                          <tr key={todo.id} className="table-danger">
                            <td>{todo.title}</td>
                            <td>{todo.day}</td>
                            <td>Overdue</td>
                          </tr>
                        ))}
                        {debugInfo.todos.dueTodosList.map(todo => (
                          <tr key={todo.id} className="table-warning">
                            <td>{todo.title}</td>
                            <td>{todo.day}</td>
                            <td>Due Today</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="info">
                      <strong>No TODOs found that need reminders.</strong>
                      <br />
                      <small>
                        To create TODOs for email reminders, you can:
                        <ol>
                          <li><strong>Manual TODOs:</strong> Go to your calendar → click on a day → "Add TODO" → choose items like "TO DO: Plant seeds", "TO DO: Water", etc.</li>
                          <li><strong>Recurring TODOs:</strong> Go to your calendar → click on a day → "Add Action" → choose actions like "Fertilized" (creates recurring "TO DO: Fertilized" every 7 days)</li>
                        </ol>
                        <strong>Note:</strong> The system now sends reminders for ALL TODOs (both manual and recurring).
                      </small>
                    </Alert>
                  )}
                </Accordion.Body>
              </Accordion.Item>

              {/* Service Status */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  ⚙️ Service Status
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Notification Service:</strong> {debugInfo.serviceStatus.isRunning ? '✅ Running' : '❌ Not Running'}
                    </Col>
                    <Col md={6}>
                      <strong>Email Service:</strong> {isEmailServiceReady() ? '✅ Ready' : '❌ Not Configured'}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <strong>Last Check:</strong> {debugInfo.serviceStatus.lastCheck}
                    </Col>
                    <Col md={6}>
                      <strong>Check Frequency:</strong> {debugInfo.serviceStatus.checkFrequency / 1000}s
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Timing Info */}
              <Accordion.Item eventKey="3">
                <Accordion.Header>
                  ⏰ Timing Info
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <strong>Current Time:</strong> {debugInfo.currentTime}
                    </Col>
                    <Col md={6}>
                      <strong>Daily Reminder Time:</strong> {debugInfo.reminderTime}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <strong>Past Reminder Time Today:</strong> {debugInfo.isPastReminderTime ? '✅ Yes' : '❌ No'}
                    </Col>
                    <Col md={6}>
                      <strong>Current Date:</strong> {debugInfo.currentDate}
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <strong>Last Daily Reminder:</strong> {debugInfo.lastReminderSent}
                    </Col>
                    <Col md={6}>
                      <strong>Last Advance Reminder:</strong> {debugInfo.lastAdvanceReminderSent}
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Recent Logs */}
              <Accordion.Item eventKey="4">
                <Accordion.Header>
                  📜 Recent Notification Logs ({debugInfo.notificationLogs.length})
                </Accordion.Header>
                <Accordion.Body>
                  {debugInfo.notificationLogs.length === 0 ? (
                    <Alert variant="info">No notification logs found. This might indicate the notification service hasn't attempted to send any reminders yet.</Alert>
                  ) : (
                    <Table striped bordered size="sm">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugInfo.notificationLogs.map((log, idx) => (
                          <tr key={idx} className={log.status === 'success' ? 'table-success' : log.status === 'failed' ? 'table-warning' : 'table-danger'}>
                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                            <td>{log.type}</td>
                            <td>{log.status}</td>
                            <td>{log.details || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          ) : null}
        </Card.Body>
      )}
    </Card>
  );
}

