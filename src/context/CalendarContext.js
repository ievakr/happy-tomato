import React from "react";

const CalendarContext = React.createContext({
    monthIndex: 0,
    setMonthIndex: (index) => {},
    smallCalendarMonth: 0,
    setSmallCalendarMonth: (index) => {},
    daySelected: null,
    setDaySelected: (day) => {},
    // View management
    currentView: "month", // "month", "week", or "daily" (daily only on mobile)
    setCurrentView: () => {},
    weekIndex: 0,
    setWeekIndex: (index) => {},
    currentDayIndex: 0,
    setCurrentDayIndex: (index) => {}
});

export default CalendarContext;
