import { describe, expect, it } from 'vitest';
import { referralSourceOptions } from './onboardingConstants';

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
});
