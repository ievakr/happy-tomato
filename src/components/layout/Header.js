import dayjs from 'dayjs';
import React, { useContext } from 'react';
import { useCalendarContext, isFullPageCalendarView } from '../../context/CalendarContext';
import LayoutContext from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import { capitalizeFirst } from '../../utils';
import { useResponsive, useResponsiveCalendarView } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';
import './Header.css';

function nameInitial(user, language) {
    const source = (user?.displayName || user?.email || '').trim();
    const letter = Array.from(source)[0] || '';
    return letter ? letter.toLocaleUpperCase(language) : '?';
}

export default function Header() {
    const { t, language } = useTranslation();
    const { currentUser } = useAuth();
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

    const openProfile = () => setCurrentView('settings');

    function applyMonthChange(newMonth) {
        setMonthIndex(newMonth);
        if (currentView === 'week') {
            setWeekIndex(0);
        }
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
        applyMonthChange(monthIndex - 1);
    }
    function handleNextMonth() {
        applyMonthChange(monthIndex + 1);
    }

    function toggleSidebar() {
        setShowSidebar(!showSidebar);
    }

    function switchToMonthView() {
        setCurrentView('month');
    }

    const isGuideLikeView = isFullPageCalendarView(currentView);
    const sectionTitleKey = {
        settings: 'settings.account',
        'manage-plants': 'layout.plantManagement',
        'manage-todo': 'layout.todoManagement',
        guide: 'layout.vegetableGuide',
        'disease-guide': 'layout.diseaseGuide',
    }[currentView];
    const sectionTitle = sectionTitleKey ? t(sectionTitleKey) : '';
    const isYearView = currentView === 'year';
    const navDate = dayjs(new Date(dayjs().year(), monthIndex)).locale(language);
    const monthLabel = isYearView
        ? navDate.format('YYYY')
        : capitalizeFirst(navDate.format('MMMM YYYY'));

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

    const handlePrevYear = () => setMonthIndex(monthIndex - 12);
    const handleNextYear = () => setMonthIndex(monthIndex + 12);

    const goPrev = currentView === 'week'
        ? handlePrevWeek
        : isYearView
            ? handlePrevYear
            : handlePrevMonth;
    const goNext = currentView === 'week'
        ? handleNextWeek
        : isYearView
            ? handleNextYear
            : handleNextMonth;
    const prevLabel = currentView === 'week'
        ? t('layout.previousWeek')
        : isYearView
            ? t('calendar.prevYear')
            : t('layout.previousMonth');
    const nextLabel = currentView === 'week'
        ? t('layout.nextWeek')
        : isYearView
            ? t('calendar.nextYear')
            : t('layout.nextMonth');

    const isCalendarChrome = currentView === 'daily' || currentView === 'month' || currentView === 'year';
    const periodSide = currentView === 'month'
        ? { label: t('layout.yearShort'), view: 'year' }
        : { label: t('layout.month'), view: 'month' };

    return (
        <header className={`calendar-header position-relative border-bottom bg-white px-2 px-md-4 py-2 ${isMobile ? 'd-flex flex-column' : 'd-flex align-items-center'}`}>
            {isMobile ? (
                <>
                <div className="header-mobile-bar">
                    <button
                        className={`header-menu-btn${
                          sectionTitle
                            ? ''
                            : currentView === 'daily' || currentView === 'month' || currentView === 'year'
                              ? ' header-menu-btn--ink'
                              : ' header-menu-btn--large'
                        }`}
                        onClick={toggleSidebar}
                        type="button"
                        aria-label={t('layout.openMenu')}
                    >
                        <span className="material-icons-outlined" aria-hidden>
                            menu
                        </span>
                    </button>
                    {sectionTitle ? (
                        <h1 className="header-page-title">{sectionTitle}</h1>
                    ) : isCalendarChrome ? (
                        <h1 className="header-page-title">{t('layout.calendar')}</h1>
                    ) : !isGuideLikeView ? (
                        <div className="header-month-nav">
                            <button
                                className="header-month-chevron"
                                onClick={goPrev}
                                aria-label={prevLabel}
                                title={prevLabel}
                                type="button"
                            >
                                <span className="material-icons-outlined" aria-hidden>
                                    chevron_left
                                </span>
                            </button>
                            <span className="header-month-label">{monthLabel}</span>
                            <button
                                className="header-month-chevron"
                                onClick={goNext}
                                aria-label={nextLabel}
                                title={nextLabel}
                                type="button"
                            >
                                <span className="material-icons-outlined" aria-hidden>
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    ) : (
                        <span className="header-month-nav" />
                    )}
                    <button
                        type="button"
                        className="header-avatar-btn"
                        onClick={openProfile}
                        aria-label={t('layout.profile')}
                        title={t('layout.profile')}
                    >
                        <span className="header-avatar" aria-hidden>
                            {nameInitial(currentUser, language)}
                        </span>
                    </button>
                </div>
                {isCalendarChrome && (
                    <div className="header-period-bar">
                        <button
                            type="button"
                            className="header-period-link header-period-link--start"
                            onClick={() => setCurrentView(periodSide.view)}
                        >
                            {periodSide.label}
                        </button>
                        <div className="header-month-nav">
                            <button
                                className="header-month-chevron"
                                onClick={goPrev}
                                aria-label={prevLabel}
                                title={prevLabel}
                                type="button"
                            >
                                <span className="material-icons-outlined" aria-hidden>
                                    chevron_left
                                </span>
                            </button>
                            <span className="header-month-label">{monthLabel}</span>
                            <button
                                className="header-month-chevron"
                                onClick={goNext}
                                aria-label={nextLabel}
                                title={nextLabel}
                                type="button"
                            >
                                <span className="material-icons-outlined" aria-hidden>
                                    chevron_right
                                </span>
                            </button>
                        </div>
                        <button
                            type="button"
                            className="header-period-link header-period-link--end"
                            onClick={() => {
                                goToToday();
                                if (currentView !== 'daily') {
                                    setCurrentView('daily');
                                }
                            }}
                        >
                            {t('calendar.today')}
                        </button>
                    </div>
                )}
                </>
            ) : (
                <>
                    {sectionTitle && (
                        <h1 className="header-page-title header-page-title--desktop">{sectionTitle}</h1>
                    )}
                    {!isGuideLikeView && (
                        <div className="calendar-month-nav calendar-month-nav-centered d-flex align-items-center">
                            {currentView === 'week' ? (
                                <>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={handlePrevWeek}
                                        aria-label={t('layout.previousWeek')}
                                        title={t('layout.previousWeek')}
                                        type="button"
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                            chevron_left
                                        </span>
                                    </button>
                                    <span className="calendar-month-label mx-2">
                                        {monthLabel}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={handleNextWeek}
                                        aria-label={t('layout.nextWeek')}
                                        title={t('layout.nextWeek')}
                                        type="button"
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
                                        type="button"
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                            chevron_left
                                        </span>
                                    </button>
                                    <span className="calendar-month-label mx-2">
                                        {monthLabel}
                                    </span>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={handleNextMonth}
                                        aria-label={t('layout.nextMonth')}
                                        title={t('layout.nextMonth')}
                                        type="button"
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                            chevron_right
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {!isMobile && (
                <div className="d-flex align-items-center ms-auto gap-2">
                    {!isGuideLikeView && (
                        <div className="btn-group flex-shrink-0" role="group" aria-label={t('layout.calendar')}>
                            <button
                                className={`btn btn-sm ${currentView === 'month' ? 'btn-danger' : 'btn-outline-danger'}`}
                                onClick={switchToMonthView}
                                title={t('layout.monthView')}
                                aria-label={t('layout.monthView')}
                                type="button"
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
                                type="button"
                            >
                                <span className="material-icons-outlined me-1" style={{ fontSize: '0.9rem' }}>
                                    calendar_view_week
                                </span>
                                <span>{t('layout.week')}</span>
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        className="btn p-0 border-0 bg-transparent"
                        onClick={openProfile}
                        aria-label={t('layout.profile')}
                        title={t('layout.profile')}
                    >
                        <span className="header-avatar" aria-hidden>
                            {nameInitial(currentUser, language)}
                        </span>
                    </button>
                </div>
            )}
        </header>
    );
}
