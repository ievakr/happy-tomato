import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive, useCalendarEventActions } from '../../hooks';
import { filterEventsForDay, isToday } from '../../utils/eventDates';
import { isTodoEvent, isCompletedTodoAction } from '../../utils/recurringTodos';
import CalendarEventChip from './CalendarEventChip';
import '../../index.css'

export default function CalendarDay({ day, rowIndex }) {
    const { setDaySelected, setCurrentView, monthIndex } = useCalendarContext();
    const { filteredEvents, plantsById } = useEventContext();
    const { isMobile } = useResponsive();
    const { handleEventClick, openEventForDay } = useCalendarEventActions();
    const [dayEvents, setDayEvents] = useState([]);
    
    const monthAnchor = dayjs(new Date(dayjs().year(), monthIndex, 1));
    const isCurrentMonth = day.isSame(monthAnchor, 'month');

    useEffect(() => {
        setDayEvents(filterEventsForDay(filteredEvents, day));
    }, [filteredEvents, day]);

    function getCurrentDayClass() {
        return isToday(day) ? 'day-number-current' : "";
    }

    const handleDayClick = () => {
        setDaySelected(day);

        if (isMobile) {
            setCurrentView('daily');
        } else {
            openEventForDay(day);
        }
    };

    // Mobile month grid: red = pending to-dos, green = completed to-dos (counts only; other events use desktop chips)
    const renderMobileEventCount = () => {
        const pendingCount = dayEvents.filter(evt => isTodoEvent(evt)).length;
        const doneCount = dayEvents.filter(evt => isCompletedTodoAction(evt)).length;

        if (pendingCount === 0 && doneCount === 0) return null;

        const circleStyle = {
            width: '17px',
            height: '17px',
            fontSize: '0.6rem',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '2px',
        };

        return (
            <div
                className="event-count-indicators-row d-flex justify-content-center align-items-start gap-1 w-100"
                style={{
                    height: '100%',
                    paddingTop: '6px',
                    paddingLeft: '2px',
                    paddingRight: '2px',
                }}
            >
                {pendingCount > 0 && (
                    <div
                        className="event-count-indicator d-flex align-items-center justify-content-center rounded-circle bg-danger text-white fw-bold"
                        style={circleStyle}
                        title={`${pendingCount} not done — tap to view`}
                    >
                        {pendingCount}
                    </div>
                )}
                {doneCount > 0 && (
                    <div
                        className="event-count-indicator d-flex align-items-center justify-content-center rounded-circle bg-success text-white fw-bold"
                        style={circleStyle}
                        title={`${doneCount} done — tap to view`}
                    >
                        {doneCount}
                    </div>
                )}
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
                        onClick={(e) => handleEventClick(evt, e, day)}
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
