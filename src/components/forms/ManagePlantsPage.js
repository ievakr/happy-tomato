import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useEventContext } from '../../context/EventContext';
import { useLayoutContext } from '../../context/LayoutContext';
import { VEGETABLE_ICONS } from '../../constants';
import { Icon } from '../common';
import { useTranslation } from '../../i18n/LanguageContext';
import './ManagePlantsPage.css';

function DeletePlantSheet({ name, onConfirm, onCancel, isLoading }) {
  const { t } = useTranslation();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [isLoading, onCancel]);

  return createPortal(
    <div className="plant-delete-backdrop" onClick={isLoading ? undefined : onCancel}>
      <div
        className="plant-delete-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-plant-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="plant-delete-grabber" aria-hidden="true" />
        <div className="plant-delete-header">
          <h2 id="delete-plant-title">{t('forms.deletePlantTitle', { name })}</h2>
          <button
            type="button"
            className="plant-delete-close"
            onClick={onCancel}
            aria-label={t('common.close')}
            disabled={isLoading}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="plant-delete-message">{t('forms.deletePlantConfirm')}</p>
        <button
          type="button"
          className="plant-delete-confirm"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {t('common.delete')}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function ManagePlantsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { plants, updatePlant, deletePlant, updatePlantMutation, deletePlantMutation } =
    usePlants(currentUser?.uid);
  const { showError, showSuccess } = useToast();
  const { setShowPlantModal } = useEventContext();
  const { setShowSidebar } = useLayoutContext();
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
      showError(t('forms.enterCategoryError'));
      return;
    }
    try {
      await updatePlant(editingId, editCategory.trim(), editVariety.trim(), editIcon);
      showSuccess(t('forms.plantUpdated'));
      setEditingId(null);
    } catch {
      showError(t('forms.plantUpdateFailed'));
    }
  };

  const handleDelete = async (plantId) => {
    try {
      await deletePlant(plantId);
      showSuccess(t('forms.plantDeleted'));
      setDeleteConfirmId(null);
      setEditingId(null);
    } catch {
      showError(t('forms.plantDeleteFailed'));
    }
  };

  const handleCreatePlant = () => {
    setShowSidebar(false);
    setShowPlantModal(true);
  };

  const closeDeleteConfirm = useCallback(() => {
    if (deletePlantMutation.isPending) return;
    setDeleteConfirmId(null);
  }, [deletePlantMutation.isPending]);

  const plantToDelete = plants.find((plant) => plant.id === deleteConfirmId);

  return (
    <div className="plants-page-scroll h-100 overflow-auto">
      <div className="plants-page">
        <button
          type="button"
          onClick={handleCreatePlant}
          className="plant-create-btn"
        >
          <Icon name="add" className="plant-create-icon" />
          {t('forms.createPlant')}
        </button>

        {plants.length === 0 ? (
          <p className="text-muted mb-0">{t('forms.noPlantsYet')}</p>
        ) : (
          <div className="plant-list">
            {plants.map((plant) =>
              editingId === plant.id ? (
                <form key={plant.id} onSubmit={handleSaveEdit} className="plant-card plant-card--editing">
                  <div className="plant-card-summary">
                    <span className="plant-card-icon" aria-hidden>
                      <Icon plantIcon={editIcon || 'leaf'} />
                    </span>
                    <span className="plant-card-text">
                      <span className="plant-card-name">{editCategory || plant.category}</span>
                      {editVariety ? (
                        <span className="plant-card-variety">{editVariety}</span>
                      ) : null}
                    </span>
                    <span className="plant-card-actions">
                      <button
                        type="button"
                        className="plant-card-action"
                        onClick={cancelEdit}
                        aria-label={t('forms.editPlant')}
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="plant-card-action plant-card-action--delete"
                        onClick={() => setDeleteConfirmId(plant.id)}
                        aria-label={t('forms.deletePlant')}
                      >
                        <Icon name="delete" />
                      </button>
                    </span>
                  </div>
                  <div className="plant-editor-body">
                    <label className="plant-editor-field" htmlFor="edit-plant-name">
                      <span>{t('forms.category')}</span>
                      <input
                        id="edit-plant-name"
                        type="text"
                        placeholder={t('forms.plantCategoryPlaceholder')}
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                      />
                    </label>
                    <label className="plant-editor-field" htmlFor="edit-plant-variety">
                      <span>{t('forms.varietyOptional')}</span>
                      <input
                        id="edit-plant-variety"
                        type="text"
                        placeholder={t('forms.plantVarietyPlaceholder')}
                        value={editVariety}
                        onChange={(e) => setEditVariety(e.target.value)}
                      />
                    </label>
                    <div className="plant-icon-grid">
                      {Object.entries(VEGETABLE_ICONS).map(([iconKey, displayName]) => (
                        <button
                          key={iconKey}
                          type="button"
                          className={`plant-icon-choice${editIcon === iconKey ? ' is-selected' : ''}`}
                          onClick={() => setEditIcon(iconKey)}
                          title={displayName}
                          aria-label={displayName}
                          aria-pressed={editIcon === iconKey}
                        >
                          <Icon plantIcon={iconKey} />
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="plant-editor-save"
                      disabled={updatePlantMutation.isPending || !editCategory.trim()}
                    >
                      {t('common.save')}
                    </button>
                  </div>
                </form>
              ) : (
                <div key={plant.id} className="plant-card">
                  <span className="plant-card-icon" aria-hidden>
                    <Icon plantIcon={plant.icon || 'leaf'} />
                  </span>
                  <span className="plant-card-text">
                    <span className="plant-card-name">{plant.category}</span>
                    {plant.variety ? (
                      <span className="plant-card-variety">{plant.variety}</span>
                    ) : null}
                  </span>
                  <span className="plant-card-actions">
                    <button
                      type="button"
                      className="plant-card-action"
                      onClick={() => startEdit(plant)}
                      aria-label={t('forms.editPlant')}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      className="plant-card-action plant-card-action--delete"
                      onClick={() => setDeleteConfirmId(plant.id)}
                      aria-label={t('forms.deletePlant')}
                    >
                      <Icon name="delete" />
                    </button>
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {plantToDelete && (
        <DeletePlantSheet
          name={plantToDelete.category}
          onConfirm={() => handleDelete(plantToDelete.id)}
          onCancel={closeDeleteConfirm}
          isLoading={deletePlantMutation.isPending}
        />
      )}
    </div>
  );
}
