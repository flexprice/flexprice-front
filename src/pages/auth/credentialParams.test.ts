import { describe, it, expect } from 'vitest';
import { stripCredentialParams } from './credentialParams';

/**
 * Query strings are assembled from parts rather than written as literals.
 *
 * A literal credential-shaped query in source is indistinguishable from a real
 * leaked credential to a secret scanner, and GitGuardian flagged exactly that
 * on the pull request these tests arrived in — which then blocked a release.
 * Building them keeps every case identical while leaving no such string behind.
 */
const SAMPLE_SECRET = 'placeholder-value';
const q = (entries: [string, string][]) => `?${new URLSearchParams(entries).toString()}`;

describe('stripCredentialParams', () => {
	it('returns null when there is nothing to strip', () => {
		expect(stripCredentialParams('')).toBeNull();
		expect(stripCredentialParams(q([['tab', 'login']]))).toBeNull();
		expect(stripCredentialParams(q([['redirect', '/billing/invoices']]))).toBeNull();
	});

	it('strips a full login link, leaving an empty query', () => {
		expect(
			stripCredentialParams(
				q([
					['email', 'a@b.com'],
					['password', SAMPLE_SECRET],
				]),
			),
		).toBe('');
	});

	it('strips the password even when it arrives alone', () => {
		expect(stripCredentialParams(q([['password', SAMPLE_SECRET]]))).toBe('');
	});

	it('strips the email even when it arrives alone', () => {
		expect(stripCredentialParams(q([['email', 'a@b.com']]))).toBe('');
	});

	// The login page is also reached with ?redirect= and ?sso=; disabling the
	// login link must not break either of them.
	it('keeps every other parameter intact', () => {
		expect(
			stripCredentialParams(
				q([
					['email', 'a@b.com'],
					['password', SAMPLE_SECRET],
					['redirect', '/billing'],
				]),
			),
		).toBe('redirect=%2Fbilling');
		expect(
			stripCredentialParams(
				q([
					['sso', 'tenant_123'],
					['password', SAMPLE_SECRET],
				]),
			),
		).toBe('sso=tenant_123');
	});

	it('strips repeated occurrences rather than just the first', () => {
		expect(
			stripCredentialParams(
				q([
					['password', SAMPLE_SECRET],
					['password', `${SAMPLE_SECRET}-2`],
					['tab', 'login'],
				]),
			),
		).toBe('tab=login');
	});
});
