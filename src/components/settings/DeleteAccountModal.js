import React from 'react';
import { Modal } from 'react-bootstrap';

function DeleteAccountModal({
  show,
  onHide,
  deleting,
  error,
  password,
  onPasswordChange,
  isGoogleUser,
  onDelete,
  t,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton={!deleting}>
        <Modal.Title>{t('settings.deleteAccount')}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-grid gap-3">
        <div className="alert alert-danger mb-0">
          <strong>{t('settings.warning')}</strong> {t('settings.cannotUndo')}
          <ul className="mb-0 mt-2">
            <li>{t('settings.deleteBullet1')}</li>
            <li>{t('settings.deleteBullet2')}</li>
            <li>{t('settings.deleteBullet3')}</li>
          </ul>
        </div>

        {error && <div className="alert alert-danger mb-0">{error}</div>}

        {!isGoogleUser && (
          <div>
            <label htmlFor="confirm-password" className="form-label">
              {t('settings.enterPasswordConfirm')}
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-control"
              value={password}
              onChange={onPasswordChange}
              placeholder={t('settings.passwordPlaceholder')}
              disabled={deleting}
              autoComplete="current-password"
            />
          </div>
        )}

        {isGoogleUser && (
          <div className="alert alert-info mb-0">{t('settings.googleReauthNotice')}</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onHide}
          disabled={deleting}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onDelete}
          disabled={deleting || (!isGoogleUser && !password)}
        >
          {deleting ? t('settings.deleting') : t('settings.deleteMyAccount')}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default DeleteAccountModal;
