import { describe, it, expect } from 'vitest';
import { stripCredentialParams } from './credentialParams';

describe('stripCredentialParams', () => {
	it('returns null when there is nothing to strip', () => {
		expect(stripCredentialParams('')).toBeNull();
		expect(stripCredentialParams('?tab=login')).toBeNull();
		expect(stripCredentialParams('?redirect=/billing/invoices')).toBeNull();
	});

	it('strips a full login link, leaving an empty query', () => {
		expect(stripCredentialParams('?email=a%40b.com&password=s3cret')).toBe('');
	});

	it('strips the password even when it arrives alone', () => {
		expect(stripCredentialParams('?password=s3cret')).toBe('');
	});

	it('strips the email even when it arrives alone', () => {
		expect(stripCredentialParams('?email=a%40b.com')).toBe('');
	});

	// The login page is also reached with ?redirect= and ?sso=; disabling the
	// login link must not break either of them.
	it('keeps every other parameter intact', () => {
		expect(stripCredentialParams('?email=a%40b.com&password=s3cret&redirect=%2Fbilling')).toBe('redirect=%2Fbilling');
		expect(stripCredentialParams('?sso=tenant_123&password=s3cret')).toBe('sso=tenant_123');
	});

	it('strips repeated occurrences rather than just the first', () => {
		expect(stripCredentialParams('?password=one&password=two&tab=login')).toBe('tab=login');
	});
});
