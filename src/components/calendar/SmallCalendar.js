import React, { useEffect, useState, useContext } from "react";
import dayjs from "dayjs";
import { getMonth, getDayHeaders } from "../../utils";
import CalendarContext from "../../context/CalendarContext";

export default function SmallCalendar() {
    const [currentMonthIdx, setCurrentMonthIdx] = useState(dayjs().month());
    const [currentMonth, setCurrentMonth] = useState(getMonth());
    useEffect(() => {
        setCurrentMonth(getMonth(currentMonthIdx));
    }, [currentMonthIdx]);

    const { monthIndex, setSmallCalendarMonth, setDaySelected, daySelected } = useContext(CalendarContext);
    useEffect(() => {
        setCurrentMonthIdx(monthIndex);
    }, [monthIndex]);

    function handlePrevMonth() {
        setCurrentMonthIdx(currentMonthIdx - 1);
    }
    function handleNextMonth() {
        setCurrentMonthIdx(currentMonthIdx + 1);
    }
    function getDayClass(day) {
        const format = "DD-MM-YY";
        const nowDay = dayjs().format(format);
        const currDay = day.format(format);
        const slcDay = daySelected && daySelected.format(format);
        const isCurrentMonth = day.month() === currentMonthIdx;
        
        let classes = '';
        
        if (nowDay === currDay) {
            classes = 'bg-danger text-white rounded-circle';
        } else if (currDay === slcDay) {
            classes = "bg-warning text-danger font-weight-bold rounded-circle";
        }
        
        // Add grey styling for days not in current month
        if (!isCurrentMonth) {
            classes += ' text-muted';
        }
        
        return classes;
    }

    return (
        <div className="mt-4 mx-auto" style={{ width: '100%' }}>
            <header className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-secondary font-weight-bold mb-0">
                    {dayjs(new Date(dayjs().year(), currentMonthIdx)).format("MMMM YYYY")}
                </p>
                <div>
                    <button className="btn btn-link p-0" onClick={handlePrevMonth}>
                        <span className="material-icons-outlined text-secondary">
                            chevron_left
                        </span>
                    </button>
                    <button className="btn btn-link p-0" onClick={handleNextMonth}>
                        <span className="material-icons-outlined text-secondary">
                            chevron_right
                        </span>
                    </button>
                </div>
            </header>
            <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '40px' }}>
                {getDayHeaders('single').map((dayHeader, i) => (
                    <span key={i} className="text-center text-muted small py-1">
                        {dayHeader}
                    </span>
                ))}
                {currentMonth.map((row, i) => (
                    <React.Fragment key={i}>
                        {row.map((day, idx) => {
                            const isCurrentMonth = day.month() === currentMonthIdx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => { setSmallCalendarMonth(currentMonthIdx); setDaySelected(day); }}
                                    className={`btn btn-sm p-1 d-flex align-items-center justify-content-center ${getDayClass(day)}`}
                                    style={{ 
                                        width: '40px', 
                                        height: '40px',
                                        opacity: isCurrentMonth ? 1 : 0.4
                                    }}
                                >
                                    <span className="small">{day.format('D')}</span>
                                </button>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
