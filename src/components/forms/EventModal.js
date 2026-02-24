import React, { useContext, useState, useEffect } from "react";
import CalendarContext from "../../context/CalendarContext";
import EventContext from "../../context/EventContext";
import { useToast } from "../../context/ToastContext";
import DatePicker from "react-widgets/DatePicker";
import { Localization } from "react-widgets";
import { DateLocalizer } from "react-widgets/IntlLocalizer";
import 'react-widgets/styles.css';
import dayjs from "dayjs";
import CustomDropdown from "../common/CustomDropdown";
import { useRecurringActions, useSavedTodos } from "../../hooks";
import TodoCombobox from "../common/TodoCombobox";

export default function EventModal() {
    const { daySelected } = useContext(CalendarContext);
    const { setShowEventModal, dispatchCallEvent, selectedEvent, setDosage, isLoading, loadingOperation, plantNames, displayNameToPlantId, plantIdToDisplayName } = useContext(EventContext); 
    const { createActionWithRecurringTodos, completeTodo, isTodoEvent, updateEventWithRecurringRecalculation, deleteRecurringTodosForEvent } = useRecurringActions();
    const { savedItems: savedTodoItems, addItem: addSavedTodo, removeItem: removeSavedTodo } = useSavedTodos();
    const { showError } = useToast();
    const [description, setDescription] = useState("");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [title, setTitle] = useState("");
    const [todoText, setTodoText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    
    // Recurring event configuration
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringInterval, setRecurringInterval] = useState(7);
    const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState(12);

    // Initialize component state when modal opens
    useEffect(() => {
        // Set the date from daySelected
        if (daySelected) {
            setSelectedDate(daySelected.toDate());
        }
        
        // Set other values from selectedEvent if editing
        if (selectedEvent) {
            console.log('📝 EventModal opened with selectedEvent:', selectedEvent);
            console.log('📝 selectedEvent.id:', selectedEvent.id);
            console.log('📝 selectedEvent type:', typeof selectedEvent.id);
            
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
            
            // Initialize recurring settings from event
            if (selectedEvent.userRecurringConfig) {
                // User has configured recurring settings
                setIsRecurring(true);
                setRecurringInterval(selectedEvent.userRecurringConfig.interval || 7);
                setRecurringMaxOccurrences(selectedEvent.userRecurringConfig.maxOccurrences || 12);
            } else if (selectedEvent.recurringInterval) {
                // Legacy event with recurring pattern
                setIsRecurring(true);
                setRecurringInterval(selectedEvent.recurringInterval || 7);
                setRecurringMaxOccurrences(12); // Default for legacy events
            } else {
                // Not recurring
                setIsRecurring(false);
                setRecurringInterval(7);
                setRecurringMaxOccurrences(12);
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
            setRecurringMaxOccurrences(12);
        }
        // Reset confirmation states
        setShowDeleteConfirm(false);
        setShowCompleteConfirm(false);
    }, [selectedEvent, daySelected, setDosage, plantIdToDisplayName]);

    function handleTodoChange(value) {
        setTodoText(value);
        setTitle(value);
    }

    async function handleDelete() {
        try {
            // Check if this event has an old-style ID that doesn't exist in Firebase
            if (selectedEvent.id && selectedEvent.id.includes('-') && !selectedEvent.id.match(/^[a-zA-Z0-9]{20}$/)) {
                console.log('🔧 Detected old-style ID that might not exist in Firebase:', selectedEvent.id);
                
                if (selectedEvent.isRecurringTodo) {
                    console.log('🎯 Old-style recurring TODO - will attempt regular deletion...');
                    // Don't do any special handling for old-style IDs
                    // Just let it fall through to the regular recurring TODO deletion logic
                    // which now only deletes the single event
                }
            }
            
            // Check if this is a recurring TODO that needs special handling
            if (selectedEvent.isRecurringTodo) {
                console.log('🗑️ Deleting single recurring TODO event:', selectedEvent.title);
                
                // Just delete this specific TODO event - don't clean up the series
                await dispatchCallEvent({ type: "delete", payload: selectedEvent });
                console.log('✅ Deleted the specific recurring TODO (series remains intact)');
                
            } else {
                // Regular event deletion - but check if it's an original action that generates TODOs
                console.log('🗑️ Deleting regular event:', selectedEvent.title);
                
                // If this is an original action event that might have generated recurring TODOs, clean them up
                if (selectedEvent.actions && selectedEvent.actions.length > 0) {
                    try {
                        const actionToMatch = selectedEvent.actions[0];
                        console.log(`🔍 Checking if action "${actionToMatch}" has generated recurring TODOs to clean up`);
                        
                        const deletedCount = await deleteRecurringTodosForEvent(
                            selectedEvent.id, 
                            actionToMatch, 
                            selectedEvent.labels
                        );
                        if (deletedCount > 0) {
                            console.log(`✅ Cleaned up ${deletedCount} recurring TODOs generated by this action`);
                        }
                    } catch (cleanupError) {
                        console.warn('⚠️ Failed to clean up generated TODOs, but will proceed with main delete:', cleanupError);
                    }
                }
                
                await dispatchCallEvent({ type: "delete", payload: selectedEvent });
                console.log('✅ Successfully deleted regular event');
            }
            
            setShowEventModal(false);
        } catch (error) {
            console.error('❌ Delete failed:', error);
            // Show user-friendly error message
            showError('Failed to delete event. Please try again.');
        }
    }

    async function handleComplete() {
        try {
            await completeTodo(selectedEvent);
            setShowEventModal(false);
        } catch (error) {
            console.error('Complete failed:', error);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        let calendarEvent;
        
        // Build user recurring configuration if enabled
        const userRecurringConfig = isRecurring ? {
            enabled: true,
            interval: Number(recurringInterval) || 7,
            maxOccurrences: Number(recurringMaxOccurrences) || 12,
            unit: 'days' // Currently only supporting days
        } : null;
        
        const rawTodo = todoText.trim();
        const toDoValue = rawTodo ? (rawTodo.startsWith("TO DO:") ? rawTodo : `TO DO: ${rawTodo}`) : null;

        // Convert display names to plant IDs for storage (legacy names kept as-is)
        const labelsToSave = (selectedLabels || []).map(
            dn => (displayNameToPlantId && displayNameToPlantId[dn]) || dn
        );

        if (selectedEvent) {
            // For updates, start with the original event to preserve all properties (isRecurringTodo, completed, etc.)
            calendarEvent = {
                ...selectedEvent,  // Preserve all original properties including isRecurringTodo
                // Override with form updates
                title: toDoValue || title,
                actions: [],  // Actions removed from UI
                description,
                labels: labelsToSave,
                toDo: toDoValue,
                day: selectedDate.valueOf(),
                id: selectedEvent.id,  // Ensure ID is preserved
                userRecurringConfig // Store user's recurring configuration
            };
            
            console.log('📝 Built calendarEvent for update:', calendarEvent);
            console.log('📝 calendarEvent.id:', calendarEvent.id);
        } else {
            // For new events, create fresh object
            const eventDate = dayjs(selectedDate).startOf("day");
            const today = dayjs().startOf("day");
            const isPastDate = eventDate.isBefore(today);
            const isTodo = !!toDoValue;

            calendarEvent = {
                title: toDoValue || title,
                actions: [],
                description,
                labels: labelsToSave,
                toDo: toDoValue,
                day: selectedDate.valueOf(),
                completed: isTodo && isPastDate,
                ...(isTodo && isPastDate && {
                    completedAt: Date.now(),
                    createdFromAction: true
                }),
                userRecurringConfig
            };
        }
        
        try {
            if (selectedEvent) {
                // Safety check: ensure the event has an ID
                if (!calendarEvent.id || !selectedEvent.id) {
                    console.error('❌ Cannot update event - missing ID!');
                    console.error('calendarEvent:', calendarEvent);
                    console.error('selectedEvent:', selectedEvent);
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
        } catch (error) {
            console.error('Save failed:', error);
        }
    }

    return (
        <>
            <div className="modal fade show d-block" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-header d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                    <span className="material-icons-outlined text-muted">
                                        event
                                    </span>
                                    <h5 className="modal-title">
                                        {selectedEvent ? 'Edit Event' : 'New Event'}
                                    </h5>
                                </div>
                                <div className="d-flex align-items-center gap-1 ms-auto flex-shrink-0">
                                    {selectedEvent && isTodoEvent(selectedEvent) && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-success"
                                            disabled={isLoading}
                                            onClick={() => setShowCompleteConfirm(true)}
                                            title="Complete TO DO"
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
                                                check_circle
                                            </span>
                                        </button>
                                    )}
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
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowEventModal(false)}
                                        aria-label="Close"
                                    />
                                </div>
                            </div>
                            <div className="modal-body">
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
                                            placeholder="Add to-do"
                                            savedItems={savedTodoItems}
                                            removeItem={removeSavedTodo}
                                        />
                                    </div>
                                    
                                    {todoText.trim() && (
                                        <div className="border rounded p-3 bg-light">
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
                                                    Make this a recurring event
                                                </label>
                                            </div>
                                            
                                            {isRecurring && (
                                                <div className="mt-3">
                                                    <div className="mb-3">
                                                        <label htmlFor="recurringInterval" className="form-label small text-muted">
                                                            Repeat every (days)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
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
                                                    <div className="mb-2">
                                                        <label htmlFor="recurringMaxOccurrences" className="form-label small text-muted">
                                                            Maximum occurrences
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
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
                                                            Total number of times this event will occur (including the first one)
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
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
                                            />
                                        </Localization>
                                    </div>
                                    
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
                                    
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                yard
                                            </span>
                                            Plants
                                        </label>
                                        <CustomDropdown
                                            title="Select plant"
                                            options={plantNames || []}
                                            selectedOptions={selectedLabels || []}
                                            onSelect={setSelectedLabels}
                                            singleSelect
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="submit" 
                                    onClick={handleSubmit} 
                                    className="btn btn-danger w-100"
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
                                    ) : (
                                        selectedEvent ? 'Update' : 'Save'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
            
            {showDeleteConfirm && (
                <>
                    <div className="modal fade show d-block" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-sm">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h6 className="modal-title">Delete Event</h6>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        aria-label="Close"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="modal-body">
                                    <p className="mb-0 text-muted">
                                        Are you sure you want to delete this event? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-danger"
                                        onClick={handleDelete}
                                        disabled={isLoading}
                                    >
                                        {isLoading && loadingOperation === 'delete' ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Deleting...</span>
                                                </span>
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" />
                </>
            )}
            
            {showCompleteConfirm && (
                <>
                    <div className="modal fade show d-block" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered modal-sm">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h6 className="modal-title">Complete TO DO</h6>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowCompleteConfirm(false)}
                                        aria-label="Close"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="modal-body">
                                    <p className="mb-0 text-muted">
                                        Mark this TO DO as completed? This will create a completed action event and remove the TO DO from your list.
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowCompleteConfirm(false)}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-success"
                                        onClick={handleComplete}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Completing...</span>
                                                </span>
                                                Completing...
                                            </>
                                        ) : (
                                            'Complete'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" />
                </>
            )}
        </>
    );
}
