import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useTranslation } from '../../i18n/LanguageContext';
import { GUIDE_PROBLEMS } from '../../data/vegetableGuide';
import VegetableGuideProblemDetail from './VegetableGuideProblemDetail';
import Icon from '../common/Icon';

const CATEGORY_ORDER = ['disease', 'pest', 'disorder'];

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

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? GUIDE_PROBLEMS.filter((p) => p.name.toLowerCase().includes(q))
      : GUIDE_PROBLEMS;

    return CATEGORY_ORDER.map((category) => ({
      category,
      label: t(`guide.problemCategory.${category}`),
      items: matched.filter((p) => p.category === category).sort(sortByName),
    })).filter((group) => group.items.length > 0);
  }, [query, t]);

  const searchBox = (
    <div className="p-3 border-bottom bg-white">
      <div className="input-group">
        <span className="input-group-text bg-white">
          <Icon name="search" className="text-secondary" style={{ fontSize: '1rem' }} />
        </span>
        <input
          ref={searchInputRef}
          type="search"
          className="form-control"
          placeholder={t('guide.diseaseSearchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('guide.diseaseSearchPlaceholder')}
        />
      </div>
    </div>
  );

  const renderProblemButton = (problem) => {
    const active = !isMobile && problem.id === selectedId;
    return (
      <li key={problem.id} className="list-group-item p-0">
        <button
          type="button"
          className={`btn w-100 text-start d-flex align-items-center gap-3 py-2 px-3 rounded-0 ${
            active ? 'bg-light fw-semibold' : ''
          }`}
          onClick={() => selectProblem(problem.id)}
          aria-pressed={active}
        >
          <Icon
            name={problem.icon || 'bug_report'}
            plantIcon={problem.plantIcon}
            className="text-secondary"
            style={{ fontSize: '1.35rem' }}
          />
          <span className="flex-grow-1">{problem.name}</span>
          {isMobile ? (
            <Icon name="chevron_right" className="text-secondary" style={{ fontSize: '1.25rem' }} />
          ) : null}
        </button>
      </li>
    );
  };

  const list = (
    <div>
      {groups.length === 0 ? (
        <p className="px-3 text-muted small">{t('guide.diseaseNoMatch', { query })}</p>
      ) : (
        groups.map((group) => (
          <div key={group.category} className="disease-guide-category mb-2">
            <div
              className="px-3 py-2 small text-uppercase text-secondary fw-bold"
              style={{ letterSpacing: '0.03em' }}
            >
              {group.label}
            </div>
            <ul className="list-group list-group-flush">{group.items.map(renderProblemButton)}</ul>
          </div>
        ))
      )}
    </div>
  );

  const intro = (
    <div className="px-3 pt-3 pb-2">
      <p className="small mb-0">{t('guide.diseaseIntro')}</p>
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
        <div className="d-flex flex-column h-100 w-100 bg-white vegetable-guide">
          <div className="d-flex align-items-center gap-2 p-2 border-bottom flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSelectedId(null)}
            >
              <Icon name="chevron_left" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }} />
              {t('guide.allDiseases')}
            </button>
          </div>
          <div
            ref={detailScrollRef}
            className="flex-grow-1 overflow-auto p-3"
            style={{ minHeight: 0 }}
          >
            <VegetableGuideProblemDetail problemId={selectedId} />
          </div>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column h-100 w-100 bg-white vegetable-guide">
        {searchBox}
        <div
          ref={listScrollRef}
          className="flex-grow-1 overflow-auto"
          style={{ minHeight: 0 }}
        >
          {intro}
          {list}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex h-100 w-100 bg-white vegetable-guide">
      <div
        className="d-flex flex-column border-end h-100"
        style={{ width: '320px', flexShrink: 0 }}
      >
        {searchBox}
        <div
          ref={listScrollRef}
          className="flex-grow-1 overflow-auto"
          style={{ minHeight: 0 }}
        >
          {intro}
          {list}
        </div>
      </div>
      <div
        ref={detailScrollRef}
        className="flex-grow-1 overflow-auto p-4"
        style={{ minHeight: 0 }}
      >
        <div style={{ maxWidth: '720px' }}>{detailContent}</div>
      </div>
    </div>
  );
}
