import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useTranslation } from '../../i18n/LanguageContext';
import { GUIDE_PROBLEMS } from '../../data/vegetableGuide';
import VegetableGuideProblemDetail from './VegetableGuideProblemDetail';
import Icon from '../common/Icon';
import './VegetableGuideView.css';
import './DiseaseGuideView.css';

const CATEGORY_ORDER = ['disease', 'pest', 'disorder'];

const CATEGORY_ICON = {
  disease: 'coronavirus',
  pest: 'bug_report',
  disorder: 'healing',
};

function sortByName(a, b) {
  return a.name.localeCompare(b.name);
}

export default function DiseaseGuideView() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const searchInputRef = useRef(null);
  const detailScrollRef = useRef(null);
  const listScrollRef = useRef(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const selectProblem = (id) => {
    searchInputRef.current?.blur();
    setSelectedId(id);
  };

  useEffect(() => {
    const el = detailScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [selectedId]);

  useEffect(() => {
    if (selectedId != null) return;
    const el = listScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    el.closest('section')?.scrollTo?.(0, 0);
  }, [selectedId]);

  const problems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDE_PROBLEMS.filter((problem) => {
      if (categoryFilter && problem.category !== categoryFilter) return false;
      if (!q) return true;
      return problem.name.toLowerCase().includes(q);
    }).sort(sortByName);
  }, [query, categoryFilter]);

  const listBody = (
    <div className="guide-list-page">
      <label className="guide-search">
        <Icon name="search" className="guide-search-icon" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder={t('guide.diseaseSearchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('guide.diseaseSearchPlaceholder')}
        />
      </label>
      <div className="disease-filters">
        {CATEGORY_ORDER.map((category) => {
          const selected = categoryFilter === category;
          return (
            <button
              key={category}
              type="button"
              className={`disease-filter${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => setCategoryFilter(selected ? null : category)}
            >
              {t(`guide.problemCategory.${category}`)}
            </button>
          );
        })}
      </div>
      {problems.length === 0 ? (
        <p className="guide-empty">{t('guide.diseaseNoMatch', { query })}</p>
      ) : (
        <div className="guide-card">
          {problems.map((problem) => (
            <button
              key={problem.id}
              type="button"
              className="guide-row"
              onClick={() => selectProblem(problem.id)}
              aria-pressed={!isMobile && problem.id === selectedId}
            >
              <Icon name={CATEGORY_ICON[problem.category] || 'bug_report'} className="guide-row-icon" />
              <span className="guide-row-name">{problem.name}</span>
              <span className="disease-row-category">
                {t(`guide.problemCategory.${problem.category}`)}
              </span>
              <Icon name="chevron_right" className="guide-row-chevron" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const detailContent = selectedId ? (
    <VegetableGuideProblemDetail problemId={selectedId} onBack={() => setSelectedId(null)} />
  ) : (
    <p>{t('guide.diseaseSelectPrompt')}</p>
  );

  if (isMobile) {
    if (selectedId) {
      return (
        <div className="d-flex flex-column h-100 w-100 vegetable-guide guide-detail-shell">
          <button type="button" className="guide-back" onClick={() => setSelectedId(null)}>
            <Icon name="chevron_left" />
            {t('common.back')}
          </button>
          <div
            ref={detailScrollRef}
            className="flex-grow-1 overflow-auto guide-detail-scroll"
            style={{ minHeight: 0 }}
          >
            <VegetableGuideProblemDetail problemId={selectedId} />
          </div>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column h-100 w-100 vegetable-guide guide-list-shell">
        <div
          ref={listScrollRef}
          className="flex-grow-1 overflow-auto"
          style={{ minHeight: 0 }}
        >
          {listBody}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex h-100 w-100 vegetable-guide guide-list-shell">
      <div
        className="d-flex flex-column h-100 guide-list-shell"
        style={{ width: '420px', flexShrink: 0 }}
      >
        <div
          ref={listScrollRef}
          className="flex-grow-1 overflow-auto"
          style={{ minHeight: 0 }}
        >
          {listBody}
        </div>
      </div>
      <div
        ref={detailScrollRef}
        className="flex-grow-1 overflow-auto guide-detail-scroll"
        style={{ minHeight: 0 }}
      >
        <div style={{ maxWidth: '720px' }}>{detailContent}</div>
      </div>
    </div>
  );
}
