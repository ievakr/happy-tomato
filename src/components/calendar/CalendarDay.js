import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../../context/GlobalContext';
import { PLANT_LABELS } from '../../constants';
import '../../index.css'

export default function CalendarDay({ day, rowIndex }) {
    const { setDaySelected, setShowEventModal, filteredEvents, setSelectedEvent } = useContext(GlobalContext);
    const [dayEvents, setDayEvents] = useState([]);

    useEffect(() => {
        const events = filteredEvents.filter(evt => dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY"));
        setDayEvents(events);
    }, [filteredEvents, day]);

    function getCurrentDayClass() {
        return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
            ? 'bg-primary text-white rounded-circle d-flex align-items-center justify-content-center'
            : "";
    }



    const handleEventClick = (evt, e) => {
        e.stopPropagation();
        setSelectedEvent(evt);
        setShowEventModal(true);
    };

    const truncateText = (text, maxLength = 12) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength);
    };

    const isTextTruncated = (text, maxLength = 12) => {
        return text && text.length > maxLength;
    };

    return (
        <div className="day-cell border border-secondary d-flex flex-column" style={{ 
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
        }}>
            <header className="d-flex flex-column align-items-center flex-shrink-0" style={{ padding: '4px 0' }}>
                <div
                    className={`day-number text-center ${getCurrentDayClass()}`}
                    style={{ width: '30px', height: '30px', lineHeight: '30px' }}
                >
                    {day.format('DD')}
                </div>
            </header>
            <div 
                className="flex-grow-1 cursor-pointer position-relative" 
                style={{ 
                    overflow: 'hidden',
                    overflowY: 'auto',
                    maxHeight: 'calc(100% - 60px)',
                    padding: '2px'
                }}
                onClick={() => {
                    setDaySelected(day);
                    setShowEventModal(true);
                }}
            >
                {dayEvents.length > 3 && (
                    <div className="text-muted small text-center mb-1" style={{ fontSize: '0.6rem' }}>
                        {dayEvents.length} events - tap to view all
                    </div>
                )}
                
                {dayEvents.slice(0, 3).map((evt, idx) => (
                    <div
                        key={idx}
                        onClick={(e) => handleEventClick(evt, e)}
                        className="event-item d-flex flex-column align-items-start position-relative" 
                        style={{ 
                            gap: "2px", 
                            marginBottom: "2px",
                            padding: '2px',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            border: '1px solid rgba(0,0,0,0.1)'
                        }}
                        title={evt.title || evt.toDo ? `${evt.title || evt.toDo}${evt.description ? ' - ' + evt.description : ''}` : ''}
                    >
                        <div className="d-flex align-items-center w-100">
                            <div className="d-flex flex-wrap align-items-center" style={{
                                maxWidth: "100%", 
                                overflow: 'hidden'
                            }}>
                                {evt.toDo && !evt.title && (
                                    <div className="d-flex align-items-center w-100">
                                        <span className="event-item flex-grow-1" style={{
                                            cursor: "pointer", 
                                            backgroundColor: "red", 
                                            padding: "1px 3px", 
                                            borderRadius: "3px", 
                                            color: "white", 
                                            fontSize: "0.6rem",
                                            marginBottom: "1px",
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {truncateText(evt.toDo, 15)}
                                        </span>
                                        {isTextTruncated(evt.toDo, 15) && (
                                            <span className="text-muted ms-1" style={{ fontSize: '0.5rem' }}>
                                                ...
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {evt.title && (
                                    <div className="d-flex align-items-center w-100">
                                        <span className="event-item flex-grow-1" style={{
                                            cursor: "pointer", 
                                            fontSize: "0.65rem",
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {truncateText(evt.title, 12)}
                                        </span>
                                        {isTextTruncated(evt.title, 12) && (
                                            <span className="text-muted ms-1" style={{ fontSize: '0.5rem' }}>
                                                ...
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {/* Icons row */}
                                <div className="d-flex align-items-center mt-1">
                                    {(evt.labels || []).slice(0, 3).map((label, labelIdx) => {
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
                                    {(evt.labels || []).length > 3 && (
                                        <span className="text-muted" style={{ fontSize: '0.5rem' }}>
                                            +{(evt.labels || []).length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {evt.title === "Mavrik" && (
                            <div className="calendar-event-box" style={{ 
                                marginTop: '2px',
                                maxHeight: '40px',
                                overflow: 'hidden'
                            }}>
                                Make sure to wait at least 7 days before harvest!
                            </div>
                        )}
                        
                        {/* Tap indicator for mobile */}
                        <div className="position-absolute top-0 end-0 d-md-none" style={{ 
                            fontSize: '0.5rem',
                            color: 'rgba(0,0,0,0.4)',
                            padding: '2px'
                        }}>
                            <i className="material-icons-outlined" style={{ fontSize: '8px' }}>
                                touch_app
                            </i>
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
            </div>
        </div>
    );
}
