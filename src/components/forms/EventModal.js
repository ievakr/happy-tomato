import React, { useContext, useState, useEffect } from "react";
import CalendarContext from "../../context/CalendarContext";
import { useEventContext } from "../../context/EventContext";
import { useToast } from "../../context/ToastContext";
import DatePicker from "react-widgets/DatePicker";
import { Localization } from "react-widgets";
import { DateLocalizer } from "react-widgets/IntlLocalizer";
import 'react-widgets/styles.css';
import dayjs from "dayjs";
import CustomDropdown from "../common/CustomDropdown";
import { Modal, ConfirmModal } from "../common";
import { useRecurringActions, useSavedTodos } from "../../hooks";
import TodoCombobox from "../common/TodoCombobox";

/** Calendar-only typing path; `inputMode: none` + readOnly on the inner input reduces iOS keyboard after picking a date. (Widget `readOnly` would block calendar updates.) */
const RW_DATE_PICKER_INPUT_PROPS = {
    readOnly: true,
    inputMode: "none",
    autoComplete: "off",
};

export default function EventModal() {
    const { daySelected } = useContext(CalendarContext);
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
    const { createActionWithRecurringTodos, isTodoEvent, updateEventWithRecurringRecalculation, deleteRecurringTodosForEvent } = useRecurringActions();
    const { savedItems: savedTodoItems, addItem: addSavedTodo } = useSavedTodos();
    const { showError } = useToast();
    const [description, setDescription] = useState("");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [title, setTitle] = useState("");
    const [todoText, setTodoText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState(7);
    const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState(2);
    /** 'count' = number of occurrences; 'until' = repeat through end date (inclusive) */
    const [recurringEndType, setRecurringEndType] = useState('count');
    const [recurringUntilDate, setRecurringUntilDate] = useState(() => dayjs().add(1, 'month').toDate());

    // Initialize component state when modal opens
    useEffect(() => {
        // Set the date from daySelected
        if (daySelected) {
            setSelectedDate(daySelected.toDate());
        }
        
        // Set other values from selectedEvent if editing
        if (selectedEvent) {
            // Convert plant IDs to display names for dropdown (legacy: keep as-is)
            const labelDisplayNames = (selectedEvent.labels || []).map(
                id => (plantIdToDisplayName && plantIdToDisplayName[id]) || id
            );
            setSelectedLabels(labelDisplayNames);
            
            // Check if this is a TODO event (recurring or manual)
            const isTodoEvent = selectedEvent.isRecurringTodo || 
                               (selectedEvent.title && typeof selectedEvent.title === 'string' && selectedEvent.title.startsWith("TO DO:")) ||
                               selectedEvent.toDo;
            
            if (isTodoEvent) {
                const todoValue = selectedEvent.toDo 
                    ? (Array.isArray(selectedEvent.toDo) ? selectedEvent.toDo.join(", ") : selectedEvent.toDo)
                    : (selectedEvent.title && selectedEvent.title.startsWith("TO DO:") ? selectedEvent.title : "");
                // Strip "TO DO: " prefix for display - we add it back on save
                const displayTodo = todoValue.replace(/^TO DO:\s*/i, "").trim() || todoValue;
                setTodoText(displayTodo);
                setTitle(selectedEvent.title || todoValue);
            } else {
                // Non-todo event (e.g. legacy action) - show content in todo field for editing
                const legacyText = selectedEvent.actions?.length 
                    ? selectedEvent.actions.join(", ") 
                    : (selectedEvent.title || "");
                setTodoText(legacyText);
                setTitle(selectedEvent.title || legacyText);
            }
            
            setDescription(selectedEvent.description || "");

            if (selectedEvent.userRecurringConfig) {
                setIsRecurring(true);
                setRecurringInterval(selectedEvent.userRecurringConfig.interval || 7);
                const cfg = selectedEvent.userRecurringConfig;
                const useUntil =
                    cfg.endType === 'count'
                        ? false
                        : cfg.endType === 'until'
                          ? cfg.untilDate != null
                          : cfg.untilDate != null;
                if (useUntil && cfg.untilDate != null) {
                    setRecurringEndType('until');
                    setRecurringUntilDate(new Date(cfg.untilDate));
                } else {
                    setRecurringEndType('count');
                    setRecurringMaxOccurrences(cfg.maxOccurrences || 2);
                    setRecurringUntilDate(dayjs(selectedEvent.day).add(1, 'month').toDate());
                }
            } else if (selectedEvent.recurringInterval) {
                setIsRecurring(true);
                setRecurringInterval(selectedEvent.recurringInterval || 7);
                setRecurringEndType('count');
                setRecurringMaxOccurrences(2);
                setRecurringUntilDate(dayjs(selectedEvent.day).add(1, 'month').toDate());
            } else {
                setIsRecurring(false);
                setRecurringInterval(7);
                setRecurringMaxOccurrences(2);
                setRecurringEndType('count');
                setRecurringUntilDate(dayjs(selectedEvent.day).add(1, 'month').toDate());
            }
        } else {
            // Reset for new event
            setSelectedLabels([]);
            setTodoText("");
            setTitle("");
            setDescription("");
            setDosage("");
            setIsRecurring(false);
            setRecurringInterval(7);
            setRecurringMaxOccurrences(2);
            setRecurringEndType('count');
            setRecurringUntilDate(
                dayjs(daySelected ? daySelected.toDate() : new Date()).add(1, 'month').toDate()
            );
        }
        // Reset confirmation states
        setShowDeleteConfirm(false);
    }, [
        selectedEvent,
        daySelected,
        setDosage,
        plantIdToDisplayName,
    ]);

    function handleTodoChange(value) {
        setTodoText(value);
        setTitle(value);
    }

    async function handleDelete() {
        try {
            // Check if this event has an old-style ID that doesn't exist in Firebase
            if (selectedEvent.id && selectedEvent.id.includes('-') && !selectedEvent.id.match(/^[a-zA-Z0-9]{20}$/)) {
                if (selectedEvent.isRecurringTodo) {
                    // Don't do any special handling for old-style IDs
                    // Just let it fall through to the regular recurring TODO deletion logic
                    // which now only deletes the single event
                }
            }
            
            // Check if this is a recurring TODO that needs special handling
            if (selectedEvent.isRecurringTodo) {
                // Just delete this specific TODO event - don't clean up the series
                await dispatchCallEvent({ type: "delete", payload: selectedEvent });
            } else {
                // Regular event deletion - clean up generated recurring TODOs if applicable
                if (selectedEvent.actions && selectedEvent.actions.length > 0) {
                    try {
                        const actionToMatch = selectedEvent.actions[0];
                        await deleteRecurringTodosForEvent(
                            selectedEvent.id,
                            actionToMatch,
                            selectedEvent.labels
                        );
                    } catch {
                        // Proceed with main delete even if cleanup fails
                    }
                }
                await dispatchCallEvent({ type: "delete", payload: selectedEvent });
            }
            setShowEventModal(false);
        } catch {
            // Error toast already shown by dispatchCallEvent / deleteRecurringTodosForEvent
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        let calendarEvent;

        const rawTodo = todoText.trim();
        const toDoValue = rawTodo ? (rawTodo.startsWith("TO DO:") ? rawTodo : `TO DO: ${rawTodo}`) : null;

        const userRecurringConfig =
            toDoValue && isRecurring
                ? {
                      enabled: true,
                      interval: Number(recurringInterval) || 7,
                      unit: 'days',
                      endType: recurringEndType,
                      ...(recurringEndType === 'count'
                          ? { maxOccurrences: Number(recurringMaxOccurrences) || 2 }
                          : { untilDate: dayjs(recurringUntilDate).endOf('day').valueOf() }),
                  }
                : null;

        if (toDoValue && isRecurring) {
            if (recurringEndType === 'count') {
                const n = Number(recurringMaxOccurrences);
                if (!Number.isFinite(n) || n < 1) {
                    showError('Enter a valid number of occurrences (at least 1).');
                    return;
                }
            } else {
                const startDay = dayjs(selectedDate).startOf('day');
                const untilDay = dayjs(recurringUntilDate).startOf('day');
                if (untilDay.isBefore(startDay)) {
                    showError('The end date must be on or after the event date.');
                    return;
                }
            }
        }

        // Convert display names to plant IDs for storage (legacy names kept as-is)
        const labelsToSave = (selectedLabels || []).map(
            dn => (displayNameToPlantId && displayNameToPlantId[dn]) || dn
        );

        const eventDate = dayjs(selectedDate).startOf('day');
        const today = dayjs().startOf('day');
        const isPastDate = eventDate.isBefore(today);
        const isTodo = !!toDoValue;
        const rawTitle = toDoValue || title;
        // Past to-dos: strip "TO DO:" from title so UI matches manual Complete (useRecurringActions.completeTodo)
        const resolvedTitle =
            isTodo && isPastDate && toDoValue
                ? toDoValue.replace(/^TO DO:\s*/i, '').trim() || rawTitle
                : rawTitle;

        if (selectedEvent) {
            calendarEvent = {
                ...selectedEvent,
                title: resolvedTitle,
                actions: [],
                description,
                labels: labelsToSave,
                toDo: toDoValue,
                day: selectedDate.valueOf(),
                id: selectedEvent.id,
                userRecurringConfig: isTodo && isPastDate ? null : userRecurringConfig,
                ...(isTodo && isPastDate
                    ? {
                          completed: true,
                          completedAt: selectedEvent.completedAt || Date.now(),
                          createdFromAction: true,
                          isRecurringTodo: false,
                      }
                    : isTodo && !isPastDate
                      ? {
                            completed: false,
                            completedAt: undefined,
                            createdFromAction: false,
                        }
                      : {}),
            };
        } else {
            calendarEvent = {
                title: resolvedTitle,
                actions: [],
                description,
                labels: labelsToSave,
                toDo: toDoValue,
                day: selectedDate.valueOf(),
                completed: isTodo && isPastDate,
                ...(isTodo &&
                    isPastDate && {
                        completedAt: Date.now(),
                        createdFromAction: true,
                    }),
                userRecurringConfig: isTodo && isPastDate ? null : userRecurringConfig,
            };
        }
        
        try {
            if (selectedEvent) {
                // Safety check: ensure the event has an ID
                if (!calendarEvent.id || !selectedEvent.id) {
                    showError('Cannot update event - missing ID. Please try refreshing the page.');
                    return;
                }
                
                // Update existing event - use recalculation function to handle recurring todos
                await updateEventWithRecurringRecalculation(calendarEvent, selectedEvent);
                if (toDoValue) {
                    addSavedTodo(rawTodo.replace(/^TO DO:\s*/i, "").trim() || rawTodo);
                }
            } else {
                // Create new event - check if we should generate recurring TO DOs
                const hasTodos = !!todoText.trim();
                
                if (hasTodos) {
                    addSavedTodo(rawTodo.replace(/^TO DO:\s*/i, "").trim() || rawTodo);
                    await createActionWithRecurringTodos(calendarEvent);
                } else {
                    // This is a regular event (no actions or todos)
                    await dispatchCallEvent({ type: 'push', payload: calendarEvent });
                }
            }
            setShowEventModal(false);
        } catch {
            showError('Failed to save event. Please try again.');
        }
    }

    const headerExtra = (
        <>
            {selectedEvent && (
                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    disabled={isLoading}
                    onClick={() => setShowDeleteConfirm(true)}
                    title={isTodoEvent(selectedEvent) ? "Delete TO DO" : "Delete event"}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                        delete
                    </span>
                </button>
            )}
        </>
    );

    return (
        <>
            <Modal
                title={selectedEvent ? 'Edit Event' : 'New Event'}
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
                                        {loadingOperation === 'update' ? 'Updating...' : 'Saving...'}
                                    </span>
                                </span>
                                {loadingOperation === 'update' ? 'Updating...' : 'Saving...'}
                            </>
                        ) : selectedEvent ? (
                            'Update'
                        ) : (
                            'Save'
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
                                            To-do
                                        </label>
                                        <TodoCombobox
                                            value={todoText}
                                            onChange={handleTodoChange}
                                            savedItems={savedTodoItems}
                                            emptyLabel="Select a to-do"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                yard
                                            </span>
                                            Plants
                                        </label>
                                        <CustomDropdown
                                            title={(plantNames || []).length ? "Select plant" : "You don't have any plants - create a plant"}
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
                                            Date
                                        </label>
                                        <Localization date={new DateLocalizer({ firstOfWeek: 1 })}>
                                            <DatePicker
                                                value={selectedDate}
                                                onChange={(date) => setSelectedDate(date)}
                                                defaultValue={new Date()}
                                                valueFormat={{ dateStyle: "medium" }}
                                                className="w-100"
                                                inputProps={RW_DATE_PICKER_INPUT_PROPS}
                                            />
                                        </Localization>
                                    </div>

                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="isRecurringCheck"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="isRecurringCheck">
                                            <span className="material-icons-outlined me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>
                                                repeat
                                            </span>
                                            This is a recurring event
                                        </label>
                                    </div>

                                    {isRecurring && (
                                        <div className="border rounded p-3 bg-light">
                                            <div className="mb-3">
                                                <label htmlFor="recurringInterval" className="form-label small text-muted">
                                                    Repeat every (days)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="recurringInterval"
                                                    min="1"
                                                    max="365"
                                                    value={recurringInterval === "" ? "" : recurringInterval}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRecurringInterval(val === "" ? "" : (parseInt(val, 10) || 7));
                                                    }}
                                                />
                                            </div>
                                            <div className="mb-2" role="group" aria-label="How recurring ends">
                                                <div className="form-label small text-muted mb-2">
                                                    Series ends
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="recurringEndType"
                                                            id="recurringEndCount"
                                                            checked={recurringEndType === 'count'}
                                                            onChange={() => setRecurringEndType('count')}
                                                        />
                                                        <label className="form-check-label" htmlFor="recurringEndCount">
                                                            After a number of occurrences
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="recurringEndType"
                                                            id="recurringEndUntil"
                                                            checked={recurringEndType === 'until'}
                                                            onChange={() => setRecurringEndType('until')}
                                                        />
                                                        <label className="form-check-label" htmlFor="recurringEndUntil">
                                                            On a date (inclusive)
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {recurringEndType === 'count' && (
                                                <div className="mb-2">
                                                    <label htmlFor="recurringMaxOccurrences" className="form-label small text-muted">
                                                        Number of occurrences
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="recurringMaxOccurrences"
                                                        min="1"
                                                        max="50"
                                                        value={recurringMaxOccurrences === "" ? "" : recurringMaxOccurrences}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setRecurringMaxOccurrences(val === "" ? "" : (parseInt(val, 10) || 12));
                                                        }}
                                                    />
                                                    <div className="form-text">
                                                        Total times this event occurs, including the first one
                                                    </div>
                                                </div>
                                            )}

                                            {recurringEndType === 'until' && (
                                                <div className="mb-2">
                                                    <label
                                                        className="form-label small text-muted d-flex align-items-center gap-2"
                                                        htmlFor="recurringUntilDate"
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                                            event_repeat
                                                        </span>
                                                        Repeat until
                                                    </label>
                                                    <div>
                                                        <Localization date={new DateLocalizer({ firstOfWeek: 1 })}>
                                                            <DatePicker
                                                                id="recurringUntilDate"
                                                                value={recurringUntilDate}
                                                                onChange={(date) => date && setRecurringUntilDate(date)}
                                                                valueFormat={{ dateStyle: 'medium' }}
                                                                className="w-100"
                                                                inputProps={RW_DATE_PICKER_INPUT_PROPS}
                                                            />
                                                        </Localization>
                                                    </div>
                                                    <div className="form-text">
                                                        Last occurrence falls on this date or earlier
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                segment
                                            </span>
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            name="description"
                                            placeholder="Add a description"
                                            value={description}
                                            required
                                            className="form-control"
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
            </Modal>

            {showDeleteConfirm && (
                <ConfirmModal
                    title="Delete Event"
                    message="Are you sure you want to delete this event? This action can't be undone."
                    confirmLabel="Delete"
                    variant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    isLoading={isLoading && loadingOperation === 'delete'}
                />
            )}

        </>
    );
}
