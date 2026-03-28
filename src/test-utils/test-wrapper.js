import React from 'react';
import CalendarContext from '../context/CalendarContext';
import EventContext from '../context/EventContext';
import LayoutContext from '../context/LayoutContext';

/**
 * Test wrapper component that provides mock app contexts
 */
export const createWrapper = (contextValue = {}) => {
  const { calendar = {}, event = {}, layout = {}, ...legacyOverrides } = contextValue;
  const defaultCalendarContext = {
    monthIndex: 0,
    setMonthIndex: jest.fn(),
    smallCalendarMonth: null,
    setSmallCalendarMonth: jest.fn(),
    daySelected: null,
    setDaySelected: jest.fn(),
    currentView: 'month',
    setCurrentView: jest.fn(),
    weekIndex: 0,
    setWeekIndex: jest.fn(),
    currentDayIndex: 0,
    setCurrentDayIndex: jest.fn(),
    ...calendar
  };
  const defaultEventContext = {
    filteredEvents: [],
    savedEvents: [],
    dispatchCallEvent: jest.fn(),
    selectedEvent: null,
    setSelectedEvent: jest.fn(),
    setShowEventModal: jest.fn(),
    setShowPlantModal: jest.fn(),
    setShowManagePlantsModal: jest.fn(),
    showManageTodoModal: false,
    setShowManageTodoModal: jest.fn(),
    labels: [],
    setLabels: jest.fn(),
    updateLabel: jest.fn(),
    plantNames: [],
    plantsById: {},
    displayNameToPlantId: {},
    plantIdToDisplayName: {},
    dosage: '',
    setDosage: jest.fn(),
    isLoading: false,
    setIsLoading: jest.fn(),
    isInitialLoading: false,
    loadingOperation: null,
    ...event
  };
  const defaultLayoutContext = {
    showSidebar: false,
    setShowSidebar: jest.fn(),
    ...layout
  };

  if (legacyOverrides.filteredEvents !== undefined) {
    defaultEventContext.filteredEvents = legacyOverrides.filteredEvents;
  }
  if (legacyOverrides.savedEvents !== undefined) {
    defaultEventContext.savedEvents = legacyOverrides.savedEvents;
  }
  if (legacyOverrides.dispatchCallEvent) {
    defaultEventContext.dispatchCallEvent = legacyOverrides.dispatchCallEvent;
  }
  if (legacyOverrides.selectedEvent !== undefined) {
    defaultEventContext.selectedEvent = legacyOverrides.selectedEvent;
  }
  if (legacyOverrides.setSelectedEvent) {
    defaultEventContext.setSelectedEvent = legacyOverrides.setSelectedEvent;
  }
  if (legacyOverrides.setShowEventModal) {
    defaultEventContext.setShowEventModal = legacyOverrides.setShowEventModal;
  }
  if (legacyOverrides.labels !== undefined) {
    defaultEventContext.labels = legacyOverrides.labels;
  }
  if (legacyOverrides.setLabels) {
    defaultEventContext.setLabels = legacyOverrides.setLabels;
  }
  if (legacyOverrides.updateLabel) {
    defaultEventContext.updateLabel = legacyOverrides.updateLabel;
  }
  if (legacyOverrides.dosage !== undefined) {
    defaultEventContext.dosage = legacyOverrides.dosage;
  }
  if (legacyOverrides.setDosage) {
    defaultEventContext.setDosage = legacyOverrides.setDosage;
  }
  if (legacyOverrides.isLoading !== undefined) {
    defaultEventContext.isLoading = legacyOverrides.isLoading;
  }
  if (legacyOverrides.isInitialLoading !== undefined) {
    defaultEventContext.isInitialLoading = legacyOverrides.isInitialLoading;
  }
  if (legacyOverrides.loadingOperation !== undefined) {
    defaultEventContext.loadingOperation = legacyOverrides.loadingOperation;
  }
  if (legacyOverrides.monthIndex !== undefined) {
    defaultCalendarContext.monthIndex = legacyOverrides.monthIndex;
  }
  if (legacyOverrides.setMonthIndex) {
    defaultCalendarContext.setMonthIndex = legacyOverrides.setMonthIndex;
  }
  if (legacyOverrides.setDaySelected) {
    defaultCalendarContext.setDaySelected = legacyOverrides.setDaySelected;
  }
  if (legacyOverrides.daySelected !== undefined) {
    defaultCalendarContext.daySelected = legacyOverrides.daySelected;
  }
  if (legacyOverrides.currentView) {
    defaultCalendarContext.currentView = legacyOverrides.currentView;
  }
  if (legacyOverrides.setCurrentView) {
    defaultCalendarContext.setCurrentView = legacyOverrides.setCurrentView;
  }
  if (legacyOverrides.weekIndex !== undefined) {
    defaultCalendarContext.weekIndex = legacyOverrides.weekIndex;
  }
  if (legacyOverrides.setWeekIndex) {
    defaultCalendarContext.setWeekIndex = legacyOverrides.setWeekIndex;
  }
  if (legacyOverrides.showSidebar !== undefined) {
    defaultLayoutContext.showSidebar = legacyOverrides.showSidebar;
  }
  if (legacyOverrides.setShowSidebar) {
    defaultLayoutContext.setShowSidebar = legacyOverrides.setShowSidebar;
  }

  return ({ children }) => (
    <CalendarContext.Provider value={defaultCalendarContext}>
      <EventContext.Provider value={defaultEventContext}>
        <LayoutContext.Provider value={defaultLayoutContext}>
          {children}
        </LayoutContext.Provider>
      </EventContext.Provider>
    </CalendarContext.Provider>
  );
};


