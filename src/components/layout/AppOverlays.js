import React, { lazy } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { LoadingOverlay } from '../common';
import LazyBoundary from '../common/LazyBoundary';

const EventModal = lazy(() => import('../forms/EventModal'));
const CreatePlantModal = lazy(() => import('../forms/CreatePlantModal'));
const WeeklySummaryTodoModal = lazy(() => import('../calendar/WeeklySummaryTodoModal'));

function AppOverlays({
  showEventModal,
  showPlantModal,
  showWeeklySummaryModal,
  filteredEvents,
  onCloseWeeklySummary,
  onError,
}) {
  const { t } = useTranslation();
  const overlayFallback = (text) => <LoadingOverlay text={text} backdrop={true} />;

  return (
    <>
      {showEventModal && createPortal(
        <LazyBoundary
          name="EventModal"
          fallback={overlayFallback(t('messages.loadingEventDetails'))}
          onError={onError}
        >
          <EventModal />
        </LazyBoundary>,
        document.body
      )}

      {showPlantModal && (
        <LazyBoundary
          name="CreatePlantModal"
          fallback={overlayFallback(t('messages.loadingData'))}
          onError={onError}
        >
          <CreatePlantModal />
        </LazyBoundary>
      )}

      {showWeeklySummaryModal && createPortal(
        <LazyBoundary
          name="WeeklySummaryTodoModal"
          fallback={overlayFallback(t('messages.loadingData'))}
          onError={onError}
        >
          <WeeklySummaryTodoModal
            events={filteredEvents}
            onClose={onCloseWeeklySummary}
          />
        </LazyBoundary>,
        document.body
      )}
    </>
  );
}

export default AppOverlays;
