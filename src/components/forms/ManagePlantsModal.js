import React, { useState } from 'react';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VEGETABLE_ICONS } from '../../constants';

export default function ManagePlantsModal({ onClose }) {
    const { currentUser } = useAuth();
    const { plants, updatePlant, deletePlant, updatePlantMutation, deletePlantMutation } = usePlants(currentUser?.uid);
    const { showError, showSuccess } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [editCategory, setEditCategory] = useState('');
    const [editVariety, setEditVariety] = useState('');
    const [editIcon, setEditIcon] = useState('tomato');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const startEdit = (plant) => {
        setEditingId(plant.id);
        setEditCategory(plant.category || '');
        setEditVariety(plant.variety || '');
        setEditIcon(plant.icon || 'tomato');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editCategory.trim()) {
            showError('Please enter a plant category.');
            return;
        }
        try {
            await updatePlant(editingId, editCategory.trim(), editVariety.trim(), editIcon);
            showSuccess('Plant updated successfully!');
            setEditingId(null);
        } catch (error) {
            console.error('Failed to update plant:', error);
            showError('Failed to update plant. Please try again.');
        }
    };

    const handleDelete = async (plantId) => {
        try {
            await deletePlant(plantId);
            showSuccess('Plant deleted.');
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Failed to delete plant:', error);
            showError('Failed to delete plant. Please try again.');
        }
    };

    const getDisplayName = (plant) => plant.variety ? `${plant.category} - ${plant.variety}` : plant.category;

    return (
        <>
            <div className="modal fade show d-block" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                <span className="material-icons-outlined text-muted">eco</span>
                                <h5 className="modal-title">Manage Plants</h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                aria-label="Close"
                            />
                        </div>
                        <div className="modal-body">
                            {plants.length === 0 ? (
                                <p className="text-muted mb-0">No plants yet. Create plants using the "+ Create Plant" button.</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {plants.map((plant) => (
                                        <div key={plant.id} className="list-group-item px-0">
                                            {editingId === plant.id ? (
                                                <form onSubmit={handleSaveEdit} className="d-grid gap-2">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Category"
                                                        value={editCategory}
                                                        onChange={(e) => setEditCategory(e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Variety (optional)"
                                                        value={editVariety}
                                                        onChange={(e) => setEditVariety(e.target.value)}
                                                    />
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {Object.keys(VEGETABLE_ICONS).map((iconKey) => (
                                                            <button
                                                                key={iconKey}
                                                                type="button"
                                                                className={`btn btn-sm p-1 ${editIcon === iconKey ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                onClick={() => setEditIcon(iconKey)}
                                                                title={VEGETABLE_ICONS[iconKey]}
                                                            >
                                                                <i className={`fi fi-rr-${iconKey}`} style={{ fontSize: '1rem' }} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="d-flex gap-2 mt-2">
                                                        <button type="submit" className="btn btn-sm btn-success" disabled={updatePlantMutation.isPending}>
                                                            Save
                                                        </button>
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className={`fi fi-rr-${plant.icon || 'leaf'}`} style={{ fontSize: '1.25rem' }} />
                                                        <span>{getDisplayName(plant)}</span>
                                                    </div>
                                                    <div className="d-flex gap-1">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary p-1"
                                                            onClick={() => startEdit(plant)}
                                                            title="Edit plant"
                                                        >
                                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger p-1"
                                                            onClick={() => setDeleteConfirmId(plant.id)}
                                                            title="Delete plant"
                                                        >
                                                            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />

            {/* Delete confirmation */}
            {deleteConfirmId && (
                <>
                    <div className="modal fade show d-block" role="dialog" style={{ zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered modal-sm">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h6 className="modal-title">Delete Plant</h6>
                                    <button type="button" className="btn-close" onClick={() => setDeleteConfirmId(null)} aria-label="Close" />
                                </div>
                                <div className="modal-body">
                                    <p className="mb-0 text-muted">
                                        Are you sure? Events using this plant will keep the reference but the plant will no longer appear in lists.
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteConfirmId(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(deleteConfirmId)}
                                        disabled={deletePlantMutation.isPending}
                                    >
                                        {deletePlantMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} />
                </>
            )}
        </>
    );
}
