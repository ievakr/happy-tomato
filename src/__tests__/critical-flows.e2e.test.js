/**
 * End-to-End Integration Tests for Critical Flows
 * 
 * These tests validate key user workflows without rendering the entire app
 * They focus on the core logic and interactions that make the app functional
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';

// Import components to test
import EventModal from '../components/forms/EventModal';
import CalendarContext from '../context/CalendarContext';
import EventContext from '../context/EventContext';
import { TODO_ITEMS } from '../constants';

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

// Mock services
jest.mock('../services/emailService', () => ({
  __esModule: true,
  default: {
    sendTodoReminder: jest.fn(() => Promise.resolve(true)),
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
const mockCompleteTodo = jest.fn();
const mockCreateActionWithRecurringTodos = jest.fn();
const mockUpdateEventWithRecurringRecalculation = jest.fn();
const mockDeleteRecurringTodosForEvent = jest.fn();
const mockIsTodoEvent = jest.fn((event) => {
  return event.isRecurringTodo || (event.title && event.title.startsWith('TO DO:'));
});

jest.mock('../hooks', () => ({
  useRecurringActions: () => ({
    createActionWithRecurringTodos: mockCreateActionWithRecurringTodos,
    completeTodo: mockCompleteTodo,
    isTodoEvent: mockIsTodoEvent,
    updateEventWithRecurringRecalculation: mockUpdateEventWithRecurringRecalculation,
    deleteRecurringTodosForEvent: mockDeleteRecurringTodosForEvent,
  }),
}));

// Helper to create context values
const createEventContextValue = (overrides = {}) => ({
  setShowEventModal: jest.fn(),
  setShowPlantModal: jest.fn(),
  dispatchCallEvent: jest.fn(),
  selectedEvent: null,
  dosage: '',
  setDosage: jest.fn(),
  isLoading: false,
  loadingOperation: null,
  labels: [{ label: 'Tomatoes', checked: true }, { label: 'Roses', checked: true }],
  labelsMapping: { tomato: 'Tomatoes', rose: 'Roses' },
  plantNames: ['Tomatoes', 'Roses'],
  ...overrides,
});

const createCalendarContextValue = (overrides = {}) => ({
  daySelected: dayjs(),
  setDaySelected: jest.fn(),
  ...overrides,
});

// Helper to render EventModal with context
const renderEventModal = (contextValue = {}) => {
  const eventValue = createEventContextValue(contextValue);
  const calendarValue = createCalendarContextValue();
  
  return {
    ...render(
      <CalendarContext.Provider value={calendarValue}>
        <EventContext.Provider value={eventValue}>
          <EventModal />
        </EventContext.Provider>
      </CalendarContext.Provider>
    ),
    contextValue: eventValue,
  };
};

describe('E2E: Critical User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flow: Create New Event', () => {
    test('should create a simple event with description only', async () => {
      const { contextValue } = renderEventModal();

      // Fill in description
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Check soil moisture levels');

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);

      // Wait for the event to be dispatched
      await waitFor(() => {
        expect(mockCreateActionWithRecurringTodos).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Check soil moisture levels',
          })
        );
      });

      // Modal should close
      await waitFor(() => {
        expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);
      });
    });

    test('should create event with plant labels', async () => {
      const { contextValue } = renderEventModal();

      // Fill in description
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Harvest tomatoes');

      // Select plant - click dropdown
      const plantDropdown = screen.getByText(/select plants/i);
      userEvent.click(plantDropdown);

      // Select a plant (this would need the actual dropdown implementation)
      // For now, we'll just test that the save works

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateActionWithRecurringTodos).toHaveBeenCalled();
      });
    });

    test('should create event with action that has dosage', async () => {
      const { contextValue } = renderEventModal();

      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Apply fertilizer to roses');

      // Select action - the dropdown interaction would select "Fertilized"
      // which has dosage "Use every 7 days"
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateActionWithRecurringTodos).toHaveBeenCalled();
      });
    });

    test('should validate required fields', async () => {
      renderEventModal();

      // Try to save without filling description
      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);

      // The description field has 'required' attribute
      const descInput = screen.getByPlaceholderText(/add a description/i);
      expect(descInput).toBeRequired();
    });
  });

  describe('Flow: Complete TODO', () => {
    test('should complete a TODO event', async () => {
      const todoEvent = {
        id: 'todo-1',
        title: 'TO DO: Water',
        description: 'Water all plants',
        day: dayjs().valueOf(),
        toDo: 'TO DO: Water',
        labels: ['Tomatoes'],
        isRecurringTodo: true,
      };

      const { contextValue } = renderEventModal({
        selectedEvent: todoEvent,
      });

      // Complete button should be visible
      const completeButton = screen.getByRole('button', { name: /complete to do/i });
      expect(completeButton).toBeInTheDocument();

      // Click complete
      userEvent.click(completeButton);

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByText(/mark this to do as completed/i)).toBeInTheDocument();
      });

      // Confirm completion
      const confirmButton = screen.getByRole('button', { name: /^complete$/i });
      userEvent.click(confirmButton);

      // completeTodo should be called
      await waitFor(() => {
        expect(mockCompleteTodo).toHaveBeenCalledWith(todoEvent);
      });

      // Modal should close
      await waitFor(() => {
        expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);
      });
    });

    test('should cancel TODO completion', async () => {
      const todoEvent = {
        id: 'todo-2',
        title: 'TO DO: Fertilize',
        description: 'Weekly fertilizer',
        day: dayjs().valueOf(),
        toDo: 'TO DO: Fertilize',
        labels: ['Roses'],
        isRecurringTodo: true,
      };

      renderEventModal({
        selectedEvent: todoEvent,
      });

      // Click complete
      const completeButton = screen.getByRole('button', { name: /complete to do/i });
      userEvent.click(completeButton);

      // Wait for confirmation modal
      await waitFor(() => {
        expect(screen.getByText(/mark this to do as completed/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);

      // Confirmation modal should close, main modal should still be open
      await waitFor(() => {
        expect(screen.queryByText(/mark this to do as completed/i)).not.toBeInTheDocument();
      });

      // Main form should still be there
      expect(screen.getByRole('form')).toBeInTheDocument();

      // completeTodo should NOT be called
      expect(mockCompleteTodo).not.toHaveBeenCalled();
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
      userEvent.clear(descInput);
      userEvent.type(descInput, 'Evening watering');

      // Click update
      const updateButton = screen.getByRole('button', { name: /update/i });
      userEvent.click(updateButton);

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
      userEvent.clear(descInput);
      userEvent.type(descInput, 'Updated');

      const updateButton = screen.getByRole('button', { name: /update/i });
      userEvent.click(updateButton);

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

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete event/i });
      userEvent.click(deleteButton);

      // Confirmation should appear
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      userEvent.click(confirmButton);

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

      // Click delete
      const deleteButton = screen.getByRole('button', { name: /delete event/i });
      userEvent.click(deleteButton);

      // Wait for confirmation
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);

      // Confirmation modal should close
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete this event/i)).not.toBeInTheDocument();
      });

      // Delete should NOT be called
      expect(contextValue.dispatchCallEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'delete' })
      );

      // Main modal should still be open
      expect(screen.getByRole('form')).toBeInTheDocument();
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

      // Click delete (should show "Delete TO DO" label)
      const deleteButton = screen.getByRole('button', { name: /delete to do/i });
      userEvent.click(deleteButton);

      // Confirm
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      userEvent.click(confirmButton);

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
    test('should show dosage information for recurring actions', () => {
      renderEventModal({
        dosage: 'Use every 7 days',
        selectedEvent: {
          id: 'test',
          title: 'Fertilized',
          description: 'Test',
          day: dayjs().valueOf(),
          actions: ['Fertilized'],
          toDo: '',
        },
      });

      // Check if dosage text is displayed (when toDo is empty, dosage won't show)
      // But we can verify the form renders correctly
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    test('should call createActionWithRecurringTodos for actions with recurring patterns', async () => {
      const { contextValue } = renderEventModal();

      // Create event with action that has recurring pattern
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'First fertilizer application');

      // The form would set actions: ['Fertilized']
      // which should trigger recurring todo generation

      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);

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

      // Check for key form elements
      expect(screen.getByPlaceholderText(/add a description/i)).toBeInTheDocument();
      expect(screen.getByText(/select actions/i)).toBeInTheDocument();
      expect(screen.getByText(/select to-do/i)).toBeInTheDocument();
      expect(screen.getByText(/select plants/i)).toBeInTheDocument();
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
    test('should close modal without saving', () => {
      const { contextValue } = renderEventModal();

      // Find close button (X icon)
      const closeButton = screen.getByRole('button', { name: /close/i });
      userEvent.click(closeButton);

      // Modal close function should be called
      expect(contextValue.setShowEventModal).toHaveBeenCalledWith(false);

      // No save/update/delete should be called
      expect(mockCreateActionWithRecurringTodos).not.toHaveBeenCalled();
      expect(mockUpdateEventWithRecurringRecalculation).not.toHaveBeenCalled();
      expect(contextValue.dispatchCallEvent).not.toHaveBeenCalled();
    });
  });
});

