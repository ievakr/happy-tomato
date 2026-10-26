import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEventContext } from '../../context/EventContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Icon from '../common/Icon';

export default function CategoryFilter() {
  const { t } = useTranslation();
  const { labels, setLabels } = useEventContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedCount = labels.filter((lbl) => lbl.checked).length;
  const allSelected = labels.length > 0 && selectedCount === labels.length;

  const triggerLabel =
    labels.length === 0 || allSelected
      ? t('calendar.allCategories')
      : t(
        selectedCount === 1
          ? 'calendar.categoriesSelectedSingular'
          : 'calendar.categoriesSelectedPlural',
        { count: selectedCount },
      );

  const visibleLabels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return labels;
    return labels.filter((lbl) => (lbl.displayName || lbl.label).toLowerCase().includes(q));
  }, [labels, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleLabel = (label) => {
    setLabels((prev) =>
      prev.map((lbl) => (lbl.label === label ? { ...lbl, checked: !lbl.checked } : lbl)),
    );
  };

  const selectAll = () => {
    setLabels((prev) => prev.map((lbl) => ({ ...lbl, checked: true })));
  };

  const clearAll = () => {
    setLabels((prev) => prev.map((lbl) => ({ ...lbl, checked: false })));
  };

  return (
    <>
      <div className="category-filter-bar">
        <button
          type="button"
          className="category-filter-trigger"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Icon name="filter_list" className="category-filter-trigger-icon" />
          <span className="category-filter-trigger-label">{triggerLabel}</span>
          <Icon name="expand_more" className="category-filter-trigger-chevron" />
        </button>
      </div>

      {open &&
        createPortal(
          <div className="category-filter-backdrop" onClick={close}>
            <div
              className="category-filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-filter-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="category-filter-grabber" aria-hidden="true" />
              <div className="category-filter-header">
                <h2 id="category-filter-title" className="category-filter-title">
                  {t('calendar.filterTitle')}
                </h2>
                <button
                  type="button"
                  className="category-filter-close"
                  onClick={close}
                  aria-label={t('common.close')}
                >
                  <Icon name="close" />
                </button>
              </div>
              <label className="category-filter-search-wrap">
                <Icon name="search" className="category-filter-search-icon" />
                <input
                  type="search"
                  className="category-filter-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('calendar.searchCategories')}
                  aria-label={t('calendar.searchCategories')}
                />
              </label>
              <div className="category-filter-bulk">
                <button type="button" className="category-filter-bulk-btn" onClick={selectAll}>
                  {t('calendar.selectAllCategories')}
                </button>
                <button type="button" className="category-filter-bulk-btn" onClick={clearAll}>
                  {t('calendar.clear')}
                </button>
              </div>
              <ul className="category-filter-list">
                {visibleLabels.map((lbl) => {
                  const name = lbl.displayName || lbl.label;
                  return (
                    <li key={lbl.label}>
                      <label className="category-filter-option">
                        <input
                          type="checkbox"
                          className="category-filter-check"
                          checked={!!lbl.checked}
                          onChange={() => toggleLabel(lbl.label)}
                        />
                        <span>{name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="category-filter-done" onClick={close}>
                {t('calendar.filterDone')}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
