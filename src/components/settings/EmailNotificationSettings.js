import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';

/**
 * Email Notification Settings Component
 * Allows users to configure email reminders for TODOs
 */
export default function EmailNotificationSettings({ show, onHide }) {
  const {
    emailPreferences,
    updateEmailPreferences,
    testEmailConfiguration,
    isEmailServiceReady,
    getEmailServiceStatus,
    getTodoSummary
  } = useEmailNotifications();

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

