import React, { useEffect, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import './styles/variables.css';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import useOnlineStatus from './hooks/useOnlineStatus';
import useServiceWorkerUpdate from './hooks/useServiceWorkerUpdate';
import { useCalendarContext } from './context/CalendarContext';
import { useEventContext } from './context/EventContext';
import { useLayoutContext } from './context/LayoutContext';
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
const CreatePlantModal = lazy(() => import('./components/forms/CreatePlantModal'));
const ManagePlantsModal = lazy(() => import('./components/forms/ManagePlantsModal'));
const ManageTodoModal = lazy(() => import('./components/forms/ManageTodoModal'));

/**
 * Main application component with responsive layout
 */
function App() {
  const { currentMonth } = useCalendar();
  const {
    showEventModal,
    showPlantModal,
    showManagePlantsModal,
    setShowManagePlantsModal,
    showManageTodoModal,
    isInitialLoading,
    loadingOperation,
  } = useEventContext();
  const { showSidebar } = useLayoutContext();
  const { currentView } = useCalendarContext();
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
  
  // Update the hook reference when emailNotifications changes to prevent stale closures
  useEffect(() => {
    if (notificationService.isRunning) {
      notificationService.updateEmailHook(emailNotifications);
    }
  }, [emailNotifications]);

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

          {/* Event modal overlay - render in portal to escape overflow constraints */}
          {showEventModal && createPortal(
            <Suspense fallback={<LoadingOverlay text="Loading event details..." backdrop={true} />}>
              <ComponentErrorBoundary
                componentName="EventModal"
                onError={handleError}
              >
                <EventModal />
              </ComponentErrorBoundary>
            </Suspense>,
            document.body
          )}
          
          {/* Create Plant modal overlay */}
          {showPlantModal && (
            <Suspense fallback={<LoadingOverlay text="Loading..." backdrop={true} />}>
              <ComponentErrorBoundary
                componentName="CreatePlantModal"
                onError={handleError}
              >
                <CreatePlantModal />
              </ComponentErrorBoundary>
            </Suspense>
          )}
          
          {/* Manage Plants modal overlay */}
          {showManagePlantsModal && (
            <Suspense fallback={<LoadingOverlay text="Loading..." backdrop={true} />}>
              <ComponentErrorBoundary
                componentName="ManagePlantsModal"
                onError={handleError}
              >
                <ManagePlantsModal onClose={() => setShowManagePlantsModal(false)} />
              </ComponentErrorBoundary>
            </Suspense>
          )}

          {showManageTodoModal && createPortal(
            <Suspense fallback={<LoadingOverlay text="Loading..." backdrop={true} />}>
              <ComponentErrorBoundary componentName="ManageTodoModal" onError={handleError}>
                <ManageTodoModal />
              </ComponentErrorBoundary>
            </Suspense>,
            document.body
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
              {/* Desktop sidebar — h-100 so the border column matches calendar height */}
              <div className={`d-none d-md-block h-100 ${showSidebar ? 'd-block' : ''}`}>
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