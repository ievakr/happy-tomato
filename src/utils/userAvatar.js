import tomato from '../assets/avatars/tomato.png';
import carrot from '../assets/avatars/carrot.png';
import eggplant from '../assets/avatars/eggplant.png';
import pepper from '../assets/avatars/pepper.png';
import broccoli from '../assets/avatars/broccoli.png';
import corn from '../assets/avatars/corn.png';
import potato from '../assets/avatars/potato.png';
import radish from '../assets/avatars/radish.png';
import cucumber from '../assets/avatars/cucumber.png';
import pumpkin from '../assets/avatars/pumpkin.png';

/** Sticker-style vegetable avatars in the Happy Tomato look. */
export const VEGETABLE_AVATARS = [
  tomato,
  carrot,
  eggplant,
  pepper,
  broccoli,
  corn,
  potato,
  radish,
  cucumber,
  pumpkin,
];

/** Stable pick from the set — same uid always gets the same vegetable. */
export function getVegetableAvatarForUser(uid) {
  if (!uid) return VEGETABLE_AVATARS[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return VEGETABLE_AVATARS[hash % VEGETABLE_AVATARS.length];
}

/**
 * Avatar image for a user: Google/provider photo when present, otherwise a
 * deterministically assigned vegetable from the set.
 */
export function getUserAvatarSrc(user) {
  if (user?.photoURL) return user.photoURL;
  return getVegetableAvatarForUser(user?.uid);
}
