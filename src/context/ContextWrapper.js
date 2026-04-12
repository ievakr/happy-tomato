import React, { useEffect, useState, useCallback } from 'react';
import CalendarContext from './CalendarContext';
import EventContext from './EventContext';
import LayoutContext from './LayoutContext';
import { usePlants } from '../hooks/usePlants';
import { useEventsQuery } from '../hooks/useEventsQuery';
import { useEventOperations } from '../hooks/useEventOperations';
import { useEventFiltering } from '../hooks/useEventFiltering';
import { useCalendarState } from '../hooks/useCalendarState';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export default function ContextWrapper(props) {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const queryClient = useQueryClient();

  // Plants (for labels and event display)
  const { plants, plantNames, plantsById, displayNameToPlantId, plantIdToDisplayName } = usePlants(
    currentUser?.uid
  );

  // Events query
  const { savedEvents, isInitialLoading, queryKey } = useEventsQuery(currentUser?.uid, {
    showError,
  });

  // Event CRUD operations
  const { dispatchCallEvent, isLoading, loadingOperation } = useEventOperations({
    currentUser,
    queryKey,
    showError,
  });

  // Label-based filtering
  const { filteredEvents, labels, setLabels, updateLabel } = useEventFiltering(
    savedEvents,
    plants,
    plantsById || {}
  );

  // Calendar state
  const calendarState = useCalendarState();

  // Layout state
  const [showSidebar, setShowSidebar] = useState(false);

  // Modal and selection state
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showManagePlantsModal, setShowManagePlantsModal] = useState(false);
  const [showManageTodoModal, setShowManageTodoModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dosage, setDosage] = useState('');

  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkApplyMode, setBulkApplyMode] = useState(false);
  const [bulkSelectedEventIds, setBulkSelectedEventIds] = useState([]);

  const toggleBulkEventSelection = useCallback((eventId) => {
    if (!eventId) return;
    setBulkSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  }, []);

  const clearBulkSelection = useCallback(() => setBulkSelectedEventIds([]), []);

  useEffect(() => {
    if (!bulkEditMode) {
      setBulkSelectedEventIds([]);
    }
  }, [bulkEditMode]);

  // When event modal closes, reset selection and bulk daily-edit state
  useEffect(() => {
    if (!showEventModal) {
      setSelectedEvent(null);
      setBulkApplyMode(false);
      setBulkEditMode(false);
      setBulkSelectedEventIds([]);
    }
  }, [showEventModal]);

  // Clear events query when user logs out
  useEffect(() => {
    if (!currentUser) {
      queryClient.removeQueries({ queryKey: ['events'] });
    }
  }, [currentUser, queryClient]);

  const resolvedIsLoading = isLoading || isInitialLoading;
  const resolvedLoadingOperation = loadingOperation || (isInitialLoading ? 'load' : null);

  return (
    <CalendarContext.Provider value={calendarState}>
      <EventContext.Provider
        value={{
          showEventModal,
          setShowEventModal,
          showPlantModal,
          setShowPlantModal,
          showManagePlantsModal,
          setShowManagePlantsModal,
          showManageTodoModal,
          setShowManageTodoModal,
          dispatchCallEvent,
          savedEvents,
          selectedEvent,
          setSelectedEvent,
          labels,
          setLabels,
          updateLabel,
          filteredEvents,
          plantsById: plantsById || {},
          plantNames: plantNames || [],
          displayNameToPlantId: displayNameToPlantId || {},
          plantIdToDisplayName: plantIdToDisplayName || {},
          dosage,
          setDosage,
          isLoading: resolvedIsLoading,
          setIsLoading: () => {},
          isInitialLoading,
          loadingOperation: resolvedLoadingOperation,
          bulkEditMode,
          setBulkEditMode,
          bulkApplyMode,
          setBulkApplyMode,
          bulkSelectedEventIds,
          setBulkSelectedEventIds,
          toggleBulkEventSelection,
          clearBulkSelection,
        }}
      >
        <LayoutContext.Provider value={{ showSidebar, setShowSidebar }}>
          {props.children}
        </LayoutContext.Provider>
      </EventContext.Provider>
    </CalendarContext.Provider>
  );
}
