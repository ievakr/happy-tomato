import React from 'react';
import { useEventContext } from '../../context/EventContext';

export default function CreateEventButton() {
    const { setShowPlantModal } = useEventContext();
    return (
        <button
            onClick={() => setShowPlantModal(true)}
            className="btn btn-danger d-flex align-items-center justify-content-center w-100"
        >
            <span>+ Create Plant</span>
        </button>
    );
}
