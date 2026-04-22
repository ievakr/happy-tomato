import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useLayoutContext } from '../../context/LayoutContext';
import { useToast } from '../../context/ToastContext';
import { useResponsive } from '../../hooks/useResponsive';
import { usePlants } from '../../hooks/usePlants';
import { useGardenPlan } from '../../hooks/useGardenPlan';
import {
  clampBedsToPlot,
  defaultGardenPlan,
  newBedId,
  normalizeGardenPlan,
} from '../../utils/gardenPlan';
import Icon from '../common/Icon';

/**
 * Client → viewBox user units (same as <rect> x/y; y down).
 * Use `ctmSourceEl.getScreenCTM()` (e.g. plot background <rect>), not the root <svg>:
 * WebKit/WKWebView often omits ancestor CSS transforms from SVGSVGElement.getScreenCTM(),
 * which breaks mapping under rotated parents (finger vs plot axes misaligned).
 */
function clientToViewBoxUser(svgEl, ctmSourceEl, clientX, clientY) {
  if (!svgEl?.createSVGPoint) return null;
  const source = ctmSourceEl?.getScreenCTM ? ctmSourceEl : svgEl;
  const ctm = source.getScreenCTM?.();
  if (!ctm) return null;
  let inv;
  try {
    inv = ctm.inverse();
  } catch {
    return null;
  }
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  return pt.matrixTransform(inv);
}

/**
 * Screen (client) → viewBox (u,v), y down, from three calibration points' real painted positions.
 * getBoundingClientRect() follows the true CSS transform; fixes "wrong axis" / opposite drag when
 * ancestor `rotate(90deg)` and `getScreenCTM()` disagree (common on iOS/WKWebView).
 * @returns {(clientX: number, clientY: number) => { x: number; y: number } | null} | null
 */
