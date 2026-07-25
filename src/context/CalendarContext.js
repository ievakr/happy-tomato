import React, { useContext } from "react";

// Views that replace the calendar grid entirely with a standalone page (as opposed to
// "month"/"year"/"week"/"daily", which are all ways of looking at the calendar itself).
// The header shows a "back to calendar" control instead of month/week navigation for these.
export const FULL_PAGE_CALENDAR_VIEWS = ["guide", "disease-guide", "settings"];

export function isFullPageCalendarView(view) {
    return FULL_PAGE_CALENDAR_VIEWS.includes(view);
}

const CalendarContext = React.createContext({
    monthIndex: 0,
    setMonthIndex: (index) => {},
    smallCalendarMonth: 0,
    setSmallCalendarMonth: (index) => {},
    daySelected: null,
    setDaySelected: (day) => {},
    // View management
    currentView: "month", // "month", "year" (mobile month drill-down), "week", "daily", or one of FULL_PAGE_CALENDAR_VIEWS
    setCurrentView: () => {},
    weekIndex: 0,
    setWeekIndex: (index) => {},
    currentDayIndex: 0,
    setCurrentDayIndex: (index) => {},
    todayFocusNonce: 0,
    goToToday: () => {},
});

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used within a CalendarProvider");
  }
  return ctx;
}

export default CalendarContext;
