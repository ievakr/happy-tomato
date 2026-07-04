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
import { useTranslation } from '../../i18n/LanguageContext';

export default function EventModal() {
  const { t } = useTranslation();
  const { daySelected } = useCalendarContext();
  const {
    setShowEventModal,
    dispatchCallEvent,
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
    isTodoEvent,
    updateEventWithRecurringRecalculation,
    deleteRecurringTodosForEvent,
  } = useRecurringActions();
  const { savedItems: savedTodoItems, addItem: addSavedTodo } = useSavedTodos();
  const { showError } = useToast();
  const {
    applyFromEvent,
    resetForNewEvent,
    buildUserRecurringConfig,
    validateRecurringConfig,
    ...recurringFields
  } = useEventRecurringConfig();

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

  const headerExtra = selectedEvent ? (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger"
      disabled={isLoading}
      onClick={() => setShowDeleteConfirm(true)}
      title={isTodoEvent(selectedEvent) ? t('forms.deleteTodo') : t('forms.deleteEvent')}
    >
      <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
        delete
      </span>
    </button>
  ) : null;

  return (
    <>
      <Modal
        title={selectedEvent ? t('forms.editEvent') : t('forms.newEvent')}
        icon="event"
        onClose={() => setShowEventModal(false)}
        className="event-modal"
        headerExtra={headerExtra}
        footer={
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-success w-100"
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
        }
      >
        <div className="d-grid gap-3">
          <div>
            <label className="form-label d-flex align-items-center gap-2">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                checklist
              </span>
              {t('forms.todo')}
            </label>
            <TodoCombobox
              value={todoText}
              onChange={handleTodoChange}
              savedItems={savedTodoItems}
              emptyLabel={t('forms.selectTodo')}
            />
          </div>

          <div>
            <label className="form-label d-flex align-items-center gap-2">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                yard
              </span>
              {t('forms.plants')}
            </label>
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

          <div>
            <label className="form-label d-flex align-items-center gap-2">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                schedule
              </span>
              {t('forms.date')}
            </label>
            <Localization date={new DateLocalizer({ firstOfWeek: 1 })}>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                defaultValue={new Date()}
                valueFormat={{ dateStyle: 'medium' }}
                className="w-100"
                inputProps={RW_DATE_PICKER_INPUT_PROPS}
              />
            </Localization>
          </div>

          <RecurringConfigSection {...recurringFields} />

          <div>
            <label className="form-label d-flex align-items-center gap-2">
              <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                segment
              </span>
              {t('forms.description')}
            </label>
            <input
              type="text"
              name="description"
              placeholder={t('forms.addDescription')}
              value={description}
              required
              className="form-control"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <EventDeleteConfirmModal
        show={showDeleteConfirm}
        event={selectedEvent}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isLoading && loadingOperation === 'delete'}
      />
    </>
  );
}
