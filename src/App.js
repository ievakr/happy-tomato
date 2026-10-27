import React, { useEffect, useState, lazy } from 'react';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import useOnlineStatus from './hooks/useOnlineStatus';
import useServiceWorkerUpdate from './hooks/useServiceWorkerUpdate';
import useAppNotifications from './hooks/useAppNotifications';
import { useResponsive, useResponsiveCalendarView } from './hooks';
import { useEventContext } from './context/EventContext';
import { useLayoutContext } from './context/LayoutContext';
import { useCalendarContext } from './context/CalendarContext';
import { ErrorBoundary, LoadingSpinner, IntroSplash, OfflineBanner, ServiceWorkerUpdateBanner } from './components/common';
import errorLogger from './utils/errorLogger';
import { readOfflinePreview, subscribeOfflinePreview } from './utils/offlinePreview';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './i18n/LanguageContext';
import LazyBoundary from './components/common/LazyBoundary';
import AppOverlays from './components/layout/AppOverlays';
import MainView from './components/layout/MainView';
import AuthWrapper from './components/auth/AuthWrapper';

const Header = lazy(() => import('./components/layout/Header'));
const Sidebar = lazy(() => import('./components/layout/Sidebar'));

/**
 * Main application component with responsive layout
 */
function App() {
  const { t } = useTranslation();
  const { bootLoading, currentUser } = useAuth();
  const { currentMonth } = useCalendar();
  const {
    showEventModal,
    showPlantModal,
    showWeeklySummaryModal,
    setShowWeeklySummaryModal,
    filteredEvents,
    isInitialLoading,
  } = useEventContext();
  const { showSidebar } = useLayoutContext();
  const { currentView } = useCalendarContext();
  const { isMobile } = useResponsive();
  useResponsiveCalendarView();
  useAppNotifications();

  const isOnline = useOnlineStatus();
  const [offlinePreview, setOfflinePreview] = useState(readOfflinePreview);
  useEffect(() => subscribeOfflinePreview(setOfflinePreview), []);
  const { updateReady, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  const handleError = (error, errorInfo) => {
    errorLogger.logError(error, errorInfo, 'App Component');
  };

  const inlineFallback = (
    <div className="d-flex justify-content-center p-3">
      <LoadingSpinner size="md" text={t('messages.loadingData')} />
    </div>
  );

  const showBootSplash = bootLoading || (!!currentUser && isInitialLoading);

  return (
    <ErrorBoundary
      title={t('messages.appErrorTitle')}
      message={t('messages.appErrorBody')}
      onError={handleError}
    >
      <AuthWrapper>
        {/* Single column wrapper so .app-shell is a flex child and fills the screen on iOS WKWebView */}
        <div className="app-viewport-root">
          {showBootSplash && (
            <IntroSplash label={t('messages.loadingApp')} />
          )}

          <AppOverlays
            showEventModal={showEventModal}
            showPlantModal={showPlantModal}
            showWeeklySummaryModal={showWeeklySummaryModal}
            filteredEvents={filteredEvents}
            onCloseWeeklySummary={() => setShowWeeklySummaryModal(false)}
            onError={handleError}
          />

          <div
            className="d-flex flex-column vh-100 app-shell"
            style={{ overflow: 'hidden' }}
          >
            {updateReady && (
              <ServiceWorkerUpdateBanner
                onReload={applyUpdate}
                onDismiss={dismissUpdate}
              />
            )}
            <LazyBoundary name="Header" fallback={inlineFallback} onError={handleError}>
              <Header />
            </LazyBoundary>
            {(!isOnline || offlinePreview) && <OfflineBanner />}

            <main
              className="d-flex flex-grow-1 position-relative"
              style={{
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div className={`d-none d-md-block h-100 ${showSidebar ? 'd-block' : ''}`}>
                <LazyBoundary name="Sidebar" fallback={inlineFallback} onError={handleError}>
                  <Sidebar />
                </LazyBoundary>
              </div>

              {showSidebar && (
                <div className="d-md-none">
                  <LazyBoundary name="Sidebar (Mobile)" fallback={inlineFallback} onError={handleError}>
                    <Sidebar />
                  </LazyBoundary>
                </div>
              )}

              <MainView
                currentView={currentView}
                isMobile={isMobile}
                currentMonth={currentMonth}
                fallback={inlineFallback}
                onError={handleError}
              />
            </main>
          </div>
        </div>
      </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App;
