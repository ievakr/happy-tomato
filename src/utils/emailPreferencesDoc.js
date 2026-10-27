/**
 * Notification settings are stored under the account id.
 * Email-derived ids collide: jane.doe@example.com and jane_doe@example.com
 * become the same document, so new writes never use the email as the id.
 */

export function emailPreferencesDocId(userId) {
  if (typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  if (!trimmed || /[/#[\]]/.test(trimmed)) return null;
  return trimmed;
}

/** Id used before settings moved onto the account id. Kept so those docs can be found and removed. */
export function legacyEmailPreferencesDocId(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[.#$[\]]/g, '_');
}
