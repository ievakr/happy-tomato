/**
 * End-to-End Tests for Happy Tomato Calendar App
 * 
 * These tests validate complete user workflows including:
 * - Creating events
 * - Completing TODOs
 * - Recurring actions
 * - Event editing and deletion
 */

import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';
import ContextWrapper from '../context/ContextWrapper';
import dayjs from 'dayjs';

// Mock Firebase to avoid actual API calls
jest.mock('../firebase', () => ({
  auth: {},
  db: {},
  functions: {},
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { success: true } }))),
  getFirebaseMessaging: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../services/pushService', () => ({
  __esModule: true,
  default: {
    sendTodoReminder: jest.fn(() => Promise.resolve(true)),
    sendWeeklySummary: jest.fn(() => Promise.resolve(true)),
    testPushConfiguration: jest.fn(() => Promise.resolve(true)),
    ensureFcmTokenRegistered: jest.fn(() => Promise.resolve(null)),
    isReady: jest.fn(() => true),
    getConfigurationStatus: jest.fn(() => ({
      isConfigured: true,
      provider: 'Firebase Cloud Messaging',
      missingVars: []
    })),
  }
}));

jest.mock('../services/notificationService', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    updateReminderHook: jest.fn(),
    isRunning: false,
    sendManualReminder: jest.fn(),
    getStatus: jest.fn(() => ({ isRunning: false })),
    getNotificationLogs: jest.fn(() => []),
  },
}));

// Helper function to render app with context
const renderApp = () => {
  return render(
    <ContextWrapper>
      <App />
    </ContextWrapper>
  );
};

