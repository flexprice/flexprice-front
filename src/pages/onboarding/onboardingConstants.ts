import type { SelectOption } from '@/components/atoms';

export const referralSourceOptions: SelectOption[] = [
	{ value: 'LinkedIn', label: 'LinkedIn' },
	{ value: 'X', label: 'X (Formerly Twitter)' },
	{ value: 'Reddit', label: 'Reddit' },
	{ value: 'Blogs', label: 'Blogs' },
	{ value: 'ChatGPT / Perplexity / Gemini', label: 'ChatGPT / Perplexity / Gemini' },
	{ value: 'HackerNews', label: 'HackerNews' },
	{ value: 'Product Hunt', label: 'Product Hunt' },
];

/** Banned substrings for organization names; extend as needed. */
export const BANNED_ORG_NAME_WORDS = ['test', 'demo', 'flexprice'];

export type OnboardingFormErrors = {
	orgName?: string;
	referralSource?: string;
};
