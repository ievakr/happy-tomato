import React, { useCallback, useEffect, useRef, useState } from 'react';
import CalendarEventChip from './CalendarEventChip';
import { eventTodoOrTitleText } from './EventItem';
import { useTranslation } from '../../i18n/LanguageContext';

/** Width of the delete hint strip revealed when swiping left (px). */
const MOBILE_EVENT_DELETE_REVEAL_PX = 52;
/** Release past this fraction of the reveal width → delete. Higher = longer swipe required. */
const MOBILE_EVENT_DELETE_RELEASE_RATIO = 0.85;

export default function MobileDailyEventRow({
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
  const { t } = useTranslation();
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
          aria-label={t('calendar.selectEventAria', { name: eventTodoOrTitleText(evt) || t('calendar.eventFallback') })}
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
