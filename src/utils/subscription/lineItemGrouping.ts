import { BILLING_PERIOD } from '@/constants/constants';
import { cadenceFanoutCount } from './cadenceCompatibility';

/** Minimal shape needed to reason about a charge's cadence (plan price or line item request). */
export interface CadenceBearingCharge {
	billing_period: BILLING_PERIOD | string;
	billing_period_count?: number;
}

/**
 * Whether a single charge fans out into more than one line item per subscription invoice —
 * i.e. its cadence strictly divides the subscription's. Mirrors the backend rule in
 * `splitInvoicePeriodByLineItemCadence`.
 *
 * Equal-cadence, longer-cadence, ONETIME, DAILY and WEEKLY charges never split (DAILY/WEEKLY
 * have no month equivalent, so they only match a subscription of the identical cadence, which
 * yields a single window).
 */
export function chargeSplitsAcrossBillingPeriod(
	subPeriod: BILLING_PERIOD | string,
	subCount: number | undefined,
	charge: CadenceBearingCharge,
): boolean {
	const fanout = cadenceFanoutCount(subPeriod, subCount, charge.billing_period, charge.billing_period_count);
	return fanout != null && fanout > 1;
}

/**
 * Whether the subscription will actually have at least one charge shorter than its billing
 * period. This is the gate for showing the "combine into one line item per invoice" control:
 * with no splitting charge, `line_item_grouping` is a no-op and the control stays hidden.
 *
 * Pass the charges that will really be attached — the primary partition plus any opted-in
 * additional-cadence prices (equivalently, what `include_price_ids` will enumerate).
 */
export function subscriptionHasSplittingCharge(
	subPeriod: BILLING_PERIOD | string,
	subCount: number | undefined,
	attachedCharges: CadenceBearingCharge[],
): boolean {
	return attachedCharges.some((charge) => chargeSplitsAcrossBillingPeriod(subPeriod, subCount, charge));
}
