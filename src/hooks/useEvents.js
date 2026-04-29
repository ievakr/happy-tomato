import { useContext } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../context/CalendarContext';
import { useEventContext } from '../context/EventContext';
import { DATE_FORMATS, EVENT_ACTIONS } from '../constants';

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
  const { setDaySelected } = useContext(CalendarContext);

  /**
   * Get events for a specific day
   */
  const getEventsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format(DATE_FORMATS.DAY_MONTH_YEAR) === day.format(DATE_FORMATS.DAY_MONTH_YEAR)
    );
  };

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