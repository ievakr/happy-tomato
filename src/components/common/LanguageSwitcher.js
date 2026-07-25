import React from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from './Icon';

/**
 * Segmented language control (e.g. English | Lietuvių). Used on the auth
 * screens and anywhere a compact language picker is needed.
 *
 * variant="flags" renders flag-only toggle buttons (used in the user menu).
 * variant="dropdown" renders a single button (flag + name) that opens a
 * dropdown menu listing every language with its flag.
 * variant="corner" renders a minimal text-based trigger (globe icon + language
 * code) that opens a plain-text list with a checkmark on the active language —
 * the compact site-header style (e.g. "EN ▾").
 *
 * abbreviateEnglish (dropdown variant only) shows "ENG" instead of the full
 * "English" label, for tight spaces.
 */
export default function LanguageSwitcher({ className = '', size = 'sm', variant = 'text', abbreviateEnglish = false }) {
  const { t, language, setLanguage, languages } = useTranslation();
  const btnSize = size === 'sm' ? 'btn-sm' : '';

  if (variant === 'corner') {
    const current = languages.find((lng) => lng.code === language) || languages[0];
    return (
      <div className={`dropdown ${className}`.trim()}>
        <button
          type="button"
          className="btn btn-sm btn-light dropdown-toggle d-flex align-items-center gap-1 language-corner-btn"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label={t('auth.language')}
        >
          <Icon name="language" style={{ fontSize: '16px' }} />
          <span>{current.code.toUpperCase()}</span>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          {languages.map((lng) => {
            const active = lng.code === language;
            return (
              <li key={lng.code}>
                <button
                  type="button"
                  className={`dropdown-item d-flex align-items-center gap-2 ${active ? 'active' : ''}`.trim()}
                  onClick={() => setLanguage(lng.code)}
                >
                  <Icon name="check" style={{ fontSize: '16px', visibility: active ? 'visible' : 'hidden' }} />
                  <span>{lng.nativeLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (variant === 'dropdown') {
    const current = languages.find((lng) => lng.code === language) || languages[0];
    const labelFor = (lng) => (abbreviateEnglish && lng.code === 'en' ? 'ENG' : lng.nativeLabel);
    return (
      <div className={`dropdown ${className}`.trim()}>
        <button
          type="button"
          className={`btn btn-outline-secondary ${btnSize} dropdown-toggle d-flex align-items-center gap-2`.trim()}
          data-bs-toggle="dropdown"
          aria-expanded="false"
          aria-label={t('auth.language')}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{current.flag}</span>
          <span>{labelFor(current)}</span>
        </button>
        <ul className="dropdown-menu">
          {languages.map((lng) => {
            const active = lng.code === language;
            return (
              <li key={lng.code}>
                <button
                  type="button"
                  className={`dropdown-item d-flex align-items-center gap-2 ${active ? 'active' : ''}`.trim()}
                  onClick={() => setLanguage(lng.code)}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{lng.flag}</span>
                  <span>{labelFor(lng)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

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
