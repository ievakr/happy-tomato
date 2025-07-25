import dayjs from 'dayjs';
import React, { useContext } from 'react';
import logo from '../../assets/logo.png';
import GlobalContext from '../../context/GlobalContext';
import { getWeekByIndex, getWeekDateRange, getCurrentWeekIndex } from '../../utils';
import { useResponsive } from '../../hooks';

export default function Header() {
    const {
        monthIndex, 
        setMonthIndex, 
        showSidebar, 
        setShowSidebar, 
        currentView, 
        setCurrentView, 
        weekIndex, 
        setWeekIndex
    } = useContext(GlobalContext);
    const { isMobile } = useResponsive();
    function handlePrevMonth() {
        setMonthIndex(monthIndex - 1)
        // Reset week index when changing months
        if (currentView === 'week') {
            setWeekIndex(0);
        }
    }
    function handleNextMonth() {
        setMonthIndex(monthIndex + 1)
        // Reset week index when changing months
        if (currentView === 'week') {
            setWeekIndex(0);
        }
    }
    
    function handlePrevWeek() {
        if (weekIndex > 0) {
            setWeekIndex(weekIndex - 1);
        } else {
            // Go to previous month, last week
            setMonthIndex(monthIndex - 1);
            setWeekIndex(4); // Assume 5 weeks max
        }
    }
    
    function handleNextWeek() {
        if (weekIndex < 4) {
            setWeekIndex(weekIndex + 1);
        } else {
            // Go to next month, first week
            setMonthIndex(monthIndex + 1);
            setWeekIndex(0);
        }
    }
    
    function toggleSidebar() {
        setShowSidebar(!showSidebar)
    }
    
    function switchToMonthView() {
        setCurrentView('month');
    }
    
    function switchToWeekView() {
        setCurrentView('week');
        // Set current week when switching to week view
        const currentWeekIdx = getCurrentWeekIndex(monthIndex, dayjs());
        setWeekIndex(currentWeekIdx);
    }
    
    function getCurrentDisplayTitle() {
        if (currentView === 'month') {
            return dayjs(new Date(dayjs().year(), monthIndex)).format(isMobile ? "MMM YYYY" : "MMMM YYYY");
        } else {
            const week = getWeekByIndex(monthIndex, weekIndex);
            return getWeekDateRange(week);
        }
    }
    return (
        <header className="calendar-header d-flex align-items-center px-2 px-md-4 py-2">
            {/* Mobile sidebar toggle button */}
            <button 
                className="sidebar-toggle btn btn-outline-secondary d-md-none me-2" 
                onClick={toggleSidebar}
            >
                <span className="material-icons-outlined">
                    menu
                </span>
            </button>
            
            <img src={logo} alt="calendar" className="me-2" style={{ width: '32px', height: '32px' }} />
            
            {/* Desktop title */}
            <h1 className="d-none d-sm-block me-2 me-md-3 mb-0 fs-4 text-secondary fw-bold">
                Happy Tomato
            </h1>
            
            {/* Mobile title - styled differently */}
            <div className="d-sm-none me-2 mobile-title">
                <div className="d-flex flex-column">
                    <span className="mobile-title-main">Happy</span>
                    <span className="mobile-title-sub">Tomato</span>
                </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="d-flex align-items-center me-2 me-md-4">
                <button 
                    className="btn btn-sm p-1" 
                    onClick={currentView === 'month' ? handlePrevMonth : handlePrevWeek}
                >
                    <span className="material-icons-outlined text-secondary">
                        chevron_left
                    </span>
                </button>
                <button 
                    className="btn btn-sm p-1" 
                    onClick={currentView === 'month' ? handleNextMonth : handleNextWeek}
                >
                    <span className="material-icons-outlined text-secondary">
                        chevron_right
                    </span>
                </button>
            </div>
            
            {/* Current period display */}
            <div className="flex-grow-1">
                <h2 className='mb-0 fs-5 text-secondary fw-bold'>
                    {getCurrentDisplayTitle()}
                </h2>
            </div>
            
            {/* View switching buttons */}
            <div className="d-flex align-items-center ms-2">
                <div className="btn-group btn-group-sm" role="group" aria-label="Calendar view">
                    <button 
                        className={`btn d-flex align-items-center ${currentView === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={switchToMonthView}
                        title="Month view"
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                            calendar_view_month
                        </span>
                        {!isMobile && <span className="ms-1">Month</span>}
                    </button>
                    <button 
                        className={`btn d-flex align-items-center ${currentView === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={switchToWeekView}
                        title="Week view"
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                            calendar_view_week
                        </span>
                        {!isMobile && <span className="ms-1">Week</span>}
                    </button>
                </div>
            </div>
        </header>
    );
}
