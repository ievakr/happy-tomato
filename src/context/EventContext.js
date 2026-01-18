import React from "react";

const EventContext = React.createContext({
    showEventModal: false,
    setShowEventModal: () => {},
    dispatchCallEvent: ({ type, payload }) => {},
    savedEvents: [],
    selectedEvent: null,
    setSelectedEvent: () => {},
    setLabels: () => {},
    labels: [],
    updateLabel: () => {},
    filteredEvents: [],
    dosage: "",
    setDosage: () => {},
    isLoading: false,
    setIsLoading: () => {},
    isInitialLoading: true,
    loadingOperation: null
});

export default EventContext;
