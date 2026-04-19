import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { getDayHeaders } from '../../utils';
import { useResponsive } from '../../hooks';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common';
import EventItem from './EventItem';
import CalendarEventChip from './CalendarEventChip';
import '../../index.css';

const DailyView = () => {
  const { showError } = useToast();
  const { 
    daySelected,
    setDaySelected,
    monthIndex,
    setMonthIndex
  } = useContext(CalendarContext);
  const {
    filteredEvents,
    setShowEventModal,
    setSelectedEvent,
    isInitialLoading,
    dispatchCallEvent,
    isLoading,
    loadingOperation,
    plantsById,
    bulkEditMode,
    setBulkEditMode,
    bulkSelectedEventIds,
    setBulkSelectedEventIds,
    toggleBulkEventSelection,
    setBulkApplyMode,
  } = useEventContext();
  
  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef(null);
  const dayElementMapRef = useRef(new Map());
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const daysToShow = 60;

  // Anchor the strip independently of the selected day so scrolling does not re-build the row and jump.
  const [stripStart, setStripStart] = useState(() =>
    (daySelected || dayjs()).subtract(Math.floor(daysToShow / 2), 'day')
  );

  const applyMonthChange = useCallback((newMonth) => {
    const currentDayValue = daySelected || dayjs();
    const dayOfMonth = currentDayValue.date();
    const newDay = dayjs(new Date(currentDayValue.year(), newMonth, dayOfMonth));
    setMonthIndex(newMonth);
    setDaySelected(newDay);
    setStripStart(newDay.subtract(Math.floor(daysToShow / 2), 'day'));
  }, [daySelected, setMonthIndex, setDaySelected, daysToShow]);

  const scrollToDay = useCallback((targetEl) => {
    const container = scrollContainerRef.current;
    if (!container || !targetEl) {
      return;
    }

    // Use viewport-relative positions — offsetLeft is unreliable on iOS WebKit for nested flex scrollers.
    const cr = container.getBoundingClientRect();
    const er = targetEl.getBoundingClientRect();
    const containerCenter = (cr.left + cr.right) / 2;
    const elCenter = (er.left + er.right) / 2;
    const delta = elCenter - containerCenter;
    const maxLeft = container.scrollWidth - container.clientWidth;
    const nextLeft = Math.max(0, Math.min(container.scrollLeft + delta, maxLeft));

    container.scrollLeft = nextLeft;
  }, []);

  /** Month shown in the header label — follows strip scroll, not only the selected day */
  const [visibleStripMonthKey, setVisibleStripMonthKey] = useState(() =>
    (daySelected || dayjs()).format('YYYY-MM')
  );

  const selectedDayCalendarKey = useMemo(
    () => (daySelected || dayjs()).format('YYYY-MM-DD'),
    [daySelected]
  );

  const getCenteredDayFromScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const nodes = container.querySelectorAll('[data-daily-strip-date]');
    let best = null;
    let bestDist = Infinity;

    nodes.forEach((node) => {
      const r = node.getBoundingClientRect();
      const mid = (r.left + r.right) / 2;
      const dist = Math.abs(mid - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = node;
      }
    });

    if (!best) return null;
    const dateStr = best.getAttribute('data-daily-strip-date');
    return dateStr ? dayjs(dateStr) : null;
  }, []);

  const syncVisibleMonthFromScroll = useCallback(() => {
    if (!isMobile) return;
    const centered = getCenteredDayFromScroll();
    if (!centered || !centered.isValid()) return;
    const key = centered.format('YYYY-MM');
    setVisibleStripMonthKey(key);
    setMonthIndex(centered.month());
  }, [getCenteredDayFromScroll, isMobile, setMonthIndex]);

  // When the selected calendar day changes (tap, Today, month arrows, open from month view), align label + month index
  useEffect(() => {
    const d = dayjs(selectedDayCalendarKey);
    setVisibleStripMonthKey(d.format('YYYY-MM'));
    setMonthIndex(d.month());
  }, [selectedDayCalendarKey, setMonthIndex]);

  // Strip scroll updates the month label (does not change the selected day)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const supportsScrollEnd =
      typeof document !== 'undefined' && 'onscrollend' in document.createElement('div');

    let debounceId;
    const run = () => syncVisibleMonthFromScroll();
    const debounced = () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(run, supportsScrollEnd ? 450 : 320);
    };

    container.addEventListener('scroll', debounced, { passive: true });
    if (supportsScrollEnd) {
      container.addEventListener('scrollend', run, { passive: true });
    }
    return () => {
      container.removeEventListener('scroll', debounced);
      if (supportsScrollEnd) {
        container.removeEventListener('scrollend', run);
      }
      clearTimeout(debounceId);
    };
  }, [syncVisibleMonthFromScroll, isMobile]);

  // After strip re-renders / re-anchors, read scroll position so the label matches what's on screen
  useEffect(() => {
    if (!isMobile) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncVisibleMonthFromScroll();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [stripStart, isMobile, syncVisibleMonthFromScroll]);

  // Get current day or fallback to today
  const currentDay = daySelected || dayjs();

  const dayEvents = useMemo(
    () =>
      filteredEvents.filter(
        (evt) => dayjs(evt.day).format('DD-MM-YY') === currentDay.format('DD-MM-YY')
      ),
    [filteredEvents, currentDay]
  );

  const selectAllCheckboxRef = useRef(null);

  const dayEventIds = useMemo(() => dayEvents.map((e) => e.id).filter(Boolean), [dayEvents]);

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (!el || !bulkEditMode) return;
    const n = dayEventIds.filter((id) => bulkSelectedEventIds.includes(id)).length;
    el.indeterminate = n > 0 && n < dayEventIds.length;
  }, [bulkEditMode, dayEventIds, bulkSelectedEventIds]);

  const toggleSelectAllDay = useCallback(() => {
    if (dayEventIds.length === 0) return;
    const allSelected = dayEventIds.every((id) => bulkSelectedEventIds.includes(id));
    if (allSelected) {
      setBulkSelectedEventIds((prev) => prev.filter((id) => !dayEventIds.includes(id)));
    } else {
      setBulkSelectedEventIds((prev) => [...new Set([...prev, ...dayEventIds])]);
    }
  }, [dayEventIds, bulkSelectedEventIds, setBulkSelectedEventIds]);

  const openBulkApplyModal = useCallback(() => {
    if (bulkSelectedEventIds.length === 0) return;
    setBulkApplyMode(true);
    setShowEventModal(true);
  }, [bulkSelectedEventIds, setBulkApplyMode, setShowEventModal]);

  const visibleMonthLabel = useMemo(
    () => dayjs(`${visibleStripMonthKey}-01`).format('MMMM YYYY'),
    [visibleStripMonthKey]
  );

  const allDays = useMemo(
    () =>
      Array.from({ length: daysToShow }, (_, i) => stripStart.add(i, 'day')),
    [stripStart, daysToShow]
  );

  const dayHeaders = getDayHeaders('short');

  // If selected day jumps outside the strip (e.g. open modal from elsewhere), re-anchor the strip.
  useEffect(() => {
    if (!isMobile || !daySelected) return;
    const stripEnd = stripStart.add(daysToShow - 1, 'day');
    if (daySelected.isBefore(stripStart, 'day') || daySelected.isAfter(stripEnd, 'day')) {
      setStripStart(daySelected.subtract(Math.floor(daysToShow / 2), 'day'));
    }
  }, [daySelected, isMobile, stripStart, daysToShow]);

  // Keep the strip scrolled so the selected day stays visible when selection changes (tap, Today, month nav, etc.).
  // Scrolling alone does not change the selected day.
  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const selectedKey = currentDay.format('YYYY-MM-DD');
    const selectedEl = dayElementMapRef.current.get(selectedKey);
    if (selectedEl) {
      scrollToDay(selectedEl);
    }
  }, [currentDay, stripStart, isMobile, scrollToDay]);

  const handleDayClick = (day) => {
    setDaySelected(day);
    setShowEventModal(true);
  };

  const handleDaySelection = useCallback((day) => {
    setDaySelected(day);
    if (!isMobile) {
      return;
    }

    setStripStart(day.subtract(Math.floor(daysToShow / 2), 'day'));
    // Scroll alignment runs in useEffect after strip re-renders (scrollToDay here would run too early).
  }, [isMobile, setDaySelected, daysToShow]);

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    if (bulkEditMode) {
      if (evt.id) toggleBulkEventSelection(evt.id);
      return;
    }
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleQuickDelete = (evt, e) => {
    e.stopPropagation();
    setEventToDelete(evt);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      try {
        await dispatchCallEvent({ type: "delete", payload: eventToDelete });
        setShowDeleteConfirm(false);
        setEventToDelete(null);
      } catch {
        showError('Failed to delete event. Please try again.');
      }
    }
  };

  const getEventsForDay = (day) => {
    return filteredEvents.filter(evt => 
      dayjs(evt.day).format("DD-MM-YY") === day.format("DD-MM-YY")
    );
  };

  const getCurrentDayClass = (day) => {
    return day.format("DD-MM-YY") === dayjs().format("DD-MM-YY")
      ? 'today'
      : '';
  };

  const jumpToToday = useCallback(() => {
    const today = dayjs();
    setDaySelected(today);
    setMonthIndex(today.month());
    setStripStart(today.subtract(Math.floor(daysToShow / 2), 'day'));
  }, [setDaySelected, setMonthIndex, daysToShow]);

  if (isInitialLoading) {
    return (
      <div className="daily-view-loading d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-view flex-grow-1 d-flex flex-column">
      {/* Mobile: Month navigation */}
      {isMobile && (
        <div className="position-relative py-2 bg-light">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <button
              className="btn btn-sm btn-light"
              onClick={() => applyMonthChange(monthIndex - 1)}
              aria-label="Previous month"
              title="Previous month"
              type="button"
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                chevron_left
              </span>
            </button>
            <span className="calendar-month-label">
              {visibleMonthLabel}
            </span>
            <button
              className="btn btn-sm btn-light"
              onClick={() => applyMonthChange(monthIndex + 1)}
              aria-label="Next month"
              title="Next month"
              type="button"
            >
              <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                chevron_right
              </span>
            </button>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={jumpToToday}
            type="button"
          >
            Today
          </button>
        </div>
      )}

      {/* Mobile: Horizontal scrollable week header */}
      {isMobile && (
        <div className="daily-week-header bg-light py-2" style={{ minHeight: '60px' }}>
          <div 
            ref={scrollContainerRef}
            className="d-flex daily-week-scroll"
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                .daily-week-header .d-flex::-webkit-scrollbar {
                  display: none;
                }
              `
            }} />
            {allDays.map((day) => {
              // Convert dayjs day index (0=Sunday) to getDayHeaders index (0=Monday)
              const dayOfWeek = (day.day() + 6) % 7;
              const dayEvents = getEventsForDay(day);
              
              return (
                <div
                  key={day.format('YYYY-MM-DD')}
                  data-daily-strip-date={day.format('YYYY-MM-DD')}
                  className={`daily-week-day text-center ${getCurrentDayClass(day)}${
                    selectedDayCalendarKey === day.format('YYYY-MM-DD') ? ' selected' : ''
                  }`}
                  onClick={() => handleDaySelection(day)}
                  ref={(node) => {
                    const key = day.format('YYYY-MM-DD');
                    if (node) {
                      dayElementMapRef.current.set(key, node);
                    } else {
                      dayElementMapRef.current.delete(key);
                    }
                  }}
                >
                  <div className="day-name-mini text-muted">
                    {dayHeaders[dayOfWeek]}
                  </div>
                  <div 
                    className={`day-number-mini fw-bold`}
                  >
                    {day.format('D')}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="events-indicator">
                      <span className="badge bg-secondary rounded-pill">
                        {dayEvents.length}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Info and Events — no horizontal swipe-to-change-month here: on iPhone, vertical
          scrolling the events list often looks "horizontal" to touch heuristics and was changing months. */}
        <div 
          className="selected-day-info flex-grow-1 p-3 d-flex flex-column"
          style={{ 
            touchAction: isMobile ? 'pan-y' : 'auto',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
        {/* Day title */}
        <div className="mb-3">
          <h5 className="mb-1">
            {currentDay.format('dddd, MMMM D, YYYY')}
          </h5>
          {currentDay.format("DD-MM-YY") === dayjs().format("DD-MM-YY") && (
            <small className="text-muted">Today</small>
          )}
        </div>

        {/* Scrollable Events container */}
        <div 
          className="daily-events flex-grow-1"
          style={{
            overflowY: 'auto',
            minHeight: 0
          }}
        >
              {dayEvents.length === 0 ? (
                    <div className="no-events text-center py-5">
                      <div className="text-muted mb-3">
                        <span className="material-icons-outlined" style={{ fontSize: '3rem' }}>
                          event_available
                        </span>
                      </div>
                      <p className="text-muted">No events scheduled for this day</p>
                    </div>
                  ) : (
                  <div className="events-list">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <h6 className="mb-0">To-Do's ({dayEvents.length})</h6>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {bulkEditMode && (
                          <>
                            <div className="form-check d-flex align-items-center mb-0">
                              <input
                                ref={selectAllCheckboxRef}
                                type="checkbox"
                                className="form-check-input bulk-edit-day-checkbox me-2"
                                id="daily-bulk-select-all"
                                checked={
                                  dayEventIds.length > 0 &&
                                  dayEventIds.every((id) => bulkSelectedEventIds.includes(id))
                                }
                                onChange={toggleSelectAllDay}
                              />
                              <label className="form-check-label small mb-0" htmlFor="daily-bulk-select-all">
                                Select all
                              </label>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              disabled={bulkSelectedEventIds.length === 0}
                              onClick={openBulkApplyModal}
                            >
                              Edit selected
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setBulkEditMode(!bulkEditMode)}
                        >
                          {bulkEditMode ? 'Cancel' : 'Bulk edit'}
                        </button>
                      </div>
                    </div>
                    {dayEvents.map((evt, idx) => {
                        if (isMobile) {
                          return (
                            <div
                              key={evt.id || idx}
                              className={`d-flex align-items-start gap-2 mb-1 ${bulkEditMode && evt.id && bulkSelectedEventIds.includes(evt.id) ? 'rounded border border-success border-2 p-1' : ''}`}
                            >
                              {bulkEditMode && (
                                <input
                                  type="checkbox"
                                  className="form-check-input bulk-edit-day-checkbox flex-shrink-0 mt-1"
                                  checked={evt.id ? bulkSelectedEventIds.includes(evt.id) : false}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => evt.id && toggleBulkEventSelection(evt.id)}
                                  aria-label={`Select ${evt.title || evt.toDo || 'event'}`}
                                />
                              )}
                              <div className="flex-grow-1 min-w-0">
                                <CalendarEventChip
                                  event={evt}
                                  plantsById={plantsById || {}}
                                  listMode
                                  preferFullPlantIcons
                                  bulkEditSelected={
                                    !!evt.id && bulkSelectedEventIds.includes(evt.id)
                                  }
                                  onClick={(e) => handleEventClick(evt, e)}
                                />
                              </div>
                            </div>
                          );
                        }

                        const isDone = !!evt.completed;

                        return (
                        <div 
                          key={evt.id || idx}
                          className="d-flex align-items-start gap-2 mb-2"
                        >
                          {bulkEditMode && (
                            <input
                              type="checkbox"
                              className="form-check-input bulk-edit-day-checkbox flex-shrink-0 mt-2"
                              checked={evt.id ? bulkSelectedEventIds.includes(evt.id) : false}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => evt.id && toggleBulkEventSelection(evt.id)}
                              aria-label={`Select ${evt.title || evt.toDo || 'event'}`}
                            />
                          )}
                          <div
                            className={`event-item-daily flex-grow-1 p-2 border rounded position-relative min-w-0 ${isDone ? 'event-item-daily-completed' : ''} ${bulkEditMode && evt.id && bulkSelectedEventIds.includes(evt.id) ? 'border-success border-2' : ''}`}
                            onClick={(e) => handleEventClick(evt, e)}
                            role={bulkEditMode ? 'button' : undefined}
                          >
                          <EventItem 
                            event={evt} 
                            compact={false}
                            showTime={true}
                            plantsById={plantsById || {}}
                            showAllIcons={true}
                          />
                          {!bulkEditMode && (
                          <button
                            className="quick-delete-btn btn btn-sm btn-danger position-absolute"
                            onClick={(e) => handleQuickDelete(evt, e)}
                            title="Delete event"
                          >
                            ×
                          </button>
                          )}
                        </div>
                        </div>
                        );
                      })}
                  </div>
                  )}
        </div>
        
        {/* Add event button - always visible at bottom (extra class for iOS safe inset; see index.css) */}
        <div className="mt-3 pt-3 border-top daily-view-footer-actions">
          <button 
            className="btn btn-danger w-100"
            onClick={() => handleDayClick(currentDay)}
          >
            <span className="material-icons-outlined me-2" style={{ fontSize: '1rem' }}>
              add
            </span>
            Add Event
          </button>
        </div>
      </div>

      {showDeleteConfirm && eventToDelete && (
        <ConfirmModal
          title="Delete Event"
          message={
            <>
              <p className="mb-2">Delete "{eventToDelete.title || eventToDelete.toDo}"?</p>
              <p className="mb-0 small">This action cannot be undone.</p>
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setEventToDelete(null);
          }}
          isLoading={isLoading && loadingOperation === 'delete'}
        />
      )}
    </div>
  );
};

export default DailyView;
