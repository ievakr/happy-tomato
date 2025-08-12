import React, { useContext, useState, useEffect } from "react";
import GlobalContext from "../../context/GlobalContext";
import CustomDropdown from "../common/CustomDropdown";
import DatePicker from "react-widgets/DatePicker";
import { Localization } from "react-widgets";
import { DateLocalizer } from "react-widgets/IntlLocalizer";
import 'react-widgets/styles.css';
import '../../styles/legacy.css';
import { PLANT_LABELS, PLANT_ACTIONS, TODO_ITEMS } from "../../constants";

export default function EventModal() {
    const { setShowEventModal, daySelected, dispatchCallEvent, selectedEvent, dosage, setDosage, isLoading, loadingOperation } = useContext(GlobalContext);
    const [description, setDescription] = useState("");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [title, setTitle] = useState("");
    const [selectedToDo, setSelectedToDo] = useState([]);
    const [selectedActions, setSelectedActions] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize component state when modal opens
    useEffect(() => {
        // Set the date from daySelected
        if (daySelected) {
            setSelectedDate(daySelected.toDate());
        }
        
        // Set other values from selectedEvent if editing
        if (selectedEvent) {
            setSelectedLabels(selectedEvent.labels || []);
            
            // Handle both old single title format and new multiple actions format
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
            
            setDescription(selectedEvent.description || "");
            // Set dosage based on first action for now
            const firstAction = selectedEvent.actions && selectedEvent.actions.length > 0 
                ? selectedEvent.actions[0] 
                : selectedEvent.title;
            setDosage(PLANT_ACTIONS[firstAction] || "");
            setSelectedToDo(Array.isArray(selectedEvent.toDo) ? selectedEvent.toDo : (selectedEvent.toDo ? [selectedEvent.toDo] : []));
        } else {
            // Reset for new event
            setSelectedLabels([]);
            setSelectedActions([]);
            setTitle("");
            setDescription("");
            setDosage("");
            setSelectedToDo([]);
        }
        // Reset delete confirmation state
        setShowDeleteConfirm(false);
    }, [selectedEvent, daySelected, setDosage]);

    function handleActionSelect(selectedActionsArray) {
        setSelectedActions(selectedActionsArray);
        setTitle(selectedActionsArray.join(", "));
        // Set dosage based on first selected action
        if (selectedActionsArray.length === 0) {
            setDosage("");
        } else {
            setDosage(PLANT_ACTIONS[selectedActionsArray[0]] || "");
        }
    }

    async function handleDelete() {
        try {
            await dispatchCallEvent({ type: "delete", payload: selectedEvent });
            setShowEventModal(false);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const calendarEvent = {
            title,
            actions: selectedActions,
            description,
            labels: selectedLabels,
            toDo: Array.isArray(selectedToDo) ? selectedToDo.join(", ") : selectedToDo,
            day: selectedDate.valueOf()
        };
        
        // Only add ID for existing events (updates), let Firebase generate ID for new events
        if (selectedEvent) {
            calendarEvent.id = selectedEvent.id;
        }
        
        try {
            if (selectedEvent) {
                await dispatchCallEvent({ type: 'update', payload: calendarEvent });
            } else {
                await dispatchCallEvent({ type: 'push', payload: calendarEvent });
            }
            setShowEventModal(false);
        } catch (error) {
            console.error('Save failed:', error);
        }
    }

    return (
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center" style={{ zIndex: 1055 }}>
            <form className="event-modal bg-white rounded-lg shadow-lg mx-3" style={{ 
                width: '100%', 
                maxWidth: '400px',
                maxHeight: '90vh',
                overflowY: 'auto',
                overflowX: 'visible'
            }} onSubmit={(e) => e.preventDefault()}>
                <header className="bg-light p-2 d-flex justify-content-between align-items-center">
                    <span className="material-icons-outlined text-muted">
                        drag_handle
                    </span>
                    <div className="d-flex align-items-center">
                        {selectedEvent && (
                            <button
                                type="button"
                                className="btn btn-sm p-1 me-2"
                                disabled={isLoading}
                                onClick={() => setShowDeleteConfirm(true)}
                                title="Delete event"
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
                <div className="p-3" style={{ overflow: 'visible' }}>
                    <div className="d-grid gap-3">
                        {/* Action Selection */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                water_drop
                            </span>
                            <div className="flex-grow-1 me-2">
                                <CustomDropdown
                                    title="Select actions"
                                    options={Object.keys(PLANT_ACTIONS)}
                                    selectedOptions={selectedActions}
                                    onSelect={handleActionSelect}
                                />
                            </div>
                            {dosage && (
                                <div className="text-muted small flex-shrink-0" style={{ fontSize: '0.75rem' }}>
                                    {dosage}
                                </div>
                            )}
                        </div>
                        
                        {/* To-Do Selection */}
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2 flex-shrink-0">
                                checklist
                            </span>
                            <div className="flex-grow-1">
                                <CustomDropdown
                                    title="Select to-do"
                                    options={TODO_ITEMS}
                                    selectedOptions={Array.isArray(selectedToDo) ? selectedToDo : (selectedToDo ? [selectedToDo] : [])}
                                    onSelect={setSelectedToDo}
                                />
                            </div>
                        </div>
                        
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
                <footer className="d-flex justify-content-end border-top p-3 mt-3">
                    <button 
                        type="submit" 
                        onClick={handleSubmit} 
                        className="btn btn-primary w-100 w-md-auto"
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
                        <div className="d-flex justify-content-end gap-2">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
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
            )}
        </div>
    );
}
