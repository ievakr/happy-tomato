import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Segmented language control (e.g. English | Lietuvių). Used on the auth
 * screens and anywhere a compact language picker is needed.
 */
export default function LanguageSwitcher({ className = '', size = 'sm' }) {
  const { language, setLanguage, languages } = useTranslation();
  const btnSize = size === 'sm' ? 'btn-sm' : '';

  return (
    <div
      className={`btn-group ${btnSize} ${className}`.trim()}
      role="group"
      aria-label="Language"
    >
      {languages.map((lng) => {
        const active = lng.code === language;
        return (
          <button
            key={lng.code}
            type="button"
            className={`btn ${active ? 'btn-success' : 'btn-outline-secondary'}`}
            aria-pressed={active}
            onClick={() => setLanguage(lng.code)}
          >
            {lng.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
