/**
 * App-level smoke tests for Happy Tomato.
 * Full UI flows are covered in critical-flows.e2e.test.js.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';
import ContextWrapper from '../context/ContextWrapper';
import { AppTestProviders, mockAuthUser } from '../test-utils/app-providers';

const e2eEventStore = { events: [] };
const mockPlants = [];

jest.mock('../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    bootLoading: false,
    currentUser: mockAuthUser,
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

jest.mock('../hooks/usePlants', () => ({
  usePlants: () => ({
    plants: mockPlants,
    plantNames: ['Tomatoes', 'Roses'],
    plantsById: {},
    displayNameToPlantId: {},
    plantIdToDisplayName: {},
  }),
}));

jest.mock('../hooks/useEventsQuery', () => ({
  useEventsQuery: () => ({
    savedEvents: e2eEventStore.events,
    isInitialLoading: false,
    queryKey: ['events', mockAuthUser.uid],
  }),
}));

jest.mock('../hooks/useEventOperations', () => {
  const { EVENT_ACTIONS } = require('../constants');
  return {
    useEventOperations: () => ({
      dispatchCallEvent: jest.fn(async ({ type, payload }) => {
        if (type === EVENT_ACTIONS.PUSH) {
          e2eEventStore.events.push({
            ...payload,
            id: payload.id || `event-${e2eEventStore.events.length + 1}`,
          });
        }
      }),
      isLoading: false,
      loadingOperation: null,
    }),
  };
});

jest.mock('../hooks/usePushNotifications', () => ({
  usePushNotifications: () => ({ pushPreferences: { enabled: false } }),
}));

jest.mock('../hooks/useOnlineStatus', () => ({
  __esModule: true,
  default: () => true,
}));

jest.mock('../hooks/useServiceWorkerUpdate', () => ({
  __esModule: true,
  default: () => ({ updateReady: false }),
}));

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useResponsive: () => ({ isMobile: false, isTablet: false, isDesktop: true, windowSize: { width: 1200, height: 800 } }),
  useResponsiveCalendarView: jest.fn(),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteField: jest.fn(),
  FieldValue: class FieldValue {},
}));

jest.mock('../firebase', () => ({
  auth: {},
  db: {},
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: {} }))),
  getFirebaseMessaging: jest.fn(() => Promise.resolve(null)),
}));

const renderApp = () =>
  render(
    <AppTestProviders>
      <ContextWrapper>
        <App />
      </ContextWrapper>
    </AppTestProviders>
  );

describe('E2E: Happy Tomato Calendar App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    e2eEventStore.events = [];
    localStorage.clear();
  });

  test('renders the authenticated calendar shell', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.queryByText(/sign in to your account/i)).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Calendar view')).toBeInTheDocument();
  });

  test('shows the create plant action in the sidebar on desktop', async () => {
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: /plant management/i }));
    expect(await screen.findByText('+ Create Plant')).toBeInTheDocument();
  });

  test('displays events from the in-memory store', async () => {
    e2eEventStore.events.push({
      id: 'event-1',
      title: 'Water greenhouse tomatoes',
      description: 'Water greenhouse tomatoes',
      day: Date.now(),
      labels: [],
    });

    renderApp();

    expect(await screen.findByText(/water greenhouse tomatoes/i)).toBeInTheDocument();
  });
});
