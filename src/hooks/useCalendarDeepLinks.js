import { useCallback, useEffect } from 'react';
import dayjs from 'dayjs';
import { useCalendarContext } from '../context/CalendarContext';
import { useResponsive } from './useResponsive';
import { monthIndexFromCalendarDate } from '../utils';

const DAY_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Open a calendar day from deep links (?day=), service worker messages, or native events.
 */
export function useCalendarDeepLinks({ onOpenWeeklySummary } = {}) {
  const { isMobile } = useResponsive();
  const { setDaySelected, setMonthIndex, setCurrentView } = useCalendarContext();

  const openCalendarDay = useCallback(
    (dayStr, options = {}) => {
      const { openWeeklySummary = false } = options;
      if (!dayStr || typeof dayStr !== 'string') return;
      const trimmed = dayStr.trim();
      if (!DAY_PARAM_RE.test(trimmed)) return;
      const next = dayjs(trimmed, 'YYYY-MM-DD', true);
      if (!next.isValid()) return;
      setDaySelected(next);
      setMonthIndex(monthIndexFromCalendarDate(next));
      setCurrentView(isMobile ? 'daily' : 'month');
      if (openWeeklySummary) {
        onOpenWeeklySummary?.();
      }
    },
    [isMobile, setDaySelected, setMonthIndex, setCurrentView, onOpenWeeklySummary]
  );

  useEffect(() => {
    const fromSearch = () => {
      const params = new URLSearchParams(window.location.search);
      return {
        day: params.get('day'),
        weeklySummary: params.get('weeklySummary') === '1',
      };
    };

    const consume = () => {
      const { day, weeklySummary } = fromSearch();
      if (!day) return;
      openCalendarDay(day, { openWeeklySummary: weeklySummary });
      const params = new URLSearchParams(window.location.search);
      params.delete('day');
      params.delete('weeklySummary');
      const qs = params.toString();
      const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', clean);
    };

    consume();
    window.addEventListener('popstate', consume);
    return () => window.removeEventListener('popstate', consume);
  }, [openCalendarDay]);

  useEffect(() => {
    const onSwMessage = (event) => {
      if (event.data?.type === 'calendar-open-day' && event.data?.day) {
        const kind = event.data?.kind ? String(event.data.kind) : '';
        openCalendarDay(String(event.data.day), {
          openWeeklySummary: kind === 'weekly_summary',
        });
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [openCalendarDay]);

  useEffect(() => {
    const onNativeOpen = (e) => {
      const day = e.detail?.day;
      const kind = e.detail?.kind ? String(e.detail.kind) : '';
      if (day) {
        openCalendarDay(String(day), {
          openWeeklySummary: kind === 'weekly_summary',
        });
      }
    };
    window.addEventListener('happy-tomato-open-day', onNativeOpen);
    return () => window.removeEventListener('happy-tomato-open-day', onNativeOpen);
  }, [openCalendarDay]);

  return { openCalendarDay };
}
