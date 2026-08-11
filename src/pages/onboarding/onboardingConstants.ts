export type ReferralSourceOption = {
	value: string;
	labelKey: string;
};

export const referralSourceOptions: ReferralSourceOption[] = [
	{ value: 'LinkedIn', labelKey: 'tenantSetup.referralSources.linkedin' },
	{ value: 'X', labelKey: 'tenantSetup.referralSources.x' },
	{ value: 'Reddit', labelKey: 'tenantSetup.referralSources.reddit' },
	{ value: 'Blogs', labelKey: 'tenantSetup.referralSources.blogs' },
	{ value: 'ChatGPT / Perplexity / Gemini', labelKey: 'tenantSetup.referralSources.aiSearch' },
	{ value: 'HackerNews', labelKey: 'tenantSetup.referralSources.hackerNews' },
	{ value: 'Product Hunt', labelKey: 'tenantSetup.referralSources.productHunt' },
];

/** Banned whole words for organization names; extend as needed. */
export const BANNED_ORG_NAME_WORDS = ['test', 'demo', 'flexprice'] as const;

/** Returns the first banned whole word found in `name`, or undefined. */
export const findBannedOrgNameWord = (name: string): string | undefined => {
	const normalized = name.trim().toLowerCase();
	return BANNED_ORG_NAME_WORDS.find((word) => new RegExp(`\\b${word}\\b`, 'i').test(normalized));
};

export type OnboardingFormErrors = {
	orgName?: string;
	referralSource?: string;
};
