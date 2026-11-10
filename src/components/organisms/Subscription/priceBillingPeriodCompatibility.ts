import type { Price } from '@/models';
import { isCadenceCompatible } from '@/utils/subscription/cadenceCompatibility';
import { isOneTimePlanPrice } from '@/utils/subscription/planPricesForSubscriptionUi';

/**
 * Whether a price belongs in the table for the selected subscription billing period.
 * isCadenceCompatible always returns false for ONETIME (it only reasons about the
 * recurring scale), so one-time prices must be kept explicitly, or they silently drop
 * out of the table whenever a billing period filter is active.
 */
export function isPriceCompatibleWithBillingPeriod(
	price: Pick<Price, 'billing_period' | 'billing_period_count'>,
	billingPeriod: string,
	billingPeriodCount?: number,
): boolean {
	return (
		isOneTimePlanPrice(price) || isCadenceCompatible(billingPeriod, billingPeriodCount, price.billing_period, price.billing_period_count)
	);
}
