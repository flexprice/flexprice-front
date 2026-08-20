const SETTINGS_ROOT = ['settings'] as const;

export const settingsQueryKeys = {
	all: SETTINGS_ROOT,
	teamMembers: (page: number, limit: number, offset: number) => [...SETTINGS_ROOT, 'team-members', page, limit, offset] as const,
	teamMembersRoot: () => [...SETTINGS_ROOT, 'team-members'] as const,
	customerPortalConfig: [...SETTINGS_ROOT, 'customer-portal-config'] as const,
	customerOnboardingConfig: [...SETTINGS_ROOT, 'customer-onboarding-config'] as const,
	customerOnboardingPlans: [...SETTINGS_ROOT, 'customer-onboarding-plans'] as const,
	walletBalanceAlertConfig: [...SETTINGS_ROOT, 'wallet-balance-alert-config'] as const,
	invoiceConfig: [...SETTINGS_ROOT, 'invoice-config'] as const,
	subscriptionConfig: [...SETTINGS_ROOT, 'subscription-config'] as const,
	samlConfig: [...SETTINGS_ROOT, 'saml-config'] as const,
};
