import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VEGETABLE_ICONS } from '../../constants';
import { Modal, Icon } from '../common';
import { useTranslation } from '../../i18n/LanguageContext';

export default function CreatePlantModal() {
    const { t } = useTranslation();
    const { setShowPlantModal } = useEventContext();
    const { currentUser } = useAuth();
    const { addPlant, addPlantMutation } = usePlants(currentUser?.uid);
    const { showError, showSuccess } = useToast();
    const [plantCategory, setPlantCategory] = useState('');
    const [plantVariety, setPlantVariety] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('tomato');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedCategory = plantCategory.trim();
        const trimmedVariety = plantVariety.trim();
        if (!trimmedCategory) {
            showError(t('forms.enterCategoryError'));
            return;
        }
        if (!currentUser) {
            showError(t('forms.signInToCreatePlants'));
            return;
        }
        try {
            await addPlant(trimmedCategory, trimmedVariety || '', selectedIcon);
            showSuccess(t('forms.plantCreated'));
            setPlantCategory('');
            setPlantVariety('');
            setSelectedIcon('tomato');
            setShowPlantModal(false);
        } catch {
            showError(t('forms.plantCreateFailed'));
        }
    };

    const handleClose = () => {
        setPlantCategory('');
        setPlantVariety('');
        setSelectedIcon('tomato');
        setShowPlantModal(false);
    };

    const isLoading = addPlantMutation.isPending;

    const footer = (
        <>
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={isLoading}
            >
                {t('common.cancel')}
            </button>
            <button
                type="submit"
                className="btn btn-success"
                disabled={isLoading || !plantCategory.trim()}
            >
                {isLoading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">{t('forms.creating')}</span>
                        </span>
                        {t('forms.creating')}
                    </>
                ) : (
                    t('forms.createPlant')
                )}
            </button>
        </>
    );

    return (
        <Modal
            title={t('forms.createPlant')}
            icon="yard"
            onClose={handleClose}
            form={{ onSubmit: handleSubmit }}
            footer={footer}
            closeDisabled={isLoading}
        >
            <div className="d-grid gap-3" style={{ minWidth: 0, maxWidth: '100%' }}>
                <div>
                    <label className="form-label d-flex align-items-center gap-2">
                        <Icon name="category" className="text-muted" style={{ fontSize: '1rem' }} />
                        {t('forms.plantCategory')}
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('forms.plantCategoryPlaceholder')}
                        value={plantCategory}
                        onChange={(e) => setPlantCategory(e.target.value)}
                        autoFocus
                    />
                </div>
                <div>
                    <label className="form-label d-flex align-items-center gap-2">
                        <Icon name="label" className="text-muted" style={{ fontSize: '1rem' }} />
                        {t('forms.plantVariety')}
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('forms.plantVarietyPlaceholder')}
                        value={plantVariety}
                        onChange={(e) => setPlantVariety(e.target.value)}
                    />
                </div>
                <div className="min-w-0 overflow-hidden">
                    <label className="form-label d-flex align-items-center gap-2">
                        <Icon name="eco" className="text-muted" style={{ fontSize: '1rem' }} />
                        {t('forms.chooseIcon')}
                    </label>
                    <div
                        className="d-flex flex-wrap gap-2 p-2 border rounded bg-light overflow-y-auto"
                        style={{ maxHeight: '104px', overflowX: 'hidden', minWidth: 0, maxWidth: '100%' }}
                    >
                        {Object.entries(VEGETABLE_ICONS).map(([iconKey, displayName]) => (
                            <button
                                key={iconKey}
                                type="button"
                                className={`btn btn-sm d-flex align-items-center justify-content-center rounded p-2 ${
                                    selectedIcon === iconKey
                                        ? 'btn-primary'
                                        : 'btn-outline-secondary'
                                }`}
                                onClick={() => setSelectedIcon(iconKey)}
                                title={displayName}
                                style={{ width: '40px', height: '40px' }}
                            >
                                <Icon
                                    plantIcon={iconKey}
                                    style={{ fontSize: '1.25rem' }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
