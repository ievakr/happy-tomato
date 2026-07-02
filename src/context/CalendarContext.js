import React, { useContext } from "react";

const CalendarContext = React.createContext({
    monthIndex: 0,
    setMonthIndex: (index) => {},
    smallCalendarMonth: 0,
    setSmallCalendarMonth: (index) => {},
    daySelected: null,
    setDaySelected: (day) => {},
    // View management
    currentView: "month", // "month", "year" (mobile month drill-down), "week", "daily", or "guide"
    setCurrentView: () => {},
    weekIndex: 0,
    setWeekIndex: (index) => {},
    currentDayIndex: 0,
    setCurrentDayIndex: (index) => {}
});

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used within a CalendarProvider");
  }
  return ctx;
}

export default CalendarContext;
