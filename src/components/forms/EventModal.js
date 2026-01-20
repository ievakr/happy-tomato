import React, { useContext, useState, useEffect } from "react";
import CalendarContext from "../../context/CalendarContext";
import EventContext from "../../context/EventContext";
import { useToast } from "../../context/ToastContext";
import CustomDropdown from "../common/CustomDropdown";
import DatePicker from "react-widgets/DatePicker";
import { Localization } from "react-widgets";
import { DateLocalizer } from "react-widgets/IntlLocalizer";
import 'react-widgets/styles.css';
import { PLANT_LABELS, PLANT_ACTIONS, TODO_ITEMS, TODO_ACTIONS } from "../../constants";
import { useRecurringActions } from "../../hooks";

export default function EventModal() {
    const { daySelected } = useContext(CalendarContext);
    const { setShowEventModal, dispatchCallEvent, selectedEvent, dosage, setDosage, isLoading, loadingOperation } = useContext(EventContext); 
    const { createActionWithRecurringTodos, completeTodo, isTodoEvent, updateEventWithRecurringRecalculation, deleteRecurringTodosForEvent } = useRecurringActions();
    const { showError } = useToast();
    const [description, setDescription] = useState("");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [title, setTitle] = useState("");
    const [selectedToDo, setSelectedToDo] = useState([]);
    const [selectedActions, setSelectedActions] = useState([]);
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
            
            setSelectedLabels(selectedEvent.labels || []);
            
            // Check if this is a TODO event (recurring or manual)
            const isTodoEvent = selectedEvent.isRecurringTodo || 
                               (selectedEvent.title && typeof selectedEvent.title === 'string' && selectedEvent.title.startsWith("TO DO:")) ||
                               selectedEvent.toDo;
            
            if (isTodoEvent && selectedEvent.toDo) {
                // This is a TODO event - populate TODO dropdown
                setSelectedToDo(Array.isArray(selectedEvent.toDo) ? selectedEvent.toDo : [selectedEvent.toDo]);
                setSelectedActions([]);
                setTitle(selectedEvent.title || "");
                
                // Set dosage from TODO_ACTIONS
                const firstTodo = Array.isArray(selectedEvent.toDo) ? selectedEvent.toDo[0] : selectedEvent.toDo;
                setDosage(TODO_ACTIONS[firstTodo] || "");
            } else if (isTodoEvent && selectedEvent.title && typeof selectedEvent.title === 'string' && selectedEvent.title.startsWith("TO DO:")) {
                // This is a TODO event but might be missing toDo field - derive from title
                setSelectedToDo([selectedEvent.title]);
                setSelectedActions([]);
                setTitle(selectedEvent.title);
                
                // Set dosage from TODO_ACTIONS
                setDosage(TODO_ACTIONS[selectedEvent.title] || "");
            } else {
                // This is a plant action event - populate actions dropdown
                if (selectedEvent.actions && Array.isArray(selectedEvent.actions)) {
                    setSelectedActions(selectedEvent.actions);
                    setTitle(selectedEvent.actions.join(", "));
                } else if (selectedEvent.title) {
                    setSelectedActions([selectedEvent.title]);
                    setTitle(selectedEvent.title);
                } else {
                    setSelectedActions([]);
                    setTitle("");
                }
                setSelectedToDo([]);
                
                // Set dosage from PLANT_ACTIONS
                const firstAction = selectedEvent.actions && selectedEvent.actions.length > 0 
                    ? selectedEvent.actions[0] 
                    : selectedEvent.title;
                setDosage(PLANT_ACTIONS[firstAction] || "");
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
            setSelectedActions([]);
            setTitle("");
            setDescription("");
            setDosage("");
            setSelectedToDo([]);
            setIsRecurring(false);
            setRecurringInterval(7);
            setRecurringMaxOccurrences(12);
        }
        // Reset confirmation states
        setShowDeleteConfirm(false);
        setShowCompleteConfirm(false);
    }, [selectedEvent, daySelected, setDosage]);

    function handleActionSelect(selectedActionsArray) {
        setSelectedActions(selectedActionsArray);
        setTitle(selectedActionsArray.join(", "));
        
        // If selecting an action, clear any selected TODOs (they're mutually exclusive)
        if (selectedActionsArray.length > 0) {
            setSelectedToDo([]);
            setIsRecurring(false); // Actions don't use the new recurring UI
        }
        
        // Set dosage based on first selected action
        if (selectedActionsArray.length === 0) {
            setDosage("");
        } else {
            const dosageText = PLANT_ACTIONS[selectedActionsArray[0]] || "";
            setDosage(dosageText);
        }
        // Note: Recurring config is only for TODOs, not actions
        // Actions will use the legacy dosage text system for backward compatibility
    }
    
    function handleTodoSelect(selectedTodoArray) {
        setSelectedToDo(selectedTodoArray);
        
        // If selecting a TODO, clear any selected actions (they're mutually exclusive)
        if (selectedTodoArray && (Array.isArray(selectedTodoArray) ? selectedTodoArray.length > 0 : selectedTodoArray)) {
            setSelectedActions([]);
        }
        
        // Set dosage based on first selected todo item
        let dosageText = "";
        if (Array.isArray(selectedTodoArray) && selectedTodoArray.length > 0) {
            dosageText = TODO_ACTIONS[selectedTodoArray[0]] || "";
        } else if (selectedTodoArray) {
            dosageText = TODO_ACTIONS[selectedTodoArray] || "";
        }
        
        setDosage(dosageText);
        
        // Auto-populate recurring settings if dosage text contains pattern (suggests user might want recurring)
        if (dosageText) {
            const intervalMatch = dosageText.match(/use every (\d+) days?/i);
            const maxOccurrencesMatch = dosageText.match(/use every (\d+) days?, (\d+) times max/i);
            
            if (intervalMatch) {
                // Pre-populate with suggested values, but keep checkbox unchecked by default
                // so user has explicit control
                setRecurringInterval(parseInt(intervalMatch[1]));
                
                if (maxOccurrencesMatch) {
                    setRecurringMaxOccurrences(parseInt(maxOccurrencesMatch[2]));
                } else {
                    setRecurringMaxOccurrences(12); // Default
                }
                // Don't auto-check the box - let user decide
            }
        }
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
            interval: recurringInterval,
            maxOccurrences: recurringMaxOccurrences,
            unit: 'days' // Currently only supporting days
        } : null;
        
        if (selectedEvent) {
            // For updates, start with the original event to preserve all properties (isRecurringTodo, completed, etc.)
            calendarEvent = {
                ...selectedEvent,  // Preserve all original properties including isRecurringTodo
                // Override with form updates
                title,
                actions: selectedActions,
                description,
                labels: selectedLabels,
                toDo: Array.isArray(selectedToDo) ? selectedToDo.join(", ") : selectedToDo,
                day: selectedDate.valueOf(),
                id: selectedEvent.id,  // Ensure ID is preserved
                userRecurringConfig // Store user's recurring configuration
            };
            
            console.log('📝 Built calendarEvent for update:', calendarEvent);
            console.log('📝 calendarEvent.id:', calendarEvent.id);
        } else {
            // For new events, create fresh object
            calendarEvent = {
                title,
                actions: selectedActions,
                description,
                labels: selectedLabels,
                toDo: Array.isArray(selectedToDo) ? selectedToDo.join(", ") : selectedToDo,
                day: selectedDate.valueOf(),
                userRecurringConfig // Store user's recurring configuration
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
            } else {
                // Create new event - check if we should generate recurring TO DOs
                const hasActions = selectedActions.length > 0;
                const hasTodos = selectedToDo && (Array.isArray(selectedToDo) ? selectedToDo.length > 0 : selectedToDo);
                
                if (hasActions || hasTodos) {
                    // This event might have recurring patterns, use recurring action creation
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
                            <div className="modal-header">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="material-icons-outlined text-muted">
                                        event
                                    </span>
                                    <h5 className="modal-title">
                                        {selectedEvent ? 'Edit Event' : 'New Event'}
                                    </h5>
                                </div>
                                <div className="d-flex align-items-center gap-1">
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
                                                water_drop
                                            </span>
                                            Actions
                                        </label>
                                        <CustomDropdown
                                            title="Select actions"
                                            options={Object.keys(PLANT_ACTIONS)}
                                            selectedOptions={selectedActions}
                                            onSelect={handleActionSelect}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                checklist
                                            </span>
                                            To-do
                                        </label>
                                        <CustomDropdown
                                            title="Select to-do"
                                            options={TODO_ITEMS}
                                            selectedOptions={Array.isArray(selectedToDo) ? selectedToDo : (selectedToDo ? [selectedToDo] : [])}
                                            onSelect={handleTodoSelect}
                                        />
                                        {dosage && selectedToDo && (Array.isArray(selectedToDo) ? selectedToDo.length > 0 : selectedToDo) && (
                                            <div className="text-muted small mt-2">
                                                <span className="material-icons-outlined me-1" style={{ fontSize: '0.75rem', verticalAlign: 'middle' }}>
                                                    schedule
                                                </span>
                                                {dosage}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {(selectedToDo && (Array.isArray(selectedToDo) ? selectedToDo.length > 0 : selectedToDo)) && (
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
                                                            value={recurringInterval}
                                                            onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 7)}
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
                                                            value={recurringMaxOccurrences}
                                                            onChange={(e) => setRecurringMaxOccurrences(parseInt(e.target.value) || 12)}
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
                                            title="Select plants"
                                            options={Object.values(PLANT_LABELS)} 
                                            selectedOptions={selectedLabels || []} 
                                            onSelect={setSelectedLabels}
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
