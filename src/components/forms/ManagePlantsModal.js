import React, { useState } from 'react';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VEGETABLE_ICONS } from '../../constants';
import { Modal, ConfirmModal, Icon } from '../common';

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
        } catch {
            showError('Failed to update plant. Please try again.');
        }
    };

    const handleDelete = async (plantId) => {
        try {
            await deletePlant(plantId);
            showSuccess('Plant deleted.');
            setDeleteConfirmId(null);
        } catch {
            showError('Failed to delete plant. Please try again.');
        }
    };

    const getDisplayName = (plant) => plant.variety ? `${plant.category} - ${plant.variety}` : plant.category;

    return (
        <>
            <Modal
                title="Manage Plants"
                icon="eco"
                onClose={onClose}
                scrollable
                footer={
                    <button type="button" className="btn btn-danger" onClick={onClose}>
                        Close
                    </button>
                }
            >
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
                                                    <Icon plantIcon={iconKey} style={{ fontSize: '1rem' }} />
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
                                            <Icon plantIcon={plant.icon || 'leaf'} style={{ fontSize: '1.25rem' }} />
                                            <span>{getDisplayName(plant)}</span>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary p-1"
                                                onClick={() => startEdit(plant)}
                                                title="Edit plant"
                                            >
                                                <Icon name="edit" style={{ fontSize: '1rem' }} />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger p-1"
                                                onClick={() => setDeleteConfirmId(plant.id)}
                                                title="Delete plant"
                                            >
                                                <Icon name="delete" style={{ fontSize: '1rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {deleteConfirmId && (
                <ConfirmModal
                    title="Delete Plant"
                    message="Are you sure? Events using this plant will keep the reference but the plant will no longer appear in lists."
                    confirmLabel="Delete"
                    variant="danger"
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                    isLoading={deletePlantMutation.isPending}
                    zIndex={1055}
                />
            )}
        </>
    );
}
