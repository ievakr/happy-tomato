import { renderHook, act } from '@testing-library/react';
import { useEvents } from './useEvents';
import dayjs from 'dayjs';
import { EVENT_ACTIONS, DATE_FORMATS } from '../constants';
import { createWrapper } from '../test-utils/test-wrapper';

// Mock dependencies
jest.mock('../context/GlobalContext', () => ({
  __esModule: true,
  default: {
    filteredEvents: [],
    dispatchCallEvent: jest.fn(),
    selectedEvent: null,
    setSelectedEvent: jest.fn(),
    setDaySelected: jest.fn(),
    setShowEventModal: jest.fn()
  }
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => ({
    filteredEvents: [],
    dispatchCallEvent: jest.fn(),
    selectedEvent: null,
    setSelectedEvent: jest.fn(),
    setDaySelected: jest.fn(),
    setShowEventModal: jest.fn()
  }))
}));

describe('useEvents', () => {
  let mockDispatch;
  let mockSetSelectedEvent;
  let mockSetDaySelected;
  let mockSetShowEventModal;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockSetSelectedEvent = jest.fn();
    mockSetDaySelected = jest.fn();
    mockSetShowEventModal = jest.fn();

    const React = require('react');
    React.useContext.mockReturnValue({
      filteredEvents: [],
      dispatchCallEvent: mockDispatch,
      selectedEvent: null,
      setSelectedEvent: mockSetSelectedEvent,
      setDaySelected: mockSetDaySelected,
      setShowEventModal: mockSetShowEventModal
    });
  });

  describe('getEventsForDay', () => {
    test('should return events for a specific day', () => {
      const today = dayjs();
      const tomorrow = today.add(1, 'day');
      
      const React = require('react');
      React.useContext.mockReturnValue({
        filteredEvents: [
          {
            id: '1',
            title: 'Event 1',
            day: today.toISOString()
          },
          {
            id: '2',
            title: 'Event 2',
            day: tomorrow.toISOString()
          },
          {
            id: '3',
            title: 'Event 3',
            day: today.toISOString()
          }
        ],
        dispatchCallEvent: mockDispatch,
        selectedEvent: null,
        setSelectedEvent: mockSetSelectedEvent,
        setDaySelected: mockSetDaySelected,
        setShowEventModal: mockSetShowEventModal
      });

      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      const events = result.current.getEventsForDay(today);

      expect(events).toHaveLength(2);
      expect(events.map(e => e.id)).toEqual(['1', '3']);
    });

    test('should return empty array when no events for day', () => {
      const today = dayjs();
      
      const React = require('react');
      React.useContext.mockReturnValue({
        filteredEvents: [
          {
            id: '1',
            title: 'Event 1',
            day: today.add(1, 'day').toISOString()
          }
        ],
        dispatchCallEvent: mockDispatch,
        selectedEvent: null,
        setSelectedEvent: mockSetSelectedEvent,
        setDaySelected: mockSetDaySelected,
        setShowEventModal: mockSetShowEventModal
      });

      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      const events = result.current.getEventsForDay(today);

      expect(events).toHaveLength(0);
    });
  });

  describe('createEvent', () => {
    test('should create a new event with generated ID', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      
      const eventData = {
        title: 'New Event',
        day: dayjs().toISOString(),
        description: 'Test event'
      };

      act(() => {
        result.current.createEvent(eventData);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.PUSH,
        payload: expect.objectContaining({
          title: 'New Event',
          day: eventData.day,
          description: 'Test event',
          id: expect.any(String)
        })
      });
    });

    test('should generate unique timestamp-based ID', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const eventData = {
        title: 'New Event',
        day: dayjs().toISOString()
      };

      act(() => {
        result.current.createEvent(eventData);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.PUSH,
        payload: expect.objectContaining({
          id: String(now)
        })
      });

      jest.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('updateEvent', () => {
    test('should update an existing event', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      
      const eventData = {
        id: '123',
        title: 'Updated Event',
        day: dayjs().toISOString(),
        description: 'Updated description'
      };

      act(() => {
        result.current.updateEvent(eventData);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.UPDATE,
        payload: eventData
      });
    });
  });

  describe('deleteEvent', () => {
    test('should delete an event', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      
      const event = {
        id: '123',
        title: 'Event to delete',
        day: dayjs().toISOString()
      };

      act(() => {
        result.current.deleteEvent(event);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: EVENT_ACTIONS.DELETE,
        payload: event
      });
    });
  });

  describe('openEventModal', () => {
    test('should open event modal for a specific day', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      const today = dayjs();

      act(() => {
        result.current.openEventModal(today);
      });

      expect(mockSetDaySelected).toHaveBeenCalledWith(today);
      expect(mockSetShowEventModal).toHaveBeenCalledWith(true);
    });
  });

  describe('editEvent', () => {
    test('should open modal for editing an existing event', () => {
      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });
      
      const event = {
        id: '123',
        title: 'Event to edit',
        day: dayjs().toISOString()
      };

      act(() => {
        result.current.editEvent(event);
      });

      expect(mockSetSelectedEvent).toHaveBeenCalledWith(event);
      expect(mockSetShowEventModal).toHaveBeenCalledWith(true);
    });
  });

  describe('filteredEvents', () => {
    test('should expose filteredEvents from context', () => {
      const mockEvents = [
        { id: '1', title: 'Event 1' },
        { id: '2', title: 'Event 2' }
      ];

      const React = require('react');
      React.useContext.mockReturnValue({
        filteredEvents: mockEvents,
        dispatchCallEvent: mockDispatch,
        selectedEvent: null,
        setSelectedEvent: mockSetSelectedEvent,
        setDaySelected: mockSetDaySelected,
        setShowEventModal: mockSetShowEventModal
      });

      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });

      expect(result.current.filteredEvents).toEqual(mockEvents);
    });
  });

  describe('selectedEvent', () => {
    test('should expose selectedEvent from context', () => {
      const mockSelectedEvent = {
        id: '123',
        title: 'Selected Event'
      };

      const React = require('react');
      React.useContext.mockReturnValue({
        filteredEvents: [],
        dispatchCallEvent: mockDispatch,
        selectedEvent: mockSelectedEvent,
        setSelectedEvent: mockSetSelectedEvent,
        setDaySelected: mockSetDaySelected,
        setShowEventModal: mockSetShowEventModal
      });

      const { result } = renderHook(() => useEvents(), { wrapper: createWrapper() });

      expect(result.current.selectedEvent).toEqual(mockSelectedEvent);
    });
  });
});

