import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
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
    isPushServiceReady,
    getTodoSummary
  } = pushNotifications;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const { showError } = useToast();

  const todoSummary = getTodoSummary();
  const isNativeApp = Capacitor.isNativePlatform();

  /** Monday–Sunday order; values match dayjs `.day()` (0 = Sunday … 6 = Saturday). */
  const weekdayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
  ];

  const handleInputChange = (field, value) => {
    updatePushPreferences({ [field]: value });
  };

  const handleSaveAndClose = () => {
    if (pushPreferences.enabled && !currentUser?.email) {
      showError('Sign in to enable push notifications');
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
              <Form.Label>Today reminder time</Form.Label>
              <Form.Control
                type="time"
                value={pushPreferences.dailyReminderTime || pushPreferences.reminderTime}
                onChange={(e) => handleInputChange('dailyReminderTime', e.target.value)}
                disabled={!pushPreferences.enabled}
              />
              <Form.Text className="text-muted">
                When to send today&apos;s and overdue tasks reminder
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
            <>
              <Form.Group className="mb-3">
                <Form.Label>How many days in advance?</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="14"
                  value={pushPreferences.advanceDays}
                  onChange={(e) => handleInputChange('advanceDays', parseInt(e.target.value, 10) || 3)}
                  disabled={!pushPreferences.enabled}
                  style={{ width: '120px' }}
                />
                <Form.Text className="text-muted">
                  Send reminders {pushPreferences.advanceDays} day(s) before TODOs are due
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Advance reminder time</Form.Label>
                <Form.Control
                  type="time"
                  value={pushPreferences.advanceReminderTime || pushPreferences.reminderTime}
                  onChange={(e) => handleInputChange('advanceReminderTime', e.target.value)}
                  disabled={!pushPreferences.enabled}
                />
                <Form.Text className="text-muted">
                  Time of day for the advance notice (independent from today reminder)
                </Form.Text>
              </Form.Group>
            </>
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
              A &quot;week ahead&quot; push on a weekday you choose
            </Form.Text>
          </Form.Group>

          {pushPreferences.weeklySummary && (
            <>
              <Form.Group className="mb-3 ms-3">
                <Form.Label>Day of week</Form.Label>
                <Form.Select
                  value={pushPreferences.weeklySummaryDay ?? 1}
                  onChange={(e) =>
                    handleInputChange('weeklySummaryDay', parseInt(e.target.value, 10))
                  }
                  disabled={!pushPreferences.enabled}
                >
                  {weekdayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 ms-3">
                <Form.Label>Weekly summary time</Form.Label>
                <Form.Control
                  type="time"
                  value={pushPreferences.weeklySummaryTime || '08:00'}
                  onChange={(e) => handleInputChange('weeklySummaryTime', e.target.value)}
                  disabled={!pushPreferences.enabled}
                />
                <Form.Text className="text-muted">
                  When to send your week-ahead summary
                </Form.Text>
              </Form.Group>
            </>
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

          {/* Sync Info */}
          <Alert variant="info" className="mb-3">
            <strong>📡 Auto-Sync Active</strong>
            <br />
            <small>
              Settings automatically sync across all devices every 30 seconds.
              No manual action needed!
            </small>
          </Alert>
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
