import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

export default function ServiceWorkerUpdateBanner({ onReload, onDismiss }) {
  const { t } = useTranslation();
  return (
    <div
      className="alert alert-info mb-0 rounded-0 d-flex flex-column flex-sm-row align-items-center justify-content-center gap-2"
      role="status"
    >
      <span className="small">{t('common.updateAvailable')}</span>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onReload}
        >
          {t('common.refresh')}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onDismiss}
        >
          {t('common.later')}
        </button>
      </div>
    </div>
  );
}
