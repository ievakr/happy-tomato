import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Badge, Spinner, Accordion, Table } from 'react-bootstrap';
import notificationService from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Capacitor } from '@capacitor/core';

/**
 * Push notification settings for TODO reminders (web push / FCM)
 */
export default function PushNotificationSettings({ show, onHide, pushNotifications }) {
  const { currentUser } = useAuth();
  const {
    pushPreferences,
    updatePushPreferences,
    resetPushPreferences,
    forceUpdateReminderTime,
    testPushConfiguration,
    isPushServiceReady,
    getTodoSummary
  } = pushNotifications;

  const [isTestingPush, setIsTestingPush] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { showSuccess, showError } = useToast();

  const todoSummary = getTodoSummary();
  const isNativeApp = Capacitor.isNativePlatform();

  const handleInputChange = (field, value) => {
    updatePushPreferences({ [field]: value });
    setTestResult(null);
  };

  const handleTestPush = async () => {
    if (!currentUser?.email) {
      setTestResult({ success: false, message: 'Sign in to test push notifications' });
      return;
    }

    setIsTestingPush(true);
    setTestResult(null);

    try {
      const success = await testPushConfiguration();
      setTestResult({
        success,
        message: success
          ? 'Test push sent. Check your system notifications.'
          : `Failed to send test push. Allow notifications${
              isNativeApp ? ' and check Firebase native config.' : ' and ensure VAPID key is set.'
            }`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test push',
      });
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleSaveAndClose = () => {
    if (pushPreferences.enabled && !currentUser?.email) {
      setTestResult({
        success: false,
        message: 'Sign in to enable push notifications',
      });
      return;
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Push Notification Settings</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Service Configuration Status */}
        <Card className="mb-4">
          <Card.Header>
            <Row className="align-items-center">
              <Col>
                <h6 className="mb-0">Push service status</h6>
              </Col>
              <Col xs="auto">
                {isPushServiceReady() ? (
                  <Badge bg="success">Ready</Badge>
                ) : (
                  <Badge bg="warning">Configuration required</Badge>
                )}
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            {isNativeApp && (
              <Alert variant="info" className="mb-3">
                <h6 className="mb-2">iOS / Android app</h6>
                <p className="mb-2 small mb-0">
                  Use <code>GoogleService-Info.plist</code> (iOS) and <code>google-services.json</code>{' '}
                  (Android) from Firebase, enable <strong>Push Notifications</strong> in Xcode, and
                  upload your APNs key to Firebase Cloud Messaging. Then run{' '}
                  <code>npx cap sync</code> and rebuild the native project.
                </p>
              </Alert>
            )}

            {!isNativeApp && !isPushServiceReady() && (
              <Alert variant="warning">
                <h6>Web push not fully configured</h6>
                <p className="mb-2">
                  Add your Web Push certificate key pair to the app environment as{' '}
                  <code>REACT_APP_FIREBASE_VAPID_KEY</code> (Firebase Console → Project settings →
                  Cloud Messaging → Web Push certificates).
                </p>
                <small className="text-muted">
                  Rebuild the app after setting the variable. Scheduled reminders use the same FCM
                  tokens stored in Firestore.
                </small>
              </Alert>
            )}

            {(isNativeApp || isPushServiceReady()) && (
              <div className="text-success">
                ✅ Push is enabled for this {isNativeApp ? 'native' : 'web'} build (FCM).
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
                  <small className="text-muted">In {pushPreferences.advanceDays} Days</small>
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

        {/* Push settings form */}
        <Form>
          {/* Enable/Disable Notifications */}
          <Form.Group className="mb-4">
            <Form.Check
              type="switch"
              id="enable-notifications"
              label="Enable push notifications"
              checked={pushPreferences.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              disabled={!isPushServiceReady()}
            />
            <Form.Text className="text-muted">
              Browser reminders for your garden TODOs (allow notifications when prompted)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Account</Form.Label>
            <Form.Control
              type="text"
              readOnly
              value={currentUser?.email || 'Sign in to sync reminders'}
              className="bg-light"
            />
            <Form.Text className="text-muted">
              Preferences sync to Firestore using your account email
            </Form.Text>
          </Form.Group>

          {/* Daily Reminder */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="daily-reminder"
              label="Daily reminder"
              checked={pushPreferences.dailyReminder}
              onChange={(e) => handleInputChange('dailyReminder', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              Push at your chosen time with pending TODOs (today and overdue)
            </Form.Text>
          </Form.Group>

          {/* Reminder Time */}
          {pushPreferences.dailyReminder && (
            <Form.Group className="mb-3">
              <Form.Label>Daily reminder time</Form.Label>
              <Form.Control
                type="time"
                value={pushPreferences.reminderTime}
                onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                disabled={!pushPreferences.enabled}
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
              label="Advance reminders"
              checked={pushPreferences.advanceReminders}
              onChange={(e) => handleInputChange('advanceReminders', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              Push a few days before TODOs are due
            </Form.Text>
          </Form.Group>

          {/* Advance Days Setting */}
          {pushPreferences.advanceReminders && (
            <Form.Group className="mb-3">
              <Form.Label>How many days in advance?</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="14"
                value={pushPreferences.advanceDays}
                onChange={(e) => handleInputChange('advanceDays', parseInt(e.target.value) || 3)}
                disabled={!pushPreferences.enabled}
                style={{ width: '120px' }}
              />
              <Form.Text className="text-muted">
                Send reminders {pushPreferences.advanceDays} day(s) before TODOs are due
              </Form.Text>
            </Form.Group>
          )}

          {/* Weekly Summary */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="weekly-summary"
              label="Weekly summary"
              checked={pushPreferences.weeklySummary ?? false}
              onChange={(e) => handleInputChange('weeklySummary', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              A &quot;week ahead&quot; push on Sunday or Monday morning
            </Form.Text>
          </Form.Group>

          {pushPreferences.weeklySummary && (
            <Form.Group className="mb-3 ms-3">
              <Form.Label>Weekly summary time</Form.Label>
              <Form.Control
                type="time"
                value={pushPreferences.weeklySummaryTime || '08:00'}
                onChange={(e) => handleInputChange('weeklySummaryTime', e.target.value)}
                disabled={!pushPreferences.enabled}
              />
              <Form.Text className="text-muted">
                When to send your week-ahead summary (Sunday/Monday)
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
                    checked={pushPreferences.dueTodayReminders}
                    onChange={(e) => handleInputChange('dueTodayReminders', e.target.checked)}
                    disabled={!pushPreferences.enabled}
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Check
                    type="checkbox"
                    id="overdue-reminders"
                    label="Remind me of overdue TODOs"
                    checked={pushPreferences.overdueReminders}
                    onChange={(e) => handleInputChange('overdueReminders', e.target.checked)}
                    disabled={!pushPreferences.enabled}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          )}

          {/* Test push */}
          <Card className="mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <h6 className="mb-1">Test push</h6>
                  <small className="text-muted">
                    Send a sample reminder to this device
                  </small>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="outline-primary"
                    onClick={handleTestPush}
                    disabled={!isPushServiceReady() || !currentUser?.email || isTestingPush}
                  >
                    {isTestingPush ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      'Send test push'
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

          {/* Sync Info */}
          <Alert variant="info" className="mb-3">
            <strong>📡 Auto-Sync Active</strong>
            <br />
            <small>
              Settings automatically sync across all devices every 30 seconds.
              No manual action needed!
            </small>
          </Alert>

          {/* Debug Panel */}
          <DebugPanel
            pushPreferences={pushPreferences}
            todoSummary={todoSummary}
            isPushServiceReady={isPushServiceReady}
            currentUserEmail={currentUser?.email}
            updatePushPreferences={updatePushPreferences}
            resetPushPreferences={resetPushPreferences}
            forceUpdateReminderTime={forceUpdateReminderTime}
          />
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSaveAndClose}>
          Save Settings
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * Debug panel for push reminder issues
 */
function DebugPanel({
  pushPreferences,
  todoSummary,
  isPushServiceReady,
  currentUserEmail,
  updatePushPreferences,
  resetPushPreferences,
  forceUpdateReminderTime,
}) {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoadingDebug, setIsLoadingDebug] = useState(false);
  const { showSuccess, showError } = useToast();

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
    const [reminderHour, reminderMinute] = pushPreferences.reminderTime.split(':').map(Number);
    const reminderDateTime = new Date();
    reminderDateTime.setHours(reminderHour, reminderMinute, 0, 0);
    
    // Check if it's past reminder time today
    const isPastReminderTime = now >= reminderDateTime;
    
    // Check last reminder sent
    const lastReminderSent = pushPreferences.lastReminderSent 
      ? new Date(pushPreferences.lastReminderSent).toLocaleString()
      : 'Never';
    const lastAdvanceReminderSent = pushPreferences.lastAdvanceReminderSent
      ? new Date(pushPreferences.lastAdvanceReminderSent).toLocaleString()
      : 'Never';

    // Determine why reminders might not be sending
    const issues = [];
    
    if (!pushPreferences.enabled) {
      issues.push('Push notifications are disabled');
    }
    if (!currentUserEmail) {
      issues.push('Not signed in (account email is used to sync preferences)');
    }
    if (!isPushServiceReady()) {
      issues.push('Push not configured (set REACT_APP_FIREBASE_VAPID_KEY and rebuild)');
    }
    if (!serviceStatus.isRunning) {
      issues.push("Notification service is not running");
    }
    if (todoSummary.dueToday === 0 && todoSummary.overdue === 0) {
      issues.push("No TODOs are due today or overdue");
    }
    if (!pushPreferences.dailyReminder) {
      issues.push("Daily reminders are disabled");
    }
    if (!isPastReminderTime) {
      issues.push(`Current time (${currentTime}) is before daily reminder time (${pushPreferences.reminderTime})`);
    }

    // Check localStorage directly for debugging
    const localStorageData = localStorage.getItem('push-notification-preferences');
    const parsedLocalStorage = localStorageData ? JSON.parse(localStorageData) : null;

    const debugData = {
      serviceStatus: {
        ...serviceStatus,
        lastCheck: serviceStatus.lastCheck ? new Date(serviceStatus.lastCheck).toLocaleString() : 'Never'
      },
      notificationLogs,
      currentTime,
      currentDate,
      reminderTime: pushPreferences.reminderTime,
      isPastReminderTime,
      lastReminderSent,
      lastAdvanceReminderSent,
      issues,
      preferences: pushPreferences,
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
        showSuccess(`Manual ${type} reminder sent. Check your system notifications.`);
        loadDebugInfo(); // Refresh debug info
      } else {
        showError(`Failed to send manual ${type} reminder. Check the debug info below for details.`);
      }
    } catch (error) {
      showError(`Error sending manual ${type} reminder: ${error.message}`);
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
                      ✅ No issues detected! Push reminders should work.
                    </Alert>
                  ) : (
                    <Alert variant="warning">
                      <strong>Potential issues preventing push reminders:</strong>
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
                      disabled={!pushPreferences.enabled || !currentUserEmail}
                    >
                      📧 Manual Daily Reminder
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => handleSendManualReminder('advance')}
                      disabled={!pushPreferences.enabled || !currentUserEmail}
                    >
                      🔔 Manual Advance Reminder
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSendManualReminder('weekly')}
                      disabled={!pushPreferences.enabled || !currentUserEmail}
                    >
                      📅 Manual Weekly Summary
                    </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  resetPushPreferences();
                  showSuccess('Complete reset done! All preferences and timestamps cleared. Please re-configure your settings.');
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
                  updatePushPreferences({
                    lastAutoReminderSent: null,
                    lastAutoAdvanceReminderSent: null
                  });
                  showSuccess('Cleared only automatic reminder timestamps. Manual testing now allowed.');
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
                  showSuccess(`Force updated reminder time to current time: ${currentTime}`);
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
                      <strong>In {pushPreferences.advanceDays} Days:</strong> {debugInfo.todos.advance}
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
                        To create TODOs for push reminders, you can:
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
                      <strong>Push (FCM):</strong> {isPushServiceReady() ? '✅ Ready' : '❌ Not configured'}
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

