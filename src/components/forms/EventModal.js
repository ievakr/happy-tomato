import React, { useContext, useState, useEffect } from "react";
import CalendarContext from "../../context/CalendarContext";
import EventContext from "../../context/EventContext";
import { useToast } from "../../context/ToastContext";
import CustomDropdown from "../common/CustomDropdown";
import DatePicker from "react-widgets/DatePicker";
import { Localization } from "react-widgets";
import { DateLocalizer } from "react-widgets/IntlLocalizer";
import 'react-widgets/styles.css';
import '../../styles/legacy.css';
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
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1055 }}>
            <form className="event-modal bg-white rounded-lg shadow-lg mx-3 d-flex flex-column" style={{ 
                width: '100%', 
                maxWidth: '400px',
                maxHeight: '90vh',
                overflow: 'hidden'
            }} onSubmit={(e) => e.preventDefault()}>
                <header className="bg-light p-2 d-flex justify-content-between align-items-center flex-shrink-0">
                    <span className="material-icons-outlined text-muted">
                        drag_handle
                    </span>
                    <div className="d-flex align-items-center">
                        {selectedEvent && isTodoEvent(selectedEvent) && (
                            <button
                                type="button"
                                className="btn btn-sm p-1 me-2"
                                disabled={isLoading}
                                onClick={() => setShowCompleteConfirm(true)}
                                title="Complete TO DO"
                            >
                                <span className="material-icons-outlined text-success">
                                    check_circle
                                </span>
                            </button>
                        )}
                        {selectedEvent && (
                            <button
                                type="button"
                                className="btn btn-sm p-1 me-2"
                                disabled={isLoading}
                                onClick={() => setShowDeleteConfirm(true)}
                                title={isTodoEvent(selectedEvent) ? "Delete TO DO" : "Delete event"}
                            >
                                <span className="material-icons-outlined text-muted">
                                    delete
                                </span>
                            </button>
                        )}
                        <button type="button" className="btn btn-sm p-1" onClick={() => setShowEventModal(false)}>
                            <span className="material-icons-outlined text-muted">
                                close
                            </span>
                        </button>
                    </div>
                </header>
                <div className="p-3 pb-0 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'visible' }}>
                    <div className="d-grid gap-3 pb-3">
                        {/* Action Selection */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                water_drop
                            </span>
                            <div className="flex-grow-1">
                                <CustomDropdown
                                    title="Select actions"
                                    options={Object.keys(PLANT_ACTIONS)}
                                    selectedOptions={selectedActions}
                                    onSelect={handleActionSelect}
                                />
                            </div>
                        </div>
                        
                        {/* To-Do Selection */}
                        <div className="mb-3">
                            <div className="d-flex align-items-center">
                                <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                    checklist
                                </span>
                                <div style={{ minWidth: '200px', flex: '1 1 auto' }}>
                                    <CustomDropdown
                                        title="Select to-do"
                                        options={TODO_ITEMS}
                                        selectedOptions={Array.isArray(selectedToDo) ? selectedToDo : (selectedToDo ? [selectedToDo] : [])}
                                        onSelect={handleTodoSelect}
                                    />
                                </div>
                            </div>
                            {dosage && selectedToDo && (Array.isArray(selectedToDo) ? selectedToDo.length > 0 : selectedToDo) && (
                                <div className="text-muted small mt-1 ms-4" style={{ fontSize: '0.75rem' }}>
                                    <span className="material-icons-outlined me-1" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>
                                        schedule
                                    </span>
                                    {dosage}
                                </div>
                            )}
                        </div>
                        
                        {/* Recurring Event Configuration - Only for TODOs */}
                        {(selectedToDo && (Array.isArray(selectedToDo) ? selectedToDo.length > 0 : selectedToDo)) && (
                            <div className="mb-3">
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
                                    <div className="mt-3 p-3 bg-light rounded">
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
                                            <div className="form-text" style={{ fontSize: '0.7rem' }}>
                                                Total number of times this event will occur (including the first one)
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Date Selection */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                schedule
                            </span>
                            <div className="flex-grow-1">
                                <Localization
                                    date={new DateLocalizer({ firstOfWeek: 1 })}
                                >
                                    <DatePicker
                                        value={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        defaultValue={new Date()}
                                        valueFormat={{ dateStyle: "medium" }}
                                        className="w-100"
                                    />
                                </Localization>
                            </div>
                        </div>
                        
                        {/* Description */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                segment
                            </span>
                            <input
                                type="text"
                                name="description"
                                placeholder="Add a description"
                                value={description}
                                required
                                className="form-control border-0 border-bottom border-secondary flex-grow-1"
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        
                        {/* Plant Selection */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                yard
                            </span>
                            <div className="flex-grow-1">
                                <CustomDropdown
                                    title="Select plants"
                                    options={Object.values(PLANT_LABELS)} 
                                    selectedOptions={selectedLabels || []} 
                                    onSelect={setSelectedLabels}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <footer className="d-flex justify-content-end border-top p-3 flex-shrink-0">
                    <button 
                        type="submit" 
                        onClick={handleSubmit} 
                        className="btn btn-danger w-100 w-md-auto"
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
                </footer>
            </form>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div className="bg-white rounded shadow-lg p-4" style={{ maxWidth: '300px', width: '90%' }}>
                        <h6 className="mb-3">Delete Event</h6>
                        <p className="mb-4 text-muted">Are you sure you want to delete this event? This action cannot be undone.</p>
                        <div className="d-flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                                style={{ flex: '1' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
                                onClick={handleDelete}
                                disabled={isLoading}
                                style={{ flex: '1' }}
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
            )}
            
            {/* Complete TO DO Confirmation Modal */}
            {showCompleteConfirm && (
                <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <div className="bg-white rounded shadow-lg p-4" style={{ maxWidth: '350px', width: '90%' }}>
                        <h6 className="mb-3">Complete TO DO</h6>
                        <p className="mb-4 text-muted">Mark this TO DO as completed? This will create a completed action event and remove the TO DO from your list.</p>
                        <div className="d-flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowCompleteConfirm(false)}
                                disabled={isLoading}
                                style={{ flex: '1' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-success"
                                onClick={handleComplete}
                                disabled={isLoading}
                                style={{ flex: '1' }}
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
            )}
        </div>
    );
}
