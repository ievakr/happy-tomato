import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import CalendarContext from './CalendarContext';
import EventContext from './EventContext';
import LayoutContext from './LayoutContext';
import { usePlants } from '../hooks/usePlants';
import { monthIndexFromCalendarDate } from '../utils';
import { useEventsQuery } from '../hooks/useEventsQuery';
import { useEventOperations } from '../hooks/useEventOperations';
import { useEventFiltering } from '../hooks/useEventFiltering';
import { useCalendarState } from '../hooks/useCalendarState';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function ContextWrapper(props) {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();

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
  const { setDaySelected, setMonthIndex, setCurrentView } = calendarState;

  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);

  const openCalendarDay = useCallback(
    (dayStr, options = {}) => {
      const { openWeeklySummary = false } = options;
      if (!dayStr || typeof dayStr !== 'string') return;
      const trimmed = dayStr.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return;
      const next = dayjs(trimmed, 'YYYY-MM-DD', true);
      if (!next.isValid()) return;
      setDaySelected(next);
      setMonthIndex(monthIndexFromCalendarDate(next));
      setCurrentView(isMobile ? 'daily' : 'month');
      if (openWeeklySummary) {
        setShowWeeklySummaryModal(true);
      }
    },
    [isMobile, setDaySelected, setMonthIndex, setCurrentView],
  );

  // Deep link: ?day=YYYY-MM-DD (web push, PWA) or native event
  useEffect(() => {
    const fromSearch = () => {
      const params = new URLSearchParams(window.location.search);
      return {
        day: params.get('day'),
        weeklySummary: params.get('weeklySummary') === '1',
      };
    };

    const consume = () => {
      const { day, weeklySummary } = fromSearch();
      if (!day) return;
      openCalendarDay(day, { openWeeklySummary: weeklySummary });
      const params = new URLSearchParams(window.location.search);
      params.delete('day');
      params.delete('weeklySummary');
      const qs = params.toString();
      const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', clean);
    };

    consume();
    window.addEventListener('popstate', consume);
    return () => window.removeEventListener('popstate', consume);
  }, [openCalendarDay]);

  useEffect(() => {
    const onSwMessage = (event) => {
      if (event.data?.type === 'calendar-open-day' && event.data?.day) {
        const kind = event.data?.kind ? String(event.data.kind) : '';
        openCalendarDay(String(event.data.day), {
          openWeeklySummary: kind === 'weekly_summary',
        });
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [openCalendarDay]);

  useEffect(() => {
    const onNativeOpen = (e) => {
      const day = e.detail?.day;
      const kind = e.detail?.kind ? String(e.detail.kind) : '';
      if (day) {
        openCalendarDay(String(day), {
          openWeeklySummary: kind === 'weekly_summary',
        });
      }
    };
    window.addEventListener('happy-tomato-open-day', onNativeOpen);
    return () => window.removeEventListener('happy-tomato-open-day', onNativeOpen);
  }, [openCalendarDay]);

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
      setBulkEditMode(false);
      setBulkSelectedEventIds([]);
    }
  }, [showEventModal]);

  // Clear cached queries when user logs out
  useEffect(() => {
    if (!currentUser) {
      queryClient.removeQueries({ queryKey: ['events'] });
      queryClient.removeQueries({ queryKey: ['plants'] });
    }
  }, [currentUser, queryClient]);

  // Sync checked plant categories so Cloud Functions use the same visibility as the calendar
  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.email) return;
    if (!labels || labels.length === 0) return;

    const t = setTimeout(() => {
      const reminderIncludedCategories = labels
          .filter((l) => l.checked)
          .map((l) => l.label);
      const docId = currentUser.email.replace(/[.#$[\]]/g, '_');
      setDoc(
          doc(db, 'emailPreferences', docId),
          {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            reminderIncludedCategories,
            reminderTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
      ).catch(() => {});
    }, 400);

    return () => clearTimeout(t);
  }, [labels, currentUser?.uid, currentUser?.email]);

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
          bulkSelectedEventIds,
          setBulkSelectedEventIds,
          toggleBulkEventSelection,
          clearBulkSelection,
          showWeeklySummaryModal,
          setShowWeeklySummaryModal,
        }}
      >
        <LayoutContext.Provider value={{ showSidebar, setShowSidebar }}>
          {props.children}
        </LayoutContext.Provider>
      </EventContext.Provider>
    </CalendarContext.Provider>
  );
}
