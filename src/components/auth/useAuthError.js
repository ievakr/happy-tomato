import { useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

/** Keeps an i18n key so the message follows the language that is active now. */
export function useAuthError() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);

  return {
    message: error ? t(error.key, error.params) : '',
    set(key, params) {
      setError(params ? { key, params } : { key });
    },
    clear() {
      setError(null);
    },
  };
}
