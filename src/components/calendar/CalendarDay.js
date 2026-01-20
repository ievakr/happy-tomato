import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import EventContext from '../../context/EventContext';
import { PLANT_LABELS, UI_CONSTANTS } from '../../constants';
import { useResponsive, useRecurringActions } from '../../hooks';
import '../../index.css'

export default function CalendarDay({ day, rowIndex }) {
    const { setDaySelected, setCurrentView, monthIndex } = useContext(CalendarContext);
    const { setShowEventModal, filteredEvents, setSelectedEvent } = useContext(EventContext);
    const { isMobile } = useResponsive();
    const { isTodoEvent, isCompletedTodoAction } = useRecurringActions();
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

    function getEventClasses(evt) {
        let baseClasses = "calendar-event text-xs rounded p-1 m-1 d-flex align-items-center cursor-pointer";
        
        if (isTodoEvent(evt)) {
            return `${baseClasses} calendar-event--todo border border-danger bg-danger bg-opacity-10 text-danger-emphasis`;
        } else if (isCompletedTodoAction(evt)) {
            return `${baseClasses} calendar-event--completed border border-success bg-success bg-opacity-10 text-success-emphasis`;
        }
        return `${baseClasses} calendar-event--default border border-primary bg-primary bg-opacity-10 text-primary-emphasis`;
    }

    function getEventIcon(evt) {
        if (isTodoEvent(evt)) {
            return "radio_button_unchecked"; // Unchecked circle for TO DO
        } else if (isCompletedTodoAction(evt)) {
            return "check_circle"; // Checked circle for completed
        } else {
            return "event"; // Default event icon
        }
    }

    const handleEventClick = (evt, e) => {
        e.stopPropagation();
        
        // Don't allow clicking on events in days from other months
        if (!isCurrentMonth) {
            return;
        }
        
        // Open event modal for editing - set selected event so delete button appears
        setSelectedEvent(evt);
        setDaySelected(day);
        setShowEventModal(true);
    };

    const handleDayClick = () => {
        // Don't allow clicking on days from other months
        if (!isCurrentMonth) {
            return;
        }
        
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

    // Mobile view: Show only event count
    const renderMobileEventCount = () => {
        if (dayEvents.length === 0) return null;
        
        // Determine color based on event types
        const hasTodos = dayEvents.some(evt => isTodoEvent(evt));
        const hasCompleted = dayEvents.some(evt => isCompletedTodoAction(evt));
        
        let bgColor = 'bg-primary'; // Default for regular events
        if (hasCompleted) {
            bgColor = 'bg-success'; // Green for completed actions (prioritize completed over pending)
        } else if (hasTodos) {
            bgColor = 'bg-danger'; // Red for TO DOs
        }
        
        return (
            <div className="d-flex justify-content-center align-items-start w-100" style={{ 
                height: '100%',
                paddingTop: '8px',
                paddingLeft: '4px',
                paddingRight: '4px',
                width: '100%' // Ensure full width
            }}>
                <div 
                    className={`event-count-indicator d-flex align-items-center justify-content-center rounded-circle ${bgColor} text-white fw-bold`}
                    style={{ 
                        width: '18px', 
                        height: '18px', 
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        flexShrink: 0, // Prevent shrinking
                        marginTop: '2px', // Additional top margin
                        position: 'relative' // Ensure proper positioning
                    }}
                    title={`${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} - tap to view`}
                >
                    {dayEvents.length}
                </div>
            </div>
        );
    };

    // Desktop view: Show detailed events (existing implementation)
    const renderDesktopEvents = () => {
        return (
            <>
                {dayEvents.length > 3 && (
                    <div className="text-muted small text-center mb-1" style={{ fontSize: '0.6rem' }}>
                        {dayEvents.length} events - tap to view all
                    </div>
                )}
                
                {dayEvents.slice(0, 3).map((evt, idx) => (
                    <div
                        key={idx}
                        onClick={(e) => handleEventClick(evt, e)}
                        className={getEventClasses(evt)}
                        style={{ 
                            gap: "2px", 
                            marginBottom: "2px",
                            padding: '3px 4px',
                            fontSize: "0.65rem"
                        }}
                        title={evt.title || evt.toDo ? `${evt.title || evt.toDo}${evt.description ? ' - ' + evt.description : ''}` : ''}
                    >
                        <div className="d-flex align-items-center w-100">
                            <span className="material-icons-outlined me-1" style={{ fontSize: '12px' }}>
                                {getEventIcon(evt)}
                            </span>
                            <div className="d-flex flex-wrap align-items-center flex-grow-1" style={{
                                maxWidth: "100%", 
                                wordWrap: 'break-word'
                            }}>
                                {evt.toDo && !evt.title && (
                                    <div className="d-flex align-items-center w-100">
                                        <span className="flex-grow-1" style={{
                                            fontSize: "0.6rem",
                                            wordWrap: 'break-word',
                                            whiteSpace: 'normal'
                                        }}>
                                            {evt.toDo}
                                        </span>
                                    </div>
                                )}
                                
                                {evt.title && (
                                    <div className="d-flex align-items-center w-100">
                                        <span className="flex-grow-1" style={{
                                            fontSize: "0.6rem",
                                            wordWrap: 'break-word',
                                            whiteSpace: 'normal'
                                        }}>
                                            {evt.title}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Icons row with responsive display */}
                                <div className="d-flex align-items-center mt-1" style={{
                                    flexWrap: isMobile ? 'nowrap' : 'wrap', // Allow wrapping on desktop for better display
                                }}>
                                    {(() => {
                                        const labels = evt.labels || [];
                                        const maxIcons = isMobile ? UI_CONSTANTS.MAX_ICONS_PER_EVENT : labels.length;
                                        const visibleLabels = labels.slice(0, maxIcons);
                                        const hasMoreLabels = labels.length > maxIcons;
                                        
                                        return (
                                            <>
                                                {visibleLabels.map((label, labelIdx) => {
                                                    const iconClass = Object.keys(PLANT_LABELS).find(key => PLANT_LABELS[key] === label) || label;
                                                    return (
                                                        <i 
                                                            key={labelIdx} 
                                                            className={`event-icons fi fi-rr-${iconClass}`} 
                                                            style={{ 
                                                                fontSize: "12px", 
                                                                cursor: "pointer", 
                                                                minWidth: "12px", 
                                                                marginRight: "1px", 
                                                                lineHeight: "1"
                                                            }}
                                                            title={label}
                                                        />
                                                    );
                                                })}
                                                {hasMoreLabels && (
                                                    <span className="text-muted" style={{ fontSize: '0.5rem' }}>
                                                        +{labels.length - maxIcons}
                                                    </span>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
                
                {dayEvents.length > 3 && (
                    <div className="text-center mt-1">
                        <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                            +{dayEvents.length - 3} more events
                        </small>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`day-cell border border-secondary d-flex flex-column ${isCurrentMonth ? '' : 'day-cell--other'}`}>
            <header className="d-flex flex-column align-items-center flex-shrink-0 py-1">
                <div
                    className={`day-number text-center ${getCurrentDayClass()} ${!isCurrentMonth ? 'text-muted' : ''}`}
                >
                    {day.format('DD')}
                </div>
            </header>
            <div 
                className={`day-cell-body flex-grow-1 position-relative ${isCurrentMonth ? 'cursor-pointer' : ''}`}
                style={{ 
                    overflowY: isMobile ? 'hidden' : 'auto'
                }}
                onClick={handleDayClick}
            >
                {isMobile ? renderMobileEventCount() : renderDesktopEvents()}
            </div>
        </div>
    );
}
