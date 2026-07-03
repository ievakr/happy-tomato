import { render, screen } from '@testing-library/react';
import App from './App';
import { createWrapper } from './test-utils/test-wrapper';

jest.mock('./context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    bootLoading: false,
    currentUser: null,
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

jest.mock('./hooks/useCalendar', () => ({
  useCalendar: () => ({ currentMonth: [] }),
}));

jest.mock('./hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({ pushPreferences: { enabled: false } }),
}));

jest.mock('./hooks/useOnlineStatus', () => ({
  __esModule: true,
  default: () => true,
}));

jest.mock('./hooks/useServiceWorkerUpdate', () => ({
  __esModule: true,
  default: () => ({ updateReady: false }),
}));

jest.mock('./hooks', () => ({
  ...jest.requireActual('./hooks'),
  useResponsive: () => ({ isMobile: false, isTablet: false }),
  useResponsiveCalendarView: jest.fn(),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

test('renders login screen when signed out', async () => {
  render(<App />, { wrapper: createWrapper() });

  expect(await screen.findByText(/sign in to your account/i)).toBeInTheDocument();
  expect(screen.getByText(/happy tomato/i)).toBeInTheDocument();
});
