import React, { useContext, useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import CalendarContext from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { getDayHeaders, monthIndexFromCalendarDate, sortCalendarEventsAlphabeticallyMobile } from '../../utils';
import { useResponsive, useRecurringActions } from '../../hooks';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal, Modal } from '../common';
import DatePicker from 'react-widgets/DatePicker';
import { Localization } from 'react-widgets';
import { DateLocalizer } from 'react-widgets/IntlLocalizer';
import 'react-widgets/styles.css';
import EventItem, { eventTodoOrTitleText } from './EventItem';
import CalendarEventChip from './CalendarEventChip';
import { EVENT_ACTIONS } from '../../constants';
import '../../index.css';

/** Mobile day strip: initial window size and how many days to add when scrolling near an edge */
const STRIP_INITIAL_DAY_COUNT = 60;
const STRIP_EXTEND_CHUNK = 45;
const STRIP_SCROLL_EDGE_PX = 100;

/** See EventModal — iOS keyboard after date pick */
const RW_DATE_PICKER_INPUT_PROPS = {
  readOnly: true,
  inputMode: 'none',
  autoComplete: 'off',
};

/** Width of the delete hint strip revealed when swiping left (px). */
const MOBILE_EVENT_DELETE_REVEAL_PX = 52;
/** Release past this fraction of the reveal width → delete (icon is visual only). Higher = longer swipe required. */
const MOBILE_EVENT_DELETE_RELEASE_RATIO = 0.85;

