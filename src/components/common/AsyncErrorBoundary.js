import React from 'react';
import BaseErrorBoundary from './BaseErrorBoundary';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Error boundary for async operations (Firebase, network).
 * Shows connection-focused messaging and retry.
 */
function AsyncErrorBoundary({ onError, children }) {
  const { t } = useTranslation();
  return (
    <BaseErrorBoundary
      title={t('common.connectionIssue')}
      icon="wifi"
      alertVariant="warning"
      retryLabel={t('common.tryAgain')}
      retryVariant="warning"
      reloadLabel={t('common.refresh')}
      showDetails={false}
      onError={onError}
    >
      {children}
    </BaseErrorBoundary>
  );
}

export default AsyncErrorBoundary;
