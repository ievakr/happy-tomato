import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEventContext } from '../../context/EventContext';
import { usePlants } from '../../hooks/usePlants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VEGETABLE_ICONS } from '../../constants';
import { Icon } from '../common';
import { useTranslation } from '../../i18n/LanguageContext';
import './CreatePlantModal.css';

export default function CreatePlantModal() {
  const { t } = useTranslation();
  const { setShowPlantModal } = useEventContext();
  const { currentUser } = useAuth();
  const { addPlant, addPlantMutation } = usePlants(currentUser?.uid);
  const { showError, showSuccess } = useToast();
  const [plantCategory, setPlantCategory] = useState('');
  const [plantVariety, setPlantVariety] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tomato');

  const handleClose = () => {
    if (addPlantMutation.isPending) return;
    setPlantCategory('');
    setPlantVariety('');
    setSelectedIcon('tomato');
    setShowPlantModal(false);
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !addPlantMutation.isPending) {
        setShowPlantModal(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [addPlantMutation.isPending, setShowPlantModal]);

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

  const isLoading = addPlantMutation.isPending;
  const canCreate = !!plantCategory.trim() && !isLoading;

  return createPortal(
    <div className="plant-sheet-backdrop" onClick={handleClose}>
      <form
        className="plant-sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="plant-sheet-grabber" aria-hidden="true" />
        <div className="plant-sheet-header">
          <h2 className="plant-sheet-title">{t('forms.createPlant')}</h2>
          <button
            type="button"
            className="plant-sheet-close"
            onClick={handleClose}
            aria-label={t('common.close')}
            disabled={isLoading}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="plant-sheet-body">
          <label className="plant-sheet-field">
            <span>{t('forms.category')}</span>
            <input
              type="text"
              value={plantCategory}
              onChange={(e) => setPlantCategory(e.target.value)}
              placeholder={t('forms.plantCategoryPlaceholder')}
              disabled={isLoading}
            />
          </label>
          <label className="plant-sheet-field">
            <span>{t('forms.varietyOptional')}</span>
            <input
              type="text"
              value={plantVariety}
              onChange={(e) => setPlantVariety(e.target.value)}
              placeholder={t('forms.plantVarietyPlaceholder')}
              disabled={isLoading}
            />
          </label>
          <div className="plant-sheet-field">
            <span>{t('forms.chooseAnIcon')}</span>
            <div className="plant-icon-grid">
              {Object.entries(VEGETABLE_ICONS).map(([iconKey, displayName]) => (
                <button
                  key={iconKey}
                  type="button"
                  className={`plant-icon-choice${selectedIcon === iconKey ? ' is-selected' : ''}`}
                  onClick={() => setSelectedIcon(iconKey)}
                  title={displayName}
                  aria-label={displayName}
                  aria-pressed={selectedIcon === iconKey}
                  disabled={isLoading}
                >
                  <Icon plantIcon={iconKey} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="plant-sheet-create" disabled={!canCreate}>
          {isLoading ? t('forms.creating') : t('forms.create')}
        </button>
      </form>
    </div>,
    document.body,
  );
}
