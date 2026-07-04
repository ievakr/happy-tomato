import React from 'react';
import { ConfirmModal } from '../common';
import { eventTodoOrTitleText } from './EventItem';
import { useTranslation } from '../../i18n/LanguageContext';

export default function EventDeleteConfirmModal({
  show,
  event,
  onConfirm,
  onCancel,
  isLoading,
}) {
  const { t } = useTranslation();
  if (!show || !event) return null;

  return (
    <ConfirmModal
      title={t('calendar.deleteEventTitle')}
      message={
        <>
          <p className="mb-2">{t('calendar.deleteEventConfirm', { name: eventTodoOrTitleText(event) })}</p>
          <p className="mb-0 small">{t('calendar.deleteCannotUndo')}</p>
        </>
      }
      confirmLabel={t('common.delete')}
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}
