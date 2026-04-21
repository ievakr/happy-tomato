/**
 * Garden plan: meters. Plot origin is bottom-left; x increases right, y increases up.
 * Bed x,y = bottom-left corner of the rectangle in meters; widthM, heightM extend right and up.
 * SVG rendering converts with ySvg = plotHeightM - y - heightM.
 */

export function newBedId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `bed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultGardenPlan(year) {
  const y = typeof year === 'number' ? year : Number(year);
  return {
    year: Number.isFinite(y) ? y : new Date().getFullYear(),
    plotWidthM: 10,
    plotHeightM: 6,
    beds: [],
    updatedAt: null,
  };
}

export function normalizeGardenPlan(raw, yearStr) {
  const base = defaultGardenPlan(Number(yearStr));
  if (!raw || typeof raw !== 'object') return base;
  const plotWidthM = clampPositiveNumber(raw.plotWidthM, base.plotWidthM);
  const plotHeightM = clampPositiveNumber(raw.plotHeightM, base.plotHeightM);
  const bedsIn = Array.isArray(raw.beds) ? raw.beds : [];
  const beds = bedsIn.map((b) => normalizeBed(b)).filter(Boolean);
  return {
    ...base,
    plotWidthM,
    plotHeightM,
    beds: clampBedsToPlot(beds, plotWidthM, plotHeightM),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : base.updatedAt,
  };
}

function clampPositiveNumber(v, fallback) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 500);
}

function normalizeBed(b) {
  if (!b || typeof b !== 'object') return null;
  const id = typeof b.id === 'string' && b.id ? b.id : newBedId();
  const x = clampNumber(b.x, 0);
  const y = clampNumber(b.y, 0);
  const widthM = clampNumber(b.widthM, 1);
  const heightM = clampNumber(b.heightM, 1);
  const label = typeof b.label === 'string' ? b.label : '';
  const plantingsIn = Array.isArray(b.plantings) ? b.plantings : [];
  const plantings = plantingsIn
    .map((p) => {
      if (!p || typeof p !== 'object') return null;
      const plantId = typeof p.plantId === 'string' ? p.plantId : '';
      if (!plantId) return null;
      return { plantId };
    })
    .filter(Boolean);
  return { id, label, x, y, widthM, heightM, plantings };
}

function clampNumber(v, min) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, n);
}

export function clampBedsToPlot(beds, plotW, plotH) {
  return beds.map((bed) => {
    let { x, y, widthM, heightM } = bed;
    widthM = Math.min(widthM, plotW);
    heightM = Math.min(heightM, plotH);
    x = Math.min(Math.max(0, x), Math.max(0, plotW - widthM));
    y = Math.min(Math.max(0, y), Math.max(0, plotH - heightM));
    return { ...bed, x, y, widthM, heightM };
  });
}

export function sanitizePlanForFirestore(plan) {
  const year = typeof plan.year === 'number' ? plan.year : Number(plan.year);
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    plotWidthM: plan.plotWidthM,
    plotHeightM: plan.plotHeightM,
    beds: plan.beds.map((b) => ({
      id: b.id,
      label: b.label || '',
      x: b.x,
      y: b.y,
      widthM: b.widthM,
      heightM: b.heightM,
      plantings: (b.plantings || []).map((p) => ({
        plantId: p.plantId,
      })),
    })),
    updatedAt: new Date().toISOString(),
  };
}
