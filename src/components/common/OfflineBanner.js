import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

export default function OfflineBanner() {
  const { t } = useTranslation();
  return (
    <div
      className="alert alert-warning mb-0 rounded-0 text-center small"
      role="status"
    >
      {t('common.offlineFeatures')}
    </div>
  );
}
