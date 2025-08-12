import dayjs from 'dayjs';
import React, { useContext, useEffect } from 'react';
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
        setWeekIndex,
        daySelected,
        setDaySelected
    } = useContext(GlobalContext);
    const { isMobile, windowSize } = useResponsive();
    
    // Very small screen detection (iPhone 13 mini and smaller)
    const isVerySmallScreen = windowSize.width < 390;
    
    // Auto-switch views based on screen size
    useEffect(() => {
        if (!isMobile && currentView === 'daily') {
            // Switch to week view when going from mobile to desktop
            switchToWeekView();
        } else if (isMobile && currentView === 'week' && currentView !== 'month') {
            // Switch to daily view when going from desktop to mobile (unless in month view)
            switchToDailyView();
        }
    }, [isMobile, currentView]);
    
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
    
    function handlePrevDay() {
        const currentDay = daySelected || dayjs();
        const prevDay = currentDay.subtract(1, 'day');
        setDaySelected(prevDay);
        
        // Update month if we went to previous month
        if (prevDay.month() !== currentDay.month()) {
            setMonthIndex(prevDay.month());
        }
    }
    
    function handleNextDay() {
        const currentDay = daySelected || dayjs();
        const nextDay = currentDay.add(1, 'day');
        setDaySelected(nextDay);
        
        // Update month if we went to next month
        if (nextDay.month() !== currentDay.month()) {
            setMonthIndex(nextDay.month());
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
    
    function switchToDailyView() {
        setCurrentView('daily');
        // Set current day when switching to daily view
        if (!daySelected) {
            setDaySelected(dayjs());
        }
    }
    

    
    function getCurrentDisplayTitle() {
        if (currentView === 'month') {
            return dayjs(new Date(dayjs().year(), monthIndex)).format(isMobile ? "MMM YYYY" : "MMMM YYYY");
        } else if (currentView === 'week') {
            const week = getWeekByIndex(monthIndex, weekIndex);
            return getWeekDateRange(week);
        } else if (currentView === 'daily') {
            const currentDay = daySelected || dayjs();
            return currentDay.format(isMobile ? "MMM D, YYYY" : "MMMM D, YYYY");
        }
    }
    
    function getNavigationHandler(direction) {
        if (currentView === 'month') {
            return direction === 'prev' ? handlePrevMonth : handleNextMonth;
        } else if (currentView === 'week') {
            return direction === 'prev' ? handlePrevWeek : handleNextWeek;
        } else if (currentView === 'daily') {
            return direction === 'prev' ? handlePrevDay : handleNextDay;
        }
    }
    return (
        <header className="calendar-header d-flex align-items-center px-2 px-md-4 py-2">
            {/* Mobile-only sidebar toggle button */}
            {isMobile && (
                <button 
                    className="sidebar-toggle btn btn-sm btn-outline-secondary me-2" 
                    onClick={toggleSidebar}
                    style={{
                        padding: '0.25rem 0.4rem',
                        fontSize: '0.8rem'
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>
                        menu
                    </span>
                </button>
            )}
            
            <img src={logo} alt="calendar" className="me-2" style={{ width: '32px', height: '32px' }} />
            
            {/* Desktop title */}
            <h1 className="d-none d-sm-block me-2 me-md-3 mb-0 fs-4 text-secondary fw-bold">
                Happy Tomato
            </h1>
            
            {/* Mobile title - styled differently */}
            <div className="d-sm-none mobile-title me-1">
                <div className="d-flex flex-column">
                    <span className="mobile-title-main">Happy Tomato</span>
                </div>
            </div>
            
            {/* Navigation buttons - only shown on desktop */}
            {!isMobile && (
                <>
                    <button 
                        className="btn btn-sm me-1" 
                        onClick={getNavigationHandler('prev')}
                    >
                        <span className="material-icons-outlined text-secondary">
                            chevron_left
                        </span>
                    </button>
                    <button 
                        className="btn btn-sm me-2" 
                        onClick={getNavigationHandler('next')}
                    >
                        <span className="material-icons-outlined text-secondary">
                            chevron_right
                        </span>
                    </button>
                </>
            )}
            
            {/* Current period display - next to chevrons on desktop */}
            <div className="d-none d-md-block ms-2">
                <h2 className='mb-0 fs-5 text-secondary fw-bold'>
                    {getCurrentDisplayTitle()}
                </h2>
            </div>
            
            {/* View switching buttons */}
            <div className="btn-group flex-shrink-0 ms-auto" role="group" aria-label="Calendar view" style={{ fontSize: '0.8rem' }}>
                <button 
                    className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={switchToMonthView}
                    title="Month view"
                    style={{ 
                        padding: isVerySmallScreen ? '0.25rem 0.4rem' : '0.25rem 0.5rem', 
                        fontSize: '0.75rem', 
                        lineHeight: '1.2' 
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                        calendar_view_month
                    </span>
                    <span>{isVerySmallScreen ? 'M' : 'Month'}</span>
                </button>
                
                {/* Mobile shows Daily view, Desktop shows Weekly view */}
                {isMobile ? (
                    <button 
                        className={`btn btn-sm ${currentView === 'daily' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={switchToDailyView}
                        title="Daily view"
                        style={{ 
                            padding: isVerySmallScreen ? '0.25rem 0.4rem' : '0.25rem 0.5rem', 
                            fontSize: '0.75rem', 
                            lineHeight: '1.2' 
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                            today
                        </span>
                        <span>{isVerySmallScreen ? 'D' : 'Day'}</span>
                    </button>
                ) : (
                    <button 
                        className={`btn btn-sm ${currentView === 'week' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={switchToWeekView}
                        title="Week view"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', lineHeight: '1.2' }}
                    >
                        <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                            calendar_view_week
                        </span>
                        <span>Week</span>
                    </button>
                )}
            </div>
        </header>
    );
}
