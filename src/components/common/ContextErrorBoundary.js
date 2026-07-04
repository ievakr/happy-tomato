import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Error boundary for context-related errors.
 * Offers Restart and Reset App Data actions.
 */
function ContextErrorBoundary({ onError, children }) {
  const { t } = useTranslation();
  return (
    <BaseErrorBoundary
      title={t('common.appContextError')}
      icon="storage"
      message={
        <>
          <p className="mb-2">{t('common.contextErrorIntro')}</p>
          <ul className="text-start mb-0">
            <li>{t('common.contextErrorReasonSync')}</li>
            <li>{t('common.contextErrorReasonFormat')}</li>
            <li>{t('common.contextErrorReasonProvider')}</li>
          </ul>
        </>
      }
      showRetry={false}
      showReload={false}
      extraActions={[
        {
          label: t('common.restartApp'),
          onClick: () => window.location.reload(),
          variant: 'danger',
          icon: 'refresh',
        },
        {
          label: t('common.resetAppData'),
          onClick: () => {
            localStorage.clear();
            window.location.reload();
          },
          variant: 'outline-secondary',
          icon: 'delete',
        },
      ]}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default ContextErrorBoundary;
