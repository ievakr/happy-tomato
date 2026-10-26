import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  vegetableGuide,
  GENERAL_GROWING_TIPS,
  GENERAL_GROWING_TIPS_ID,
} from '../../data/vegetableGuide';
import VegetableGuideDetail from './VegetableGuideDetail';
import VegetableGuideProblemDetail from './VegetableGuideProblemDetail';
import Icon from '../common/Icon';
import './VegetableGuideView.css';

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

  const listRows = filtered.map((veg) => (
    <button
      key={veg.id}
      type="button"
      className="guide-row"
      onClick={() => selectVegetable(veg.id)}
      aria-pressed={!isMobile && veg.id === selectedId && !selectedProblemId}
    >
      <Icon plantIcon={veg.icon} className="guide-row-icon" />
      <span className="guide-row-name">{veg.name}</span>
      <Icon name="chevron_right" className="guide-row-chevron" />
    </button>
  ));

  if (showGeneralTips) {
    listRows.push(
      <button
        key={GENERAL_GROWING_TIPS_ID}
        type="button"
        className="guide-row"
        onClick={() => selectVegetable(GENERAL_GROWING_TIPS_ID)}
        aria-pressed={!isMobile && selectedId === GENERAL_GROWING_TIPS_ID}
      >
        <Icon name="menu_book" className="guide-row-icon" />
        <span className="guide-row-name">{t('guide.generalTips')}</span>
        <Icon name="chevron_right" className="guide-row-chevron" />
      </button>
    );
  }

  const listBody = (
    <div className="guide-list-page">
      <p className="guide-intro">{t('guide.intro')}</p>
      <label className="guide-search">
        <Icon name="search" className="guide-search-icon" />
        <input
          ref={searchInputRef}
          type="search"
          placeholder={t('guide.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('guide.searchPlaceholder')}
        />
      </label>
      {filtered.length === 0 && !showGeneralTips ? (
        <p className="guide-empty">{t('guide.noMatch', { query })}</p>
      ) : (
        <div className="guide-card">{listRows}</div>
      )}
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
      const onBack = selectedProblemId
        ? () => setSelectedProblemId(null)
        : () => setSelectedId(null);

      return (
        <div className="d-flex flex-column h-100 w-100 vegetable-guide guide-detail-shell">
          <button type="button" className="guide-back" onClick={onBack}>
            <Icon name="chevron_left" />
            {t('common.back')}
          </button>
          <div
            ref={detailScrollRef}
            className="flex-grow-1 overflow-auto guide-detail-scroll"
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
        style={{ width: '380px', flexShrink: 0 }}
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
