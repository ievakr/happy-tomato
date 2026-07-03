import { useCalendarContext } from '../context/CalendarContext';
import { useEventContext } from '../context/EventContext';
import { EVENT_ACTIONS } from '../constants';
import { filterEventsForDay } from '../utils/eventDates';

/**
 * Custom hook for event management
 */
export const useEvents = () => {
  const {
    filteredEvents,
    dispatchCallEvent,
    selectedEvent,
    setSelectedEvent,
    setShowEventModal
  } = useEventContext();
  const { setDaySelected } = useCalendarContext();

  /**
   * Get events for a specific day
   */
  const getEventsForDay = (day) => filterEventsForDay(filteredEvents, day);

  /**
   * Create a new event
   */
  const createEvent = (eventData) => {
    const calendarEvent = {
      ...eventData,
      id: String(Date.now())
    };
    void Promise.resolve(dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: calendarEvent })).catch(
      () => {
        // Toast already shown by dispatchCallEvent
      }
    );
  };

  /**
   * Update an existing event
   */
  const updateEvent = (eventData) => {
    void Promise.resolve(dispatchCallEvent({ type: EVENT_ACTIONS.UPDATE, payload: eventData })).catch(
      () => {
        // Toast already shown by dispatchCallEvent
      }
    );
  };

  /**
   * Delete an event
   */
  const deleteEvent = (event) => {
    void Promise.resolve(dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: event })).catch(
      () => {
        // Toast already shown by dispatchCallEvent
      }
    );
  };

  /**
   * Open event modal for a specific day
   */
  const openEventModal = (day) => {
    setDaySelected(day);
    setShowEventModal(true);
  };

  /**
   * Open event modal for editing an existing event
   */
  const editEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  return {
    filteredEvents,
    selectedEvent,
    getEventsForDay,
    createEvent,
    updateEvent,
    deleteEvent,
    openEventModal,
    editEvent
  };
}; 