import './App.css';
import { getMonth } from './util'
import React, { useState, useContext, useEffect } from 'react';
import CalendarHeader from './components/CalendarHeader';
import Sidebar from './components/Sidebar';
import Month from './components/Month';
import GlobalContext from './context/GlobalContext';
import EventModal from './components/EventModal';
import 'react-tooltip/dist/react-tooltip.css'

function App() {
  const [currentMonth, setCurrentMonth] = useState(getMonth())
  const { monthIndex, showEventModal } = useContext(GlobalContext)
  useEffect(() => {
    setCurrentMonth(getMonth(monthIndex))
  }, [monthIndex])
  return (
    <React.Fragment>
      {showEventModal && <EventModal />}
      <div className = 'd-flex flex-column vh-100'>
        <CalendarHeader />
        <div className = 'd-flex flex-grow-1'>
          <Sidebar/>
          <Month month = {currentMonth}/>
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
