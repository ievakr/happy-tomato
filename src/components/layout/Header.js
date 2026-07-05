import dayjs from 'dayjs';
import React, { useContext, useCallback } from 'react';
import logo from '../../assets/logo.png';
import { useCalendarContext } from '../../context/CalendarContext';
import LayoutContext from '../../context/LayoutContext';
import { calendarDateFromMonthIndex, capitalizeFirst } from '../../utils';
import { useResponsive, useResponsiveCalendarView } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import UserMenu from '../auth/UserMenu';

export default function Header() {
    const { t, language } = useTranslation();
    const {
        monthIndex, 
        setMonthIndex, 
        currentView, 
        setCurrentView, 
        weekIndex,
        setWeekIndex,
        daySelected,
        setDaySelected,
        goToToday,
    } = useCalendarContext();
    const { showSidebar, setShowSidebar } = useContext(LayoutContext);
    const { isMobile } = useResponsive();
    const { switchToWeekView } = useResponsiveCalendarView();
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

    const exitGuideView = useCallback(() => {
        goToToday();
        setCurrentView(isMobile ? 'daily' : 'month');
    }, [goToToday, isMobile, setCurrentView]);

    /** Mobile: one control for day → month → year (iPhone Calendar–style), replacing the icon toggle. */
    const mobileCalendarHierarchyYear = calendarDateFromMonthIndex(monthIndex).year();
    const mobileNavMonthName = capitalizeFirst(
        currentView === 'daily'
            ? calendarDateFromMonthIndex(monthIndex).locale(language).format('MMMM')
            : (daySelected || dayjs()).locale(language).format('MMMM')
    );
    const handleMobileCalendarNav = () => {
        if (currentView === 'guide') return;
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
            ? t('layout.monthViewNamed', { month: mobileNavMonthName })
            : currentView === 'month'
              ? t('layout.yearLabel', { year: mobileCalendarHierarchyYear })
              : t('layout.calendar');

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
                            {currentView === 'guide' ? (
                                <button
                                    type="button"
                                    className="calendar-header-mobile-calendar-nav btn btn-sm flex-shrink-0 text-nowrap"
                                    onClick={exitGuideView}
                                    title={t('layout.backToCalendar')}
                                    aria-label={t('layout.backToCalendar')}
                                >
                                    <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                        chevron_left
                                    </span>
                                    {t('layout.calendar')}
                                </button>
                            ) : currentView !== 'year' ? (
                                <button
                                    type="button"
                                    className="calendar-header-mobile-calendar-nav btn btn-sm flex-shrink-0 text-nowrap"
                                    onClick={handleMobileCalendarNav}
                                    title={mobileCalendarNavTitle}
                                    aria-label={mobileCalendarNavTitle}
                                >
                                    {mobileCalendarNavLabel}
                                </button>
                            ) : null}

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
                        {currentView === 'guide' ? (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                                onClick={exitGuideView}
                                title={t('layout.backToCalendar')}
                                aria-label={t('layout.backToCalendar')}
                            >
                                <span className="material-icons-outlined me-1" style={{ fontSize: '1rem' }}>
                                    chevron_left
                                </span>
                                {t('layout.calendar')}
                            </button>
                        ) : currentView === 'week' ? (
                            <>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handlePrevWeek}
                                    aria-label={t('layout.previousWeek')}
                                    title={t('layout.previousWeek')}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_left
                                    </span>
                                </button>
                                <span className="calendar-month-label mx-2">
                                    {capitalizeFirst(dayjs(new Date(dayjs().year(), monthIndex)).locale(language).format("MMMM YYYY"))}
                                </span>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handleNextWeek}
                                    aria-label={t('layout.nextWeek')}
                                    title={t('layout.nextWeek')}
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
                                    aria-label={t('layout.previousMonth')}
                                    title={t('layout.previousMonth')}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                        chevron_left
                                    </span>
                                </button>
                                <span className="calendar-month-label mx-2">
                                    {capitalizeFirst(dayjs(new Date(dayjs().year(), monthIndex)).locale(language).format("MMMM YYYY"))}
                                </span>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={handleNextMonth}
                                    aria-label={t('layout.nextMonth')}
                                    title={t('layout.nextMonth')}
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
                    <div className="btn-group flex-shrink-0" role="group" aria-label={t('layout.calendar')}>
                        <button 
                            className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={switchToMonthView}
                            title={t('layout.monthView')}
                            aria-label={t('layout.monthView')}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '0.9rem', marginRight: '0.25rem' }}>
                                calendar_view_month
                            </span>
                            <span>{t('layout.month')}</span>
                        </button>
                        
                        <button 
                            className={`btn btn-sm ${currentView === 'week' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={switchToWeekView}
                            title={t('layout.weekView')}
                            aria-label={t('layout.weekView')}
                        >
                            <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                calendar_view_week
                            </span>
                            <span>{t('layout.week')}</span>
                        </button>
                    </div>
                    
                    {/* User menu */}
                    <UserMenu />
                </div>
            )}
        </header>
    );
}
