import { BILLING_MODEL, BILLING_PERIOD, INVOICE_CADENCE, PRICE_TYPE, TIER_MODE, PRICE_UNIT_TYPE } from '@/models';
import type { CreatePriceTier } from '@/models/Price';
import type { PriceBucketSize } from '@/models/Meter';
import type { CreateSubscriptionLineItemRequest, SubscriptionPriceCreateRequest } from '@/types/dto/Subscription';
import type { InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';

function normalizePriceCurrency(currency?: string): string | undefined {
	const normalized = currency?.trim().toLowerCase();
	return normalized || undefined;
}

function withPriceCurrency(price: SubscriptionPriceCreateRequest, currency?: string): SubscriptionPriceCreateRequest {
	const normalized = normalizePriceCurrency(currency);
	return normalized ? { ...price, currency: normalized } : price;
}

type FormTierInput = CreatePriceTier & { from?: number };

function mapFormTiersToCreateRequestTiers(tiers: FormTierInput[]): CreatePriceTier[] {
	return tiers.map((tier) => ({
		up_to: tier.up_to,
		unit_amount: tier.unit_amount ?? '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

function getFixedChargeTiers(internalPrice: Partial<InternalPrice>): FormTierInput[] | undefined {
	if (internalPrice.tiers?.length) {
		return internalPrice.tiers as FormTierInput[];
	}
	if (internalPrice.price_unit_config?.price_unit_tiers?.length) {
		return internalPrice.price_unit_config.price_unit_tiers;
	}
	return undefined;
}

function applyFixedChargePricingFields(price: SubscriptionPriceCreateRequest, internalPrice: Partial<InternalPrice>): void {
	const billingModel = (internalPrice.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE;
	const isCustomPriceUnit = internalPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	if (isCustomPriceUnit && internalPrice.price_unit_config) {
		price.price_unit_config = { ...internalPrice.price_unit_config };
		delete price.amount;
		delete price.tiers;
		delete price.tier_mode;
		if (internalPrice.transform_quantity) {
			price.transform_quantity = internalPrice.transform_quantity;
		}
		return;
	}

	switch (billingModel) {
		case BILLING_MODEL.FLAT_FEE:
			if (internalPrice.amount != null && internalPrice.amount !== '') {
				price.amount = internalPrice.amount;
			}
			break;
		case BILLING_MODEL.PACKAGE:
			if (internalPrice.amount != null && internalPrice.amount !== '') {
				price.amount = internalPrice.amount;
			}
			if (internalPrice.transform_quantity) {
				price.transform_quantity = internalPrice.transform_quantity;
			}
			break;
		case BILLING_MODEL.TIERED: {
			const tiers = getFixedChargeTiers(internalPrice);
			price.tier_mode = (internalPrice.tier_mode as TIER_MODE) ?? TIER_MODE.VOLUME;
			if (tiers?.length) {
				price.tiers = mapFormTiersToCreateRequestTiers(tiers);
			}
			break;
		}
	}
}

/** Subscription line item in local form state (API request payload + client-side temp id). */
export type AddedSubscriptionLineItem = CreateSubscriptionLineItemRequest & { tempId: string };

export interface SubscriptionLineItemFormDefaults {
	currency?: string;
	billingPeriod?: string;
}

/**
 * Converts form state (InternalPrice from fixed-charge RecurringChargesForm or UsagePricingForm) into
 * CreateSubscriptionLineItemRequest for subscription-level line items.
 */
export function internalPriceToSubscriptionLineItemRequest(
	internalPrice: Partial<InternalPrice>,
	quantity?: number,
): CreateSubscriptionLineItemRequest {
	const isUsage = internalPrice.type === PRICE_TYPE.USAGE;

	if (isUsage) {
		const price: SubscriptionPriceCreateRequest = {
			type: PRICE_TYPE.USAGE,
			price_unit_type: internalPrice.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
			billing_period: (internalPrice.billing_period as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
			billing_period_count: internalPrice.billing_period_count ?? 1,
			billing_model: (internalPrice.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE,
			invoice_cadence: (internalPrice.invoice_cadence as INVOICE_CADENCE) ?? INVOICE_CADENCE.ARREAR,
			display_name: internalPrice.display_name,
			start_date: internalPrice.start_date,
			meter_id: internalPrice.meter_id,
			filter_values: internalPrice.filter_values ?? undefined,
		};
		if (internalPrice.amount != null) price.amount = internalPrice.amount;
		if (internalPrice.tier_mode != null) price.tier_mode = internalPrice.tier_mode as TIER_MODE;
		if (internalPrice.tiers?.length) price.tiers = internalPrice.tiers;
		if (internalPrice.transform_quantity) price.transform_quantity = internalPrice.transform_quantity;
		if (internalPrice.bucket_size) price.bucket_size = internalPrice.bucket_size as PriceBucketSize;
		if (internalPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && internalPrice.price_unit_config) {
			price.price_unit_config = internalPrice.price_unit_config;
		}
		return {
			price: withPriceCurrency(price, internalPrice.currency),
			quantity: 0,
			display_name: internalPrice.display_name,
			start_date: internalPrice.start_date,
		};
	}

	const price: SubscriptionPriceCreateRequest = {
		type: internalPrice.type ?? PRICE_TYPE.FIXED,
		price_unit_type: internalPrice.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		billing_period: (internalPrice.billing_period as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
		billing_period_count: internalPrice.billing_period_count ?? 1,
		billing_model: (internalPrice.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE,
		invoice_cadence: (internalPrice.invoice_cadence as INVOICE_CADENCE) ?? INVOICE_CADENCE.ARREAR,
		display_name: internalPrice.display_name,
		min_quantity: internalPrice.min_quantity,
		start_date: internalPrice.start_date,
	};

	applyFixedChargePricingFields(price, internalPrice);

	if (internalPrice.trial_period_days !== undefined) {
		price.trial_period_days = internalPrice.trial_period_days;
	}

	return {
		price: withPriceCurrency(price, internalPrice.currency),
		quantity: quantity ?? internalPrice.min_quantity ?? 1,
		display_name: internalPrice.display_name,
		start_date: internalPrice.start_date,
	};
}

/**
 * Converts an added subscription line item back to form state (InternalPrice).
 * Used when editing an existing subscription-level charge so RecurringChargesForm (fixed) or UsagePricingForm can be pre-filled.
 */
export function subscriptionLineItemToInternalPrice(
	lineItem: AddedSubscriptionLineItem,
	defaults?: SubscriptionLineItemFormDefaults,
): Partial<InternalPrice> {
	const subscriptionPrice = lineItem.price;
	if (!subscriptionPrice) {
		return {
			display_name: lineItem.display_name ?? '',
			min_quantity: lineItem.quantity ?? 1,
			start_date: lineItem.start_date,
			internal_state: PriceInternalState.EDIT,
		};
	}

	const isUsage = subscriptionPrice.type === PRICE_TYPE.USAGE;
	const isCustomPriceUnit = subscriptionPrice.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;
	const baseFields: Partial<InternalPrice> = {
		display_name: lineItem.display_name ?? subscriptionPrice.display_name ?? '',
		billing_period:
			(subscriptionPrice.billing_period as BILLING_PERIOD) ?? (defaults?.billingPeriod as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
		billing_period_count: subscriptionPrice.billing_period_count ?? 1,
		invoice_cadence: (subscriptionPrice.invoice_cadence as INVOICE_CADENCE) ?? INVOICE_CADENCE.ARREAR,
		billing_model: (subscriptionPrice.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE,
		type: (subscriptionPrice.type as PRICE_TYPE) ?? PRICE_TYPE.FIXED,
		min_quantity: lineItem.quantity ?? subscriptionPrice.min_quantity ?? 1,
		start_date: lineItem.start_date ?? subscriptionPrice.start_date,
		price_unit_type: subscriptionPrice.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		internal_state: PriceInternalState.EDIT,
	};

	if (isUsage) {
		const usagePriceFields: Partial<InternalPrice> = {
			...baseFields,
			type: PRICE_TYPE.USAGE,
			meter_id: subscriptionPrice.meter_id,
			filter_values: subscriptionPrice.filter_values,
			tier_mode: subscriptionPrice.tier_mode,
			tiers: subscriptionPrice.tiers as InternalPrice['tiers'],
			transform_quantity: subscriptionPrice.transform_quantity ?? undefined,
			bucket_size: subscriptionPrice.bucket_size,
			currency: (subscriptionPrice as { currency?: string }).currency ?? defaults?.currency ?? 'USD',
		};
		const priceWithMeter = subscriptionPrice as SubscriptionPriceCreateRequest & { meter?: unknown };
		if (priceWithMeter.meter) {
			(usagePriceFields as Record<string, unknown>).meter = priceWithMeter.meter;
		}
		if (isCustomPriceUnit && subscriptionPrice.price_unit_config) {
			return {
				...usagePriceFields,
				price_unit_config: subscriptionPrice.price_unit_config,
				amount: subscriptionPrice.price_unit_config.amount ?? subscriptionPrice.amount,
			};
		}
		return { ...usagePriceFields, amount: subscriptionPrice.amount };
	}

	const trialFields =
		subscriptionPrice.trial_period_days !== undefined
			? {
					trial_period_days: subscriptionPrice.trial_period_days,
					isTrialPeriod: subscriptionPrice.trial_period_days > 0,
				}
			: {};

	const packageAndTieredFields = {
		transform_quantity: subscriptionPrice.transform_quantity ?? undefined,
		tier_mode: subscriptionPrice.tier_mode,
		tiers: subscriptionPrice.tiers as InternalPrice['tiers'],
	};

	if (isCustomPriceUnit && subscriptionPrice.price_unit_config) {
		return {
			...baseFields,
			...trialFields,
			...packageAndTieredFields,
			price_unit_config: subscriptionPrice.price_unit_config,
			amount: subscriptionPrice.price_unit_config.amount ?? subscriptionPrice.amount,
			currency: (subscriptionPrice as { currency?: string }).currency ?? defaults?.currency ?? 'USD',
		};
	}

	return {
		...baseFields,
		...trialFields,
		...packageAndTieredFields,
		amount: subscriptionPrice.amount,
		currency: (subscriptionPrice as { currency?: string }).currency ?? defaults?.currency ?? 'USD',
	};
}
