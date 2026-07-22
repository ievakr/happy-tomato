// Static, offline vegetable care guide.
//
// Timing assumes a temperate NORTHERN HEMISPHERE climate (roughly USDA zones
// 4–8 / much of Europe and North America). Months are deliberately given as
// ranges because the exact week depends on your local last-frost date. When in
// doubt, let soil temperature and your last spring frost — not the calendar —
// be the guide.
//
// This is intentionally plain reference content: it does not depend on the
// user's own plants and never changes based on their data. `icon` values match
// the keys in src/constants VEGETABLE_ICONS so the guide reuses existing art.

import DETAILED_VEGETABLES from './vegetableGuideDetailed';
import GENERAL_GROWING_TIPS, { GENERAL_GROWING_TIPS_ID } from './vegetableGuideGeneralTips';
import GUIDE_PROBLEMS, {
  getGuideProblem,
  getGuideProblemsByIds,
  getCropsAffectedByProblem,
} from './vegetableGuideProblems';

export const GUIDE_HEMISPHERE = 'Northern hemisphere';
export { GENERAL_GROWING_TIPS, GENERAL_GROWING_TIPS_ID };
export {
  GUIDE_PROBLEMS,
  getGuideProblem,
  getGuideProblemsByIds,
  getCropsAffectedByProblem,
};

/** @returns {boolean} True when the entry uses the expanded guide format. */
export function isDetailedGuideEntry(veg) {
  return Boolean(veg?.overview) && !veg?.isGeneralTips;
}

export function isGeneralTipsEntry(entry) {
  return Boolean(entry?.isGeneralTips) || entry?.id === GENERAL_GROWING_TIPS_ID;
}

/** Sorted alphabetically by name for a predictable, browsable list. */
export const vegetableGuide = [...DETAILED_VEGETABLES].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export default vegetableGuide;
