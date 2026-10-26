import React, { useEffect } from 'react';
import { Modal } from '../common';
import { eventActionText } from './EventItem';
import { useTranslation } from '../../i18n/LanguageContext';

export default function EventDeleteConfirmModal({
  show,
  event,
  onConfirm,
  onCancel,
  isLoading,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, isLoading, onCancel]);

  if (!show || !event) return null;

  return (
    <Modal className="delete-event-modal" size="sm" closeDisabled={isLoading}>
      <div className="delete-event-dialog">
        <div className="delete-event-icon" aria-hidden>
          <span className="material-icons-outlined">delete</span>
        </div>
        <h2 className="delete-event-title">{t('calendar.deleteEventTitle')}</h2>
        <p className="delete-event-message">
          {t('calendar.deleteEventConfirm', { name: eventActionText(event) })}
        </p>
        <button
          type="button"
          className="delete-event-confirm"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? t('common.loading') : t('common.delete')}
        </button>
        <button
          type="button"
          className="delete-event-cancel"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
