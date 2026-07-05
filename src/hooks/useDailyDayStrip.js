import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { monthIndexFromCalendarDate, capitalizeFirst } from '../utils';
import { filterEventsForDay, isToday } from '../utils/eventDates';
import { useTranslation } from '../i18n/LanguageContext';

/** Mobile day strip: initial window size and how many days to add when scrolling near an edge */
export const STRIP_INITIAL_DAY_COUNT = 60;
const STRIP_EXTEND_CHUNK = 45;
const STRIP_SCROLL_EDGE_PX = 100;

/**
 * Manages horizontal day-strip state: virtual scroll, month sync, iOS scroll quirks.
 */
export function useDailyDayStrip({
  daySelected,
  setDaySelected,
  monthIndex,
  setMonthIndex,
  isMobile,
  isInitialLoading,
  filteredEvents,
  openNewEventForDay,
  todayFocusNonce = 0,
  goToToday: goToTodayFromContext,
}) {
  const { language } = useTranslation();
  const scrollContainerRef = useRef(null);
  const dayElementMapRef = useRef(new Map());
  const stripPrependingRef = useRef(false);
  const stripExtendBusyRef = useRef(false);
  const stripExtendRafRef = useRef(null);
  const stripUserHasPannedRef = useRef(false);
  const stripTapRef = useRef({ time: 0, key: '' });
  const suppressNextStripClickRef = useRef(false);
  const stripEdgeObserverRef = useRef(null);
  const [stripRecenterNonce, setStripRecenterNonce] = useState(1);
  const selectedDayKeyForRecenterRef = useRef(null);
  const wasInitialLoadingRef = useRef(isInitialLoading);
  const [stripDayCount, setStripDayCount] = useState(STRIP_INITIAL_DAY_COUNT);
  const [stripStart, setStripStart] = useState(() =>
    (daySelected || dayjs()).subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day')
  );
  const [visibleStripMonthKey, setVisibleStripMonthKey] = useState(() =>
    (daySelected || dayjs()).format('YYYY-MM')
  );

  const selectedDayCalendarKey = useMemo(
    () => (daySelected || dayjs()).format('YYYY-MM-DD'),
    [daySelected]
  );

  useEffect(() => {
    selectedDayKeyForRecenterRef.current = selectedDayCalendarKey;
  }, [selectedDayCalendarKey]);

  const scrollToDay = useCallback((targetEl) => {
    const container = scrollContainerRef.current;
    if (!container || !targetEl) return;

    const cr = container.getBoundingClientRect();
    const er = targetEl.getBoundingClientRect();
    const containerCenter = (cr.left + cr.right) / 2;
    const elCenter = (er.left + er.right) / 2;
    const delta = elCenter - containerCenter;
    const maxLeft = container.scrollWidth - container.clientWidth;
    const nextLeft = Math.max(0, Math.min(container.scrollLeft + delta, maxLeft));
    container.scrollLeft = nextLeft;
  }, []);

  const getStripCellWidth = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return 70;
    const firstCell = container.querySelector('[data-daily-strip-date]');
    return firstCell
      ? Math.max(1, Math.round(firstCell.getBoundingClientRect().width))
      : 70;
  }, []);

  const extendStripBackward = useCallback(() => {
    if (
      !isMobile ||
      stripExtendBusyRef.current ||
      stripPrependingRef.current ||
      !stripUserHasPannedRef.current
    ) {
      return;
    }

    stripExtendBusyRef.current = true;
    stripPrependingRef.current = true;
    const chunk = STRIP_EXTEND_CHUNK;
    const cellW = getStripCellWidth();
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
  }, [getStripCellWidth, isMobile]);

  const extendStripForward = useCallback(() => {
    if (!isMobile || stripExtendBusyRef.current || stripPrependingRef.current) {
      return;
    }
    setStripDayCount((c) => c + STRIP_EXTEND_CHUNK);
  }, [isMobile]);

  const maybeExtendStrip = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile || stripExtendBusyRef.current || stripPrependingRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;

    if (scrollLeft > 48) {
      stripUserHasPannedRef.current = true;
    }

    const nearRight = scrollLeft >= maxScroll - STRIP_SCROLL_EDGE_PX;
    const nearLeft =
      stripUserHasPannedRef.current &&
      scrollLeft <= STRIP_SCROLL_EDGE_PX &&
      scrollLeft < maxScroll - STRIP_SCROLL_EDGE_PX;

    if (nearLeft) {
      extendStripBackward();
      return;
    }
    if (nearRight) {
      extendStripForward();
    }
  }, [extendStripBackward, extendStripForward, isMobile]);

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

    const container = scrollContainerRef.current;
    if (container && container.scrollLeft > 48) {
      stripUserHasPannedRef.current = true;
    }

    const centered = getCenteredDayFromScroll();
    if (!centered || !centered.isValid()) return;

    const monthKey = centered.format('YYYY-MM');
    const nextMonthIndex = monthIndexFromCalendarDate(centered);

    setVisibleStripMonthKey((prev) => (prev === monthKey ? prev : monthKey));
    setMonthIndex((prev) => (prev === nextMonthIndex ? prev : nextMonthIndex));
  }, [getCenteredDayFromScroll, isMobile, setMonthIndex]);

  const scheduleStripScrollWork = useCallback(() => {
    if (stripExtendRafRef.current != null) return;
    stripExtendRafRef.current = requestAnimationFrame(() => {
      stripExtendRafRef.current = null;
      maybeExtendStrip();
      syncVisibleMonthFromScroll();
    });
  }, [maybeExtendStrip, syncVisibleMonthFromScroll]);

  const attachStripEdgeObserver = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    if (stripEdgeObserverRef.current) {
      stripEdgeObserverRef.current.disconnect();
      stripEdgeObserverRef.current = null;
    }

    const cells = container.querySelectorAll('[data-daily-strip-date]');
    const first = cells[0];
    const last = cells[cells.length - 1];
    if (!first || !last || first === last) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === last) {
            extendStripForward();
          } else if (entry.target === first) {
            extendStripBackward();
          }
        }
      },
      { root: container, threshold: 0.01 }
    );

    observer.observe(first);
    observer.observe(last);
    stripEdgeObserverRef.current = observer;
  }, [extendStripBackward, extendStripForward, isMobile]);

  const bindStripScrollContainer = useCallback(
    (node) => {
      scrollContainerRef.current = node;
      if (!node || !isMobile) {
        if (stripEdgeObserverRef.current) {
          stripEdgeObserverRef.current.disconnect();
          stripEdgeObserverRef.current = null;
        }
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          attachStripEdgeObserver();
          syncVisibleMonthFromScroll();
        });
      });
    },
    [attachStripEdgeObserver, isMobile, syncVisibleMonthFromScroll]
  );

  const reanchorStrip = useCallback((anchorDay) => {
    stripUserHasPannedRef.current = false;
    setStripDayCount(STRIP_INITIAL_DAY_COUNT);
    setStripStart(anchorDay.subtract(Math.floor(STRIP_INITIAL_DAY_COUNT / 2), 'day'));
    setStripRecenterNonce((n) => n + 1);
  }, []);

  const applyMonthChange = useCallback(
    (newMonthIndex) => {
      const currentDayValue = daySelected || dayjs();
      const dayOfMonth = currentDayValue.date();
      const refYear = dayjs().year();
      const dim = dayjs(new Date(refYear, newMonthIndex, 1)).daysInMonth();
      const newDay = dayjs(new Date(refYear, newMonthIndex, Math.min(dayOfMonth, dim)));
      setMonthIndex(newMonthIndex);
      setDaySelected(newDay);
      reanchorStrip(newDay);
    },
    [daySelected, setMonthIndex, setDaySelected, reanchorStrip]
  );

  const jumpToToday = useCallback(() => {
    if (goToTodayFromContext) {
      goToTodayFromContext();
      return;
    }
    const today = dayjs().startOf('day');
    setDaySelected(today);
    setMonthIndex(monthIndexFromCalendarDate(today));
    reanchorStrip(today);
  }, [goToTodayFromContext, setDaySelected, setMonthIndex, reanchorStrip]);

  useEffect(() => {
    if (!isMobile || todayFocusNonce === 0) return;
    reanchorStrip(dayjs().startOf('day'));
  }, [todayFocusNonce, isMobile, reanchorStrip]);

  useEffect(() => {
    const d = dayjs(selectedDayCalendarKey);
    setVisibleStripMonthKey(d.format('YYYY-MM'));
    setMonthIndex(monthIndexFromCalendarDate(d));
  }, [selectedDayCalendarKey, setMonthIndex]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile || isInitialLoading) return;

    const supportsScrollEnd =
      typeof document !== 'undefined' && 'onscrollend' in document.createElement('div');

    container.addEventListener('scroll', scheduleStripScrollWork, { passive: true });
    container.addEventListener('touchmove', scheduleStripScrollWork, { passive: true });
    if (supportsScrollEnd) {
      container.addEventListener('scrollend', scheduleStripScrollWork, { passive: true });
    }

    return () => {
      container.removeEventListener('scroll', scheduleStripScrollWork);
      container.removeEventListener('touchmove', scheduleStripScrollWork);
      if (supportsScrollEnd) {
        container.removeEventListener('scrollend', scheduleStripScrollWork);
      }
      if (stripExtendRafRef.current != null) {
        cancelAnimationFrame(stripExtendRafRef.current);
        stripExtendRafRef.current = null;
      }
    };
  }, [scheduleStripScrollWork, isMobile, isInitialLoading]);

  useEffect(() => {
    if (!isMobile || isInitialLoading) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attachStripEdgeObserver();
      });
    });
    return () => {
      cancelAnimationFrame(id);
      if (stripEdgeObserverRef.current) {
        stripEdgeObserverRef.current.disconnect();
        stripEdgeObserverRef.current = null;
      }
    };
  }, [attachStripEdgeObserver, isMobile, isInitialLoading, stripStart, stripDayCount]);

  useEffect(() => {
    if (!isMobile || isInitialLoading) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncVisibleMonthFromScroll();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [stripStart, stripDayCount, isMobile, isInitialLoading, syncVisibleMonthFromScroll]);

  useEffect(() => {
    if (!isMobile || !daySelected) return;
    const stripEnd = stripStart.add(stripDayCount - 1, 'day');
    if (daySelected.isBefore(stripStart, 'day') || daySelected.isAfter(stripEnd, 'day')) {
      reanchorStrip(daySelected);
    }
  }, [daySelected, isMobile, stripStart, stripDayCount, reanchorStrip]);

  useLayoutEffect(() => {
    if (!isMobile || stripPrependingRef.current || isInitialLoading) return;

    const selectedKey = selectedDayKeyForRecenterRef.current;
    const selectedEl = selectedKey ? dayElementMapRef.current.get(selectedKey) : null;
    if (selectedEl) {
      scrollToDay(selectedEl);
    }
  }, [stripRecenterNonce, isMobile, isInitialLoading, scrollToDay]);

  useEffect(() => {
    if (wasInitialLoadingRef.current && !isInitialLoading && isMobile) {
      setStripRecenterNonce((n) => n + 1);
    }
    wasInitialLoadingRef.current = isInitialLoading;
  }, [isInitialLoading, isMobile]);

  const handleDaySelection = useCallback(
    (day) => {
      setDaySelected(day);
    },
    [setDaySelected]
  );

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

  const visibleMonthLabel = useMemo(
    () => capitalizeFirst(dayjs(`${visibleStripMonthKey}-01`).locale(language).format('MMMM YYYY')),
    [visibleStripMonthKey, language]
  );

  const allDays = useMemo(
    () => Array.from({ length: stripDayCount }, (_, i) => stripStart.add(i, 'day')),
    [stripStart, stripDayCount]
  );

  const getEventsForDay = useCallback(
    (day) => filterEventsForDay(filteredEvents, day),
    [filteredEvents]
  );

  const getTodayClass = useCallback((day) => (isToday(day) ? 'today' : ''), []);

  const registerDayElement = useCallback((key, node) => {
    if (node) {
      dayElementMapRef.current.set(key, node);
    } else {
      dayElementMapRef.current.delete(key);
    }
  }, []);

  return {
    visibleMonthLabel,
    allDays,
    selectedDayCalendarKey,
    bindStripScrollContainer,
    scheduleStripScrollWork,
    handleStripDayClick,
    handleStripDayTouchEnd,
    getEventsForDay,
    getTodayClass,
    registerDayElement,
    applyMonthChange,
    jumpToToday,
    monthIndex,
  };
}
