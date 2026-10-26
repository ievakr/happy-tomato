import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../common/Icon';
import { eventTodoOrTitleText } from './EventItem';
import { useTranslation } from '../../i18n/LanguageContext';

/** Width of the red Delete action revealed when swiping left (px). */
const MOBILE_EVENT_DELETE_REVEAL_PX = 112;
/** Release past this fraction of the reveal width → keep Delete open. */
const MOBILE_EVENT_DELETE_OPEN_RATIO = 0.35;

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
  const title = eventTodoOrTitleText(evt);
  const plantId = (evt.labels || [])[0];
  const plant = plantId ? plantsById?.[plantId] : null;
  const plantLine = plant
    ? [plant.category, plant.variety].filter(Boolean).join(' · ')
    : '';
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

    const DELETE_OPEN_AT = MOBILE_EVENT_DELETE_REVEAL_PX * MOBILE_EVENT_DELETE_OPEN_RATIO;
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
      const next = x >= DELETE_OPEN_AT && !deleteDisabled ? MOBILE_EVENT_DELETE_REVEAL_PX : 0;
      openPxRef.current = next;
      setOpenPx(next);
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

  const rowShellClass = 'daily-task-swipe mb-2';

  const rowInner = (
    <>
      {bulkEditMode && (
        <input
          type="checkbox"
          className="daily-bulk-check flex-shrink-0"
          checked={evt.id ? bulkSelectedEventIds.includes(evt.id) : false}
          onClick={(e) => e.stopPropagation()}
          onChange={() => evt.id && toggleBulkEventSelection(evt.id)}
          aria-label={t('calendar.selectEventAria', { name: eventTodoOrTitleText(evt) || t('calendar.eventFallback') })}
        />
      )}
      {!bulkEditMode && supportsDayViewCompleteToggle(evt) && renderDayTodoCompleteButton(evt)}
      <span className={`daily-task-icon${evt.completed ? ' daily-task-icon--done' : ''}`}>
        <Icon plantIcon={plant?.icon || 'leaf'} />
      </span>
      <span className="daily-task-copy">
        <span className={`daily-task-title${evt.completed ? ' daily-task-title--done' : ''}`}>{title}</span>
        {plantLine ? <span className="daily-task-sub">{plantLine}</span> : null}
      </span>
    </>
  );

  if (bulkEditMode) {
    return (
      <div
        className={`daily-task-card${evt.completed ? ' daily-task-card--done' : ''}`}
        onClick={(e) => handleEventClick(evt, e)}
        role="button"
      >
        {rowInner}
      </div>
    );
  }

  return (
    <div className={`${rowShellClass} position-relative`}>
      <button
        type="button"
        className="daily-task-swipe-delete"
        style={{ width: MOBILE_EVENT_DELETE_REVEAL_PX }}
        disabled={deleteDisabled}
        onClick={openDeleteConfirmFromSwipe}
      >
        <span className="material-icons-outlined" aria-hidden>
          delete
        </span>
        {t('common.delete')}
      </button>
      <div
        ref={contentRef}
        className={`daily-task-card mobile-daily-event-swipe__content${evt.completed ? ' daily-task-card--done' : ''}`}
        style={{
          touchAction: 'pan-y',
          transform: `translateX(${-openPx}px)`,
          transition: isHorizontalPan ? 'none' : 'transform 0.2s ease-out',
        }}
        onClick={(e) => {
          if (openPxRef.current > 0) {
            openPxRef.current = 0;
            setOpenPx(0);
            return;
          }
          handleEventClick(evt, e);
        }}
        role="button"
      >
        {rowInner}
      </div>
    </div>
  );
}
