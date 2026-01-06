import React, { useContext, useEffect } from 'react';
import './styles/variables.css';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import GlobalContext from './context/GlobalContext';
import { getLoadingMessage } from './utils';
import AuthWrapper from './components/auth/AuthWrapper';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CalendarHeader from './components/calendar/CalendarHeader';
import CalendarGrid from './components/calendar/CalendarGrid';
import WeeklyView from './components/calendar/WeeklyView';
import DailyView from './components/calendar/DailyView';
import EventModal from './components/forms/EventModal';
import { ErrorBoundary, ComponentErrorBoundary, LoadingOverlay } from './components/common';
import errorLogger from './utils/errorLogger';
import { useEmailNotifications } from './hooks/useEmailNotifications';
import notificationService from './services/notificationService';
import 'react-tooltip/dist/react-tooltip.css';

/**
 * Main application component with responsive layout
 */
function App() {
  const { currentMonth } = useCalendar();
  const { showEventModal, showSidebar, isInitialLoading, loadingOperation, currentView } = useContext(GlobalContext);
  const emailNotifications = useEmailNotifications();

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

  return (
    <ErrorBoundary
      title="Application Error"
      message="The calendar application encountered an unexpected error."
      onError={handleError}
    >
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
          <ComponentErrorBoundary
            componentName="EventModal"
            onError={handleError}
          >
            <EventModal />
          </ComponentErrorBoundary>
        )}
        
        {/* Main application layout */}
        <div 
          className='d-flex flex-column vh-100' 
          style={{ overflow: 'hidden' }}
        >
          {/* Application header */}
          <ComponentErrorBoundary
            componentName="Header"
            onError={handleError}
          >
            <Header />
          </ComponentErrorBoundary>
          
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
              <ComponentErrorBoundary
                componentName="Sidebar"
                onError={handleError}
              >
                <Sidebar />
              </ComponentErrorBoundary>
            </div>
            
            {/* Mobile sidebar overlay */}
            {showSidebar && (
              <div className="d-md-none">
                <ComponentErrorBoundary
                  componentName="Sidebar (Mobile)"
                  onError={handleError}
                >
                  <Sidebar />
                </ComponentErrorBoundary>
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
                <ComponentErrorBoundary
                  componentName="CalendarHeader"
                  onError={handleError}
                >
                  <CalendarHeader />
                </ComponentErrorBoundary>
              )}
              
              {/* Switch between month, week, and daily views */}
              {currentView === 'month' ? (
                <ComponentErrorBoundary
                  componentName="CalendarGrid"
                  onError={handleError}
                >
                  <CalendarGrid month={currentMonth} />
                </ComponentErrorBoundary>
              ) : currentView === 'week' ? (
                <ComponentErrorBoundary
                  componentName="WeeklyView"
                  onError={handleError}
                >
                  <WeeklyView />
                </ComponentErrorBoundary>
              ) : (
                <ComponentErrorBoundary
                  componentName="DailyView"
                  onError={handleError}
                >
                  <DailyView />
                </ComponentErrorBoundary>
              )}

            </section>
          </main>
        </div>
      </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App; 