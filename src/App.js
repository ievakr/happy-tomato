import React, { useContext } from 'react';
import './styles/variables.css';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import GlobalContext from './context/GlobalContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CalendarHeader from './components/calendar/CalendarHeader';
import CalendarGrid from './components/calendar/CalendarGrid';
import EventModal from './components/forms/EventModal';
import 'react-tooltip/dist/react-tooltip.css';

/**
 * Main application component with responsive layout
 */
function App() {
  const { currentMonth } = useCalendar();
  const { showEventModal, showSidebar } = useContext(GlobalContext);

  return (
    <>
      {/* Event modal overlay */}
      {showEventModal && <EventModal />}
      
      {/* Main application layout */}
      <div 
        className='d-flex flex-column vh-100' 
        style={{ overflow: 'hidden' }}
      >
        {/* Application header */}
        <Header />
        
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
            <Sidebar />
          </div>
          
          {/* Mobile sidebar overlay */}
          {showSidebar && (
            <div className="d-md-none">
              <Sidebar />
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
            <CalendarHeader />
            <CalendarGrid month={currentMonth} />
          </section>
        </main>
      </div>
    </>
  );
}

export default App; 