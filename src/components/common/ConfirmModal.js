import React from 'react';
import Modal from './Modal';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Confirmation dialog for destructive or important actions.
 * @param {Object} props
 * @param {string} props.title - Dialog title (e.g. "Delete Event")
 * @param {React.ReactNode} props.message - Message content
 * @param {string} [props.confirmLabel='Confirm'] - Confirm button text
 * @param {string} [props.cancelLabel='Cancel'] - Cancel button text
 * @param {'danger'|'success'|'primary'} [props.variant='danger'] - Confirm button style
 * @param {function} props.onConfirm - Confirm handler
 * @param {function} props.onCancel - Cancel handler
 * @param {boolean} [props.isLoading=false] - Show loading state on confirm button
 * @param {boolean} [props.confirmDisabled=false] - Disable confirm button
 * @param {number} [props.zIndex] - Custom z-index for nested modals
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  confirmDisabled = false,
  zIndex,
}) {
  const { t } = useTranslation();
  const confirmText = confirmLabel ?? t('common.confirm');
  const cancelText = cancelLabel ?? t('common.cancel');
  const variantClass = variant === 'danger' ? 'btn-danger' : variant === 'success' ? 'btn-success' : 'btn-primary';
  const disabled = isLoading || confirmDisabled;

  const footer = (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={onCancel}
        disabled={disabled}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={`btn ${variantClass}`}
        onClick={onConfirm}
        disabled={disabled}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </span>
            {confirmText}...
          </>
        ) : (
          confirmText
        )}
      </button>
    </>
  );

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={footer}
      size="sm"
      zIndex={zIndex}
      closeDisabled={disabled}
      titleTag="h6"
    >
      <div className="text-muted">{message}</div>
    </Modal>
  );
}
