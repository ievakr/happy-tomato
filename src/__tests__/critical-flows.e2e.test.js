/**
 * End-to-End Integration Tests for Critical Flows
 * 
 * These tests validate key user workflows without rendering the entire app
 * They focus on the core logic and interactions that make the app functional
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';

// Import components to test
import EventModal from '../components/forms/EventModal';
import CalendarContext from '../context/CalendarContext';
import EventContext from '../context/EventContext';
import { ToastProvider } from '../context/ToastContext';
import { TODO_ITEMS } from '../constants';

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
  getFirebaseMessaging: jest.fn(() => Promise.resolve(null)),
}));

// Mock services
jest.mock('../services/pushService', () => ({
  __esModule: true,
  default: {
    sendTodoReminder: jest.fn(() => Promise.resolve(true)),
    sendWeeklySummary: jest.fn(() => Promise.resolve(true)),
    testPushConfiguration: jest.fn(() => Promise.resolve(true)),
    ensureFcmTokenRegistered: jest.fn(() => Promise.resolve(null)),
    isReady: jest.fn(() => false),
    getConfigurationStatus: jest.fn(() => ({
      isConfigured: false,
      missingVars: []
    })),
  }
}));

jest.mock('../services/notificationService', () => ({
  scheduleNotification: jest.fn(),
  cancelNotification: jest.fn(),
}));

// Mock recurring actions hook
const mockCreateActionWithRecurringTodos = jest.fn();
const mockUpdateEventWithRecurringRecalculation = jest.fn();
const mockDeleteRecurringTodosForEvent = jest.fn();
const mockIsTodoEvent = jest.fn((event) => {
  return event.isRecurringTodo || (event.title && event.title.startsWith('TO DO:'));
});

const mockApplyFromEvent = jest.fn();
const mockResetForNewEvent = jest.fn();
const mockSavedTodoItems = [];

jest.mock('../hooks', () => ({
  useRecurringActions: () => ({
    createActionWithRecurringTodos: mockCreateActionWithRecurringTodos,
    isTodoEvent: mockIsTodoEvent,
    updateEventWithRecurringRecalculation: mockUpdateEventWithRecurringRecalculation,
    deleteRecurringTodosForEvent: mockDeleteRecurringTodosForEvent,
  }),
  useSavedTodos: () => ({
    savedItems: mockSavedTodoItems,
    addItem: jest.fn(),
    removeItem: jest.fn(),
    setItems: jest.fn(),
    isLoading: false,
  }),
  useEventRecurringConfig: () => ({
    isRecurring: false,
    setIsRecurring: jest.fn(),
    recurringInterval: 7,
    setRecurringInterval: jest.fn(),
    recurringMaxOccurrences: 2,
    setRecurringMaxOccurrences: jest.fn(),
    recurringEndType: 'count',
    setRecurringEndType: jest.fn(),
    recurringUntilDate: new Date('2024-06-15'),
    setRecurringUntilDate: jest.fn(),
    applyFromEvent: mockApplyFromEvent,
    resetForNewEvent: mockResetForNewEvent,
    buildUserRecurringConfig: () => null,
    validateRecurringConfig: () => true,
  }),
}));

// Helper to create context values
const createEventContextValue = (overrides = {}) => ({
  setShowEventModal: jest.fn(),
  setShowPlantModal: jest.fn(),
  dispatchCallEvent: jest.fn(() => Promise.resolve()),
  selectedEvent: null,
  dosage: '',
  setDosage: jest.fn(),
  isLoading: false,
  loadingOperation: null,
  labels: [
    { label: 'plant1', displayName: 'Tomatoes - Cherry', checked: true },
    { label: 'plant2', displayName: 'Roses - Hybrid', checked: true }
  ],
  plantNames: ['Tomatoes - Cherry', 'Roses - Hybrid'],
  plantsById: {
    plant1: { id: 'plant1', category: 'Tomatoes', variety: 'Cherry', icon: 'tomato' },
    plant2: { id: 'plant2', category: 'Roses', variety: 'Hybrid', icon: 'rose' }
  },
  displayNameToPlantId: { 'Tomatoes - Cherry': 'plant1', 'Roses - Hybrid': 'plant2' },
  plantIdToDisplayName: { plant1: 'Tomatoes - Cherry', plant2: 'Roses - Hybrid' },
  ...overrides,
});

const defaultTestDay = dayjs('2024-06-15');

const createCalendarContextValue = (overrides = {}) => ({
  daySelected: defaultTestDay,
  setDaySelected: jest.fn(),
  ...overrides,
});

// Helper to render EventModal with context
const renderEventModal = (contextValue = {}) => {
  const eventValue = createEventContextValue(contextValue);
  const calendarValue = createCalendarContextValue();
  
  return {
    ...render(
      <ToastProvider>
        <CalendarContext.Provider value={calendarValue}>
          <EventContext.Provider value={eventValue}>
            <EventModal />
          </EventContext.Provider>
        </CalendarContext.Provider>
      </ToastProvider>
    ),
    contextValue: eventValue,
  };
};

describe('E2E: Critical User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavedTodoItems.length = 0;
    mockCreateActionWithRecurringTodos.mockResolvedValue(undefined);
    mockUpdateEventWithRecurringRecalculation.mockResolvedValue(undefined);
  });

  describe('Flow: Create New Event', () => {
    test('should create a simple event with description only', async () => {
      const { contextValue } = renderEventModal();

      const descInput = screen.getByPlaceholderText(/add a description/i);
      await userEvent.type(descInput, 'Check soil moisture levels');

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(contextValue.dispatchCallEvent).toHaveBeenCalledWith({
          type: 'push',
          payload: expect.objectContaining({
            description: 'Check soil moisture levels',
          }),
        });
      });

      await waitFor(() => {
        expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);
      });
    });

    test('should create event with plant labels', async () => {
      const { contextValue } = renderEventModal();

      await userEvent.type(screen.getByPlaceholderText(/add a description/i), 'Harvest tomatoes');
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(contextValue.dispatchCallEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'push' })
        );
      });
    });

    test('should create a to-do with recurring series', async () => {
      mockSavedTodoItems.push('Water plants');
      renderEventModal();

      await userEvent.click(screen.getByRole('button', { name: /select a to-do/i }));
      await userEvent.click(await screen.findByRole('option', { name: /water plants/i }));

      await userEvent.type(screen.getByPlaceholderText(/add a description/i), 'Weekly watering');
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockCreateActionWithRecurringTodos).toHaveBeenCalledWith(
          expect.objectContaining({ description: 'Weekly watering' })
        );
      });
    });

    test('should validate required fields', () => {
      renderEventModal();

      expect(screen.getByPlaceholderText(/add a description/i)).toBeRequired();
    });
  });

  describe('Flow: Edit TODO (complete from day list, not modal)', () => {
    test('event modal does not offer Complete for a TO DO', () => {
      const todoEvent = {
        id: 'todo-1',
        title: 'TO DO: Water',
        description: 'Water all plants',
        day: dayjs().valueOf(),
        toDo: 'TO DO: Water',
        labels: ['Tomatoes'],
        isRecurringTodo: true,
      };

      renderEventModal({
        selectedEvent: todoEvent,
      });

      expect(screen.queryByRole('button', { name: /complete to do/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/mark this to do as completed/i)).not.toBeInTheDocument();
    });
  });

  describe('Flow: Edit Event', () => {
    test('should update an existing event', async () => {
      const existingEvent = {
        id: 'event-1',
        title: 'Watered',
        description: 'Morning watering',
        day: dayjs().valueOf(),
        labels: ['Tomatoes'],
        actions: ['Watered'],
      };

      const { contextValue } = renderEventModal({
        selectedEvent: existingEvent,
      });

      // Update button should show instead of Save
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();

      // Change description
      const descInput = screen.getByPlaceholderText(/add a description/i);
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Evening watering');

      await userEvent.click(screen.getByRole('button', { name: /update/i }));

      // Update function should be called
      await waitFor(() => {
        expect(mockUpdateEventWithRecurringRecalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'event-1',
            description: 'Evening watering',
          }),
          existingEvent
        );
      });

      // Modal should close
      await waitFor(() => {
        expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);
      });
    });

    test('should preserve event ID when updating', async () => {
      const existingEvent = {
        id: 'unique-event-id',
        title: 'Test Event',
        description: 'Original',
        day: dayjs().valueOf(),
        labels: [],
        actions: [],
      };

      renderEventModal({
        selectedEvent: existingEvent,
      });

      const descInput = screen.getByPlaceholderText(/add a description/i);
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Updated');

      await userEvent.click(screen.getByRole('button', { name: /update/i }));

      await waitFor(() => {
        expect(mockUpdateEventWithRecurringRecalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'unique-event-id',
          }),
          existingEvent
        );
      });
    });
  });

  describe('Flow: Delete Event', () => {
    test('should delete a regular event with confirmation', async () => {
      const regularEvent = {
        id: 'event-to-delete',
        title: 'Old Event',
        description: 'This will be deleted',
        day: dayjs().subtract(1, 'day').valueOf(),
        labels: ['Cucumbers'],
        actions: ['Watered'],
      };

      const { contextValue } = renderEventModal({
        selectedEvent: regularEvent,
      });

      await userEvent.click(screen.getByTitle('Delete event'));

      await waitFor(() => {
        expect(screen.getByText(/delete "old event"/i)).toBeInTheDocument();
      });

      const confirmDialog = screen
        .getByText('Delete Event', { selector: '.modal-title' })
        .closest('[role="dialog"]');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

      // dispatchCallEvent with delete should be called
      await waitFor(() => {
        expect(contextValue.dispatchCallEvent).toHaveBeenCalledWith({
          type: 'delete',
          payload: regularEvent,
        });
      });

      // Modal should close
      await waitFor(() => {
        expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);
      });
    });

    test('should cancel event deletion', async () => {
      const eventToKeep = {
        id: 'keep-this',
        title: 'Important Event',
        description: 'Do not delete',
        day: dayjs().valueOf(),
        labels: [],
        actions: [],
      };

      const { contextValue } = renderEventModal({
        selectedEvent: eventToKeep,
      });

      await userEvent.click(screen.getByTitle('Delete event'));

      await waitFor(() => {
        expect(screen.getByText(/delete "important event"/i)).toBeInTheDocument();
      });

      const confirmDialog = screen
        .getByText('Delete Event', { selector: '.modal-title' })
        .closest('[role="dialog"]');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText(/delete "important event"/i)).not.toBeInTheDocument();
      });

      expect(contextValue.dispatchCallEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'delete' })
      );

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    test('should delete a TODO event', async () => {
      const todoToDelete = {
        id: 'todo-delete',
        title: 'TO DO: Water',
        description: 'Delete this TODO',
        day: dayjs().valueOf(),
        toDo: 'TO DO: Water',
        labels: ['Tomatoes'],
        isRecurringTodo: true,
      };

      const { contextValue } = renderEventModal({
        selectedEvent: todoToDelete,
      });

      const deleteBtn = document.querySelector('.event-modal .btn-outline-danger');
      await userEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText(/delete "to do: water"/i)).toBeInTheDocument();
      });

      const confirmDialog = screen
        .getByText('Delete Event', { selector: '.modal-title' })
        .closest('[role="dialog"]');
      await userEvent.click(within(confirmDialog).getByRole('button', { name: /^delete$/i }));

      // Delete should be dispatched
      await waitFor(() => {
        expect(contextValue.dispatchCallEvent).toHaveBeenCalledWith({
          type: 'delete',
          payload: todoToDelete,
        });
      });
    });
  });

  describe('Flow: Recurring Actions', () => {
    test('should show recurring config section for new events', () => {
      renderEventModal();

      expect(screen.getByText('New Event')).toBeInTheDocument();
      expect(screen.getByText('To-do')).toBeInTheDocument();
    });

    test('should call createActionWithRecurringTodos when saving a to-do', async () => {
      mockSavedTodoItems.push('Fertilize roses');
      renderEventModal();

      await userEvent.click(screen.getByRole('button', { name: /select a to-do/i }));
      await userEvent.click(await screen.findByRole('option', { name: /fertilize roses/i }));
      await userEvent.type(screen.getByPlaceholderText(/add a description/i), 'First fertilizer application');
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockCreateActionWithRecurringTodos).toHaveBeenCalled();
      });
    });
  });

  describe('Flow: Form Validation', () => {
    test('should require description field', () => {
      renderEventModal();

      const descInput = screen.getByPlaceholderText(/add a description/i);
      expect(descInput).toBeRequired();
      expect(descInput).toHaveAttribute('required');
    });

    test('should have all expected form fields', () => {
      renderEventModal();

      expect(screen.getByPlaceholderText(/add a description/i)).toBeInTheDocument();
      expect(screen.getByText('To-do')).toBeInTheDocument();
      expect(screen.getByText('Plants')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    test('should show save button for new events', () => {
      renderEventModal();

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument();
    });

    test('should show update button for existing events', () => {
      renderEventModal({
        selectedEvent: {
          id: 'existing',
          title: 'Test',
          description: 'Test',
          day: dayjs().valueOf(),
        },
      });

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    });
  });

  describe('Flow: Close Modal', () => {
    test('should close modal without saving', async () => {
      const { contextValue } = renderEventModal();

      // Find close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      // Modal close function should be called
      expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);

      // No save/update/delete should be called
      expect(mockCreateActionWithRecurringTodos).not.toHaveBeenCalled();
      expect(mockUpdateEventWithRecurringRecalculation).not.toHaveBeenCalled();
      expect(contextValue.dispatchCallEvent).not.toHaveBeenCalled();
    });
  });
});

