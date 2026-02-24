import React from "react";

const EventContext = React.createContext({
    showEventModal: false,
    setShowEventModal: () => {},
    showPlantModal: false,
    setShowPlantModal: () => {},
    showManagePlantsModal: false,
    setShowManagePlantsModal: () => {},
    dispatchCallEvent: ({ type, payload }) => {},
    savedEvents: [],
    selectedEvent: null,
    setSelectedEvent: () => {},
    setLabels: () => {},
    labels: [],
    updateLabel: () => {},
    filteredEvents: [],
    plantNames: [],
    plantsById: {},
    displayNameToPlantId: {},
    plantIdToDisplayName: {},
    dosage: "",
    setDosage: () => {},
    isLoading: false,
    setIsLoading: () => {},
    isInitialLoading: true,
    loadingOperation: null
});

export default EventContext;
