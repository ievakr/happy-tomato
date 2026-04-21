import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePlants } from '../../hooks/usePlants';
import { useGardenPlan } from '../../hooks/useGardenPlan';
import {
  clampBedsToPlot,
  defaultGardenPlan,
  newBedId,
  normalizeGardenPlan,
} from '../../utils/gardenPlan';
import Icon from '../common/Icon';

function clientToWorldMeters(svgEl, clientX, clientY, plotH) {
  if (!svgEl?.createSVGPoint) return null;
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: plotH - p.y };
}

const YEAR_RANGE = 15;

/** Label inside SVG bed rect (user units = meters). Returns null if no name. */
function getBedLabelSvg(bed) {
  const raw = (bed.label || '').trim();
  if (!raw) return null;
  const fontSize = Math.min(0.4, Math.max(0.14, Math.min(bed.widthM, bed.heightM) * 0.24));
  const approxCharWidth = fontSize * 0.55;
  const maxChars = Math.max(4, Math.floor(bed.widthM / approxCharWidth) - 1);
  const display =
    raw.length > maxChars ? `${raw.slice(0, Math.max(1, maxChars - 1))}…` : raw;
  return { display, fontSize };
}

export default function GardenPlannerView() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const { showError, showSuccess } = useToast();
  const { plants, plantIdToDisplayName } = usePlants(userId);

  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentCalendarYear);
  const yearStr = String(selectedYear);
  const [selectedBedId, setSelectedBedId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [plantPickerOpen, setPlantPickerOpen] = useState(false);

  const { plan, isLoading, savePlan, isSaving } = useGardenPlan(userId, yearStr);
  const [localPlan, setLocalPlan] = useState(null);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    skipSaveRef.current = true;
    setSelectedBedId(null);
    setIsEditMode(false);
    setPlantPickerOpen(false);
  }, [yearStr]);

  useEffect(() => {
    setPlantPickerOpen(false);
  }, [selectedBedId, isEditMode]);

  // Sync from React Query when the server/cache snapshot changes — but do not treat that as a user
  // edit (otherwise each successful save updates `plan`, re-sets `localPlan`, and the debounced save
  // fires again, looping and flickering "Saving…" / "Save now").
  useEffect(() => {
    if (!plan) return;
    skipSaveRef.current = true;
    setLocalPlan(plan);
  }, [plan]);

  const dragRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!isEditMode) return;
    if (!localPlan || !userId) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      savePlan(localPlan).catch(() => {
        showError('Could not save garden plan. Check your connection.');
      });
    }, 700);
    return () => clearTimeout(t);
  }, [localPlan, userId, savePlan, showError, isEditMode]);

  const updatePlan = useCallback((updater) => {
    setLocalPlan((prev) => {
      const base = prev || defaultGardenPlan(selectedYear);
      return typeof updater === 'function' ? updater(base) : updater;
    });
  }, [selectedYear]);

  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentCalendarYear + 2; y >= currentCalendarYear - YEAR_RANGE; y -= 1) {
      list.push(y);
    }
    return list;
  }, [currentCalendarYear]);

  const handlePlotSizeChange = (field, raw) => {
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    updatePlan((p) => {
      const next = { ...p, [field]: Math.min(n, 500) };
      return {
        ...next,
        beds: clampBedsToPlot(next.beds, next.plotWidthM, next.plotHeightM),
      };
    });
  };

  const addBed = () => {
    updatePlan((p) => {
      const w = Math.min(2, p.plotWidthM);
      const h = Math.min(1, p.plotHeightM);
      const x = Math.max(0, (p.plotWidthM - w) / 2);
      const y = Math.max(0, (p.plotHeightM - h) / 2);
      const bed = {
        id: newBedId(),
        label: '',
        x,
        y,
        widthM: w,
        heightM: h,
        plantings: [],
      };
      return { ...p, beds: [...p.beds, bed] };
    });
  };

  const removeBed = (bedId) => {
    updatePlan((p) => ({
      ...p,
      beds: p.beds.filter((b) => b.id !== bedId),
    }));
    setSelectedBedId((prev) => (prev === bedId ? null : prev));
  };

  const selectedBed = localPlan?.beds?.find((b) => b.id === selectedBedId) || null;

  const onBedPointerDown = (e, bed) => {
    if (e.button !== 0) return;
    const svg = svgRef.current;
    if (svg?.setPointerCapture) {
      svg.setPointerCapture(e.pointerId);
    }
    const plotH = localPlan.plotHeightM;
    const w = clientToWorldMeters(svg, e.clientX, e.clientY, plotH);
    if (!w) return;
    dragRef.current = {
      bedId: bed.id,
      grabX: w.x - bed.x,
      grabY: w.y - bed.y,
    };
    setSelectedBedId(bed.id);
  };

  const onSvgPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || !localPlan) return;
    const svg = svgRef.current;
    const w = clientToWorldMeters(svg, e.clientX, e.clientY, localPlan.plotHeightM);
    if (!w) return;
    let nx = w.x - d.grabX;
    let ny = w.y - d.grabY;
    const bed = localPlan.beds.find((b) => b.id === d.bedId);
    if (!bed) return;
    nx = Math.min(Math.max(0, nx), Math.max(0, localPlan.plotWidthM - bed.widthM));
    ny = Math.min(Math.max(0, ny), Math.max(0, localPlan.plotHeightM - bed.heightM));
    updatePlan((p) => ({
      ...p,
      beds: p.beds.map((b) => (b.id === d.bedId ? { ...b, x: nx, y: ny } : b)),
    }));
  };

  const endDrag = (e) => {
    const svg = svgRef.current;
    if (svg?.hasPointerCapture?.(e.pointerId)) {
      svg.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const updateBedField = (bedId, patch) => {
    updatePlan((p) => {
      const beds = p.beds.map((b) => (b.id === bedId ? { ...b, ...patch } : b));
      return { ...p, beds: clampBedsToPlot(beds, p.plotWidthM, p.plotHeightM) };
    });
  };

  const addPlantingWithId = (bedId, plantId) => {
    if (!plantId) return;
    updatePlan((p) => ({
      ...p,
      beds: p.beds.map((b) =>
        b.id === bedId ? { ...b, plantings: [...b.plantings, { plantId }] } : b,
      ),
    }));
  };

  const onPickPlantToAdd = (bedId, rawId) => {
    const plantId = String(rawId || '').trim();
    if (!plantId) return;
    addPlantingWithId(bedId, plantId);
    setPlantPickerOpen(false);
  };

  const removePlanting = (bedId, index) => {
    updatePlan((p) => ({
      ...p,
      beds: p.beds.map((b) =>
        b.id === bedId
          ? { ...b, plantings: b.plantings.filter((_, i) => i !== index) }
          : b,
      ),
    }));
  };

  const applyCopyFromPreviousYear = useCallback(async () => {
    if (!userId) return false;
    const prevYear = String(selectedYear - 1);
    const ref = doc(db, 'gardenPlans', userId, 'years', prevYear);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const normalized = normalizeGardenPlan(snap.data(), yearStr);
    if (normalized.beds.length === 0) return false;
    const merged = {
      ...normalized,
      year: selectedYear,
      beds: normalized.beds.map((b) => ({
        ...b,
        id: newBedId(),
        plantings: b.plantings.map((p) => ({ ...p })),
      })),
    };
    skipSaveRef.current = true;
    setLocalPlan(merged);
    await savePlan(merged);
    return true;
  }, [userId, selectedYear, yearStr, savePlan]);

  const autoCopyAttemptedYearRef = useRef(null);

  useEffect(() => {
    autoCopyAttemptedYearRef.current = null;
  }, [yearStr]);

  // When this year has never been saved and has no beds, copy layout from the previous year if available.
  useEffect(() => {
    if (!userId || !plan || isLoading) return;
    if (plan.beds.length > 0) return;
    if (plan.updatedAt) return;
    if (autoCopyAttemptedYearRef.current === yearStr) return;

    autoCopyAttemptedYearRef.current = yearStr;
    let cancelled = false;
    (async () => {
      try {
        const ok = await applyCopyFromPreviousYear();
        if (cancelled) {
          autoCopyAttemptedYearRef.current = null;
          return;
        }
        if (ok) showSuccess('Copied from previous year.');
        else autoCopyAttemptedYearRef.current = null;
      } catch {
        if (!cancelled) autoCopyAttemptedYearRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, plan, isLoading, yearStr, applyCopyFromPreviousYear, showSuccess]);

  const copyFromPreviousYear = async () => {
    if (!userId) return;
    try {
      const ok = await applyCopyFromPreviousYear();
      if (!ok) {
        showError('No saved plan for the previous year.');
      } else {
        showSuccess('Copied from previous year.');
      }
    } catch {
      showError('Could not copy the previous year’s plan.');
    }
  };

  const saveNow = async () => {
    if (!localPlan || !userId) return;
    try {
      await savePlan(localPlan);
      showSuccess('Garden plan saved.');
      setIsEditMode(false);
    } catch {
      showError('Save failed.');
    }
  };

  if (!userId) {
    return (
      <div className="p-4 text-muted">
        Sign in to use the Garden Planner.
      </div>
    );
  }

  if (isLoading && !localPlan) {
    return (
      <div className="p-4 d-flex align-items-center gap-2 text-muted">
        <span className="spinner-border spinner-border-sm" aria-hidden />
        Loading garden plan…
      </div>
    );
  }

  const plotW = localPlan?.plotWidthM ?? 10;
  const plotH = localPlan?.plotHeightM ?? 6;

  return (
    <div className="garden-planner d-flex flex-column flex-md-row flex-grow-1 min-h-0">
      <div className="flex-grow-1 d-flex flex-column min-h-0 p-2 p-md-3 border-bottom border-md-bottom-0 border-md-end">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <label className="mb-0 small text-muted" htmlFor="garden-year">
            Year
          </label>
          <select
            id="garden-year"
            className="form-select form-select-sm"
            style={{ maxWidth: '110px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {isEditMode ? (
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyFromPreviousYear}>
                Copy from previous year
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={addBed}>
                <Icon name="add" className="me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
                Add bed
              </button>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={saveNow} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setIsEditMode(true)}>
              Edit
            </button>
          )}
        </div>

        <div className="ratio ratio-4x3 border rounded bg-light flex-grow-1" style={{ minHeight: '220px', maxHeight: '70vh' }}>
          <div className="d-flex align-items-center justify-content-center p-1 h-100">
            <svg
              ref={svgRef}
              role="img"
              aria-label="Garden plot"
              className="w-100 h-100"
              viewBox={`0 0 ${plotW} ${plotH}`}
              preserveAspectRatio="xMidYMid meet"
              onPointerMove={isEditMode ? onSvgPointerMove : undefined}
              onPointerUp={isEditMode ? endDrag : undefined}
              onPointerLeave={isEditMode ? endDrag : undefined}
            >
              <rect x={0} y={0} width={plotW} height={plotH} fill="#f4f7f2" stroke="#adb5bd" strokeWidth={0.08} />
              {(localPlan?.beds || []).map((bed) => {
                const ySvg = plotH - bed.y - bed.heightM;
                const isSel = bed.id === selectedBedId;
                const labelSvg = getBedLabelSvg(bed);
                return (
                  <g key={bed.id}>
                    <rect
                      x={bed.x}
                      y={ySvg}
                      width={bed.widthM}
                      height={bed.heightM}
                      fill={isSel ? 'rgba(220, 53, 69, 0.18)' : 'rgba(25, 135, 84, 0.15)'}
                      stroke={isSel ? '#dc3545' : '#198754'}
                      strokeWidth={isSel ? 0.12 : 0.06}
                      style={{
                        cursor: isEditMode ? 'grab' : 'pointer',
                        touchAction: isEditMode ? 'none' : 'manipulation',
                      }}
                      onPointerDown={isEditMode ? (e) => onBedPointerDown(e, bed) : undefined}
                      onClick={
                        isEditMode
                          ? undefined
                          : (e) => {
                              e.stopPropagation();
                              setSelectedBedId(bed.id);
                            }
                      }
                    />
                    {labelSvg ? (
                      <text
                        x={bed.x + bed.widthM / 2}
                        y={ySvg + bed.heightM / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={labelSvg.fontSize}
                        fontWeight="600"
                        fill="#1a3d2e"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {labelSvg.display}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <p className="small text-muted mt-2 mb-0">
          {isEditMode
            ? 'Drag beds to move. Units: meters; origin is bottom-left of the plot.'
            : 'Tap a bed to see which plants are in it. Use Edit to change the layout.'}
        </p>
      </div>

      <div
        className="garden-planner-sidebar p-3 d-flex flex-column gap-3"
        style={{ width: '100%', maxWidth: '380px', overflowY: 'auto' }}
      >
        <section className="border rounded-3 bg-light p-3">
          <h3 className="h6 mb-3 pb-2 border-bottom small text-uppercase text-secondary fw-semibold">
            Plot
          </h3>
          {!isEditMode ? (
            <p className="small text-muted mb-0">
              {plotW} × {plotH} m
              <span className="d-block mt-1">Origin: bottom-left corner.</span>
            </p>
          ) : (
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small mb-1" htmlFor="plot-w">
                  Width (m)
                </label>
                <input
                  id="plot-w"
                  type="number"
                  min={1}
                  step={0.1}
                  className="form-control form-control-sm"
                  value={localPlan?.plotWidthM ?? ''}
                  onChange={(e) => handlePlotSizeChange('plotWidthM', e.target.value)}
                />
              </div>
              <div className="col-6">
                <label className="form-label small mb-1" htmlFor="plot-h">
                  Depth (m)
                </label>
                <input
                  id="plot-h"
                  type="number"
                  min={1}
                  step={0.1}
                  className="form-control form-control-sm"
                  value={localPlan?.plotHeightM ?? ''}
                  onChange={(e) => handlePlotSizeChange('plotHeightM', e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {selectedBed ? (
          <>
            <section className="border rounded-3 bg-white p-3 shadow-sm">
              <h3 className="h6 mb-3 pb-2 border-bottom small text-uppercase text-secondary fw-semibold">
                Selected bed
              </h3>
              {!isEditMode && (
                <>
                  {selectedBed.label ? <p className="fw-semibold mb-2">{selectedBed.label}</p> : null}
                  <p className="small text-muted mb-0">Size: {selectedBed.widthM} × {selectedBed.heightM} m</p>
                </>
              )}
              {isEditMode && (
                <>
                  <div className="mb-2">
                    <label className="form-label small mb-1" htmlFor="bed-label">
                      Label
                    </label>
                    <input
                      id="bed-label"
                      type="text"
                      className="form-control form-control-sm"
                      value={selectedBed.label}
                      onChange={(e) => updateBedField(selectedBed.id, { label: e.target.value })}
                      placeholder="e.g. North raised bed"
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small mb-1">Width (m)</label>
                      <input
                        type="number"
                        min={0.2}
                        step={0.1}
                        className="form-control form-control-sm"
                        value={selectedBed.widthM}
                        onChange={(e) =>
                          updateBedField(selectedBed.id, { widthM: Number.parseFloat(e.target.value) || 0.2 })
                        }
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small mb-1">Depth (m)</label>
                      <input
                        type="number"
                        min={0.2}
                        step={0.1}
                        className="form-control form-control-sm"
                        value={selectedBed.heightM}
                        onChange={(e) =>
                          updateBedField(selectedBed.id, { heightM: Number.parseFloat(e.target.value) || 0.2 })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeBed(selectedBed.id)}
                  >
                    Delete bed
                  </button>
                </>
              )}
            </section>

            <section className="border rounded-3 bg-white p-3 shadow-sm">
              <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom gap-2">
                <h3 className="h6 mb-0 small text-uppercase text-secondary fw-semibold">Plants</h3>
                {isEditMode && !plantPickerOpen && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      if (!plants.length) {
                        showError('Add plants in Manage Plants first.');
                        return;
                      }
                      setPlantPickerOpen(true);
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
              {!isEditMode
                ? selectedBed.plantings.length === 0
                  ? (
                    <p className="small text-muted mb-0">No plants in this bed.</p>
                  )
                  : (
                    <p className="small mb-0 text-break">
                      {selectedBed.plantings
                        .map((p) => (plantIdToDisplayName || {})[p.plantId] || 'Unknown plant')
                        .join(', ')}
                    </p>
                  )
                : (
                  <>
                    {selectedBed.plantings.length === 0 && !plantPickerOpen ? (
                      <p className="small text-muted mb-0">No plants yet.</p>
                    ) : null}
                    {selectedBed.plantings.length > 0 ? (
                      <ul className="list-unstyled small mb-2">
                        {selectedBed.plantings.map((p, i) => (
                          <li
                            key={`${selectedBed.id}-p-${i}`}
                            className="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom border-light"
                          >
                            <span className="text-break">
                              {(plantIdToDisplayName || {})[p.plantId] || 'Unknown plant'}
                            </span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger text-nowrap p-0 flex-shrink-0"
                              onClick={() => removePlanting(selectedBed.id, i)}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {plantPickerOpen ? (
                      <div className="d-flex flex-column gap-2">
                        <label className="form-label small mb-0" htmlFor="garden-add-plant">
                          Choose plant
                        </label>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <select
                            id="garden-add-plant"
                            className="form-select form-select-sm flex-grow-1"
                            defaultValue=""
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) onPickPlantToAdd(selectedBed.id, v);
                              e.target.value = '';
                            }}
                          >
                            <option value="">Select…</option>
                            {plants.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {pl.variety ? `${pl.category} — ${pl.variety}` : pl.category}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setPlantPickerOpen(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
            </section>
          </>
        ) : (
          <p className="small text-muted mb-0 px-1">
            {isEditMode ? 'Tap or click a bed to select it and edit details.' : 'Tap a bed on the map to see its plants.'}
          </p>
        )}
      </div>
    </div>
  );
}
