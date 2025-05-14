import React, { useContext, useState, useEffect } from "react";
import GlobalContext from "../context/GlobalContext";
import CustomDropdown from "./CustomDropdown";
import DatePicker from "react-widgets/DatePicker";
import 'react-widgets/styles.css';
import '../styles.css';

const labelsClasses = {
    "rose": "Roses",
    "tomato": "Tomatoes",
    "leafy-green": "Salad",
    "cucumber": "Cucumbers",
    "radish": "Radishes",
    "onion": "Onions",
    "garlic-alt": "Garlic",
    "pepper-alt": "Bell Peppers",
    "carrot": "Carrots",
    "broccoli": "Broccoli",
    "watermelon": "Watermelon",
    "strawberries": "Strawberries"
};

const plantActions = {
    "Planted seeds": "",
    "Transplanted": "",
    "Watered": "",
    "Fertilized": "Use every 7 days",
    "Mimox Zn": "Use every 14 days",
    "Mavrik": "Use once",
    "Altosan B/Zn": "Use every 7 days",
    "NeemAzal": "Use every 7 days, 3 times max"
};

const toDoList = ["TO DO: Plant seeds", "TO DO: Transplant"]

export default function EventModal() {
    const { setShowEventModal, daySelected, dispatchCallEvent, selectedEvent, dosage, setDosage } = useContext(GlobalContext);
    const [description, setDescription] = useState(selectedEvent ? selectedEvent.description : "");
    const [selectedLabels, setSelectedLabels] = useState([]);
    const [selectedDate, setSelectedDate] = useState(daySelected.toDate());
    const [title, setTitle] = useState(selectedEvent ? selectedEvent.title : "");
    const [selectedToDo, setSelectedToDo] = useState([]);

    useEffect(() => {
        if (selectedEvent) {
            setSelectedLabels(selectedEvent.labels || []);
            setTitle(selectedEvent.title || "");
            setDescription(selectedEvent.description || "");
            setDosage(plantActions[selectedEvent.title] || "");
            setSelectedToDo(selectedEvent.toDo || "");
        }
    }, [selectedEvent, setDosage]);

    function handleSubmit(e) {
        e.preventDefault();
        const calendarEvent = {
            title,
            description,
            labels: selectedLabels,
            toDo: selectedToDo,
            day: selectedDate.valueOf(),
            id: selectedEvent ? selectedEvent.id : Date.now()
        };
        if (selectedEvent) {
            dispatchCallEvent({ type: 'update', payload: calendarEvent });
        } else {
            dispatchCallEvent({ type: 'push', payload: calendarEvent });
        }
        setShowEventModal(false);
    }

    return (
        <div className="position-fixed w-100 h-100 top-0 start-0 d-flex justify-content-center align-items-center">
            <form className="bg-white rounded-lg shadow-lg" style={{ width: '25%' }}>
                <header className="bg-light p-2 d-flex justify-content-between align-items-center">
                    <span className="material-icons-outlined text-muted">
                        drag_handle
                    </span>
                    <div className="d-flex align-items-center">
                        {selectedEvent && (
                            <button
                                type="button"
                                className="btn p-0 me-2"
                                onClick={() => {
                                    dispatchCallEvent({ type: "delete", payload: selectedEvent });
                                    setShowEventModal(false);
                                }}
                            >
                                <span className="material-icons-outlined text-muted">
                                    delete
                                </span>
                            </button>
                        )}
                        <button type="button" className="btn p-0" onClick={() => setShowEventModal(false)}>
                            <span className="material-icons-outlined text-muted">
                                close
                            </span>
                        </button>
                    </div>
                </header>
                <div className="p-3">
                    <div className="d-grid gap-3">
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2">
                                water_drop
                            </span>
                            <CustomDropdown
                                title={title || "Select action"}
                                options={Object.keys(plantActions)}
                                onSelect={setTitle}
                            />
                            <div className="d-flex m-3">
                                {dosage}
                            </div>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2">
                                checklist
                            </span>
                            <CustomDropdown
                                title={selectedToDo.join(", ") || "Select to-do"}
                                options={toDoList}
                                onSelect={(value) => setSelectedToDo(value)}
                            />
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2">
                                schedule
                            </span>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                defaultValue={new Date()}
                                valueFormat={{ dateStyle: "medium" }}
                            />
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2">
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
                        <div className="d-flex align-items-center mb-3">
                            <span className="material-icons-outlined text-muted me-2">
                                yard
                            </span>
                            <CustomDropdown
                                title={selectedLabels.length ? selectedLabels.join(", ") : "Select vegetables"}
                                options={Object.values(labelsClasses)} 
                                selectedOptions={selectedLabels || []} 
                                onSelect={setSelectedLabels}
                            />
                        </div>
                    </div>
                </div>
                <footer className="d-flex justify-content-end border-top p-3 mt-3">
                    <button type="submit" onClick={handleSubmit} className="btn btn-primary">
                        Save
                    </button>
                </footer>
            </form>
        </div>
    );
}
