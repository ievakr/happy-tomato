import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../common/Icon';
import { eventTodoOrTitleText } from './EventItem';
import { useTranslation } from '../../i18n/LanguageContext';

/** Width of the Delete action revealed when swiping left (px). */
const MOBILE_EVENT_DELETE_REVEAL_PX = 112;
/** Width of the Done action revealed when swiping right (px). */
const MOBILE_EVENT_DONE_REVEAL_PX = 128;
/** Release past this fraction of a reveal → keep Delete open, or mark done. */
const MOBILE_EVENT_SWIPE_COMMIT_RATIO = 0.35;

export default function MobileDailyEventRow({
  evt,
  bulkEditMode,
  bulkSelectedEventIds,
  plantsById,
  toggleBulkEventSelection,
  supportsDayViewCompleteToggle,
  renderDayTodoCompleteButton,
  handleEventClick,
  onMarkDone,
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
  const suppressClickRef = useRef(false);
  const canMarkDone =
    !bulkEditMode &&
    !deleteDisabled &&
    !evt.completed &&
    supportsDayViewCompleteToggle(evt);

  useEffect(() => {
    openPxRef.current = openPx;
  }, [openPx]);

  const markDoneFromSwipe = useCallback(() => {
    if (!canMarkDone) return;
    openPxRef.current = 0;
    setOpenPx(0);
    onMarkDone?.(evt);
  }, [canMarkDone, evt, onMarkDone]);

  const openDeleteConfirmFromSwipe = useCallback(() => {
    if (!evt?.id || deleteDisabled) return;
    openPxRef.current = 0;
    setOpenPx(0);
    onRequestDeleteConfirm?.(evt);
  }, [evt, deleteDisabled, onRequestDeleteConfirm]);

  useEffect(() => {
    if (bulkEditMode || deleteDisabled) return;
    const el = contentRef.current;
    if (!el) return;

    const DELETE_COMMIT_AT = MOBILE_EVENT_DELETE_REVEAL_PX * MOBILE_EVENT_SWIPE_COMMIT_RATIO;
    const DONE_COMMIT_AT = MOBILE_EVENT_DONE_REVEAL_PX * MOBILE_EVENT_SWIPE_COMMIT_RATIO;
    const AXIS_LOCK_PX = 10;
    const minOpen = canMarkDone ? -MOBILE_EVENT_DONE_REVEAL_PX : 0;

    const clampOpen = (v) => Math.max(minOpen, Math.min(MOBILE_EVENT_DELETE_REVEAL_PX, v));

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
      suppressClickRef.current = true;
      const x = openPxRef.current;
      if (x >= DELETE_COMMIT_AT) {
        openPxRef.current = MOBILE_EVENT_DELETE_REVEAL_PX;
        setOpenPx(MOBILE_EVENT_DELETE_REVEAL_PX);
      } else if (x <= -DONE_COMMIT_AT) {
        openPxRef.current = 0;
        setOpenPx(0);
        markDoneFromSwipe();
      } else {
        openPxRef.current = 0;
        setOpenPx(0);
      }
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
  }, [bulkEditMode, deleteDisabled, canMarkDone, markDoneFromSwipe]);

  const rowShellClass = 'daily-task-swipe mb-2';

  const plantIcon = (
    <span className={`daily-task-icon${evt.completed ? ' daily-task-icon--done' : ''}`}>
      <Icon plantIcon={plant?.icon || 'leaf'} />
    </span>
  );

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
      {!bulkEditMode && supportsDayViewCompleteToggle(evt) ? (
        <div
          className="daily-task-complete-zone"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target.closest('.daily-todo-complete-circle')) return;
            e.currentTarget.querySelector('.daily-todo-complete-circle')?.click();
          }}
        >
          {renderDayTodoCompleteButton(evt)}
          {plantIcon}
        </div>
      ) : (
        plantIcon
      )}
      <span className="daily-task-copy">
        <span className={`daily-task-title${evt.completed ? ' daily-task-title--done' : ''}`}>{title}</span>
        {plantLine ? <span className="daily-task-sub">{plantLine}</span> : null}
      </span>
    </>
  );

  if (bulkEditMode || deleteDisabled) {
    return (
      <div
        className={`daily-task-card mb-2${evt.completed ? ' daily-task-card--done' : ''}`}
        onClick={(e) => handleEventClick(evt, e)}
        role="button"
      >
        {rowInner}
      </div>
    );
  }

  return (
    <div className={`${rowShellClass} position-relative`}>
      {canMarkDone && (
        <div
          className="daily-task-swipe-done"
          style={{ width: MOBILE_EVENT_DONE_REVEAL_PX }}
          aria-hidden
        >
          <span className="material-icons-outlined">check</span>
          {t('calendar.done')}
        </div>
      )}
      <button
        type="button"
        className="daily-task-swipe-delete"
        style={{ width: MOBILE_EVENT_DELETE_REVEAL_PX }}
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
          if (suppressClickRef.current || openPxRef.current !== 0) {
            suppressClickRef.current = false;
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
