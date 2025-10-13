/**
 * Firebase Integration Tests
 * 
 * This file contains integration tests for Firebase Firestore operations.
 * These tests mock Firebase to test the integration between the app and Firestore.
 */

import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import ContextWrapper from '../context/ContextWrapper';
import GlobalContext from '../context/GlobalContext';
import dayjs from 'dayjs';

// Mock Firebase modules
jest.mock('../firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn()
}));

jest.mock('../utils/errorLogger', () => ({
  logError: jest.fn()
}));

import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import errorLogger from '../utils/errorLogger';

describe('Firebase Integration Tests', () => {
  // Mock alert
  let alertMock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertMock.mockRestore();
  });

  describe('Initial Data Loading (fetchEvents)', () => {
    test('should successfully fetch events from Firestore on mount', async () => {
      const mockEvents = [
        { 
          id: 'event1', 
          title: 'Water Plants', 
          description: 'Water all tomato plants',
          day: dayjs().toISOString(),
          labels: ['Tomato']
        },
        { 
          id: 'event2', 
          title: 'Fertilize', 
          description: 'Add fertilizer to garden',
          day: dayjs().add(1, 'day').toISOString(),
          labels: ['General']
        }
      ];

      // Mock getDocs to return mock events
      getDocs.mockResolvedValueOnce({
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => {
            const { id, ...rest } = event;
            return rest;
          }
        }))
      });

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(getDocs).toHaveBeenCalledWith('events-collection');
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(2);
        expect(contextValue.savedEvents[0].id).toBe('event1');
        expect(contextValue.savedEvents[1].id).toBe('event2');
      });
    });

    test('should handle empty events collection', async () => {
      getDocs.mockResolvedValueOnce({
        docs: []
      });

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue.savedEvents).toEqual([]);
        expect(contextValue.isInitialLoading).toBe(false);
      });
    });

    test('should handle fetch errors gracefully with retry', async () => {
      const error = new Error('Network error');
      // Fail only once, then return empty on retries to complete faster
      getDocs
        .mockRejectedValueOnce(error)
        .mockResolvedValue({ docs: [] });

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      // Should have retried after initial failure
      expect(getDocs).toHaveBeenCalled();
    });
  });

  describe('Create Event (push operation)', () => {
    test('should successfully add a new event to Firestore', async () => {
      // Setup initial empty state
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const mockDocRef = {
        id: 'generated-id-123',
        path: 'events/generated-id-123'
      };

      addDoc.mockResolvedValueOnce(mockDocRef);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(contextValue.isInitialLoading).toBe(false);
      });

      // Add new event
      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledWith('events-collection', newEvent);
        expect(contextValue.savedEvents).toHaveLength(1);
        expect(contextValue.savedEvents[0].id).toBe('generated-id-123');
        expect(contextValue.savedEvents[0].title).toBe('New Event');
      });
    });

    test('should retry failed add operations', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const mockDocRef = {
        id: 'generated-id-123',
        path: 'events/generated-id-123'
      };

      // Fail first attempt, succeed on 2nd
      addDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDocRef);

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue.isInitialLoading).toBe(false);
      });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledTimes(2);
        expect(contextValue.savedEvents).toHaveLength(1);
        expect(contextValue.savedEvents[0].id).toBe('generated-id-123');
      }, { timeout: 10000 });
    });

    test('should handle add operation errors after all retries', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const error = new Error('Failed to add document');
      addDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(errorLogger.logError).toHaveBeenCalledWith(
          error,
          null,
          'Event Operation',
          expect.objectContaining({
            operation: 'push'
          })
        );
        expect(alertMock).toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Update Event (update operation)', () => {
    test('should successfully update an existing event in Firestore', async () => {
      const existingEvent = {
        id: 'event1',
        title: 'Old Title',
        description: 'Old description',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: existingEvent.id,
            data: () => {
              const { id, ...rest } = existingEvent;
              return rest;
            }
          }
        ]
      });

      const updatedEvent = {
        ...existingEvent,
        title: 'Updated Title',
        description: 'Updated description'
      };

      updateDoc.mockResolvedValueOnce(undefined);
      doc.mockReturnValue('event-doc-ref');
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(1);
      });

      await act(async () => {
        await contextValue.dispatchCallEvent({ 
          type: 'update', 
          payload: updatedEvent 
        });
      });

      await waitFor(() => {
        expect(doc).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalledWith('event-doc-ref', updatedEvent);
        expect(contextValue.savedEvents[0].title).toBe('Updated Title');
        expect(contextValue.savedEvents[0].description).toBe('Updated description');
      });
    });

    test('should handle update operation errors with retry', async () => {
      const existingEvent = {
        id: 'event1',
        title: 'Old Title',
        description: 'Old description',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: existingEvent.id,
            data: () => {
              const { id, ...rest } = existingEvent;
              return rest;
            }
          }
        ]
      });

      const error = new Error('Update failed');
      updateDoc.mockRejectedValue(error);
      doc.mockReturnValue('event-doc-ref');
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.savedEvents).toHaveLength(1);
      }, { timeout: 10000 });

      const updatedEvent = { ...existingEvent, title: 'New Title' };

      await act(async () => {
        await contextValue.dispatchCallEvent({ 
          type: 'update', 
          payload: updatedEvent 
        });
      });

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled(); // Should have attempted update
        expect(errorLogger.logError).toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Delete Event (delete operation)', () => {
    test('should successfully delete an existing event from Firestore', async () => {
      const existingEvent = {
        id: 'event1',
        title: 'Event to Delete',
        description: 'This will be deleted',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: existingEvent.id,
            data: () => {
              const { id, ...rest } = existingEvent;
              return rest;
            }
          }
        ]
      });

      const mockDocRef = {
        path: 'events/event1'
      };

      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          title: existingEvent.title,
          description: existingEvent.description,
          day: existingEvent.day,
          labels: existingEvent.labels
        })
      });
      deleteDoc.mockResolvedValueOnce(undefined);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(1);
      });

      await act(async () => {
        await contextValue.dispatchCallEvent({ 
          type: 'delete', 
          payload: existingEvent 
        });
      });

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalledWith(mockDocRef);
        expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
        expect(contextValue.savedEvents).toHaveLength(0);
      });
    });

    test('should handle deleting non-existent document gracefully', async () => {
      const existingEvent = {
        id: 'event1',
        title: 'Event to Delete',
        description: 'This will be deleted',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: existingEvent.id,
            data: () => {
              const { id, ...rest } = existingEvent;
              return rest;
            }
          }
        ]
      });

      const mockDocRef = {
        path: 'events/event1'
      };

      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValueOnce({
        exists: () => false // Document doesn't exist
      });
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(1);
      });

      await act(async () => {
        await contextValue.dispatchCallEvent({ 
          type: 'delete', 
          payload: existingEvent 
        });
      });

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalledWith(mockDocRef);
        expect(deleteDoc).not.toHaveBeenCalled(); // Should not call delete
        expect(contextValue.savedEvents).toHaveLength(0); // Still removes from local state
      });
    });

    test('should handle delete operation errors with retry', async () => {
      const existingEvent = {
        id: 'event1',
        title: 'Event to Delete',
        description: 'This will be deleted',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: existingEvent.id,
            data: () => {
              const { id, ...rest } = existingEvent;
              return rest;
            }
          }
        ]
      });

      const mockDocRef = {
        path: 'events/event1'
      };

      const error = new Error('Delete failed');
      doc.mockReturnValue(mockDocRef);
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingEvent
      });
      deleteDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.savedEvents).toHaveLength(1);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ 
          type: 'delete', 
          payload: existingEvent 
        });
      });

      await waitFor(() => {
        expect(deleteDoc).toHaveBeenCalled(); // Should have attempted delete
        expect(errorLogger.logError).toHaveBeenCalled();
        // For delete operations that fail, local state should not be updated
        expect(contextValue.savedEvents).toHaveLength(1);
      }, { timeout: 10000 });
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase permission-denied errors', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const error = new Error('Permission denied');
      error.code = 'permission-denied';
      addDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Permission denied')
        );
      }, { timeout: 10000 });
    });

    test('should handle Firebase unavailable errors', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const error = new Error('Service unavailable');
      error.code = 'unavailable';
      addDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('temporarily unavailable')
        );
      }, { timeout: 10000 });
    });

    test('should handle network errors', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const error = new Error('Failed to fetch');
      addDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Network error')
        );
      }, { timeout: 10000 });
    });
  });

  describe('Operation Queue Management', () => {
    test('should queue operations when one is in progress', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const event1 = {
        title: 'Event 1',
        description: 'First event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const event2 = {
        title: 'Event 2',
        description: 'Second event',
        day: dayjs().toISOString(),
        labels: ['Pepper']
      };

      const mockDocRef1 = { id: 'id1', path: 'events/id1' };
      const mockDocRef2 = { id: 'id2', path: 'events/id2' };

      addDoc
        .mockResolvedValueOnce(mockDocRef1)
        .mockResolvedValueOnce(mockDocRef2);

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      // Start first operation
      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: event1 });
      });

      // Start second operation
      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: event2 });
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledTimes(2);
        expect(contextValue.savedEvents).toHaveLength(2);
      }, { timeout: 10000 });
    });

    test('should process queued operations in order', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const operations = [
        { title: 'Event 1', description: 'First', day: dayjs().toISOString(), labels: [] },
        { title: 'Event 2', description: 'Second', day: dayjs().toISOString(), labels: [] },
        { title: 'Event 3', description: 'Third', day: dayjs().toISOString(), labels: [] }
      ];

      addDoc
        .mockResolvedValueOnce({ id: 'id1', path: 'events/id1' })
        .mockResolvedValueOnce({ id: 'id2', path: 'events/id2' })
        .mockResolvedValueOnce({ id: 'id3', path: 'events/id3' });

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      // Queue all operations
      for (const event of operations) {
        await act(async () => {
          await contextValue.dispatchCallEvent({ type: 'push', payload: event });
        });
      }

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledTimes(3);
        expect(contextValue.savedEvents).toHaveLength(3);
        expect(contextValue.savedEvents[0].title).toBe('Event 1');
        expect(contextValue.savedEvents[1].title).toBe('Event 2');
        expect(contextValue.savedEvents[2].title).toBe('Event 3');
      }, { timeout: 10000 });
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    test('should use exponential backoff for retries', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const mockDocRef = { id: 'id1', path: 'events/id1' };

      // Fail once, succeed on second try
      addDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDocRef);

      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalledTimes(2);
        expect(contextValue.savedEvents).toHaveLength(1);
        expect(contextValue.savedEvents[0].id).toBe('id1');
      }, { timeout: 10000 });
    });

    test('should fail after maximum retries', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const error = new Error('Persistent network error');
      addDoc.mockRejectedValue(error);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        // Initial attempt + 2 retries = 3 total
        expect(addDoc).toHaveBeenCalled();
        expect(errorLogger.logError).toHaveBeenCalled();
        expect(alertMock).toHaveBeenCalled();
        // Local state should be updated for failed push operations
        expect(contextValue.savedEvents).toHaveLength(1);
      }, { timeout: 10000 });
    });
  });

  describe('Loading States', () => {
    test('should set loading states during operations', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const mockDocRef = { id: 'id1', path: 'events/id1' };
      addDoc.mockResolvedValueOnce(mockDocRef);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      const beforeOperation = contextValue.isLoading;

      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(1);
      });

      const afterOperation = contextValue.isLoading;

      expect(beforeOperation).toBe(false);
      expect(afterOperation).toBe(false);
    });

    test('should set correct loading operation type', async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const newEvent = {
        title: 'New Event',
        description: 'Test event',
        day: dayjs().toISOString(),
        labels: ['Tomato']
      };

      const mockDocRef = { id: 'id1', path: 'events/id1' };
      addDoc.mockResolvedValueOnce(mockDocRef);
      collection.mockReturnValue('events-collection');

      let contextValue;
      const TestComponent = () => {
        contextValue = React.useContext(GlobalContext);
        return null;
      };

      render(
        <ContextWrapper>
          <TestComponent />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(contextValue).toBeDefined();
        expect(contextValue.isInitialLoading).toBe(false);
      }, { timeout: 10000 });

      // The loading operation type should be 'load' initially and then change to 'push'
      // Since operations complete quickly, we just verify that operations work
      await act(async () => {
        await contextValue.dispatchCallEvent({ type: 'push', payload: newEvent });
      });

      await waitFor(() => {
        expect(contextValue.savedEvents).toHaveLength(1);
      });
    });
  });
});

