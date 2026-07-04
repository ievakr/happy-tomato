import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Push notification settings for TODO reminders (web push / FCM)
 */
export default function PushNotificationSettings({ show, onHide, pushNotifications }) {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const {
    pushPreferences,
    updatePushPreferences,
    isPushServiceReady,
    getTodoSummary,
  } = pushNotifications;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const { showError } = useToast();

  const todoSummary = getTodoSummary();
  const isNativeApp = Capacitor.isNativePlatform();

  /** Monday–Sunday order; values match dayjs `.day()` (0 = Sunday … 6 = Saturday). */
  const weekdayOptions = [
    { value: 1, labelKey: 'settings.weekday.monday' },
    { value: 2, labelKey: 'settings.weekday.tuesday' },
    { value: 3, labelKey: 'settings.weekday.wednesday' },
    { value: 4, labelKey: 'settings.weekday.thursday' },
    { value: 5, labelKey: 'settings.weekday.friday' },
    { value: 6, labelKey: 'settings.weekday.saturday' },
    { value: 0, labelKey: 'settings.weekday.sunday' },
  ];

  const handleInputChange = (field, value) => {
    updatePushPreferences({ [field]: value });
  };

  const handleSaveAndClose = () => {
    if (pushPreferences.enabled && !currentUser?.email) {
      showError(t('settings.signInToEnablePush'));
      return;
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('settings.pushSettingsTitle')}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Service Configuration Status */}
        <Card className="mb-4">
          <Card.Header>
            <Row className="align-items-center">
              <Col>
                <h6 className="mb-0">{t('settings.pushServiceStatus')}</h6>
              </Col>
              <Col xs="auto">
                {isPushServiceReady() ? (
                  <Badge bg="success">{t('settings.ready')}</Badge>
                ) : (
                  <Badge bg="warning">{t('settings.configRequired')}</Badge>
                )}
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            {isNativeApp && (
              <Alert variant="info" className="mb-3">
                <h6 className="mb-2">{t('settings.iosAndroidApp')}</h6>
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
                <h6>{t('settings.webPushNotConfigured')}</h6>
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
                ✅ {t('settings.pushEnabledFor', {
                  buildType: isNativeApp ? t('settings.buildNative') : t('settings.buildWeb'),
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* TODO Summary */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">{t('settings.currentTodos')}</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-danger">{todoSummary.overdue}</div>
                  <small className="text-muted">{t('settings.overdue')}</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-warning">{todoSummary.dueToday}</div>
                  <small className="text-muted">{t('settings.dueToday')}</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-primary">{todoSummary.advance}</div>
                  <small className="text-muted">{t('settings.inDays', { days: pushPreferences.advanceDays })}</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <div className="h4 text-info">{todoSummary.upcoming}</div>
                  <small className="text-muted">{t('settings.upcoming')}</small>
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
              label={t('settings.enablePush')}
              checked={pushPreferences.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              disabled={!isPushServiceReady()}
            />
            <Form.Text className="text-muted">
              {t('settings.enablePushHelp')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('settings.account')}</Form.Label>
            <Form.Control
              type="text"
              readOnly
              value={currentUser?.email || t('settings.signInToSync')}
              className="bg-light"
            />
            <Form.Text className="text-muted">
              {t('settings.accountSyncHelp')}
            </Form.Text>
          </Form.Group>

          {/* Daily Reminder */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="daily-reminder"
              label={t('settings.dailyReminder')}
              checked={pushPreferences.dailyReminder}
              onChange={(e) => handleInputChange('dailyReminder', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              {t('settings.dailyReminderHelp')}
            </Form.Text>
          </Form.Group>

          {/* Reminder Time */}
          {pushPreferences.dailyReminder && (
            <Form.Group className="mb-3">
              <Form.Label>{t('settings.todayReminderTime')}</Form.Label>
              <Form.Control
                type="time"
                value={pushPreferences.dailyReminderTime || pushPreferences.reminderTime}
                onChange={(e) => handleInputChange('dailyReminderTime', e.target.value)}
                disabled={!pushPreferences.enabled}
              />
              <Form.Text className="text-muted">
                {t('settings.todayReminderTimeHelp1')}{' '}
                <strong>{t('settings.advanceReminderTime')}</strong>{' '}
                {t('settings.todayReminderTimeHelp2')}
              </Form.Text>
            </Form.Group>
          )}

          {/* Advanced Settings Toggle */}
          <Button
            variant="link"
            className="p-0 mb-3"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} {t('settings.advancedSettings')}
          </Button>

          {/* Advance Reminders */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="advance-reminders"
              label={t('settings.advanceReminders')}
              checked={pushPreferences.advanceReminders}
              onChange={(e) => handleInputChange('advanceReminders', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              {t('settings.advanceRemindersHelp')}
            </Form.Text>
          </Form.Group>

          {/* Advance Days Setting */}
          {pushPreferences.advanceReminders && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>{t('settings.howManyDaysAdvance')}</Form.Label>
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
                  {t('settings.advanceDaysHelp', { days: pushPreferences.advanceDays })}
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('settings.advanceReminderTime')}</Form.Label>
                <Form.Control
                  type="time"
                  value={pushPreferences.advanceReminderTime || pushPreferences.reminderTime}
                  onChange={(e) => handleInputChange('advanceReminderTime', e.target.value)}
                  disabled={!pushPreferences.enabled}
                />
                <Form.Text className="text-muted">
                  {t('settings.advanceReminderTimeHelp')}
                </Form.Text>
              </Form.Group>
            </>
          )}

          {/* Weekly Summary */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="weekly-summary"
              label={t('settings.weeklySummary')}
              checked={pushPreferences.weeklySummary ?? false}
              onChange={(e) => handleInputChange('weeklySummary', e.target.checked)}
              disabled={!pushPreferences.enabled}
            />
            <Form.Text className="text-muted">
              {t('settings.weeklySummaryHelp')}
            </Form.Text>
          </Form.Group>

          {pushPreferences.weeklySummary && (
            <>
              <Form.Group className="mb-3 ms-3">
                <Form.Label>{t('settings.dayOfWeek')}</Form.Label>
                <Form.Select
                  value={pushPreferences.weeklySummaryDay ?? 1}
                  onChange={(e) =>
                    handleInputChange('weeklySummaryDay', parseInt(e.target.value, 10))
                  }
                  disabled={!pushPreferences.enabled}
                >
                  {weekdayOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3 ms-3">
                <Form.Label>{t('settings.weeklySummaryTime')}</Form.Label>
                <Form.Control
                  type="time"
                  value={pushPreferences.weeklySummaryTime || '08:00'}
                  onChange={(e) => handleInputChange('weeklySummaryTime', e.target.value)}
                  disabled={!pushPreferences.enabled}
                />
                <Form.Text className="text-muted">
                  {t('settings.weeklySummaryTimeHelp')}
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
                    label={t('settings.remindDueToday')}
                    checked={pushPreferences.dueTodayReminders}
                    onChange={(e) => handleInputChange('dueTodayReminders', e.target.checked)}
                    disabled={!pushPreferences.enabled}
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Check
                    type="checkbox"
                    id="overdue-reminders"
                    label={t('settings.remindOverdue')}
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
            <strong>📡 {t('settings.autoSyncActive')}</strong>
            <br />
            <small>
              {t('settings.autoSyncHelp')}
            </small>
          </Alert>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t('common.cancel')}
        </Button>
        <Button variant="success" onClick={handleSaveAndClose}>
          {t('settings.saveSettings')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
