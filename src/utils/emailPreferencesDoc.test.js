import {
  emailPreferencesDocId,
  legacyEmailPreferencesDocId,
} from './emailPreferencesDoc';

describe('email preference document ids', () => {
  test('stores settings under the account id', () => {
    expect(emailPreferencesDocId('user-a')).toBe('user-a');
    expect(emailPreferencesDocId('user-a')).not.toBe(emailPreferencesDocId('user-b'));
  });

  test('keeps the old email id so existing documents can be found', () => {
    expect(legacyEmailPreferencesDocId('jane.doe@example.com')).toBe('jane_doe@example_com');
  });

  test('rejects an account id that could escape the document path', () => {
    expect(emailPreferencesDocId('user/a')).toBeNull();
    expect(emailPreferencesDocId('')).toBeNull();
  });
});
