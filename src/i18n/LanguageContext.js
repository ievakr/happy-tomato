import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/lt';

import common from './dictionaries/common';
import auth from './dictionaries/auth';
import layout from './dictionaries/layout';
import calendar from './dictionaries/calendar';
import forms from './dictionaries/forms';
import settings from './dictionaries/settings';
import guide from './dictionaries/guide';
import messages from './dictionaries/messages';

/**
 * Lightweight, dependency-free i18n.
 *
 * Each dictionary file default-exports `{ en: {...}, lt: {...} }` with flat,
 * namespaced keys (e.g. 'auth.signIn'). We merge them into per-language lookup
 * tables. `t('auth.signIn')` returns the current language string, falling back
 * to English, then to the key itself so nothing ever renders blank.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'lt', label: 'Lithuanian', nativeLabel: 'Lietuvių', flag: '🇱🇹' },
];

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
const STORAGE_KEY = 'happy-tomato-language';
const DEFAULT_LANGUAGE = 'en';

const DICTIONARIES = [common, auth, layout, calendar, forms, settings, guide, messages];

const RESOURCES = {
  en: Object.assign({}, ...DICTIONARIES.map((d) => d.en || {})),
  lt: Object.assign({}, ...DICTIONARIES.map((d) => d.lt || {})),
};

/** Fill {placeholders} in a string from a params object. */
function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

/** Detect a sensible starting language from the device (Lithuanian → 'lt'). */
export function detectDeviceLanguage() {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const candidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  for (const c of candidates) {
    const code = String(c).toLowerCase().split('-')[0];
    if (LANGUAGE_CODES.includes(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGE_CODES.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable (private mode, etc.)
  }
  return null;
}

/** The language to use before/at first render. */
function getInitialLanguage() {
  return readStoredLanguage() || detectDeviceLanguage();
}

// Apply the dayjs locale at module load, before React renders anything, so the
// very first paint already formats dates in the right language. The `import
// 'dayjs/locale/lt'` above only REGISTERS the locale; this line SELECTS it.
dayjs.locale(getInitialLanguage());

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  // Set the dayjs locale SYNCHRONOUSLY during render (not in an effect) so that
  // children render dates/day-names with the correct locale in the same pass.
  // If it were only in an effect, text (via t()) would switch immediately while
  // dayjs-formatted dates lagged a render behind, looking inconsistent.
  if (dayjs.locale() !== language) {
    dayjs.locale(language);
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore write failures
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
    }
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (LANGUAGE_CODES.includes(code)) {
      setLanguageState(code);
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const table = RESOURCES[language] || RESOURCES.en;
      const value = table[key] ?? RESOURCES.en[key] ?? key;
      return interpolate(value, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}

export default LanguageContext;
