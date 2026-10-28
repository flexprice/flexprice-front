export type NewPasswordError = 'tooShort' | 'tooLong' | 'mismatch';

const MIN_PASSWORD_LENGTH = 8;
/** bcrypt, which stores the password, reads at most 72 bytes. */
const MAX_PASSWORD_BYTES = 72;

/** Checks a new password and its confirmation; null when it can be sent. */
export function newPasswordError(password: string, confirmation: string): NewPasswordError | null {
	if ([...password].length < MIN_PASSWORD_LENGTH) return 'tooShort';
	if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return 'tooLong';
	if (password !== confirmation) return 'mismatch';
	return null;
}
