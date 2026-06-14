import React from 'react';
import { useEventContext } from '../../context/EventContext';
import { useLayoutContext } from '../../context/LayoutContext';

export default function CreateEventButton() {
    const { setShowPlantModal } = useEventContext();
    const { setShowSidebar } = useLayoutContext();

    const handleClick = () => {
        setShowSidebar(false);
        setShowPlantModal(true);
    };

    return (
        <button
            onClick={handleClick}
            className="btn btn-danger d-flex align-items-center justify-content-center w-100"
        >
            <span>+ Create Plant</span>
        </button>
    );
}
