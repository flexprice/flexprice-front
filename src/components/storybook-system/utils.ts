export type BillingStatus =
	| 'active'
	| 'archived'
	| 'paid'
	| 'draft'
	| 'void'
	| 'overdue'
	| 'trialing'
	| 'canceled'
	| 'past_due';

export type StatusTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info';

export interface PricingTier {
	from: number;
	to?: number;
	unitPrice: number;
}

export const STATUS_LABELS: Record<BillingStatus, string> = {
	active: 'Active',
	archived: 'Archived',
	paid: 'Paid',
	draft: 'Draft',
	void: 'Void',
	overdue: 'Overdue',
	trialing: 'Trialing',
	canceled: 'Canceled',
	past_due: 'Past due',
};

export const STATUS_TONES: Record<BillingStatus, StatusTone> = {
	active: 'success',
	archived: 'neutral',
	paid: 'success',
	draft: 'neutral',
	void: 'danger',
	overdue: 'warning',
	trialing: 'info',
	canceled: 'danger',
	past_due: 'warning',
};

export const getStatusLabel = (status: BillingStatus) => STATUS_LABELS[status];

export const getStatusTone = (status: BillingStatus) => STATUS_TONES[status];

export const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US') =>
	new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
	}).format(amount);

export const calculateTieredPrice = (quantity: number, tiers: PricingTier[]) => {
	if (quantity <= 0) return 0;

	return tiers.reduce((total, tier) => {
		const tierEnd = tier.to ?? quantity;
		const billableUnits = Math.max(0, Math.min(quantity, tierEnd) - tier.from + 1);
		return total + billableUnits * tier.unitPrice;
	}, 0);
};

export const shallowFingerprint = (value: Record<string, unknown>) => {
	const activeEntries = Object.entries(value).filter(([, entryValue]) => {
		if (entryValue === undefined || entryValue === null || entryValue === '') return false;
		if (Array.isArray(entryValue)) return entryValue.length > 0;
		return true;
	});

	const payload = activeEntries
		.map(([key, entryValue]) => `${key}:${JSON.stringify(entryValue)}`)
		.sort()
		.join('|');

	let hash = 0;
	for (let index = 0; index < payload.length; index += 1) {
		hash = (hash << 5) - hash + payload.charCodeAt(index);
		hash |= 0;
	}

	return `${activeEntries.length}-${Math.abs(hash).toString(36)}`;
};
