import React, { useState } from 'react';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useEventContext } from '../../context/EventContext';
import { useLayoutContext } from '../../context/LayoutContext';
import { VEGETABLE_ICONS } from '../../constants';
import { ConfirmModal, Icon } from '../common';
import { useTranslation } from '../../i18n/LanguageContext';
import './ManagePlantsPage.css';

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

  return (
    <div className="h-100 overflow-auto">
      <div className="plants-page">
        <button
          type="button"
          onClick={handleCreatePlant}
          className="btn btn-danger w-100 plant-create-btn"
        >
          {t('forms.createPlant')}
        </button>

        {plants.length === 0 ? (
          <p className="text-muted mb-0">{t('forms.noPlantsYet')}</p>
        ) : (
          <div className="plant-list">
            {plants.map((plant) =>
              editingId === plant.id ? (
                <form key={plant.id} onSubmit={handleSaveEdit} className="plant-editor">
                  <div>
                    <label className="plant-editor-label" htmlFor="edit-plant-name">
                      {t('forms.plantName')}
                    </label>
                    <input
                      id="edit-plant-name"
                      type="text"
                      className="form-control"
                      placeholder={t('forms.plantCategoryPlaceholder')}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="plant-editor-label" htmlFor="edit-plant-variety">
                      {t('forms.plantVariety')}
                    </label>
                    <input
                      id="edit-plant-variety"
                      type="text"
                      className="form-control"
                      placeholder={t('forms.plantVarietyPlaceholder')}
                      value={editVariety}
                      onChange={(e) => setEditVariety(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="plant-editor-label">{t('forms.chooseIcon')}</span>
                    <div className="plant-icon-picker">
                      {Object.keys(VEGETABLE_ICONS).map((iconKey) => (
                        <button
                          key={iconKey}
                          type="button"
                          className={`plant-icon-option${editIcon === iconKey ? ' is-selected' : ''}`}
                          onClick={() => setEditIcon(iconKey)}
                          title={VEGETABLE_ICONS[iconKey]}
                          aria-pressed={editIcon === iconKey}
                        >
                          <Icon plantIcon={iconKey} style={{ fontSize: '1.1rem' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="plant-editor-actions">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelEdit}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={updatePlantMutation.isPending}
                    >
                      {t('common.save')}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-link text-danger plant-editor-delete"
                    onClick={() => setDeleteConfirmId(plant.id)}
                  >
                    <Icon name="delete" className="plant-editor-delete-icon" />
                    {t('forms.deletePlant')}
                  </button>
                </form>
              ) : (
                <button
                  key={plant.id}
                  type="button"
                  className="plant-row"
                  onClick={() => startEdit(plant)}
                >
                  <Icon
                    plantIcon={plant.icon || 'leaf'}
                    className="plant-row-icon"
                  />
                  <span className="plant-row-text">
                    <span className="plant-row-name">{plant.category}</span>
                    {plant.variety ? (
                      <span className="plant-row-variety">{plant.variety}</span>
                    ) : null}
                  </span>
                  <Icon name="chevron_right" className="plant-row-chevron" />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <ConfirmModal
          title={t('forms.deletePlant')}
          message={t('forms.deletePlantConfirm')}
          confirmLabel={t('common.delete')}
          variant="danger"
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          isLoading={deletePlantMutation.isPending}
          zIndex={1055}
        />
      )}
    </div>
  );
}
