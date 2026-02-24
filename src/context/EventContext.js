import React from "react";

const EventContext = React.createContext({
    showEventModal: false,
    setShowEventModal: () => {},
    showPlantModal: false,
    setShowPlantModal: () => {},
    dispatchCallEvent: ({ type, payload }) => {},
    savedEvents: [],
    selectedEvent: null,
    setSelectedEvent: () => {},
    setLabels: () => {},
    labels: [],
    updateLabel: () => {},
    filteredEvents: [],
    labelsMapping: {},
    plantNames: [],
    dosage: "",
    setDosage: () => {},
    isLoading: false,
    setIsLoading: () => {},
    isInitialLoading: true,
    loadingOperation: null
});

export default EventContext;
