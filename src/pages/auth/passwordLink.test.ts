import { describe, it, expect } from 'vitest';
import { buildPasswordLink, formatLinkExpiry, readPasswordLinkToken } from './passwordLink';

/**
 * Sample tokens are assembled from parts, as in credentialParams.test.ts, so a
 * secret scanner never sees a token-shaped literal in source.
 */
const SAMPLE_TOKEN = [['sample', 'data'].join('-'), ['sample', 'signature'].join('-')].join('.');
const ORIGIN = 'https://dashboard.example.com';

describe('buildPasswordLink', () => {
	it('opens the set-password tab and carries the token only after #', () => {
		const url = new URL(buildPasswordLink(ORIGIN, SAMPLE_TOKEN));

		expect(url.origin).toBe(ORIGIN);
		expect(url.pathname).toBe('/auth');
		expect(url.searchParams.get('tab')).toBe('set-password');
		expect(url.search).not.toContain(SAMPLE_TOKEN);
		expect(url.hash).toBe(`#token=${SAMPLE_TOKEN}`);
	});
});

describe('readPasswordLinkToken', () => {
	it('reads back the token a built link carries', () => {
		const url = new URL(buildPasswordLink(ORIGIN, SAMPLE_TOKEN));

		expect(readPasswordLinkToken(url.hash)).toBe(SAMPLE_TOKEN);
	});

	it('returns null when the fragment has no token', () => {
		expect(readPasswordLinkToken('')).toBeNull();
		expect(readPasswordLinkToken('#')).toBeNull();
		expect(readPasswordLinkToken('#type=recovery')).toBeNull();
		expect(readPasswordLinkToken('#token=')).toBeNull();
	});

	it('trims whitespace a chat app may add around a pasted link', () => {
		expect(readPasswordLinkToken(`#token=%20${SAMPLE_TOKEN}%0A`)).toBe(SAMPLE_TOKEN);
	});
});

describe('formatLinkExpiry', () => {
	// A 24-hour link made at 10:00 must not read as "valid all of Oct 18".
	it('shows the time of day, not just the date', () => {
		// No offset, so the time is read as local and the result is the same in every time zone.
		const shown = formatLinkExpiry('2026-10-18T10:00:00', 'en-US');

		expect(shown).toContain('Oct 18, 2026');
		expect(shown).toMatch(/10:00\sAM/u);
	});
});
