import React, { useContext } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useResponsive } from '../../hooks';
import { calendarDateFromMonthIndex, calendarNavRefYear } from '../../utils';

const MONTHS_0_11 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * Mobile year picker (iOS Calendar–style): 12-month grid; pick a month to return to month view.
 */
export default function YearlyView() {
  const { monthIndex, setMonthIndex, setCurrentView } = useContext(CalendarContext);
  const { isInitialLoading } = useEventContext();
  const { isMobile } = useResponsive();

  const refYear = calendarNavRefYear();
  const yearAnchor = calendarDateFromMonthIndex(monthIndex);
  const displayYear = yearAnchor.year();

  const goPrevYear = () => setMonthIndex(monthIndex - 12);
  const goNextYear = () => setMonthIndex(monthIndex + 12);

  const selectMonth = (month0to11) => {
    const nextIndex = (displayYear - refYear) * 12 + month0to11;
    setMonthIndex(nextIndex);
    setCurrentView('month');
  };

  if (!isMobile) {
    return null;
  }

  if (isInitialLoading) {
    return null;
  }

  return (
    <div className="yearly-view flex-grow-1 d-flex flex-column bg-white" role="navigation" aria-label="Year view">
      <div className="yearly-view-toolbar py-2 px-2 bg-light border-bottom">
        <div className="d-flex align-items-center justify-content-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={goPrevYear}
            aria-label="Previous year"
            title="Previous year"
          >
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              chevron_left
            </span>
          </button>
          <span className="calendar-month-label fs-5 fw-semibold">{displayYear}</span>
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={goNextYear}
            aria-label="Next year"
            title="Next year"
          >
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <div
        className="yearly-view-grid flex-grow-1 p-3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          alignContent: 'start',
        }}
      >
        {MONTHS_0_11.map((m) => {
          const label = dayjs(new Date(displayYear, m, 1)).format('MMM');
          return (
            <button
              key={m}
              type="button"
              className="btn btn-outline-secondary py-3"
              onClick={() => selectMonth(m)}
            >
              <span className="fw-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
