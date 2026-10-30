import React, { useState, useEffect } from 'react';
import { useCalendarContext } from '../../context/CalendarContext';
import { useEventContext } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import DatePicker from 'react-widgets/DatePicker';
import { Localization } from 'react-widgets';
import { DateLocalizer } from 'react-widgets/IntlLocalizer';
import 'react-widgets/styles.css';
import CustomDropdown from '../common/CustomDropdown';
import { Modal } from '../common';
import EventDeleteConfirmModal from '../calendar/EventDeleteConfirmModal';
import { useRecurringActions, useSavedTodos, useEventRecurringConfig } from '../../hooks';
import TodoCombobox from '../common/TodoCombobox';
import RecurringConfigSection from './RecurringConfigSection';
import { RW_DATE_PICKER_INPUT_PROPS } from '../../constants/datePicker';
import { EVENT_ACTIONS } from '../../constants';
import { parseTodoFieldsFromEvent, buildCalendarEventPayload } from '../../utils/eventForm';
import { findRecurringScheduleConflict, getUserRecurringSeriesForEvent } from '../../utils/recurringTodos';
import { useTranslation } from '../../i18n/LanguageContext';

export default function EventModal() {
  const { t, language } = useTranslation();
  const { daySelected } = useCalendarContext();
  const {
    setShowEventModal,
    dispatchCallEvent,
    dispatchBulkCallEvents,
    filteredEvents,
    savedEvents,
    selectedEvent,
    setDosage,
    isLoading,
    loadingOperation,
    plantNames,
    displayNameToPlantId,
    plantIdToDisplayName,
  } = useEventContext();
  const {
    createActionWithRecurringTodos,
    updateEventWithRecurringRecalculation,
    deleteRecurringTodosForEvent,
  } = useRecurringActions();
  const { savedItems: savedTodoItems, addItem: addSavedTodo } = useSavedTodos();
  const { showError, showWarning } = useToast();
  const {
    applyFromEvent,
    resetForNewEvent,
    buildUserRecurringConfig,
    validateRecurringConfig,
    ...recurringFields
  } = useEventRecurringConfig(selectedEvent);

  const [description, setDescription] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [todoText, setTodoText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedDayMs = daySelected?.valueOf?.() ?? null;

  useEffect(() => {
    if (daySelected) {
      setSelectedDate(daySelected.toDate());
    }

    if (selectedEvent) {
      const labelDisplayNames = (selectedEvent.labels || []).map(
        (id) => (plantIdToDisplayName && plantIdToDisplayName[id]) || id
      );
      setSelectedLabels(labelDisplayNames);
      const { todoText: parsedTodo, title: parsedTitle } = parseTodoFieldsFromEvent(selectedEvent);
      setTodoText(parsedTodo);
      setTitle(parsedTitle);
      setDescription(selectedEvent.description || '');
      applyFromEvent(selectedEvent);
    } else {
      setSelectedLabels([]);
      setTodoText('');
      setTitle('');
      setDescription('');
      setDosage('');
      resetForNewEvent(daySelected);
    }
    setShowDeleteConfirm(false);
  }, [selectedEvent, selectedDayMs, setDosage, plantIdToDisplayName, applyFromEvent, resetForNewEvent, daySelected]);

  function handleTodoChange(value) {
    setTodoText(value);
    setTitle(value);
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    try {
      if (selectedEvent.isRecurringTodo) {
        await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: selectedEvent });
      } else {
        if (selectedEvent.actions?.length > 0) {
          try {
            await deleteRecurringTodosForEvent(
              selectedEvent.id,
              selectedEvent.actions[0],
              selectedEvent.labels
            );
          } catch {
            // Proceed with main delete
          }
        }
        await dispatchCallEvent({ type: EVENT_ACTIONS.DELETE, payload: selectedEvent });
      }
      setShowEventModal(false);
    } catch {
      // Toast already shown
    }
  }

  async function handleDeleteSeries() {
    if (!selectedEvent) return;
    const members = getUserRecurringSeriesForEvent(filteredEvents, selectedEvent);
    if (members.length < 2) return;
    try {
      await dispatchBulkCallEvents(
        members
          .filter((evt) => evt?.id)
          .map((evt) => ({ type: EVENT_ACTIONS.DELETE, payload: evt }))
      );
      setShowDeleteConfirm(false);
      setShowEventModal(false);
    } catch {
      // Toast already shown
    }
  }

  const seriesCount = selectedEvent
    ? getUserRecurringSeriesForEvent(filteredEvents, selectedEvent).length
    : 0;

  async function handleSubmit(e) {
    e.preventDefault();

    const rawTodo = todoText.trim();
    const toDoValue = rawTodo ? (rawTodo.startsWith('TO DO:') ? rawTodo : `TO DO: ${rawTodo}`) : null;
    const userRecurringConfig = buildUserRecurringConfig(toDoValue);

    if (!validateRecurringConfig(toDoValue, selectedDate, showError)) {
      return;
    }

    const calendarEvent = buildCalendarEventPayload({
      selectedEvent,
      todoText,
      title,
      description,
      selectedLabels,
      selectedDate,
      userRecurringConfig,
      displayNameToPlantId,
    });

    const ignoreIds = new Set(
      selectedEvent
        ? getUserRecurringSeriesForEvent(savedEvents, selectedEvent).map((evt) => evt.id)
        : []
    );
    if (selectedEvent?.id) ignoreIds.add(selectedEvent.id);
    const conflict = findRecurringScheduleConflict(savedEvents, calendarEvent, ignoreIds);
    if (conflict) {
      const todoName = (rawTodo || calendarEvent.title || '').replace(/^TO DO:\s*/i, '').trim();
      const plant = (selectedLabels || []).filter(Boolean).join(', ');
      const name = plant ? `${todoName} | ${plant}` : todoName;
      showWarning(t('forms.eventAlreadyOnDay', {
        name,
        date: conflict.day.format('DD/MM/YYYY'),
      }));
      return;
    }

    try {
      if (selectedEvent) {
        if (!calendarEvent.id || !selectedEvent.id) {
          showError(t('forms.updateEventMissingId'));
          return;
        }
        await updateEventWithRecurringRecalculation(calendarEvent, selectedEvent);
        if (toDoValue) {
          addSavedTodo(rawTodo.replace(/^TO DO:\s*/i, '').trim() || rawTodo);
        }
      } else {
        const hasTodos = !!todoText.trim();
        if (hasTodos) {
          addSavedTodo(rawTodo.replace(/^TO DO:\s*/i, '').trim() || rawTodo);
          await createActionWithRecurringTodos(calendarEvent);
        } else {
          await dispatchCallEvent({ type: EVENT_ACTIONS.PUSH, payload: calendarEvent });
        }
      }
      setShowEventModal(false);
    } catch {
      showError(t('forms.saveEventFailed'));
    }
  }

  return (
    <>
      <Modal
        title={selectedEvent ? t('forms.editEvent') : t('forms.newEvent')}
        onClose={() => setShowEventModal(false)}
        className="event-modal"
        footer={
          <div className="event-modal-actions">
            <button
              type="button"
              onClick={handleSubmit}
              className="btn event-modal-save w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">
                      {loadingOperation === 'update' ? t('forms.updating') : t('forms.saving')}
                    </span>
                  </span>
                  {loadingOperation === 'update' ? t('forms.updating') : t('forms.saving')}
                </>
              ) : selectedEvent ? (
                t('forms.update')
              ) : (
                t('common.save')
              )}
            </button>
            {selectedEvent && (
              <button
                type="button"
                className="btn btn-outline-danger event-modal-delete w-100"
                disabled={isLoading}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <span className="material-icons-outlined" aria-hidden>
                  delete
                </span>
                {t('common.delete')}
              </button>
            )}
          </div>
        }
      >
        <div className="event-modal-form">
          <div className="event-modal-field">
            <label className="form-label">{t('forms.todo')}</label>
            <TodoCombobox
              value={todoText}
              onChange={handleTodoChange}
              savedItems={savedTodoItems}
              emptyLabel={t('forms.selectTodo')}
            />
          </div>

          <div className="event-modal-field">
            <label className="form-label">{t('forms.plant')}</label>
            <CustomDropdown
              title={
                (plantNames || []).length
                  ? t('forms.selectPlant')
                  : t('forms.noPlantsCreate')
              }
              options={plantNames || []}
              selectedOptions={selectedLabels || []}
              onSelect={setSelectedLabels}
              singleSelect
            />
          </div>

          <div className="event-modal-field">
            <label className="form-label" htmlFor="event-date">{t('forms.date')}</label>
            <Localization date={new DateLocalizer({ culture: language === 'lt' ? 'lt' : 'en-GB', firstOfWeek: 1 })}>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                valueFormat={{ day: '2-digit', month: '2-digit', year: 'numeric' }}
                className="w-100"
                dropUp
                inputProps={{ ...RW_DATE_PICKER_INPUT_PROPS, id: 'event-date' }}
              />
            </Localization>
          </div>

          <div className="event-modal-field">
            <label className="form-label" htmlFor="event-description">{t('forms.description')}</label>
            <textarea
              id="event-description"
              name="description"
              value={description}
              required
              rows={3}
              className="form-control"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <RecurringConfigSection {...recurringFields} selectedDate={selectedDate} />
        </div>
      </Modal>

      <EventDeleteConfirmModal
        show={showDeleteConfirm}
        event={selectedEvent}
        seriesCount={seriesCount}
        onConfirm={handleDelete}
        onDeleteSeries={seriesCount > 1 ? handleDeleteSeries : undefined}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isLoading && loadingOperation === 'delete'}
      />
    </>
  );
}
