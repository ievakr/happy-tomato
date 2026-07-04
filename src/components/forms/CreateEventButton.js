import React from 'react';
import { useEventContext } from '../../context/EventContext';
import { useLayoutContext } from '../../context/LayoutContext';
import { useTranslation } from '../../i18n/LanguageContext';

export default function CreateEventButton() {
    const { t } = useTranslation();
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
            <span>+ {t('forms.createPlant')}</span>
        </button>
    );
}
