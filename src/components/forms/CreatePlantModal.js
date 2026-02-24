import React, { useContext, useState } from 'react';
import EventContext from '../../context/EventContext';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VEGETABLE_ICONS } from '../../constants';

export default function CreatePlantModal() {
    const { setShowPlantModal } = useContext(EventContext);
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
            showError('Please enter a plant category.');
            return;
        }
        if (!currentUser) {
            showError('Please sign in to create plants.');
            return;
        }
        try {
            await addPlant(trimmedCategory, trimmedVariety || '', selectedIcon);
            showSuccess('Plant created successfully!');
            setPlantCategory('');
            setPlantVariety('');
            setSelectedIcon('tomato');
            setShowPlantModal(false);
        } catch (error) {
            console.error('Failed to create plant:', error);
            showError('Failed to create plant. Please try again.');
        }
    };

    const handleClose = () => {
        setPlantCategory('');
        setPlantVariety('');
        setSelectedIcon('tomato');
        setShowPlantModal(false);
    };

    const isLoading = addPlantMutation.isPending;

    return (
        <>
            <div className="modal fade show d-block" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                    <span className="material-icons-outlined text-muted">
                                        yard
                                    </span>
                                    <h5 className="modal-title">Create Plant</h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleClose}
                                    aria-label="Close"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="modal-body">
                                <div className="d-grid gap-3">
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                category
                                            </span>
                                            Plant Category
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Tomatoes"
                                            value={plantCategory}
                                            onChange={(e) => setPlantCategory(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                label
                                            </span>
                                            Plant Variety
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Cherry"
                                            value={plantVariety}
                                            onChange={(e) => setPlantVariety(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label d-flex align-items-center gap-2">
                                            <span className="material-icons-outlined text-muted" style={{ fontSize: '1rem' }}>
                                                eco
                                            </span>
                                            Choose icon
                                        </label>
                                        <div 
                                            className="d-flex flex-wrap gap-2 p-2 border rounded bg-light"
                                            style={{ minHeight: '80px' }}
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
                                                    style={{ width: '44px', height: '44px' }}
                                                >
                                                    <i 
                                                        className={`fi fi-rr-${iconKey}`}
                                                        style={{ fontSize: '1.25rem' }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-danger"
                                    disabled={isLoading || !plantCategory.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Creating...</span>
                                            </span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Plant'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}
