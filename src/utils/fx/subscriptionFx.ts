import type { InlineFxRateRequest, SubscriptionFxRateRow } from '@/types/dto/Subscription';
import { isCustomCurrency } from '@/utils/common/custom_currency';

/**
 * Billing currency of the first present customer (invoicing customer, then picked, then page customer),
 * matching the backend, which uses the invoicing customer. Undefined when nothing needs converting.
 */
export const resolveBillingCurrency = (
	charge: string,
	candidates: Array<{ billing_currency?: string } | null | undefined>,
): string | undefined => {
	const customer = candidates.find((candidate) => !!candidate);
	const billing = customer?.billing_currency?.toLowerCase();
	if (!billing || !charge || billing === charge.toLowerCase()) return undefined;
	return billing;
};

export const canSetSubscriptionFxRates = (charge: string, billing: string | undefined): boolean => !!billing && !isCustomCurrency(charge);

export const toInlineFxRates = (rows: SubscriptionFxRateRow[], visible: boolean): InlineFxRateRequest[] | undefined => {
	if (!visible || rows.length === 0) return undefined;
	return rows.map(({ rate, start_date, end_date }) => ({
		rate,
		...(start_date ? { start_date } : {}),
		...(end_date ? { end_date } : {}),
	}));
};
