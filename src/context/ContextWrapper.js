import React, { useEffect } from 'react';
import CalendarContext from './CalendarContext';
import EventContext from './EventContext';
import LayoutContext from './LayoutContext';
import { usePlants } from '../hooks/usePlants';
import { useEventsQuery } from '../hooks/useEventsQuery';
import { useEventOperations } from '../hooks/useEventOperations';
import { useEventFiltering } from '../hooks/useEventFiltering';
import { useCalendarState } from '../hooks/useCalendarState';
import { useCalendarDeepLinks } from '../hooks/useCalendarDeepLinks';
import { useCalendarModals } from '../hooks/useCalendarModals';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function CalendarDeepLinkListener({ onOpenWeeklySummary }) {
  useCalendarDeepLinks({ onOpenWeeklySummary });
  return null;
}

export default function ContextWrapper(props) {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const queryClient = useQueryClient();

  const { plants, plantNames, plantsById, displayNameToPlantId, plantIdToDisplayName } = usePlants(
    currentUser?.uid
  );

  const { savedEvents, isInitialLoading, queryKey } = useEventsQuery(currentUser?.uid, {
    showError,
  });

  const { dispatchCallEvent, dispatchBulkCallEvents, isLoading, loadingOperation } = useEventOperations({
    currentUser,
    queryKey,
    showError,
  });

  const { filteredEvents, labels, setLabels, updateLabel } = useEventFiltering(
    savedEvents,
    plants,
    plantsById || {}
  );

  const calendarState = useCalendarState();
  const modalState = useCalendarModals();
  const { setShowWeeklySummaryModal } = modalState;

  const [showSidebar, setShowSidebar] = React.useState(false);

  useEffect(() => {
    if (!currentUser) {
      queryClient.removeQueries({ queryKey: ['events'] });
      queryClient.removeQueries({ queryKey: ['plants'] });
    }
  }, [currentUser, queryClient]);

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
        { merge: true }
      ).catch(() => {});
    }, 400);

    return () => clearTimeout(t);
  }, [labels, currentUser?.uid, currentUser?.email]);

  const resolvedIsLoading = isLoading || isInitialLoading;
  const resolvedLoadingOperation = loadingOperation || (isInitialLoading ? 'load' : null);

  return (
    <CalendarContext.Provider value={calendarState}>
      <CalendarDeepLinkListener
        onOpenWeeklySummary={() => setShowWeeklySummaryModal(true)}
      />
      <EventContext.Provider
        value={{
          ...modalState,
          dispatchCallEvent,
          dispatchBulkCallEvents,
          savedEvents,
          labels,
          setLabels,
          updateLabel,
          filteredEvents,
          plantsById: plantsById || {},
          plantNames: plantNames || [],
          displayNameToPlantId: displayNameToPlantId || {},
          plantIdToDisplayName: plantIdToDisplayName || {},
          isLoading: resolvedIsLoading,
          setIsLoading: () => {},
          isInitialLoading,
          loadingOperation: resolvedLoadingOperation,
        }}
      >
        <LayoutContext.Provider value={{ showSidebar, setShowSidebar }}>
          {props.children}
        </LayoutContext.Provider>
      </EventContext.Provider>
    </CalendarContext.Provider>
  );
}
