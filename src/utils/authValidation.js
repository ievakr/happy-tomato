/**
 * Client-side password policy. Firebase Authentication itself enforces a hard
 * floor of 6 characters (createUserWithEmailAndPassword / confirmPasswordReset
 * reject anything shorter), so this can never go below that — but we require
 * more, since 6 is too weak on its own.
 */
export const MIN_PASSWORD_LENGTH = 8;
