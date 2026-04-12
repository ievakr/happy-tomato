import React, { useContext } from "react";

const EventContext = React.createContext({
    showEventModal: false,
    setShowEventModal: () => {},
    showPlantModal: false,
    setShowPlantModal: () => {},
    showManagePlantsModal: false,
    setShowManagePlantsModal: () => {},
    showManageTodoModal: false,
    setShowManageTodoModal: () => {},
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
    loadingOperation: null,
    bulkEditMode: false,
    setBulkEditMode: () => {},
    bulkApplyMode: false,
    setBulkApplyMode: () => {},
    bulkSelectedEventIds: [],
    setBulkSelectedEventIds: () => {},
    toggleBulkEventSelection: () => {},
    clearBulkSelection: () => {},
});

export function useEventContext() {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return ctx;
}

export default EventContext;
