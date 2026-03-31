import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive, useRecurringActions } from '../../hooks';
import CalendarEventChip from './CalendarEventChip';
import '../../index.css'

export default function CalendarDay({ day, rowIndex }) {
    const { setDaySelected, setCurrentView, monthIndex } = useContext(CalendarContext);
    const { setShowEventModal, filteredEvents, setSelectedEvent, plantsById } = useEventContext();
    const { isMobile } = useResponsive();
    const { isTodoEvent } = useRecurringActions();
    const [dayEvents, setDayEvents] = useState([]);
    
    // Check if this day belongs to the currently displayed month
    const isCurrentMonth = day.month() === monthIndex;

    useEffect(() => {
        const events = filteredEvents.filter(evt => dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY"));
        setDayEvents(events);
    }, [filteredEvents, day]);

    function getCurrentDayClass() {
        return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
            ? 'day-number-current'
            : "";
    }

    const handleEventClick = (evt, e) => {
        e.stopPropagation();
        
        // Open event modal for editing - set selected event so delete button appears
        setSelectedEvent(evt);
        setDaySelected(day);
        setShowEventModal(true);
    };

    const handleDayClick = () => {
        // Set the selected day for both mobile and desktop
        setDaySelected(day);
        
        if (isMobile) {
            // On mobile: switch to daily view instead of opening modal
            setCurrentView('daily');
        } else {
            // On desktop: open modal for creating/viewing events
            setShowEventModal(true);
        }
    };

    // Mobile month grid: compact event count badge
    const renderMobileEventCount = () => {
        if (dayEvents.length === 0) return null;
        
        const hasTodos = dayEvents.some(evt => isTodoEvent(evt));
        const hasCompleted = dayEvents.some(evt => evt.completed);
        
        let bgColor = 'bg-primary';
        if (hasCompleted) {
            bgColor = 'bg-success';
        } else if (hasTodos) {
            bgColor = 'bg-danger';
        }
        
        return (
            <div className="d-flex justify-content-center align-items-start w-100" style={{ 
                height: '100%',
                paddingTop: '8px',
                paddingLeft: '4px',
                paddingRight: '4px',
                width: '100%'
            }}>
                <div 
                    className={`event-count-indicator d-flex align-items-center justify-content-center rounded-circle ${bgColor} text-white fw-bold`}
                    style={{ 
                        width: '18px', 
                        height: '18px', 
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginTop: '2px',
                        position: 'relative'
                    }}
                    title={`${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} - tap to view`}
                >
                    {dayEvents.length}
                </div>
            </div>
        );
    };

    const renderDesktopEvents = () => {
        return (
            <>
                {dayEvents.map((evt, idx) => (
                    <CalendarEventChip
                        key={evt.id || idx}
                        event={evt}
                        plantsById={plantsById}
                        onClick={(e) => handleEventClick(evt, e)}
                    />
                ))}
            </>
        );
    };

    return (
        <div 
            className={`day-cell border border-secondary d-flex flex-column cursor-pointer ${isCurrentMonth ? '' : 'day-cell--other'}`}
            onClick={handleDayClick}
        >
            <header className="d-flex flex-column align-items-center flex-shrink-0 py-1">
                <div
                    className={`day-number text-center ${getCurrentDayClass()} ${!isCurrentMonth ? 'text-muted' : ''}`}
                >
                    {day.format('DD')}
                </div>
            </header>
            <div 
                className="day-cell-body flex-grow-1 position-relative"
                style={{ 
                    minHeight: 0,
                    overflowY: isMobile ? 'hidden' : 'auto',
                    WebkitOverflowScrolling: isMobile ? undefined : 'touch',
                }}
            >
                {isMobile ? renderMobileEventCount() : renderDesktopEvents()}
            </div>
        </div>
    );
}
