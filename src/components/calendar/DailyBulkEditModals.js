import React from 'react';
import dayjs from 'dayjs';
import { ConfirmModal, Modal } from '../common';
import DatePicker from 'react-widgets/DatePicker';
import { Localization } from 'react-widgets';
import { DateLocalizer } from 'react-widgets/IntlLocalizer';
import { RW_DATE_PICKER_INPUT_PROPS } from '../../constants/datePicker';
import { EVENT_ACTIONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useEventContext } from '../../context/EventContext';
import { useRecurringActions } from '../../hooks';
import { useTranslation } from '../../i18n/LanguageContext';

export default function DailyBulkEditModals({
  showBulkMoveModal,
  setShowBulkMoveModal,
  bulkMoveDate,
  setBulkMoveDate,
  showBulkDeleteConfirm,
  setShowBulkDeleteConfirm,
  bulkSelectedEventIds,
  setBulkEditMode,
}) {
  const { t } = useTranslation();
  const { showError } = useToast();
  const { filteredEvents, dispatchCallEvent, dispatchBulkCallEvents, isLoading, loadingOperation } =
    useEventContext();
  const { deleteRecurringTodosForEvent } = useRecurringActions();

  const confirmBulkMove = async () => {
    const dayMs = dayjs(bulkMoveDate).startOf('day').valueOf();
    try {
      const operations = bulkSelectedEventIds
        .map((id) => filteredEvents.find((e) => e.id === id))
        .filter(Boolean)
        .map((evt) => ({
          type: EVENT_ACTIONS.UPDATE,
          payload: { ...evt, day: dayMs },
        }));

      await dispatchBulkCallEvents(operations);
      setShowBulkMoveModal(false);
      setBulkEditMode(false);
    } catch {
      showError(t('calendar.moveFailed'));
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
      showError(t('calendar.deleteFailed'));
    }
  };

  return (
    <>
      {showBulkMoveModal && (
        <Modal
          title={t(
            bulkSelectedEventIds.length !== 1
              ? 'calendar.moveEventsTitlePlural'
              : 'calendar.moveEventsTitleSingular',
            { count: bulkSelectedEventIds.length },
          )}
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
                {t('common.cancel')}
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
                    {t('calendar.moving')}
                  </>
                ) : (
                  t('calendar.move')
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
              {t('calendar.newDate')}
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
          title={t('calendar.deleteEventsTitle')}
          message={
            <p className="mb-0">
              {t(
                bulkSelectedEventIds.length !== 1
                  ? 'calendar.deleteEventsConfirmPlural'
                  : 'calendar.deleteEventsConfirmSingular',
                { count: bulkSelectedEventIds.length },
              )}
            </p>
          }
          confirmLabel={t('calendar.deleteAll')}
          variant="danger"
          onConfirm={confirmBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          isLoading={isLoading && loadingOperation === 'delete'}
          zIndex={1060}
        />
      )}
    </>
  );
}
