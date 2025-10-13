import React from 'react';
import GlobalContext from '../context/GlobalContext';

/**
 * Test wrapper component that provides a mock GlobalContext
 */
export const createWrapper = (contextValue = {}) => {
  const defaultContext = {
    filteredEvents: [],
    dispatchCallEvent: jest.fn(),
    selectedEvent: null,
    setSelectedEvent: jest.fn(),
    setDaySelected: jest.fn(),
    setShowEventModal: jest.fn(),
    monthIndex: 0,
    ...contextValue
  };

  return ({ children }) => (
    <GlobalContext.Provider value={defaultContext}>
      {children}
    </GlobalContext.Provider>
  );
};


