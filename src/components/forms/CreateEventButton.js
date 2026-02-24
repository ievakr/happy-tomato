import React, { useContext } from 'react';
import EventContext from '../../context/EventContext';

export default function CreateEventButton() {
    const { setShowPlantModal } = useContext(EventContext);
    return (
        <button
            onClick={() => setShowPlantModal(true)}
            className="btn btn-danger d-flex align-items-center justify-content-center"
        >
            <span>+ Create Plant</span>
        </button>
    );
}
