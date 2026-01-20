import React, { useContext, useEffect, Suspense, lazy } from 'react';
import './styles/variables.css';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import useOnlineStatus from './hooks/useOnlineStatus';
import useServiceWorkerUpdate from './hooks/useServiceWorkerUpdate';
import CalendarContext from './context/CalendarContext';
import EventContext from './context/EventContext';
import LayoutContext from './context/LayoutContext';
import { getLoadingMessage } from './utils';
import { ErrorBoundary, ComponentErrorBoundary, LoadingOverlay, LoadingSpinner, OfflineBanner, ServiceWorkerUpdateBanner } from './components/common';
import errorLogger from './utils/errorLogger';
import { useEmailNotifications } from './hooks/useEmailNotifications';
import notificationService from './services/notificationService';
import 'react-tooltip/dist/react-tooltip.css';

const AuthWrapper = lazy(() => import('./components/auth/AuthWrapper'));
const Header = lazy(() => import('./components/layout/Header'));
const Sidebar = lazy(() => import('./components/layout/Sidebar'));
const CalendarHeader = lazy(() => import('./components/calendar/CalendarHeader'));
const CalendarGrid = lazy(() => import('./components/calendar/CalendarGrid'));
const WeeklyView = lazy(() => import('./components/calendar/WeeklyView'));
const DailyView = lazy(() => import('./components/calendar/DailyView'));
const EventModal = lazy(() => import('./components/forms/EventModal'));

/**
 * Main application component with responsive layout
 */
function App() {
  const { currentMonth } = useCalendar();
  const { showEventModal, isInitialLoading, loadingOperation } = useContext(EventContext);
  const { showSidebar } = useContext(LayoutContext);
  const { currentView } = useContext(CalendarContext);
  const emailNotifications = useEmailNotifications();
  const isOnline = useOnlineStatus();
  const { updateReady, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  const handleError = (error, errorInfo) => {
    errorLogger.logError(error, errorInfo, 'App Component');
  };

  // Initialize notification service
  useEffect(() => {
    if (emailNotifications.emailPreferences.enabled) {
      notificationService.start(emailNotifications);
    } else {
      notificationService.stop();
    }
    
    return () => {
      notificationService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailNotifications.emailPreferences.enabled]);
  
  // Update the hook reference on EVERY render to prevent stale closures
  useEffect(() => {
    if (notificationService.isRunning) {
      notificationService.updateEmailHook(emailNotifications);
    }
  });

  const inlineFallback = (
    <div className="d-flex justify-content-center p-3">
      <LoadingSpinner size="md" text="Loading..." />
    </div>
  );

  return (
    <ErrorBoundary
      title="Application Error"
      message="The calendar application encountered an unexpected error."
      onError={handleError}
    >
      <Suspense fallback={<LoadingOverlay text="Loading application..." backdrop={true} />}>
        <AuthWrapper>
          {/* Initial loading overlay */}
          {isInitialLoading && (
            <LoadingOverlay 
              text={getLoadingMessage(loadingOperation || 'load')} 
              backdrop={true}
            />
          )}

          {/* Event modal overlay */}
          {showEventModal && (
            <Suspense fallback={<LoadingOverlay text="Loading event details..." backdrop={true} />}>
              <ComponentErrorBoundary
                componentName="EventModal"
                onError={handleError}
              >
                <EventModal />
              </ComponentErrorBoundary>
            </Suspense>
          )}
          
          {/* Main application layout */}
          <div 
            className='d-flex flex-column vh-100' 
            style={{ overflow: 'hidden' }}
          >
            {!isOnline && <OfflineBanner />}
            {updateReady && (
              <ServiceWorkerUpdateBanner
                onReload={applyUpdate}
                onDismiss={dismissUpdate}
              />
            )}
            {/* Application header */}
            <Suspense fallback={inlineFallback}>
              <ComponentErrorBoundary
                componentName="Header"
                onError={handleError}
              >
                <Header />
              </ComponentErrorBoundary>
            </Suspense>
            
            {/* Main content area */}
            <main 
              className='d-flex flex-grow-1 position-relative' 
              style={{ 
                minHeight: 0,
                overflow: 'hidden'
              }}
            >
              {/* Desktop sidebar */}
              <div className={`d-none d-md-block ${showSidebar ? 'd-block' : ''}`}>
                <Suspense fallback={inlineFallback}>
                  <ComponentErrorBoundary
                    componentName="Sidebar"
                    onError={handleError}
                  >
                    <Sidebar />
                  </ComponentErrorBoundary>
                </Suspense>
              </div>
              
              {/* Mobile sidebar overlay */}
              {showSidebar && (
                <div className="d-md-none">
                  <Suspense fallback={inlineFallback}>
                    <ComponentErrorBoundary
                      componentName="Sidebar (Mobile)"
                      onError={handleError}
                    >
                      <Sidebar />
                    </ComponentErrorBoundary>
                  </Suspense>
                </div>
              )}
              
              {/* Calendar area */}
              <section 
                className="flex-grow-1 d-flex flex-column" 
                style={{ 
                  minHeight: 0,
                  overflow: 'hidden'
                }}
                aria-label="Calendar view"
              >
                {/* Show day headers only for monthly view */}
                {currentView === 'month' && (
                  <Suspense fallback={inlineFallback}>
                    <ComponentErrorBoundary
                      componentName="CalendarHeader"
                      onError={handleError}
                    >
                      <CalendarHeader />
                    </ComponentErrorBoundary>
                  </Suspense>
                )}
                
                {/* Switch between month, week, and daily views */}
                {currentView === 'month' ? (
                  <Suspense fallback={inlineFallback}>
                    <ComponentErrorBoundary
                      componentName="CalendarGrid"
                      onError={handleError}
                    >
                      <CalendarGrid month={currentMonth} />
                    </ComponentErrorBoundary>
                  </Suspense>
                ) : currentView === 'week' ? (
                  <Suspense fallback={inlineFallback}>
                    <ComponentErrorBoundary
                      componentName="WeeklyView"
                      onError={handleError}
                    >
                      <WeeklyView />
                    </ComponentErrorBoundary>
                  </Suspense>
                ) : (
                  <Suspense fallback={inlineFallback}>
                    <ComponentErrorBoundary
                      componentName="DailyView"
                      onError={handleError}
                    >
                      <DailyView />
                    </ComponentErrorBoundary>
                  </Suspense>
                )}

              </section>
            </main>
          </div>
        </AuthWrapper>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App; 