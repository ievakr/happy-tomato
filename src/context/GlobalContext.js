import React from "react";

const GlobalContext = React.createContext({
    monthIndex: 0,
    setMonthIndex: (index) => {},
    smallCalendarMonth: 0,
    setSmallCalendarMonth: (index) => {},
    daySelected: null,
    setDaySelected: (day) => {},
    showEventModal: false,
    setShowEventModal: () => {},
    dispatchCallEvent: ({type, payload}) => {},
    savedEvents: [],
    selectedEvent: null,
    setSelectedEvent: () => {},
    setLabels: () => {},
    labels: [],
    updateLabel: () => {},
    filteredEvents: [],
    dosage: "",
    setDosage: () => {},
    showSidebar: false,
    setShowSidebar: () => {},
    isLoading: false,
    setIsLoading: () => {},
    isInitialLoading: true,
    loadingOperation: null,
    // View management
    currentView: 'month', // 'month', 'week', or 'daily' (daily only on mobile)
    setCurrentView: () => {},
    weekIndex: 0,
    setWeekIndex: (index) => {},
    currentDayIndex: 0,
    setCurrentDayIndex: (index) => {}
})

export default GlobalContext;