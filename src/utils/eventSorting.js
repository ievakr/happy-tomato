/**
 * Category and variety string for a plant, matching EventItem CalendarEventChip display.
 */
function plantDisplaySortLabel(plant, fallbackLabel) {
  if (!plant) return String(fallbackLabel ?? '').trim();
  return (plant.variety ? `${plant.category} - ${plant.variety}` : plant.category || '').trim();
}

/**
 * Secondary sort key: all linked plants, by display name order, joined.
 */
function getEventPlantNamesSecondaryKey(evt, plantsById = {}) {
  const labels = evt?.labels;
  if (!labels || labels.length === 0) return '';
  const localeOpts = { sensitivity: 'base' };
  const names = labels.map((lid) =>
    plantDisplaySortLabel(plantsById[lid], lid)
  );
  names.sort((a, b) => a.localeCompare(b, undefined, localeOpts));
  return names.join(', ');
}

/**
 * Stable label for sorting calendar events alphabetically on mobile lists.
 * Matches chip/event display priority: title, else toDo (array joined).
 */
export function getCalendarEventAlphabeticalLabel(evt) {
  let raw = evt?.title;
  if (raw == null || raw === '') {
    raw = evt?.toDo;
    if (Array.isArray(raw)) raw = raw.filter(Boolean).join(', ');
  }
  const s = String(raw ?? '').trim();
  const stripped = s.replace(/^TO DO:\s*/i, '').trim();
  return stripped || s;
}

/**
 * Alphabetical sort for mobile day lists: primary event label, secondary plant names, then id.
 * @param {Array} events
 * @param {Record<string, { category?: string, variety?: string }>} [plantsById]
 */
export function sortCalendarEventsAlphabeticallyMobile(events, plantsById = {}) {
  const localeOpts = { sensitivity: 'base' };
  return [...events].sort((a, b) => {
    const cmp = getCalendarEventAlphabeticalLabel(a).localeCompare(
      getCalendarEventAlphabeticalLabel(b),
      undefined,
      localeOpts
    );
    if (cmp !== 0) return cmp;
    const cmpPlants = getEventPlantNamesSecondaryKey(a, plantsById).localeCompare(
      getEventPlantNamesSecondaryKey(b, plantsById),
      undefined,
      localeOpts
    );
    if (cmpPlants !== 0) return cmpPlants;
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
  });
}
