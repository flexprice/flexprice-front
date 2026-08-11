import { describe, expect, it } from 'vitest';
import { findBannedOrgNameWord, referralSourceOptions } from './onboardingConstants';

describe('onboardingConstants', () => {
	it('keeps Reddit third in referral sources', () => {
		expect(referralSourceOptions.map((o) => o.value)).toEqual([
			'LinkedIn',
			'X',
			'Reddit',
			'Blogs',
			'ChatGPT / Perplexity / Gemini',
			'HackerNews',
			'Product Hunt',
		]);
	});

	it('rejects banned whole words without blocking ordinary substrings', () => {
		expect(findBannedOrgNameWord('Test Labs')).toBe('test');
		expect(findBannedOrgNameWord('Demo Co')).toBe('demo');
		expect(findBannedOrgNameWord('Contest')).toBeUndefined();
		expect(findBannedOrgNameWord('Testing Labs')).toBeUndefined();
		expect(findBannedOrgNameWord('Demonstration Co.')).toBeUndefined();
	});
});
