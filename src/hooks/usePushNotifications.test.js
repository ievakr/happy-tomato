import { renderHook, act } from '@testing-library/react';
import { usePushNotifications, normalizePushPreferences } from './usePushNotifications';
import pushService from '../services/pushService';
import dayjs from 'dayjs';
import { createWrapper } from '../test-utils/test-wrapper';

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
    setDoc: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../services/pushService');

let mockCurrentUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const defaultPrefs = normalizePushPreferences({
  enabled: true,
  userEmail: '',
  userName: '',
  userId: '',
  dailyReminder: true,
  reminderTime: '09:00',
  overdueReminders: true,
  dueTodayReminders: true,
  advanceReminders: true,
  advanceDays: 3,
  weeklySummary: false,
  weeklySummaryTime: '08:00',
  lastReminderSent: null,
  lastAdvanceReminderSent: null,
  lastAutoReminderSent: null,
  lastAutoAdvanceReminderSent: null,
  lastWeeklySummarySent: null,
});

describe('normalizePushPreferences', () => {
  test('folds stale advance 15:00 when daily matches legacy reminderTime', () => {
    const out = normalizePushPreferences({
      reminderTime: '08:30',
      dailyReminderTime: '08:30',
      advanceReminderTime: '15:00',
    });
    expect(out.advanceReminderTime).toBe('08:30');
  });

  test('keeps distinct advance 15:00 when reminderTime disagrees with daily', () => {
    const out = normalizePushPreferences({
      reminderTime: '08:30',
      dailyReminderTime: '09:00',
      advanceReminderTime: '15:00',
    });
    expect(out.advanceReminderTime).toBe('15:00');
  });
});

describe('usePushNotifications', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockCurrentUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };
    pushService.isReady.mockReturnValue(true);
    pushService.getConfigurationStatus.mockReturnValue({ isConfigured: true });
    const { getDoc, setDoc } = require('firebase/firestore');
    getDoc.mockImplementation(() => Promise.resolve({ exists: () => false }));
    setDoc.mockImplementation(() => Promise.resolve());
  });

  describe('Initial state and preferences', () => {
    test('should initialize with default preferences when localStorage is empty', () => {
      const { result } = renderHook(() => usePushNotifications(), {
        wrapper: createWrapper(),
      });

      expect(result.current.pushPreferences).toEqual(defaultPrefs);
    });

    test('should load preferences from localStorage', () => {
      const savedPrefs = {
        ...defaultPrefs,
        userEmail: 'test@example.com',
        userName: 'Test User',
        dailyReminder: true,
        reminderTime: '10:00',
        advanceReminders: false,
        advanceDays: 5,
        lastReminderSent: 1234567890,
      };
      localStorage.setItem('push-notification-preferences', JSON.stringify(savedPrefs));

      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      expect(result.current.pushPreferences).toEqual(normalizePushPreferences(savedPrefs));
    });

    test('should save preferences to localStorage when updated', () => {
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          userEmail: 'new@example.com',
          userName: 'New User',
        });
      });

      const saved = JSON.parse(localStorage.getItem('push-notification-preferences'));
      expect(saved.userEmail).toBe('new@example.com');
      expect(saved.userName).toBe('New User');
    });
  });

  describe('updatePushPreferences', () => {
    test('should update push preferences', () => {
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          userEmail: 'test@example.com',
          userName: 'Test User',
        });
      });

      expect(result.current.pushPreferences.userEmail).toBe('test@example.com');
      expect(result.current.pushPreferences.userName).toBe('Test User');
    });

    test('syncs advanceReminderTime when only dailyReminderTime is patched', () => {
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          userEmail: 'test@example.com',
          dailyReminderTime: '09:00',
          advanceReminderTime: '16:00',
          reminderTime: '08:00',
        });
      });

      expect(result.current.pushPreferences.advanceReminderTime).toBe('16:00');

      act(() => {
        result.current.updatePushPreferences({
          dailyReminderTime: '08:00',
        });
      });

      expect(result.current.pushPreferences.dailyReminderTime).toBe('08:00');
      expect(result.current.pushPreferences.reminderTime).toBe('08:00');
      expect(result.current.pushPreferences.advanceReminderTime).toBe('08:00');
    });
  });

  describe('resetPushPreferences', () => {
    test('should reset push preferences', () => {
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          userEmail: 'test@example.com',
        });
      });

      act(() => {
        result.current.resetPushPreferences();
      });

      expect(result.current.pushPreferences.enabled).toBe(false);
      expect(result.current.pushPreferences.userEmail).toBe('');
    });
  });

  describe('sendDailyReminder', () => {
    test('should send daily reminder successfully', async () => {
      const today = dayjs();
      const mockEvents = [
        {
          id: '1',
          title: 'TO DO: Water plants',
          day: today.toISOString(),
          isRecurringTodo: true,
          completed: false,
        },
      ];

      pushService.sendTodoReminder.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications(), {
        wrapper: createWrapper({ savedEvents: mockEvents, filteredEvents: mockEvents }),
      });

      act(() => {
        result.current.updatePushPreferences({
          enabled: true,
          userEmail: 'test@example.com',
        });
      });

      let success;
      await act(async () => {
        success = await result.current.sendDailyReminder(false);
      });

      expect(success).toBe(true);
      expect(pushService.sendTodoReminder).toHaveBeenCalledWith({
        todos: expect.any(Array),
        reminderType: 'Daily Garden Reminder',
      });
    });

    test('should not send if push notifications disabled', async () => {
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          enabled: false,
          userEmail: 'test@example.com',
        });
      });

      let success;
      await act(async () => {
        success = await result.current.sendDailyReminder();
      });

      expect(success).toBe(false);
      expect(pushService.sendTodoReminder).not.toHaveBeenCalled();
    });
  });

  describe('testPushConfiguration', () => {
    test('should test push configuration', async () => {
      pushService.testPushConfiguration.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      act(() => {
        result.current.updatePushPreferences({
          userEmail: 'test@example.com',
        });
      });

      let success;
      await act(async () => {
        success = await result.current.testPushConfiguration();
      });

      expect(success).toBe(true);
      expect(pushService.testPushConfiguration).toHaveBeenCalled();
    });

    test('should throw error if not signed in', async () => {
      mockCurrentUser = null;
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      await expect(result.current.testPushConfiguration()).rejects.toThrow(
        'Sign in to enable push notifications',
      );
    });
  });

  describe('isPushServiceReady', () => {
    test('should return push service ready status', () => {
      pushService.isReady.mockReturnValue(true);
      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      expect(result.current.isPushServiceReady()).toBe(true);
      expect(pushService.isReady).toHaveBeenCalled();
    });
  });

  describe('getPushServiceStatus', () => {
    test('should return push service configuration status', () => {
      const status = { isConfigured: true, provider: 'FCM' };
      pushService.getConfigurationStatus.mockReturnValue(status);

      const { result } = renderHook(() => usePushNotifications(), { wrapper: createWrapper() });

      expect(result.current.getPushServiceStatus()).toEqual(status);
      expect(pushService.getConfigurationStatus).toHaveBeenCalled();
    });
  });
});
