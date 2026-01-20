import React, { useContext } from 'react';
import plusImg from '../../assets/plus.png';
import CalendarContext from '../../context/CalendarContext';
import EventContext from '../../context/EventContext';
import dayjs from "dayjs";

export default function CreateEventButton() {
    const { setDaySelected } = useContext(CalendarContext);
    const { setShowEventModal, setDosage } = useContext(EventContext);
    return (
        <button
            onClick={() => {setDaySelected(dayjs()); setShowEventModal(true); setDosage("")}}
            className="btn btn-outline-primary d-flex align-items-center gap-2"
        >
            <img src={plusImg} alt="create_event" className="create-event-icon" />
            <span>Create</span>
        </button>
    );
}
