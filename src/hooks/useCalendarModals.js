import { useCallback, useEffect, useState } from 'react';

/**
 * Modal visibility and bulk-edit selection state for the calendar.
 */
export function useCalendarModals() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dosage, setDosage] = useState('');

  const [bulkEditMode, setBulkEditMode] = useState(false);
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

  useEffect(() => {
    if (!showEventModal) {
      setSelectedEvent(null);
      setBulkEditMode(false);
      setBulkSelectedEventIds([]);
    }
  }, [showEventModal]);

  return {
    showEventModal,
    setShowEventModal,
    showPlantModal,
    setShowPlantModal,
    showWeeklySummaryModal,
    setShowWeeklySummaryModal,
    selectedEvent,
    setSelectedEvent,
    dosage,
    setDosage,
    bulkEditMode,
    setBulkEditMode,
    bulkSelectedEventIds,
    setBulkSelectedEventIds,
    toggleBulkEventSelection,
    clearBulkSelection,
  };
}