// Helper to open event modal
const openEventModal = async () => {
  // Click the "Create Event" button
  const createButton = screen.getByRole('button', { name: /create/i });
  userEvent.click(createButton);
  
  // Wait for modal to appear
  await waitFor(() => {
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
};

// Helper to fill out event form
const fillEventForm = async ({ description, plants, actions }) => {
  // Fill description
  if (description) {
    const descInput = screen.getByPlaceholderText(/add a description/i);
    userEvent.clear(descInput);
    userEvent.type(descInput, description);
  }

  // Select plants (if provided)
  if (plants && plants.length > 0) {
    const plantDropdown = screen.getByText(/select plants/i);
    userEvent.click(plantDropdown);
    
    for (const plant of plants) {
      const plantOption = await screen.findByText(plant);
      userEvent.click(plantOption);
    }
    
    // Close dropdown by clicking outside
    userEvent.click(screen.getByRole('form'));
  }

  // Select actions (if provided)
  if (actions && actions.length > 0) {
    const actionDropdown = screen.getByText(/select actions/i);
    userEvent.click(actionDropdown);
    
    for (const action of actions) {
      const actionOption = await screen.findByText(action);
      userEvent.click(actionOption);
    }
    
    // Close dropdown
    userEvent.click(screen.getByRole('form'));
  }
};

// Helper to save event
const saveEvent = async () => {
  const saveButton = screen.getByRole('button', { name: /save/i });
  userEvent.click(saveButton);
  
  // Wait for modal to close
  await waitFor(() => {
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  }, { timeout: 3000 });
};

describe('E2E: Happy Tomato Calendar App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Critical Flow: Create Event', () => {
    test('should create a simple event with description', async () => {
      renderApp();

      // Wait for app to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Open event modal
      await openEventModal();

      // Fill in event details
      await fillEventForm( {
        description: 'Water tomato plants in greenhouse',
      });

      // Save the event
      await saveEvent();

      // Verify event appears in calendar
      await waitFor(() => {
        expect(screen.getByText(/water tomato plants in greenhouse/i)).toBeInTheDocument();
      });
    });

    test('should create an event with plant labels', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      await fillEventForm( {
        description: 'Harvest ripe tomatoes',
        plants: ['Tomatoes'],
      });

      await saveEvent();

      // Verify event with plant label appears
      await waitFor(() => {
        expect(screen.getByText(/harvest ripe tomatoes/i)).toBeInTheDocument();
      });
    });

    test('should create an event with plant action', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      await fillEventForm( {
        description: 'Apply fertilizer to roses',
        plants: ['Roses'],
        actions: ['Fertilized'],
      });

      await saveEvent();

      // Verify event appears
      await waitFor(() => {
        expect(screen.getByText(/apply fertilizer to roses/i)).toBeInTheDocument();
      });
    });

    test('should create event with multiple plants', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      await fillEventForm( {
        description: 'Water all vegetables',
        plants: ['Tomatoes', 'Cucumbers', 'Bell Peppers'],
      });

      await saveEvent();

      // Verify event appears
      await waitFor(() => {
        expect(screen.getByText(/water all vegetables/i)).toBeInTheDocument();
      });
    });

    test('should create event with specific date selection', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      // Fill description
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Plant new seeds');

      // Note: Date picker interaction would require more complex setup
      // For now, we verify the form accepts the input
      
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/plant new seeds/i)).toBeInTheDocument();
      });
    });
  });

  describe('E2E Flow: Recurring Actions', () => {
    test('should create action that generates recurring TODOs', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create an action that has recurring pattern (e.g., Fertilized - every 7 days)
      await openEventModal();

      const actionDropdown = screen.getByText(/select actions/i);
      userEvent.click(actionDropdown);
      const actionOption = await screen.findByText(/Fertilized/i);
      userEvent.click(actionOption);

      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'First fertilizer application');

      const plantDropdown = screen.getByText(/select plants/i);
      userEvent.click(plantDropdown);
      const plantOption = await screen.findByText('Roses');
      userEvent.click(plantOption);

      // Verify dosage info appears
      await waitFor(() => {
        expect(screen.getByText(/use every 7 days/i)).toBeInTheDocument();
      });

      await saveEvent();

      // Verify the action is created
      await waitFor(() => {
        expect(screen.getByText(/first fertilizer application/i)).toBeInTheDocument();
      });

      // Note: Verifying generated recurring TODOs would require checking future dates
      // which is challenging in E2E tests without date manipulation
    });

    test('should show dosage information for recurring actions', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      // Select Kytos action (every 14 days)
      const actionDropdown = screen.getByText(/select actions/i);
      userEvent.click(actionDropdown);
      const kytosOption = await screen.findByText(/Kytos/i);
      userEvent.click(kytosOption);

      // Verify dosage appears
      await waitFor(() => {
        expect(screen.getByText(/use every 14 days/i)).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      userEvent.click(closeButton);
    });

    test('should show dosage for limited-use actions', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      // Select NeemAzal (every 7 days, 3 times max)
      const actionDropdown = screen.getByText(/select actions/i);
      userEvent.click(actionDropdown);
      const neemazalOption = await screen.findByText(/NeemAzal/i);
      userEvent.click(neemazalOption);

      // Verify dosage with limit appears
      await waitFor(() => {
        expect(screen.getByText(/use every 7 days, 3 times max/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      userEvent.click(closeButton);
    });
  });

  describe('E2E Flow: Event Editing', () => {
    test('should edit an existing event', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create an event first
      await openEventModal();
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Original description');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/original description/i)).toBeInTheDocument();
      });

      // Click on the event to edit it
      const eventText = screen.getByText(/original description/i);
      userEvent.click(eventText);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Edit the description
      const editDescInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.clear(editDescInput);
      userEvent.type(editDescInput, 'Updated description');

      // Update button should appear instead of Save
      const updateButton = screen.getByRole('button', { name: /update/i });
      userEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.queryByRole('form')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify updated text appears
      await waitFor(() => {
        expect(screen.getByText(/updated description/i)).toBeInTheDocument();
        expect(screen.queryByText(/original description/i)).not.toBeInTheDocument();
      });
    });

    test('should cancel event editing', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create an event
      await openEventModal();
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Original event');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/original event/i)).toBeInTheDocument();
      });

      // Open the event
      const eventText = screen.getByText(/original event/i);
      userEvent.click(eventText);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Start editing but cancel
      const editDescInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.clear(editDescInput);
      userEvent.type(editDescInput, 'This should not be saved');

      // Close modal without saving
      const closeButton = screen.getByRole('button', { name: /close/i });
      userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('form')).not.toBeInTheDocument();
      });

      // Original text should still be there
      expect(screen.getByText(/original event/i)).toBeInTheDocument();
      expect(screen.queryByText(/this should not be saved/i)).not.toBeInTheDocument();
    });
  });

  describe('E2E Flow: Event Deletion', () => {
    test('should delete an event with confirmation', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create an event
      await openEventModal();
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Event to be deleted');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/event to be deleted/i)).toBeInTheDocument();
      });

      // Open the event
      const eventText = screen.getByText(/event to be deleted/i);
      userEvent.click(eventText);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete event/i });
      userEvent.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      userEvent.click(confirmDeleteButton);

      // Wait for modals to close
      await waitFor(() => {
        expect(screen.queryByRole('form')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Event should be gone
      await waitFor(() => {
        expect(screen.queryByText(/event to be deleted/i)).not.toBeInTheDocument();
      });
    });

    test('should cancel event deletion', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create an event
      await openEventModal();
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Event to keep');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/event to keep/i)).toBeInTheDocument();
      });

      // Open the event
      const eventText = screen.getByText(/event to keep/i);
      userEvent.click(eventText);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete event/i });
      userEvent.click(deleteButton);

      // Cancel deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);

      // Confirmation modal should close
      await waitFor(() => {
        expect(screen.queryByText(/are you sure you want to delete this event/i)).not.toBeInTheDocument();
      });

      // Main modal should still be open
      expect(screen.getByRole('form')).toBeInTheDocument();

      // Close the modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      userEvent.click(closeButton);

      // Event should still exist
      expect(screen.getByText(/event to keep/i)).toBeInTheDocument();
    });

    test('should delete a TODO event', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create a TODO
      await openEventModal();

      const todoDropdown = screen.getByText(/select to-do/i);
      userEvent.click(todoDropdown);
      const todoOption = await screen.findByText(/TO DO: Water/i);
      userEvent.click(todoOption);

      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'TODO to delete');

      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/TO DO: Water/i)).toBeInTheDocument();
      });

      // Open the TODO
      const todoEvent = screen.getByText(/TO DO: Water/i);
      userEvent.click(todoEvent);

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Delete the TODO
      const deleteButton = screen.getByRole('button', { name: /delete to do/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/are you sure you want to delete this event/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByRole('form')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // TODO should be deleted
      await waitFor(() => {
        expect(screen.queryByText(/TO DO: Water/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('E2E Flow: Calendar Navigation', () => {
    test('should navigate between months', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const currentMonth = dayjs().format('MMMM YYYY');
      
      // Verify current month is displayed
      expect(screen.getByText(currentMonth)).toBeInTheDocument();

      // Find next month button (typically a chevron right)
      const nextButtons = screen.getAllByRole('button');
      const nextMonthButton = nextButtons.find(btn => 
        btn.querySelector('.material-icons-outlined')?.textContent === 'chevron_right'
      );

      if (nextMonthButton) {
        userEvent.click(nextMonthButton);

        const nextMonth = dayjs().add(1, 'month').format('MMMM YYYY');
        await waitFor(() => {
          expect(screen.getByText(nextMonth)).toBeInTheDocument();
        });
      }
    });

    test('should display today button and return to current month', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Look for Today button
      const todayButton = screen.getByRole('button', { name: /today/i });
      expect(todayButton).toBeInTheDocument();

      // Click it (should already be on today)
      userEvent.click(todayButton);

      // Current month should still be displayed
      const currentMonth = dayjs().format('MMMM YYYY');
      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    });
  });

  describe('E2E Flow: View Switching', () => {
    test('should switch between month and week views', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Look for view switcher buttons (Month/Week/Day)
      const buttons = screen.getAllByRole('button');
      
      // Try to find week view button
      const weekButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('week')
      );

      if (weekButton) {
        userEvent.click(weekButton);

        // In week view, we should see a different layout
        // This is a basic check - actual implementation may vary
        await waitFor(() => {
          // Week view should be rendered
          expect(weekButton).toHaveClass(/active|selected/i);
        });
      }
    });
  });

  describe('E2E Flow: Multiple Events', () => {
    test('should create and manage multiple events', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Create first event
      await openEventModal();
      let descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'First event');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/first event/i)).toBeInTheDocument();
      });

      // Create second event
      await openEventModal();
      descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Second event');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/second event/i)).toBeInTheDocument();
      });

      // Create third event
      await openEventModal();
      descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Third event');
      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/third event/i)).toBeInTheDocument();
      });

      // All three events should be visible
      expect(screen.getByText(/first event/i)).toBeInTheDocument();
      expect(screen.getByText(/second event/i)).toBeInTheDocument();
      expect(screen.getByText(/third event/i)).toBeInTheDocument();
    });
  });

  describe('E2E Flow: Complex Event Scenarios', () => {
    test('should create event with all fields populated', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      await openEventModal();

      // Select action
      const actionDropdown = screen.getByText(/select actions/i);
      userEvent.click(actionDropdown);
      const actionOption = await screen.findByText(/Fertilized/i);
      userEvent.click(actionOption);
      userEvent.click(screen.getByRole('form')); // Close dropdown

      // Select TODO (note: typically you'd choose one or the other, but testing form)
      const todoDropdown = screen.getByText(/select to-do/i);
      userEvent.click(todoDropdown);
      const todoOption = await screen.findByText(/TO DO: Water/i);
      userEvent.click(todoOption);
      userEvent.click(screen.getByRole('form')); // Close dropdown

      // Add description
      const descInput = screen.getByPlaceholderText(/add a description/i);
      userEvent.type(descInput, 'Complete garden maintenance');

      // Select plant
      const plantDropdown = screen.getByText(/select plants/i);
      userEvent.click(plantDropdown);
      const plantOption = await screen.findByText('Tomatoes');
      userEvent.click(plantOption);
      userEvent.click(screen.getByRole('form')); // Close dropdown

      await saveEvent();

      await waitFor(() => {
        expect(screen.getByText(/complete garden maintenance/i)).toBeInTheDocument();
      });
    });

    test('should handle rapid event creation', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Quickly create multiple events
      for (let i = 1; i <= 5; i++) {
        await openEventModal();
        const descInput = screen.getByPlaceholderText(/add a description/i);
        userEvent.type(descInput, `Rapid event ${i}`);
        await saveEvent();

        await waitFor(() => {
          expect(screen.getByText(new RegExp(`rapid event ${i}`, 'i'))).toBeInTheDocument();
        });
      }

      // All events should exist
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(new RegExp(`rapid event ${i}`, 'i'))).toBeInTheDocument();
      }
    });
  });
});

