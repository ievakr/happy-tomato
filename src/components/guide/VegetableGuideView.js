import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  vegetableGuide,
  GENERAL_GROWING_TIPS,
  GENERAL_GROWING_TIPS_ID,
} from '../../data/vegetableGuide';
import VegetableGuideDetail, { DIFFICULTY_CLASS } from './VegetableGuideDetail';
import VegetableGuideProblemDetail from './VegetableGuideProblemDetail';
import Icon from '../common/Icon';

export default function VegetableGuideView() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const searchInputRef = useRef(null);
  const detailScrollRef = useRef(null);
  const listScrollRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  const selectVegetable = (id) => {
    searchInputRef.current?.blur();
    setSelectedProblemId(null);
    setSelectedId(id);
  };

  useEffect(() => {
    const el = detailScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [selectedId, selectedProblemId]);

  useEffect(() => {
    if (selectedId != null || selectedProblemId != null) return;
    const el = listScrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    el.closest('section')?.scrollTo?.(0, 0);
  }, [selectedId, selectedProblemId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vegetableGuide;
    return vegetableGuide.filter((v) => v.name.toLowerCase().includes(q));
  }, [query]);

  const showGeneralTips = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const label = 'general growing tips';
    return label.includes(q) || GENERAL_GROWING_TIPS.name.toLowerCase().includes(q);
  }, [query]);

  const selected = useMemo(() => {
    if (selectedId === GENERAL_GROWING_TIPS_ID) return GENERAL_GROWING_TIPS;
    return vegetableGuide.find((v) => v.id === selectedId) || null;
  }, [selectedId]);

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
          placeholder={t('guide.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('guide.searchPlaceholder')}
        />
      </div>
    </div>
  );

  const listItems = [
    ...filtered.map((veg) => {
      const active = !isMobile && veg.id === selectedId && !selectedProblemId;
      return (
        <li key={veg.id} className="list-group-item p-0">
          <button
            type="button"
            className={`btn w-100 text-start d-flex align-items-center gap-3 py-2 px-3 rounded-0 ${
              active ? 'bg-light fw-semibold' : ''
            }`}
            onClick={() => selectVegetable(veg.id)}
            aria-pressed={active}
          >
            <Icon plantIcon={veg.icon} style={{ fontSize: '1.35rem' }} />
            <span className="flex-grow-1">{veg.name}</span>
            <span className={`small ${DIFFICULTY_CLASS[veg.difficulty] || 'text-secondary'}`}>
              {t(`guide.difficulty.${veg.difficulty}`)}
            </span>
            {isMobile ? (
              <Icon name="chevron_right" className="text-secondary" style={{ fontSize: '1.25rem' }} />
            ) : null}
          </button>
        </li>
      );
    }),
  ];

  if (showGeneralTips) {
    const active = !isMobile && selectedId === GENERAL_GROWING_TIPS_ID;
    listItems.push(
      <li key={GENERAL_GROWING_TIPS_ID} className="list-group-item p-0">
        <button
          type="button"
          className={`btn w-100 text-start d-flex align-items-center gap-3 py-2 px-3 rounded-0 ${
            active ? 'bg-light fw-semibold' : ''
          }`}
          onClick={() => selectVegetable(GENERAL_GROWING_TIPS_ID)}
          aria-pressed={active}
        >
          <Icon name="tips_and_updates" style={{ fontSize: '1.35rem' }} />
          <span className="flex-grow-1">{t('guide.generalTips')}</span>
          {isMobile ? (
            <Icon name="chevron_right" className="text-secondary" style={{ fontSize: '1.25rem' }} />
          ) : null}
        </button>
      </li>
    );
  }

  const list = (
    <ul className="list-group list-group-flush">
      {filtered.length === 0 && !showGeneralTips ? (
        <li className="list-group-item text-muted small">{t('guide.noMatch', { query })}</li>
      ) : (
        listItems
      )}
    </ul>
  );

  const intro = (
    <div className="px-3 pt-3 pb-2">
      <p className="small mb-0">{t('guide.intro')}</p>
    </div>
  );

  const detailContent = selectedProblemId ? (
    <VegetableGuideProblemDetail
      problemId={selectedProblemId}
      onBack={() => setSelectedProblemId(null)}
    />
  ) : selected ? (
    <VegetableGuideDetail veg={selected} onSelectProblem={setSelectedProblemId} />
  ) : (
    <p>{t('guide.selectPrompt')}</p>
  );

  if (isMobile) {
    if (selectedProblemId || selected) {
      const backLabel = selectedProblemId
        ? selected?.name || t('guide.backToGuide')
        : t('guide.allVegetables');
      const onBack = selectedProblemId
        ? () => setSelectedProblemId(null)
        : () => setSelectedId(null);

      return (
        <div className="d-flex flex-column h-100 w-100 bg-white vegetable-guide">
          <div className="d-flex align-items-center gap-2 p-2 border-bottom flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onBack}
            >
              <Icon name="chevron_left" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }} />
              {backLabel}
            </button>
          </div>
          <div
            ref={detailScrollRef}
            className="flex-grow-1 overflow-auto p-3"
            style={{ minHeight: 0 }}
          >
            {selectedProblemId ? (
              <VegetableGuideProblemDetail problemId={selectedProblemId} />
            ) : (
              <VegetableGuideDetail veg={selected} onSelectProblem={setSelectedProblemId} />
            )}
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
