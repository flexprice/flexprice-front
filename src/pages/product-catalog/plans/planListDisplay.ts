import type { StatusChipStatus } from '@/components/atoms/StatusChip';
import { billlingPeriodOptions } from '@/constants/constants';
import { ENTITY_STATUS, Plan } from '@/models';

export function getPlanBillingPeriodLabel(plan: Plan, emptyLabel: string): string {
	const present = new Set((plan.prices ?? []).map((price) => String(price.billing_period)));
	const labels = billlingPeriodOptions.filter((option) => present.has(option.value)).map((option) => option.label);
	return labels.length > 0 ? labels.join(', ') : emptyLabel;
}

export function getPlanCurrencyLabel(plan: Plan, emptyLabel: string): string {
	const currencies = [
		...new Set(
			(plan.prices ?? []).map((price) => price.currency?.toUpperCase()).filter((currency): currency is string => Boolean(currency)),
		),
	];
	return currencies.length > 0 ? currencies.join(', ') : emptyLabel;
}

export function getPlanListStatus(plan: Plan): StatusChipStatus {
	return plan.status === ENTITY_STATUS.PUBLISHED ? 'Active' : 'Inactive';
}
