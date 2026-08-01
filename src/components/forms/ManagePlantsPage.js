import React, { useState } from 'react';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useEventContext } from '../../context/EventContext';
import { useLayoutContext } from '../../context/LayoutContext';
import { VEGETABLE_ICONS } from '../../constants';
import { ConfirmModal, Icon } from '../common';
import { useTranslation } from '../../i18n/LanguageContext';

export default function ManagePlantsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { plants, updatePlant, deletePlant, updatePlantMutation, deletePlantMutation } =
    usePlants(currentUser?.uid);
  const { showError, showSuccess } = useToast();
  const { setShowPlantModal } = useEventContext();
  const { setShowSidebar } = useLayoutContext();
  const [manageOpen, setManageOpen] = useState(false);
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
    } catch {
      showError(t('forms.plantDeleteFailed'));
    }
  };

  const handleCreatePlant = () => {
    setShowSidebar(false);
    setShowPlantModal(true);
  };

  const getDisplayName = (plant) =>
    plant.variety ? `${plant.category} - ${plant.variety}` : plant.category;

  return (
    <div className="h-100 overflow-auto">
      <div className="container-md py-4" style={{ maxWidth: '760px' }}>
        <h2 className="mb-3">{t('layout.plantManagement')}</h2>

        <button
          type="button"
          onClick={handleCreatePlant}
          className="btn btn-link text-decoration-none px-0 mb-3"
        >
          + {t('forms.createPlant')}
        </button>

        <div className="border rounded bg-white overflow-hidden">
          <button
            type="button"
            className="btn btn-light w-100 d-flex align-items-center justify-content-between text-start rounded-0 border-0 py-3 px-3"
            onClick={() => setManageOpen((open) => !open)}
            aria-expanded={manageOpen}
            aria-controls="manage-plants-panel"
          >
            <span className="fw-semibold">{t('forms.managePlants')}</span>
            <Icon
              name="expand_more"
              style={{
                fontSize: '1.35rem',
                transition: 'transform 0.2s ease',
                transform: manageOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {manageOpen && (
            <div id="manage-plants-panel" className="border-top px-3 py-3">
              {plants.length === 0 ? (
                <p className="text-muted mb-0">{t('forms.noPlantsYet')}</p>
              ) : (
                <div className="list-group list-group-flush">
                  {plants.map((plant) => (
                    <div key={plant.id} className="list-group-item px-0">
                      {editingId === plant.id ? (
                        <form onSubmit={handleSaveEdit} className="d-grid gap-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('forms.category')}
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('forms.varietyOptional')}
                            value={editVariety}
                            onChange={(e) => setEditVariety(e.target.value)}
                          />
                          <div className="d-flex flex-wrap gap-1">
                            {Object.keys(VEGETABLE_ICONS).map((iconKey) => (
                              <button
                                key={iconKey}
                                type="button"
                                className={`btn btn-sm p-1 ${
                                  editIcon === iconKey ? 'btn-primary' : 'btn-outline-secondary'
                                }`}
                                onClick={() => setEditIcon(iconKey)}
                                title={VEGETABLE_ICONS[iconKey]}
                              >
                                <Icon plantIcon={iconKey} style={{ fontSize: '1rem' }} />
                              </button>
                            ))}
                          </div>
                          <div className="d-flex gap-2 mt-2">
                            <button
                              type="submit"
                              className="btn btn-sm btn-success"
                              disabled={updatePlantMutation.isPending}
                            >
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={cancelEdit}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <Icon
                              plantIcon={plant.icon || 'leaf'}
                              style={{ fontSize: '1.25rem' }}
                            />
                            <span>{getDisplayName(plant)}</span>
                          </div>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary p-1"
                              onClick={() => startEdit(plant)}
                              title={t('forms.editPlant')}
                            >
                              <Icon name="edit" style={{ fontSize: '1rem' }} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={() => setDeleteConfirmId(plant.id)}
                              title={t('forms.deletePlant')}
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
            </div>
          )}
        </div>
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
