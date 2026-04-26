import dayjs from 'dayjs';
import React, { useContext, useEffect, useCallback } from 'react';
import logo from '../../assets/logo.png';
import CalendarContext from '../../context/CalendarContext';
import LayoutContext from '../../context/LayoutContext';
import { getCurrentWeekIndex, calendarDateFromMonthIndex } from '../../utils';
import { useResponsive } from '../../hooks/useResponsive';
import UserMenu from '../auth/UserMenu';

export default function Header() {
    const {
        monthIndex, 
        setMonthIndex, 
        currentView, 
        setCurrentView, 
        weekIndex,
        setWeekIndex,
        daySelected,
        setDaySelected
    } = useContext(CalendarContext);
    const { showSidebar, setShowSidebar } = useContext(LayoutContext);
    const { isMobile } = useResponsive();
    
    const switchToWeekView = useCallback(() => {
        setCurrentView('week');
        // Set current week when switching to week view
        const currentWeekIdx = getCurrentWeekIndex(monthIndex, dayjs());
        setWeekIndex(currentWeekIdx);
    }, [monthIndex, setCurrentView, setWeekIndex]);
    
    const switchToDailyView = useCallback(() => {
        setCurrentView('daily');
        // Set current day when switching to daily view
        if (!daySelected) {
            setDaySelected(dayjs());
        }
    }, [daySelected, setCurrentView, setDaySelected]);
    
    // Auto-switch views based on screen size
    useEffect(() => {
        if (currentView === 'garden') {
            return;
        }
        if (!isMobile && currentView === 'year') {
            setCurrentView('month');
            return;
        }
        if (!isMobile && currentView === 'daily') {
            // Switch to week view when going from mobile to desktop
            switchToWeekView();
        } else if (isMobile && currentView === 'week' && currentView !== 'month') {
            // Switch to daily view when going from desktop to mobile (unless in month view)
            switchToDailyView();
        }
    }, [isMobile, currentView, setCurrentView, switchToDailyView, switchToWeekView]);
    
    function applyMonthChange(newMonth) {
        setMonthIndex(newMonth);
        // Reset week index when changing months
        if (currentView === 'week') {
            setWeekIndex(0);
        }
        // Update selected day for daily view - preserve day of month
        if (currentView === 'daily') {
            const currentDay = daySelected || dayjs();
            const dayOfMonth = currentDay.date();
            const refYear = dayjs().year();
            const dim = dayjs(new Date(refYear, newMonth, 1)).daysInMonth();
            const newDay = dayjs(new Date(refYear, newMonth, Math.min(dayOfMonth, dim)));
            setDaySelected(newDay);
        }
    }
    function handlePrevMonth() {
        const newMonth = monthIndex - 1;
        applyMonthChange(newMonth);
    }
    function handleNextMonth() {
        const newMonth = monthIndex + 1;
        applyMonthChange(newMonth);
    }

    
    function toggleSidebar() {
        setShowSidebar(!showSidebar)
    }
    
    function switchToMonthView() {
        setCurrentView('month');
    }

    /** Mobile: one control for day → month → year (iPhone Calendar–style), replacing the icon toggle. */
    const mobileCalendarHierarchyYear = calendarDateFromMonthIndex(monthIndex).year();
    const mobileNavMonthName = (daySelected || dayjs()).format('MMMM');
    const handleMobileCalendarNav = () => {
        if (currentView === 'garden') return;
        if (currentView === 'daily') {
            setCurrentView('month');
        } else if (currentView === 'month') {
            setCurrentView('year');
        }
    };
    const mobileCalendarNavLabel =
        currentView === 'month'
            ? `< ${mobileCalendarHierarchyYear}`
            : `< ${mobileNavMonthName}`;
    const mobileCalendarNavTitle =
        currentView === 'daily'
            ? `Month view — ${mobileNavMonthName}`
            : currentView === 'month'
              ? `Year ${mobileCalendarHierarchyYear}`
              : 'Calendar';

    const handlePrevWeek = () => {
        if (weekIndex > 0) {
            setWeekIndex(weekIndex - 1);
        } else {
            setMonthIndex(monthIndex - 1);
            setWeekIndex(4);
        }
    };

    const handleNextWeek = () => {
        if (weekIndex < 4) {
            setWeekIndex(weekIndex + 1);
        } else {
            setMonthIndex(monthIndex + 1);
            setWeekIndex(0);
        }
    };

    return (
        <header className={`calendar-header position-relative border-bottom bg-white px-2 px-md-4 py-2 ${isMobile ? 'd-flex flex-column' : 'd-flex align-items-center'}`}>
            {/* Mobile: First row with basic controls */}
            {isMobile ? (
                <>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        {/* Left side: Sidebar toggle + Logo + App name */}
                        <div className="d-flex align-items-center">
                            <button 
                                className="sidebar-toggle btn btn-sm btn-outline-secondary me-2" 
                                onClick={toggleSidebar}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>
                                    menu
                                </span>
                            </button>
                            <img src={logo} alt="calendar" className="me-2" style={{ width: '28px', height: '28px' }} />
                            <span className="mobile-title-main app-title">
                                Happy Tomato
                            </span>
                        </div>
                        
                        {/* Right side: Month/year drill-down + settings (day view is default on mobile) */}
                        <div className="d-flex align-items-center gap-1">
                            {currentView !== 'garden' && currentView !== 'year' && (
                                <button
                                    type="button"
                                    className="calendar-header-mobile-calendar-nav btn btn-sm flex-shrink-0 text-nowrap"
                                    onClick={handleMobileCalendarNav}
                                    title={mobileCalendarNavTitle}
                                    aria-label={mobileCalendarNavTitle}
                                >
                                    {mobileCalendarNavLabel}
                                </button>
                            )}

                            {/* User menu */}
                            <div className="flex-shrink-0">
                                <UserMenu />
                            </div>
                        </div>
                    </div>
                    
                </>
            ) : (
                <>
                    {/* Desktop layout - single row */}
                    <img src={logo} alt="calendar" className="me-2" style={{ width: '32px', height: '32px' }} />
                    
                    <h1 className="me-2 me-md-3 mb-0 fs-4 fw-bold app-title">
                        Happy Tomato
                    </h1>

                    {/* Center navigation - week or month */}
                    <div className="calendar-month-nav calendar-month-nav-centered d-flex align-items-center">
                        {currentView === 'garden' ? (
                            <span className="calendar-month-label mx-2 text-secondary">
                                Plan beds by year
                            </span>
                        ) : currentView === 'week' ? (
                            <>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handlePrevWeek}
                                    aria-label="Previous week"
                                    title="Previous week"
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_left
                                    </span>
                                </button>
                                <span className="calendar-month-label mx-2">
                                    {dayjs(new Date(dayjs().year(), monthIndex)).format("MMMM YYYY")}
                                </span>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handleNextWeek}
                                    aria-label="Next week"
                                    title="Next week"
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_right
                                    </span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handlePrevMonth}
                                    aria-label="Previous month"
                                    title="Previous month"
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_left
                                    </span>
                                </button>
                                <span className="calendar-month-label mx-2">
                                    {dayjs(new Date(dayjs().year(), monthIndex)).format("MMMM YYYY")}
                                </span>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handleNextMonth}
                                    aria-label="Next month"
                                    title="Next month"
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_right
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
            
            {/* Desktop controls */}
            {!isMobile && (
                    <div className="d-flex align-items-center ms-auto gap-2">
                    {/* View switching buttons */}
                    <div className="btn-group flex-shrink-0" role="group" aria-label="Calendar view">
                        <button 
                            className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={switchToMonthView}
                            title="Month view"
                            aria-label="Month view"
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                                calendar_view_month
                            </span>
                            <span>Month</span>
                        </button>
                        
                        <button 
                            className={`btn btn-sm ${currentView === 'week' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={switchToWeekView}
                            title="Week view"
                            aria-label="Week view"
                        >
                            <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                calendar_view_week
                            </span>
                            <span>Week</span>
                        </button>
                    </div>
                    
                    {/* User menu */}
                    <UserMenu />
                </div>
            )}
        </header>
    );
}