function buildClientToViewBoxFromBcr(refs, plotWidthM, plotHeightM) {
  const c00 = refs.r00?.getBoundingClientRect();
  const cW0 = refs.rW0?.getBoundingClientRect();
  const c0H = refs.r0H?.getBoundingClientRect();
  if (!c00 || !cW0 || !c0H) return null;
  const pw = Number(plotWidthM);
  const ph = Number(plotHeightM);
  if (!Number.isFinite(pw) || !Number.isFinite(ph) || pw <= 0 || ph <= 0) return null;
  const s00 = { x: c00.left + c00.width / 2, y: c00.top + c00.height / 2 };
  const sW0 = { x: cW0.left + cW0.width / 2, y: cW0.top + cW0.height / 2 };
  const s0H = { x: c0H.left + c0H.width / 2, y: c0H.top + c0H.height / 2 };
  const a = (sW0.x - s00.x) / pw;
  const b = (s0H.x - s00.x) / ph;
  const c = (sW0.y - s00.y) / pw;
  const dM = (s0H.y - s00.y) / ph;
  const det = a * dM - b * c;
  if (Math.abs(det) < 1e-10) return null;
  return (clientX, clientY) => {
    const dx = clientX - s00.x;
    const dy = clientY - s00.y;
    const u = (dM * dx - b * dy) / det;
    const v = (-c * dx + a * dy) / det;
    if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
    return { x: u, y: v };
  };
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
  const { setShowSidebar } = useLayoutContext();
  const { isMobile } = useResponsive();
  const { plants, plantIdToDisplayName } = usePlants(userId);

  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentCalendarYear);
  const yearStr = String(selectedYear);
  const [selectedBedId, setSelectedBedId] = useState(null);
  /** Visual highlight while dragging — avoids setSelectedBedId on pointerdown (re-render would reset the SVG / transform). */
  const [activeDragBedId, setActiveDragBedId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [plantPickerOpen, setPlantPickerOpen] = useState(false);

  const { plan, isLoading, savePlan, isSaving } = useGardenPlan(userId, yearStr);
  const [localPlan, setLocalPlan] = useState(null);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    skipSaveRef.current = true;
    setSelectedBedId(null);
    setActiveDragBedId(null);
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
  /** Plot fill <rect> — stable CTM for client→viewBox (see clientToViewBoxUser). */
  const plotBgRef = useRef(null);
  /** Invisible calibrators at (0,0), (W,0), (0,H) for BCR-based screen → viewBox. */
  const plotCal00Ref = useRef(null);
  const plotCalW0Ref = useRef(null);
  const plotCal0HRef = useRef(null);
  /** @type {React.MutableRefObject<Map<string, SVGGElement>>} */
  const bedGroupRefs = useRef(new Map());
  const mobileLandscapeStageRef = useRef(null);
  const [mobileLandscapeStagePx, setMobileLandscapeStagePx] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!isMobile) return undefined;
    const el = mobileLandscapeStageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const apply = () => {
      // Use client dimensions (content + padding) so the rotated child matches the inset box. Using
      // getBoundingClientRect() here while the stage has padding made the child larger than the
      // available area and clipped the top/edges after rotation.
      setMobileLandscapeStagePx({ w: el.clientWidth, h: el.clientHeight });
    };
    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

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

  /** Commit bed position after imperative SVG transform drag. */
  const stopDragState = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d) return;
      d.winCleanup?.();
      if (d.rafId != null) {
        cancelAnimationFrame(d.rafId);
        d.rafId = null;
      }
      const gEl = bedGroupRefs.current.get(d.bedId);
      gEl?.removeAttribute('transform');
      if (
        d.lastNx != null &&
        d.lastNy != null &&
        (d.lastNx !== d.worldX0 || d.lastNy !== d.worldY0)
      ) {
        updatePlan((p) => ({
          ...p,
          beds: p.beds.map((b) => (b.id === d.bedId ? { ...b, x: d.lastNx, y: d.lastNy } : b)),
        }));
      }
      setActiveDragBedId(null);
      setSelectedBedId(d.bedId);
      const pointerIdToRelease = e?.pointerId ?? d.pointerId;
      dragRef.current = null;
      const svg = svgRef.current;
      if (svg && pointerIdToRelease != null && svg.hasPointerCapture?.(pointerIdToRelease)) {
        svg.releasePointerCapture(pointerIdToRelease);
      }
    },
    [updatePlan],
  );

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
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      e.preventDefault();
    }
    const svg = svgRef.current;
    if (svg?.setPointerCapture) {
      svg.setPointerCapture(e.pointerId);
    }
    const plotH = localPlan.plotHeightM;
    const plotWm = localPlan.plotWidthM;
    const bcrToPlot = buildClientToViewBoxFromBcr(
      { r00: plotCal00Ref.current, rW0: plotCalW0Ref.current, r0H: plotCal0HRef.current },
      plotWm,
      plotH,
    );
    const ctmEl = plotBgRef.current || svg;
    const clientToPlotForDrag =
      bcrToPlot ||
      ((clientX, clientY) => clientToViewBoxUser(svg, ctmEl, clientX, clientY));
    const p0 = clientToPlotForDrag(e.clientX, e.clientY);
    if (!p0) return;
    const rx0 = bed.x;
    const ry0 = plotH - bed.y - bed.heightM;
    const offX = p0.x - rx0;
    const offY = p0.y - ry0;
    setActiveDragBedId(bed.id);
    const pointerId = e.pointerId;
    const applyGroupTransform = () => {
      const dr = dragRef.current;
      if (!dr) return;
      const el = bedGroupRefs.current.get(dr.bedId);
      if (el && dr.lastR1x != null && dr.lastR1y != null) {
        const tx = dr.lastR1x - dr.rx0;
        const ty = dr.lastR1y - dr.ry0;
        el.setAttribute('transform', `translate(${tx},${ty})`);
      }
    };
    const onWinPointerMove = (ev) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== pointerId) return;
      if (ev.pointerType === 'touch' || ev.pointerType === 'pen') {
        ev.preventDefault();
      }
      const p1 = d.clientToPlot(ev.clientX, ev.clientY);
      if (!p1) return;
      let r1x = p1.x - d.offX;
      let r1y = p1.y - d.offY;
      r1x = Math.min(Math.max(0, r1x), Math.max(0, d.plotWidthM - d.bedWidthM));
      r1y = Math.min(Math.max(0, r1y), Math.max(0, d.plotHeightM - d.bedHeightM));
      d.lastR1x = r1x;
      d.lastR1y = r1y;
      d.lastNx = r1x;
      d.lastNy = d.plotHeightM - r1y - d.bedHeightM;
      if (d.rafId == null) {
        d.rafId = requestAnimationFrame(() => {
          const dr = dragRef.current;
          if (!dr) return;
          dr.rafId = null;
          applyGroupTransform();
        });
      }
    };
    const onWinPointerEnd = (ev) => {
      if (ev.pointerId !== pointerId) return;
      stopDragState(ev);
    };
    window.addEventListener('pointermove', onWinPointerMove, { capture: true, passive: false });
    window.addEventListener('pointerup', onWinPointerEnd, { capture: true });
    window.addEventListener('pointercancel', onWinPointerEnd, { capture: true });
    const winCleanup = () => {
      window.removeEventListener('pointermove', onWinPointerMove, { capture: true });
      window.removeEventListener('pointerup', onWinPointerEnd, { capture: true });
      window.removeEventListener('pointercancel', onWinPointerEnd, { capture: true });
    };
    dragRef.current = {
      bedId: bed.id,
      rx0,
      ry0,
      offX,
      offY,
      plotWidthM: plotWm,
      plotHeightM: plotH,
      bedWidthM: bed.widthM,
      bedHeightM: bed.heightM,
      worldX0: bed.x,
      worldY0: bed.y,
      lastR1x: rx0,
      lastR1y: ry0,
      lastNx: bed.x,
      lastNy: bed.y,
      pointerId,
      rafId: null,
      winCleanup,
      clientToPlot: clientToPlotForDrag,
    };
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

  const mapIslandStyle = isEditMode
    ? {
        touchAction: 'none',
        overscrollBehavior: 'contain',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }
    : {};

  const gardenMapSvg = (
    <svg
      ref={svgRef}
      role="img"
      aria-label="Garden plot"
      className="w-100 h-100"
      style={{ touchAction: isEditMode ? 'none' : undefined, display: 'block' }}
      viewBox={`0 0 ${plotW} ${plotH}`}
      preserveAspectRatio="xMidYMid meet"
      onLostPointerCapture={isEditMode ? (ev) => { if (dragRef.current) stopDragState(ev); } : undefined}
    >
      <rect
        ref={plotBgRef}
        x={0}
        y={0}
        width={plotW}
        height={plotH}
        fill="#f4f7f2"
        stroke="#adb5bd"
        strokeWidth={0.08}
      />
      <circle
        ref={plotCal00Ref}
        cx={0}
        cy={0}
        r={0.1}
        fill="transparent"
        pointerEvents="none"
        aria-hidden="true"
      />
      <circle
        ref={plotCalW0Ref}
        cx={plotW}
        cy={0}
        r={0.1}
        fill="transparent"
        pointerEvents="none"
        aria-hidden="true"
      />
      <circle
        ref={plotCal0HRef}
        cx={0}
        cy={plotH}
        r={0.1}
        fill="transparent"
        pointerEvents="none"
        aria-hidden="true"
      />
      {(localPlan?.beds || []).map((bed) => {
        const ySvg = plotH - bed.y - bed.heightM;
        const isSel = bed.id === selectedBedId || bed.id === activeDragBedId;
        const labelSvg = getBedLabelSvg(bed);
        return (
          <g
            key={bed.id}
            ref={(el) => {
              if (el) bedGroupRefs.current.set(bed.id, el);
              else bedGroupRefs.current.delete(bed.id);
            }}
          >
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
  );

  const editToolbar = (
    <>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyFromPreviousYear}>
        Copy from previous year
      </button>
      <button type="button" className="btn btn-sm btn-danger" onClick={addBed}>
        <Icon name="add" className="me-1" style={{ fontSize: '1rem', verticalAlign: 'middle' }} />
        Add bed
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        style={{ minWidth: '6.25rem' }}
        onClick={saveNow}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </>
  );

  const sidebarBody = (
    <>
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
    </>
  );

  const touchScrollProps = {
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  };

  const mobileMapMinHeightPx =
    isMobile && mobileLandscapeStagePx.h > 0
      ? Math.min(
          Math.ceil((mobileLandscapeStagePx.h * plotH) / Math.max(plotW, 0.01)) + 16,
          2000,
        )
      : undefined;

  const isMobileRotated =
    isMobile && mobileLandscapeStagePx.w > 0 && mobileLandscapeStagePx.h > 0;

  const mobileColumnInner = (
    <div
      className="d-flex flex-column w-100 bg-white"
      style={{
        // Rotated 90°: top padding in this box does not line up with the physical top — use stage insets + nudge on the rotator instead.
        paddingTop: isMobileRotated ? 0 : 'env(safe-area-inset-top, 0px)',
        minHeight: '100%',
      }}
    >
      <div className="d-flex align-items-center gap-2 px-2 py-2 border-bottom flex-shrink-0">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => setShowSidebar(true)}
          aria-label="Open menu"
        >
          <span className="material-icons-outlined" style={{ fontSize: '1.15rem', verticalAlign: 'middle' }}>
            menu
          </span>
        </button>
        <label className="mb-0 small text-muted flex-shrink-0" htmlFor="garden-year-mobile">
          Year
        </label>
        <select
          id="garden-year-mobile"
          className="form-select form-select-sm flex-grow-1"
          style={{ minWidth: 0 }}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {!isEditMode ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger flex-shrink-0"
            onClick={() => setIsEditMode(true)}
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="position-relative flex-grow-1 min-h-0 d-flex flex-column">
        {isEditMode ? (
          <div
            className="position-absolute top-0 start-0 end-0 bottom-0 bg-dark"
            style={{ opacity: 0.12, pointerEvents: 'none', zIndex: 5 }}
            aria-hidden
          />
        ) : null}
        <div
          className="flex-grow-1 min-h-0 d-flex bg-light border border-top-0"
          style={{
            ...mapIslandStyle,
            ...(mobileMapMinHeightPx ? { minHeight: mobileMapMinHeightPx, flexShrink: 0 } : {}),
          }}
        >
          <div className="d-flex align-items-center justify-content-center p-1 flex-grow-1 min-h-0 w-100">
            {gardenMapSvg}
          </div>
        </div>

        {isEditMode ? (
          <div
            className="position-absolute top-0 end-0 h-100 bg-white border-start shadow d-flex flex-column"
            style={{
              width: 'min(45%, 360px)',
              zIndex: 10,
              maxWidth: '100%',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="d-flex align-items-center justify-between gap-2 border-bottom px-3 py-2 flex-shrink-0">
              <span className="fw-semibold small">Edit garden</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsEditMode(false)}
                aria-label="Close editor"
              >
                <span className="material-icons-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle' }}>
                  close
                </span>
              </button>
            </div>
            <div className="d-flex flex-wrap gap-2 p-3 border-bottom flex-shrink-0">{editToolbar}</div>
            <div
              className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3"
              style={{
                minHeight: 0,
                touchAction: 'pan-y',
                ...touchScrollProps,
              }}
            >
              {sidebarBody}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={`garden-planner d-flex flex-grow-1 min-h-0 w-100 ${
        isMobile ? 'flex-column h-100' : 'flex-column flex-md-row'
      }`}
    >
      {/* Desktop / tablet: toolbar + map + sidebar (breakpoint matches useResponsive / immersive header) */}
      {!isMobile ? (
        <>
      <div className="flex-grow-1 d-flex flex-column min-h-0 p-2 p-md-3 border-bottom border-md-bottom-0 border-md-end">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <label className="mb-0 small text-muted" htmlFor="garden-year-desktop">
            Year
          </label>
          <select
            id="garden-year-desktop"
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
          {isEditMode ? editToolbar : (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setIsEditMode(true)}>
              Edit
            </button>
          )}
        </div>

        <div
          className="ratio ratio-4x3 border rounded bg-light flex-grow-1"
          style={{
            minHeight: '220px',
            maxHeight: '70vh',
            ...mapIslandStyle,
          }}
        >
          <div className="d-flex align-items-center justify-content-center p-1 h-100">{gardenMapSvg}</div>
        </div>
        <p className="small text-muted mt-2 mb-0">
          {isEditMode
            ? 'Drag beds to move. Units: meters; origin is bottom-left of the plot.'
            : 'Tap a bed to see which plants are in it. Use Edit to change the layout.'}
        </p>
      </div>

      <div
        className="garden-planner-sidebar d-flex p-3 flex-column gap-3"
        style={{ width: '100%', maxWidth: '380px', overflowY: 'auto' }}
      >
        {sidebarBody}
      </div>
        </>
      ) : null}

      {/* Mobile: entire planner (chrome + map + drawer) rotated 90° as one horizontal “tabletop” */}
      {isMobile ? (
        <div
          ref={mobileLandscapeStageRef}
          className="flex-grow-1 min-h-0 w-100 position-relative"
          style={{
            minHeight: 0,
            boxSizing: 'border-box',
            // Child uses transform: rotate(90°). In this parent (not rotated), the phone’s status / notch band
            // (env(safe-area-inset-top)) should apply on horizontal insets, not paddingTop, or the nudge “vertical in
            // the app” reads as a sideways slide in the tabletop layout. Split the top inset between L/R so the
            // canvas clears the earpiece strip without shoving the whole view along the long axis the wrong way.
            paddingTop: 0,
            paddingLeft: 'max(0.5rem, env(safe-area-inset-left, 0px), calc(0.5 * env(safe-area-inset-top, 0px) + 0.25rem))',
            paddingRight: 'max(0.5rem, env(safe-area-inset-right, 0px), calc(0.5 * env(safe-area-inset-top, 0px) + 0.25rem))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            // Let the rotated “tabletop” paint without clipping; main still has overflow hidden.
            overflow: 'visible',
          }}
        >
          {mobileLandscapeStagePx.w > 0 && mobileLandscapeStagePx.h > 0 ? (
            <div
              style={{
                position: 'absolute',
                // Center the rotator: horizontal/vertical insets (above) handle safe areas for a 90° child.
                left: '50%',
                top: '50%',
                width: mobileLandscapeStagePx.h,
                height: mobileLandscapeStagePx.w,
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
                overflowX: 'hidden',
                overflowY: 'auto',
                ...touchScrollProps,
              }}
            >
              {mobileColumnInner}
            </div>
          ) : (
            mobileColumnInner
          )}
        </div>
      ) : null}
    </div>
  );
}