function MobileDailyEventRow({
  evt,
  bulkEditMode,
  bulkSelectedEventIds,
  plantsById,
  toggleBulkEventSelection,
  supportsDayViewCompleteToggle,
  renderDayTodoCompleteButton,
  handleEventClick,
  onRequestDeleteConfirm,
  deleteDisabled,
}) {
  const [openPx, setOpenPx] = useState(0);
  const openPxRef = useRef(0);
  const [isHorizontalPan, setIsHorizontalPan] = useState(false);
  const panModeRef = useRef('undecided');
  const gestureStartRef = useRef({ x: 0, y: 0, open: 0 });
  const contentRef = useRef(null);

  useEffect(() => {
    openPxRef.current = openPx;
  }, [openPx]);

  const openDeleteConfirmFromSwipe = useCallback(() => {
    if (!evt?.id || deleteDisabled) return;
    setOpenPx(0);
    onRequestDeleteConfirm(evt);
  }, [evt, deleteDisabled, onRequestDeleteConfirm]);

  useEffect(() => {
    if (bulkEditMode) return;
    const el = contentRef.current;
    if (!el) return;

    const DELETE_RELEASE_AT = MOBILE_EVENT_DELETE_REVEAL_PX * MOBILE_EVENT_DELETE_RELEASE_RATIO;
    const AXIS_LOCK_PX = 10;

    const clampOpen = (v) =>
      Math.max(0, Math.min(MOBILE_EVENT_DELETE_REVEAL_PX, v));

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      panModeRef.current = 'undecided';
      gestureStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        open: openPxRef.current,
      };
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const { x: x0, y: y0, open: o0 } = gestureStartRef.current;
      const dx = x0 - t.clientX;
      const dy = y0 - t.clientY;

      if (panModeRef.current === 'undecided') {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          panModeRef.current = 'vertical';
          return;
        }
        panModeRef.current = 'horizontal';
        setIsHorizontalPan(true);
      }
      if (panModeRef.current === 'vertical') return;

      e.preventDefault();
      const next = clampOpen(o0 + dx);
      openPxRef.current = next;
      setOpenPx(next);
    };

    const onTouchEnd = () => {
      if (panModeRef.current !== 'horizontal') {
        panModeRef.current = 'undecided';
        return;
      }
      panModeRef.current = 'undecided';
      setIsHorizontalPan(false);
      const x = openPxRef.current;
      if (x >= DELETE_RELEASE_AT && !deleteDisabled) {
        openDeleteConfirmFromSwipe();
        return;
      }
      openPxRef.current = 0;
      setOpenPx(0);
    };

    const onTouchCancel = () => {
      const wasH = panModeRef.current === 'horizontal';
      panModeRef.current = 'undecided';
      if (wasH) setIsHorizontalPan(false);
      openPxRef.current = 0;
      setOpenPx(0);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [bulkEditMode, deleteDisabled, openDeleteConfirmFromSwipe]);

  const rowShellClass = 'd-flex align-items-stretch mb-1 mobile-daily-event-swipe';

  const rowInner = (
    <>
      {bulkEditMode && (
        <input
          type="checkbox"
          className="form-check-input bulk-edit-day-checkbox flex-shrink-0 mt-1"
          checked={evt.id ? bulkSelectedEventIds.includes(evt.id) : false}
          onClick={(e) => e.stopPropagation()}
          onChange={() => evt.id && toggleBulkEventSelection(evt.id)}
          aria-label={`Select ${eventTodoOrTitleText(evt) || 'event'}`}
        />
      )}
      {!bulkEditMode && supportsDayViewCompleteToggle(evt) && renderDayTodoCompleteButton(evt)}
      <div className="flex-grow-1 min-w-0 align-self-start">
        <CalendarEventChip
          event={evt}
          plantsById={plantsById || {}}
          listMode
          preferFullPlantIcons
          bulkEditSelected={!!evt.id && bulkSelectedEventIds.includes(evt.id)}
          hideLeadingStatusIcon={!bulkEditMode && supportsDayViewCompleteToggle(evt)}
          onClick={(e) => handleEventClick(evt, e)}
        />
      </div>
    </>
  );

  if (bulkEditMode) {
    return (
      <div
        className={`d-flex align-items-start gap-2 mb-1 ${
          evt.id && bulkSelectedEventIds.includes(evt.id) ? 'rounded border border-success border-2 p-1' : ''
        }`}
      >
        {rowInner}
      </div>
    );
  }

  return (
    <div className={`${rowShellClass} position-relative overflow-hidden rounded`}>
      {openPx > 0 && (
        <div
          className="mobile-daily-event-swipe__track position-absolute top-0 end-0 bottom-0"
          style={{
            width: MOBILE_EVENT_DELETE_REVEAL_PX,
            background: 'transparent',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <span
            className="material-icons-outlined text-danger mobile-daily-event-swipe-delete-icon"
            aria-hidden
          >
            delete
          </span>
        </div>
      )}
      <div
        ref={contentRef}
        className="mobile-daily-event-swipe__content position-relative d-flex align-items-start gap-2 w-100"
        style={{
          touchAction: 'pan-y',
          transform: `translateX(${-openPx}px)`,
          transition: isHorizontalPan ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {rowInner}
      </div>
    </div>
  );
}

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
  } = useEventContext();
  const {
    updateEventWithRecurringRecalculation,
    deleteRecurringTodosForEvent,
    completeTodo,
    uncompleteTodo,
    supportsDayViewCompleteToggle,
  } = useRecurringActions();

  const { isMobile } = useResponsive();
  const scrollContainerRef = useRef(null);
  const dayElementMapRef = useRef(new Map());
  /** When prepending days, skip scroll-into-view for the selected day (would fight scroll compensation). */
  const stripPrependingRef = useRef(false);
  const stripExtendBusyRef = useRef(false);
  const stripExtendRafRef = useRef(null);
  /** Prepend older days only after the user has panned the strip (avoids growing backward on first paint). */
  const stripUserHasPannedRef = useRef(false);
  /** Double-tap same day in strip (iOS) or double-click (mouse) → new event modal. */
  const stripTapRef = useRef({ time: 0, key: '' });
  const suppressNextStripClickRef = useRef(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkMoveDate, setBulkMoveDate] = useState(() => new Date());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [stripDayCount, setStripDayCount] = useState(STRIP_INITIAL_DAY_COUNT);

  // Anchor the strip independently of the selected day so scrolling does not re-build the row and jump.
  const [stripStart, setStripStart] = useState(() =>
    (daySelected || dayjs()).subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day')
  );

  const applyMonthChange = useCallback(
    (newMonthIndex) => {
      const currentDayValue = daySelected || dayjs();
      const dayOfMonth = currentDayValue.date();
      const refYear = dayjs().year();
      const dim = dayjs(new Date(refYear, newMonthIndex, 1)).daysInMonth();
      const newDay = dayjs(new Date(refYear, newMonthIndex, Math.min(dayOfMonth, dim)));
      setMonthIndex(newMonthIndex);
      setDaySelected(newDay);
      stripUserHasPannedRef.current = false;
      setStripDayCount(STRIP_INITIAL_DAY_COUNT);
      setStripStart(newDay.subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day'));
    },
    [daySelected, setMonthIndex, setDaySelected]
  );

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

  const maybeExtendStrip = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile || stripExtendBusyRef.current || stripPrependingRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      return;
    }

    if (scrollLeft > 48) {
      stripUserHasPannedRef.current = true;
    }

    const firstCell = container.querySelector('[data-daily-strip-date]');
    const cellW = firstCell
      ? Math.max(1, Math.round(firstCell.getBoundingClientRect().width))
      : 70;

    const nearRight = scrollLeft >= maxScroll - STRIP_SCROLL_EDGE_PX;
    const nearLeft =
      stripUserHasPannedRef.current &&
      scrollLeft <= STRIP_SCROLL_EDGE_PX &&
      scrollLeft < maxScroll - STRIP_SCROLL_EDGE_PX;

    if (nearLeft) {
      stripExtendBusyRef.current = true;
      stripPrependingRef.current = true;
      const chunk = STRIP_EXTEND_CHUNK;
      setStripStart((s) => s.subtract(chunk, 'day'));
      setStripDayCount((c) => c + chunk);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = scrollContainerRef.current;
          if (el) {
            el.scrollLeft += cellW * chunk;
          }
          stripPrependingRef.current = false;
          stripExtendBusyRef.current = false;
        });
      });
      return;
    }

    if (nearRight) {
      setStripDayCount((c) => c + STRIP_EXTEND_CHUNK);
    }
  }, [isMobile]);

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
    setMonthIndex(monthIndexFromCalendarDate(centered));
  }, [getCenteredDayFromScroll, isMobile, setMonthIndex]);

  // When the selected calendar day changes (tap, Today, month arrows, open from month view), align label + month index
  useEffect(() => {
    const d = dayjs(selectedDayCalendarKey);
    setVisibleStripMonthKey(d.format('YYYY-MM'));
    setMonthIndex(monthIndexFromCalendarDate(d));
  }, [selectedDayCalendarKey, setMonthIndex]);

  // Strip scroll: infinite horizontal range + month label (updates every frame while scrolling)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const onScroll = () => {
      if (stripExtendRafRef.current == null) {
        stripExtendRafRef.current = requestAnimationFrame(() => {
          stripExtendRafRef.current = null;
          maybeExtendStrip();
          syncVisibleMonthFromScroll();
        });
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (stripExtendRafRef.current != null) {
        cancelAnimationFrame(stripExtendRafRef.current);
        stripExtendRafRef.current = null;
      }
    };
  }, [syncVisibleMonthFromScroll, isMobile, maybeExtendStrip]);

  // After strip re-renders / re-anchors, read scroll position so the label matches what's on screen
  useEffect(() => {
    if (!isMobile) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncVisibleMonthFromScroll();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [stripStart, stripDayCount, isMobile, syncVisibleMonthFromScroll]);

  // Get current day or fallback to today
  const currentDay = daySelected || dayjs();

  const dayEvents = useMemo(() => {
    const forDay = filteredEvents.filter(
      (evt) => dayjs(evt.day).format('DD-MM-YY') === currentDay.format('DD-MM-YY')
    );
    if (!isMobile) return forDay;
    return sortCalendarEventsAlphabeticallyMobile(forDay, plantsById || {});
  }, [filteredEvents, currentDay, isMobile, plantsById]);

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

  const openBulkMoveModal = useCallback(() => {
    if (bulkSelectedEventIds.length === 0) return;
    setBulkMoveDate(currentDay.toDate());
    setShowBulkMoveModal(true);
  }, [bulkSelectedEventIds, currentDay]);

  const confirmBulkMove = async () => {
    const dayMs = dayjs(bulkMoveDate).startOf('day').valueOf();
    try {
      for (const id of bulkSelectedEventIds) {
        const evt = filteredEvents.find((e) => e.id === id);
        if (!evt) continue;
        await updateEventWithRecurringRecalculation({ ...evt, day: dayMs }, evt);
      }
      setShowBulkMoveModal(false);
      setBulkEditMode(false);
    } catch {
      showError('Failed to move events. Please try again.');
    }
  };

  const confirmBulkDelete = async () => {
    try {
      for (const id of bulkSelectedEventIds) {
        const evt = filteredEvents.find((e) => e.id === id);
        if (!evt) continue;
        if (evt.isRecurringTodo) {
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
        } else {
          if (evt.actions && evt.actions.length > 0) {
            try {
              await deleteRecurringTodosForEvent(evt.id, evt.actions[0], evt.labels);
            } catch {
              // Proceed with main delete
            }
          }
          await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: evt });
        }
      }
      setShowBulkDeleteConfirm(false);
      setBulkEditMode(false);
    } catch {
      showError('Failed to delete some events. Please try again.');
    }
  };

  const visibleMonthLabel = useMemo(
    () => dayjs(`${visibleStripMonthKey}-01`).format('MMMM YYYY'),
    [visibleStripMonthKey]
  );

  const allDays = useMemo(
    () =>
      Array.from({ length: stripDayCount }, (_, i) => stripStart.add(i, 'day')),
    [stripStart, stripDayCount]
  );

  const dayHeaders = getDayHeaders('short');

  // If selected day jumps outside the strip (e.g. open modal from elsewhere), re-anchor the strip.
  useEffect(() => {
    if (!isMobile || !daySelected) return;
    const stripEnd = stripStart.add(stripDayCount - 1, 'day');
    if (daySelected.isBefore(stripStart, 'day') || daySelected.isAfter(stripEnd, 'day')) {
      stripUserHasPannedRef.current = false;
      setStripDayCount(STRIP_INITIAL_DAY_COUNT);
      setStripStart(daySelected.subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day'));
    }
  }, [daySelected, isMobile, stripStart, stripDayCount]);

  // After selection or re-anchor, center the selected day in the strip (not when user is extending via scroll).
  // Include isInitialLoading: while loading we render a spinner (no strip); when loading ends deps were often
  // unchanged so this effect would not re-run and the strip stayed at scrollLeft 0 — wrong day centered / empty list perception until Today.
  useLayoutEffect(() => {
    if (!isMobile || stripPrependingRef.current || isInitialLoading) {
      return;
    }

    const selectedKey = currentDay.format('YYYY-MM-DD');
    const selectedEl = dayElementMapRef.current.get(selectedKey);
    if (selectedEl) {
      scrollToDay(selectedEl);
    }
  }, [currentDay, stripStart, isMobile, isInitialLoading, scrollToDay]);

  const openNewEventForDay = useCallback(
    (day) => {
      setDaySelected(day);
      setSelectedEvent(null);
      setShowEventModal(true);
    },
    [setDaySelected, setSelectedEvent, setShowEventModal]
  );

  const handleDayClick = (day) => {
    openNewEventForDay(day);
  };

  const handleDaySelection = useCallback((day) => {
    setDaySelected(day);
    if (!isMobile) {
      return;
    }

    stripUserHasPannedRef.current = false;
    setStripDayCount(STRIP_INITIAL_DAY_COUNT);
    setStripStart(day.subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day'));
  }, [isMobile, setDaySelected]);

  const handleStripDayTouchEnd = useCallback(
    (day) => {
      const key = day.format('YYYY-MM-DD');
      const now = Date.now();
      const prev = stripTapRef.current;
      if (prev.key === key && now - prev.time < 450) {
        stripTapRef.current = { time: 0, key: '' };
        suppressNextStripClickRef.current = true;
        openNewEventForDay(day);
        return;
      }
      stripTapRef.current = { time: now, key };
    },
    [openNewEventForDay]
  );

  const handleStripDayClick = useCallback(
    (day) => {
      if (suppressNextStripClickRef.current) {
        suppressNextStripClickRef.current = false;
        return;
      }
      handleDaySelection(day);
    },
    [handleDaySelection]
  );

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    if (bulkEditMode) {
      if (evt.id) toggleBulkEventSelection(evt.id);
      return;
    }
    setSelectedEvent(evt);
    setShowEventModal(true);
  };

  const handleDayViewToggleComplete = async (evt, e) => {
    e.stopPropagation();
    if (!evt?.id || bulkEditMode) return;
    try {
      if (evt.completed) {
        await uncompleteTodo(evt);
      } else {
        await completeTodo(evt);
      }
    } catch {
      showError(evt.completed ? 'Could not restore to-do.' : 'Could not mark complete.');
    }
  };

  const renderDayTodoCompleteButton = (evt, extraClassName = '') => (
    <button
      type="button"
      className={`daily-todo-complete-circle flex-shrink-0 ${evt.completed ? 'daily-todo-complete-circle--done' : ''} ${extraClassName}`.trim()}
      onClick={(e) => handleDayViewToggleComplete(evt, e)}
      disabled={isLoading}
      aria-label={evt.completed ? 'Mark as to-do' : 'Mark complete'}
      aria-pressed={!!evt.completed}
    >
      {evt.completed && (
        <span className="material-icons-outlined daily-todo-complete-circle__check" aria-hidden>
          check
        </span>
      )}
    </button>
  );

  const openDeleteConfirmForEvent = useCallback((evt) => {
    setEventToDelete(evt);
    setShowDeleteConfirm(true);
  }, []);

  const handleQuickDelete = (evt, e) => {
    e.stopPropagation();
    openDeleteConfirmForEvent(evt);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      try {
        await dispatchCallEvent({ type: "delete", payload: eventToDelete });
        setShowDeleteConfirm(false);
        setEventToDelete(null);
      } catch {
        // Toast already shown by dispatchCallEvent
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
    setMonthIndex(monthIndexFromCalendarDate(today));
    stripUserHasPannedRef.current = false;
    setStripDayCount(STRIP_INITIAL_DAY_COUNT);
    setStripStart(today.subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day'));
  }, [setDaySelected, setMonthIndex]);

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
                  onClick={() => handleStripDayClick(day)}
                  onDoubleClick={() => openNewEventForDay(day)}
                  onTouchEnd={() => handleStripDayTouchEnd(day)}
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
                      <p className="text-muted">No to-dos scheduled for this day</p>
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
                              onClick={openBulkMoveModal}
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={bulkSelectedEventIds.length === 0}
                              onClick={() => setShowBulkDeleteConfirm(true)}
                            >
                              Delete
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
                            <MobileDailyEventRow
                              key={evt.id || idx}
                              evt={evt}
                              bulkEditMode={bulkEditMode}
                              bulkSelectedEventIds={bulkSelectedEventIds}
                              plantsById={plantsById}
                              toggleBulkEventSelection={toggleBulkEventSelection}
                              supportsDayViewCompleteToggle={supportsDayViewCompleteToggle}
                              renderDayTodoCompleteButton={renderDayTodoCompleteButton}
                              handleEventClick={handleEventClick}
                              onRequestDeleteConfirm={openDeleteConfirmForEvent}
                              deleteDisabled={isLoading}
                            />
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
                              aria-label={`Select ${eventTodoOrTitleText(evt) || 'event'}`}
                            />
                          )}
                          {!bulkEditMode &&
                            supportsDayViewCompleteToggle(evt) &&
                            renderDayTodoCompleteButton(evt, 'align-self-center')}
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
                            hideLeadingCompleteIcon
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
              <p className="mb-2">Delete "{eventTodoOrTitleText(eventToDelete)}"?</p>
              <p className="mb-0 small">This action can't be undone.</p>
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

      {showBulkMoveModal && (
        <Modal
          title={`Move ${bulkSelectedEventIds.length} event${bulkSelectedEventIds.length !== 1 ? 's' : ''}`}
          icon="event"
          onClose={() => setShowBulkMoveModal(false)}
          size="sm"
          footer={
            <div className="d-flex gap-2 w-100">
              <button
                type="button"
                className="btn btn-outline-secondary flex-grow-1"
                onClick={() => setShowBulkMoveModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success flex-grow-1"
                onClick={confirmBulkMove}
                disabled={isLoading}
              >
                {isLoading && loadingOperation === 'update' ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Moving…
                  </>
                ) : (
                  'Move'
                )}
              </button>
            </div>
          }
        >
          <div>
            <label className="form-label d-flex align-items-center gap-2">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                schedule
              </span>
              New date
            </label>
            <Localization date={new DateLocalizer({ firstOfWeek: 1 })}>
              <DatePicker
                value={bulkMoveDate}
                onChange={(date) => date && setBulkMoveDate(date)}
                defaultValue={new Date()}
                valueFormat={{ dateStyle: 'medium' }}
                className="w-100"
                inputProps={RW_DATE_PICKER_INPUT_PROPS}
              />
            </Localization>
          </div>
        </Modal>
      )}

      {showBulkDeleteConfirm && (
        <ConfirmModal
          title="Delete events"
          message={
            <p className="mb-0">
              Delete {bulkSelectedEventIds.length} event
              {bulkSelectedEventIds.length !== 1 ? 's' : ''}? This can't be undone.
            </p>
          }
          confirmLabel="Delete all"
          variant="danger"
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          isLoading={isLoading && loadingOperation === 'delete'}
          zIndex={1060}
        />
      )}
    </div>
  );
};

export default DailyView;
