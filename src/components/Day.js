import React, { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import GlobalContext from '../context/GlobalContext';
import '../index.css'

export default function Day({ day, rowIdx }) {
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

    const labelsClasses = {
        "rose": "Roses",
        "tomato": "Tomatoes",
        "cucumber": "Cucumbers",
        "radish": "Radishes",
        "onion": "Onions",
        "pepper-alt": "Bell Peppers",
        "garlic-alt": "Garlic",
        "leafy-green": "Salad",
        "carrot": "Carrots",
        "broccoli": "Broccoli",
        "watermelon": "Watermelon",
        "strawberry": "Strawberries",
        "pumpkin": "Squash"
    };

    return (
        <div className="border border-secondary d-flex flex-column">
            <header className="d-flex flex-column align-items-center">
                {rowIdx === 0 && (
                    <p className="text-muted small mt-1 mb-0">
                        {day.format('ddd').toUpperCase()}
                    </p>
                )}
                <div
                    className={`text-center ${getCurrentDayClass()}`}
                    style={{ width: '30px', height: '30px', lineHeight: '30px' }}
                >
                    {day.format('DD')}
                </div>
            </header>
            <div className="flex-grow-1 cursor-pointer" onClick={() => {
                setDaySelected(day);
                setShowEventModal(true);
            }}>
                {dayEvents.map((evt, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedEvent(evt)}
                        className="d-flex flex-column align-items-start ms-2" style={{ gap: "6px" }}
                    >
                        <div className="d-flex align-items-center">
                            <div className="d-flex flex-wrap align-items-center" style={{maxWidth: "100%"}}>
                            {evt.toDo && !evt.title && (
                                    <span style={{cursor: "pointer", backgroundColor: "red", padding: 5, borderRadius: 6, color: "white", whiteSpace: "nowrap"}}>
                                        {evt.toDo}
                                    </span>
                                )}
                                <span className="me-2" style={{cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                                    {evt.title}
                                </span>
                                {(evt.labels || []).map((label, labelIdx) => {
                                    const iconClass = Object.keys(labelsClasses).find(key => labelsClasses[key] === label) || label;
                                    return (
                                        <i 
                                            key={labelIdx} 
                                            className={`fi fi-rr-${iconClass}`} 
                                            style={{ fontSize: "20px", cursor: "pointer", minWidth: "20px", marginRight: "3px", lineHeight: "40px"}}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                        {evt.title === "Mavrik" && (
                            <div className="calendar-event-box">
                                Make sure to wait at least 7 days before harvest!
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
