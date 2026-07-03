import React, { useMemo, useRef, useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { vegetableGuide } from '../../data/vegetableGuide';
import Icon from '../common/Icon';

const DIFFICULTY_CLASS = {
  Easy: 'text-success',
  Moderate: 'text-warning',
  Advanced: 'text-danger',
};

function CareRow({ icon, label, children }) {
  if (!children) return null;
  return (
    <div className="d-flex gap-3 py-2 border-bottom border-light">
      <div className="text-secondary d-flex align-items-start" style={{ minWidth: '1.5rem' }}>
        <Icon name={icon} style={{ fontSize: '1.25rem' }} />
      </div>
      <div className="flex-grow-1">
        <div className="small text-uppercase text-secondary fw-semibold" style={{ letterSpacing: '0.02em' }}>
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function VegetableDetail({ veg }) {
  return (
    <article>
      <div className="d-flex align-items-center gap-3 mb-2">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-light border"
          style={{ width: '56px', height: '56px', flexShrink: 0 }}
        >
          <Icon plantIcon={veg.icon} style={{ fontSize: '1.75rem' }} />
        </span>
        <div>
          <h2 className="h4 mb-1">{veg.name}</h2>
          <span className={`small fw-semibold ${DIFFICULTY_CLASS[veg.difficulty] || 'text-secondary'}`}>
            {veg.difficulty}
          </span>
        </div>
      </div>

      <p className="text-muted">{veg.summary}</p>

      <div className="mt-3">
        <CareRow icon="wb_sunny" label="Sunlight">{veg.sun}</CareRow>
        <CareRow icon="grass" label="Sowing">{veg.sow}</CareRow>
        <CareRow icon="park" label="Transplanting">{veg.transplant}</CareRow>
        <CareRow icon="straighten" label="Spacing">{veg.spacing}</CareRow>
        <CareRow icon="south" label="Sowing depth">{veg.depth}</CareRow>
        <CareRow icon="water_drop" label="Watering">{veg.water}</CareRow>
        <CareRow icon="eco" label="Feeding">{veg.feed}</CareRow>
        <CareRow icon="agriculture" label="Harvest">{veg.harvest}</CareRow>
      </div>

      {veg.tips?.length ? (
        <div className="mt-4 p-3 rounded-3 bg-light border">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Icon name="tips_and_updates" className="text-secondary" style={{ fontSize: '1.15rem' }} />
            <span className="small text-uppercase text-secondary fw-semibold">Good to know</span>
          </div>
          <ul className="mb-0 ps-3">
            {veg.tips.map((tip, i) => (
              <li key={i} className="mb-1">{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export default function VegetableGuideView() {
  const { isMobile } = useResponsive();
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(vegetableGuide[0]?.id ?? null);

  const selectVegetable = (id) => {
    searchInputRef.current?.blur();
    setSelectedId(id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vegetableGuide;
    return vegetableGuide.filter((v) => v.name.toLowerCase().includes(q));
  }, [query]);

  const selected = useMemo(
    () => vegetableGuide.find((v) => v.id === selectedId) || null,
    [selectedId],
  );

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
          placeholder="Search vegetables…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the vegetable guide"
        />
      </div>
    </div>
  );

  const list = (
    <ul className="list-group list-group-flush">
      {filtered.length === 0 ? (
        <li className="list-group-item text-muted small">No vegetables match “{query}”.</li>
      ) : (
        filtered.map((veg) => {
          const active = !isMobile && veg.id === selectedId;
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
                  {veg.difficulty}
                </span>
                {isMobile ? (
                  <Icon name="chevron_right" className="text-secondary" style={{ fontSize: '1.25rem' }} />
                ) : null}
              </button>
            </li>
          );
        })
      )}
    </ul>
  );

  const intro = (
    <div className="px-3 pt-3 pb-2">
      <p className="small text-muted mb-0">
        Simple, offline care notes for common crops.
      </p>
    </div>
  );

  if (isMobile) {
    if (selected) {
      return (
        <div className="d-flex flex-column h-100 w-100 bg-white vegetable-guide">
          <div className="d-flex align-items-center gap-2 p-2 border-bottom flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSelectedId(null)}
            >
              <Icon name="chevron_left" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }} />
              All vegetables
            </button>
          </div>
          <div className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0 }}>
            <VegetableDetail veg={selected} />
          </div>
        </div>
      );
    }
    return (
      <div className="d-flex flex-column h-100 w-100 bg-white vegetable-guide">
        {searchBox}
        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
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
        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
          {intro}
          {list}
        </div>
      </div>
      <div className="flex-grow-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        {selected ? (
          <div style={{ maxWidth: '640px' }}>
            <VegetableDetail veg={selected} />
          </div>
        ) : (
          <p className="text-muted">Select a vegetable to see its care guide.</p>
        )}
      </div>
    </div>
  );
}
