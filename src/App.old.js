import './App.css';
import { getMonth } from './utils'
import React, { useState, useContext, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CalendarGrid from './components/calendar/CalendarGrid';
import GlobalContext from './context/GlobalContext';
import EventModal from './components/forms/EventModal';
import 'react-tooltip/dist/react-tooltip.css'

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth())
  const { monthIndex, showEventModal, showSidebar } = useContext(GlobalContext)
  
  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex))
  }, [monthIndex])

  return (
    <React.Fragment>
      {showEventModal && <EventModal />}
      <div className='d-flex flex-column vh-100' style={{ overflow: 'hidden' }}>
        <Header />
        <div className='d-flex flex-grow-1 position-relative' style={{ 
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Sidebar - hidden on mobile unless toggled */}
          <div className={`d-none d-md-block ${showSidebar ? 'd-block' : ''}`}>
            <Sidebar/>
          </div>
          
          {/* Mobile sidebar overlay */}
          {showSidebar && (
            <div className="d-md-none">
              <Sidebar/>
            </div>
          )}
          
          {/* Main calendar area */}
          <div className="flex-grow-1 d-flex flex-column" style={{ 
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <CalendarGrid month={currentMonth}/>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
