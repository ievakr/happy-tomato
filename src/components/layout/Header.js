import dayjs from 'dayjs';
import React, { useContext, useEffect, useCallback, useState } from 'react';
import logo from '../../assets/logo.png';
import GlobalContext from '../../context/GlobalContext';
import { getWeekByIndex, getWeekDateRange, getCurrentWeekIndex } from '../../utils';
import { useResponsive } from '../../hooks';
import { useEmailNotifications } from '../../hooks/useEmailNotifications';
import EmailNotificationSettings from '../settings/EmailNotificationSettings';
import UserMenu from '../auth/UserMenu';
import notificationService from '../../services/notificationService';

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
    const emailNotifications = useEmailNotifications();
    const [showEmailSettings, setShowEmailSettings] = useState(false);
    
    // Very small screen detection (iPhone 13 mini and smaller)
    const isVerySmallScreen = windowSize.width < 390;
    
    // Initialize notification service on mount
    useEffect(() => {
        if (emailNotifications.emailPreferences.enabled) {
            notificationService.start(emailNotifications);
        } else {
            notificationService.stop();
        }
        
        // Cleanup on unmount
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
        if (!isMobile && currentView === 'daily') {
            // Switch to week view when going from mobile to desktop
            switchToWeekView();
        } else if (isMobile && currentView === 'week' && currentView !== 'month') {
            // Switch to daily view when going from desktop to mobile (unless in month view)
            switchToDailyView();
        }
    }, [isMobile, currentView, switchToDailyView, switchToWeekView]);
    
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
        <header className={`calendar-header px-2 px-md-4 py-2 ${isMobile ? 'd-flex flex-column' : 'd-flex align-items-center'}`}>
            {/* Mobile: First row with basic controls */}
            {isMobile ? (
                <>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        {/* Left side: Sidebar toggle + Logo + App name */}
                        <div className="d-flex align-items-center">
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
                            <img src={logo} alt="calendar" className="me-2" style={{ width: '28px', height: '28px' }} />
                            <span className="mobile-title-main">Happy Tomato</span>
                        </div>
                        
                        {/* Right side: View buttons and settings */}
                        <div className="d-flex align-items-center gap-2">
                            {/* Email notification settings button */}
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowEmailSettings(true)}
                                title="Email notification settings"
                                style={{
                                    padding: '0.25rem 0.4rem',
                                    fontSize: '0.8rem'
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                    {emailNotifications.emailPreferences.enabled ? 'mail' : 'mail_outline'}
                                </span>
                            </button>
                            
                            <div className="btn-group flex-shrink-0" role="group" aria-label="Calendar view" style={{ fontSize: '0.8rem' }}>
                                <button 
                                    className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={switchToMonthView}
                                    title="Month view"
                                    style={{ 
                                        padding: '0.25rem 0.4rem', 
                                        fontSize: '0.75rem', 
                                        lineHeight: '1.2' 
                                    }}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                                        calendar_view_month
                                    </span>
                                    <span>{isVerySmallScreen ? 'M' : 'Month'}</span>
                                </button>
                                <button 
                                    className={`btn btn-sm ${currentView === 'daily' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={switchToDailyView}
                                    title="Daily view"
                                    style={{ 
                                        padding: '0.25rem 0.4rem', 
                                        fontSize: '0.75rem', 
                                        lineHeight: '1.2' 
                                    }}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                                        today
                                    </span>
                                    <span>{isVerySmallScreen ? 'D' : 'Day'}</span>
                                </button>
                            </div>
                            
                            {/* User menu */}
                            <UserMenu />
                        </div>
                    </div>
                    
                    {/* Mobile: Second row with navigation and month title */}
                    <div className="d-flex align-items-center justify-content-center">
                        <button 
                            className="btn btn-sm me-2" 
                            onClick={getNavigationHandler('prev')}
                            style={{ padding: '0.25rem 0.4rem' }}
                        >
                            <span className="material-icons-outlined text-secondary" style={{ fontSize: '1rem' }}>
                                chevron_left
                            </span>
                        </button>
                        
                        <h2 className="mb-0 text-secondary fw-bold text-center fs-6 mx-3">
                            {getCurrentDisplayTitle()}
                        </h2>
                        
                        <button 
                            className="btn btn-sm ms-2" 
                            onClick={getNavigationHandler('next')}
                            style={{ padding: '0.25rem 0.4rem' }}
                        >
                            <span className="material-icons-outlined text-secondary" style={{ fontSize: '1rem' }}>
                                chevron_right
                            </span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Desktop layout - single row */}
                    <img src={logo} alt="calendar" className="me-2" style={{ width: '32px', height: '32px' }} />
                    
                    <h1 className="me-2 me-md-3 mb-0 fs-4 text-secondary fw-bold">
                        Happy Tomato
                    </h1>
                    
                    {/* Current period display with navigation buttons */}
                    <div className="flex-grow-1 mx-2 d-flex align-items-center justify-content-center">
                        <button 
                            className="btn btn-sm me-1" 
                            onClick={getNavigationHandler('prev')}
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <span className="material-icons-outlined text-secondary" style={{ fontSize: '1.2rem' }}>
                                chevron_left
                            </span>
                        </button>
                        
                        <h2 className="mb-0 text-secondary fw-bold text-center fs-5 mx-3">
                            {getCurrentDisplayTitle()}
                        </h2>
                        
                        <button 
                            className="btn btn-sm ms-1" 
                            onClick={getNavigationHandler('next')}
                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <span className="material-icons-outlined text-secondary" style={{ fontSize: '1.2rem' }}>
                                chevron_right
                            </span>
                        </button>
                    </div>
                </>
            )}
            
            {/* Desktop controls */}
            {!isMobile && (
                <div className="d-flex align-items-center ms-auto gap-2">
                    {/* Email notification settings button */}
                    <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowEmailSettings(true)}
                        title="Email notification settings"
                        style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            lineHeight: '1.2'
                        }}
                    >
                        <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                            {emailNotifications.emailPreferences.enabled ? 'mail' : 'mail_outline'}
                        </span>
                        <span>Email</span>
                    </button>
                    
                    {/* View switching buttons */}
                    <div className="btn-group flex-shrink-0" role="group" aria-label="Calendar view" style={{ fontSize: '0.8rem' }}>
                        <button 
                            className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={switchToMonthView}
                            title="Month view"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', lineHeight: '1.2' }}
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
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', lineHeight: '1.2' }}
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
            
            {/* Email Notification Settings Modal */}
            <EmailNotificationSettings 
                show={showEmailSettings} 
                onHide={() => setShowEmailSettings(false)}
                emailNotifications={emailNotifications}
            />
        </header>
    );
}
