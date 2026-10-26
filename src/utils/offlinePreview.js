const STORAGE_KEY = 'happy-tomato-offline-preview';
const EVENT_NAME = 'happy-tomato-offline-preview';

export function readOfflinePreview() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeOfflinePreview(enabled) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // localStorage may be unavailable
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeOfflinePreview(onChange) {
  const sync = () => onChange(readOfflinePreview());
  window.addEventListener(EVENT_NAME, sync);
  return () => window.removeEventListener(EVENT_NAME, sync);
}
