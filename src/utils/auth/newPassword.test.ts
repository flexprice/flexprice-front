import { describe, it, expect } from 'vitest';
import { newPasswordError } from './newPassword';

describe('newPasswordError', () => {
	it('accepts a matching password of 8 to 72 bytes', () => {
		expect(newPasswordError('long-enough-1', 'long-enough-1')).toBeNull();
		expect(newPasswordError('a'.repeat(72), 'a'.repeat(72))).toBeNull();
	});

	it('names what is wrong', () => {
		expect(newPasswordError('short12', 'short12')).toBe('tooShort');
		expect(newPasswordError('a'.repeat(73), 'a'.repeat(73))).toBe('tooLong');
		expect(newPasswordError('long-enough-1', 'long-enough-2')).toBe('mismatch');
	});

	// The server's limit is bcrypt's 72 bytes, so accented letters and emoji count for more than one.
	it('measures the upper limit in bytes', () => {
		const emoji = '\u{1F600}'.repeat(19);
		expect(newPasswordError(emoji, emoji)).toBe('tooLong');
	});
});
