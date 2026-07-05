import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * Segmented language control (e.g. English | Lietuvių). Used on the auth
 * screens and anywhere a compact language picker is needed.
 *
 * variant="flags" renders flag-only toggle buttons (used in the user menu).
 */
export default function LanguageSwitcher({ className = '', size = 'sm', variant = 'text' }) {
  const { t, language, setLanguage, languages } = useTranslation();
  const btnSize = size === 'sm' ? 'btn-sm' : '';

  if (variant === 'flags') {
    return (
      <div
        className={`d-flex gap-2 ${className}`.trim()}
        role="group"
        aria-label={t('auth.language')}
      >
        {languages.map((lng) => {
          const active = lng.code === language;
          return (
            <button
              key={lng.code}
              type="button"
              className={`btn ${btnSize} ${active ? 'btn-success' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
              aria-pressed={active}
              aria-label={lng.label}
              title={lng.nativeLabel}
              onClick={() => setLanguage(lng.code)}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{lng.flag}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`btn-group ${btnSize} ${className}`.trim()}
      role="group"
      aria-label={t('auth.language')}
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
