import { PriceApi } from '@/api/PriceApi';
import { removeFormatting } from '@/components/atoms/Input/Input';
import { BILLING_PERIOD } from '@/constants/constants';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { Meter } from '@/models/Meter';
import { PRICE_TYPE, PRICE_UNIT_TYPE, BILLING_MODEL, type Price } from '@/models/Price';
import type { LineItem } from '@/models/Subscription';
import type { CommitmentTimeBucket, CommitmentTimeBucketPrice } from '@/types/dto/CommitmentTimeBucket';
import type { CreateSubscriptionLineItemRequest, UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import { CommitmentType, type LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';
import { normalizeCommitmentTimeBuckets, getCommitmentTimeBucketConstraints } from '@/utils/common/commitment_helpers';
import {
	buildBucketPriceFromDraft,
	cleanTimeBucketDraftForSave,
	hydrateCommitmentTimeBucketsForDisplay,
	normalizeCommitmentType,
	normalizeTimeBucketDraftsOrError,
	timeBucketFromDraft,
	timeBucketToDraft,
	billingModelSelectValueFromPrice,
	resolveBillingModelFromSelect,
	resolveDraftBillingModelSelect,
	resolveDraftCommitmentType,
	type BucketPriceContext,
	type CommitmentTimeBucketDraft,
} from '@/utils/common/commitment_time_bucket_draft';

/** Default commitment type for new subscription charge window buckets. */
export const SUBSCRIPTION_CHARGE_COMMITMENT_TYPE = CommitmentType.AMOUNT;

export type SubscriptionChargeCommitmentState = {
	windowCommitment: boolean;
	commitmentType: CommitmentType;
	timeBuckets: CommitmentTimeBucketDraft[];
};

export const DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE: SubscriptionChargeCommitmentState = {
	windowCommitment: false,
	commitmentType: CommitmentType.AMOUNT,
	timeBuckets: [],
};

function resolveCommitmentTypeFromBuckets(buckets?: CommitmentTimeBucket[]): CommitmentType {
	const firstType = buckets?.[0]?.commitment_type;
	return firstType ? normalizeCommitmentType(firstType) : CommitmentType.AMOUNT;
}

export function formatBucketPriceLabel(price?: CommitmentTimeBucket['price'], currencySymbol = '$'): string | null {
	if (!price) return null;

	const billingModel = billingModelSelectValueFromPrice(price);

	if (billingModel === 'SLAB_TIERED') {
		const tierCount = price.tiers?.length ?? 0;
		return tierCount > 0 ? `Slab tiered (${tierCount} tiers)` : 'Slab tiered';
	}
	if (billingModel === BILLING_MODEL.TIERED) {
		const tierCount = price.tiers?.length ?? 0;
		return tierCount > 0 ? `Volume tiered (${tierCount} tiers)` : 'Volume tiered';
	}
	if (billingModel === BILLING_MODEL.PACKAGE) {
		const amount = price.amount ? `${currencySymbol}${price.amount}` : null;
		const units = price.transform_quantity?.divide_by;
		if (amount && units) return `Package ${amount} / ${units} units`;
		if (amount) return `Package ${amount}`;
		return 'Package';
	}
	if (price.amount) {
		return `${currencySymbol}${price.amount} flat`;
	}

	return null;
}

export function subscriptionChargeCommitmentFromLineItem(
	item: CreateSubscriptionLineItemRequest | LineItem,
): SubscriptionChargeCommitmentState {
	return lineItemWindowCommitmentStateFromLineItem(item as LineItem);
}

export function lineItemHasWindowCommitment(lineItem: LineItem): boolean {
	return !!lineItem.commitment_windowed || (lineItem.commitment_time_buckets?.length ?? 0) > 0;
}

function lineItemHasTopLevelCommitment(lineItem: LineItem): boolean {
	return (
		!!lineItem.commitment_amount ||
		!!lineItem.commitment_quantity ||
		!!lineItem.commitment_type ||
		(lineItem.commitment_overage_factor != null &&
			lineItem.commitment_overage_factor !== '' &&
			lineItem.commitment_overage_factor !== '1') ||
		lineItem.commitment_true_up_enabled === true
	);
}

function lineItemHasCommitment(lineItem: LineItem): boolean {
	return lineItemHasWindowCommitment(lineItem) || lineItemHasTopLevelCommitment(lineItem);
}

/** Batch-fetch prices referenced by commitment bucket `price_id`s. */
export async function fetchCommitmentPricesByIds(priceIds: string[]): Promise<Record<string, Price>> {
	if (priceIds.length === 0) return {};

	const response = await PriceApi.ListPrices({ price_ids: priceIds });
	const pricesById: Record<string, Price> = {};
	for (const price of response.items ?? []) {
		pricesById[price.id] = price;
	}
	return pricesById;
}

function parseCommitmentAmount(value?: string): number | undefined {
	if (!value?.trim()) return undefined;
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCommitmentQuantity(value?: string): number | undefined {
	if (!value?.trim()) return undefined;
	const parsed = parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveTopLevelCommitmentType(lineItem: LineItem, buckets: CommitmentTimeBucket[]): CommitmentType {
	if (lineItem.commitment_type) return normalizeCommitmentType(lineItem.commitment_type);
	if (buckets[0]?.commitment_type) return normalizeCommitmentType(buckets[0].commitment_type);
	return CommitmentType.AMOUNT;
}

/** Map persisted line item commitment fields to config shape for read-only display. */
export function lineItemCommitmentConfigFromLineItem(
	lineItem: LineItem,
	hydratedBuckets?: CommitmentTimeBucket[],
): LineItemCommitmentConfig | null {
	const buckets = hydratedBuckets ?? lineItem.commitment_time_buckets ?? [];
	if (!lineItemHasCommitment(lineItem)) return null;

	const commitmentType = resolveTopLevelCommitmentType(lineItem, buckets);
	const firstBucket = buckets[0];

	let commitment_amount = parseCommitmentAmount(lineItem.commitment_amount);
	let commitment_quantity = parseCommitmentQuantity(lineItem.commitment_quantity);

	if (commitmentType === CommitmentType.AMOUNT) {
		if (commitment_amount == null) {
			commitment_amount = parseCommitmentAmount(lineItem.commitment_quantity) ?? parseCommitmentAmount(firstBucket?.commitment_value);
		}
	} else if (commitment_quantity == null) {
		commitment_quantity = parseCommitmentQuantity(lineItem.commitment_quantity) ?? parseCommitmentQuantity(firstBucket?.commitment_value);
	}

	return {
		commitment_type: commitmentType,
		...(commitment_amount != null ? { commitment_amount } : {}),
		...(commitment_quantity != null ? { commitment_quantity } : {}),
		overage_factor: lineItem.commitment_overage_factor
			? parseFloat(lineItem.commitment_overage_factor)
			: firstBucket?.overage_factor
				? parseFloat(firstBucket.overage_factor)
				: undefined,
		enable_true_up: lineItem.commitment_true_up_enabled ?? firstBucket?.true_up_enabled,
		is_window_commitment: lineItemHasWindowCommitment(lineItem),
		commitment_duration: lineItem.commitment_duration as LineItemCommitmentConfig['commitment_duration'],
		commitment_time_buckets: buckets,
	};
}

/** Collect unique bucket price IDs that need fetching when inline price is omitted. */
export function collectCommitmentBucketPriceIds(buckets: CommitmentTimeBucket[], excludePriceIds: string[] = []): string[] {
	const excluded = new Set(excludePriceIds.filter(Boolean));
	return [
		...new Set(
			buckets.filter((bucket) => !bucket.price && bucket.price_id && !excluded.has(bucket.price_id)).map((bucket) => bucket.price_id!),
		),
	];
}

/** Map a persisted price record to inline bucket price shape for display/edit hydration. */
export function priceRecordToCommitmentBucketPrice(price: Price): CommitmentTimeBucketPrice {
	return {
		type: price.type,
		price_unit_type: price.price_unit_type,
		billing_period: price.billing_period,
		billing_period_count: price.billing_period_count,
		billing_model: price.billing_model,
		...(price.tier_mode ? { tier_mode: price.tier_mode } : {}),
		...(price.tiers?.length ? { tiers: price.tiers } : {}),
		invoice_cadence: price.invoice_cadence,
		currency: price.currency.toLowerCase(),
		...(price.amount ? { amount: price.amount } : {}),
		meter_id: price.meter_id,
		...(price.transform_quantity ? { transform_quantity: price.transform_quantity } : {}),
		...(price.display_name ? { display_name: price.display_name } : {}),
		...(price.filter_values ? { filter_values: price.filter_values } : {}),
		...(price.price_unit_config ? { price_unit_config: price.price_unit_config } : {}),
	};
}

/** Attach fetched prices to buckets referenced by `price_id`. */
export function attachCommitmentBucketPrices(buckets: CommitmentTimeBucket[], pricesById: Record<string, Price>): CommitmentTimeBucket[] {
	return buckets.map((bucket) => {
		if (bucket.price || !bucket.price_id) return bucket;
		const price = pricesById[bucket.price_id];
		if (!price) return bucket;
		return { ...bucket, price: priceRecordToCommitmentBucketPrice(price) };
	});
}

export function lineItemWindowCommitmentStateFromLineItem(lineItem: LineItem): SubscriptionChargeCommitmentState {
	return lineItemWindowCommitmentStateFromBuckets(lineItem, lineItem.commitment_time_buckets ?? []);
}

export function lineItemWindowCommitmentStateFromBuckets(
	lineItem: LineItem,
	buckets: CommitmentTimeBucket[],
): SubscriptionChargeCommitmentState {
	const hydratedBuckets = hydrateCommitmentTimeBucketsForDisplay(buckets);

	return {
		windowCommitment: lineItemHasWindowCommitment(lineItem),
		commitmentType: resolveCommitmentTypeFromBuckets(hydratedBuckets),
		timeBuckets: hydratedBuckets.map(timeBucketToDraft),
	};
}

function formatTimePoint(point: { hour: number; minute?: number }, minutesEnabled: boolean): string {
	const hour = String(point.hour).padStart(2, '0');
	const minute = minutesEnabled ? String(point.minute ?? 0).padStart(2, '0') : '00';
	return `${hour}:${minute}`;
}

/** Single-line summary for a persisted commitment time bucket. */
export function formatCommitmentTimeBucketLabel(bucket: CommitmentTimeBucket, currencySymbol: string, minutesEnabled: boolean): string {
	const hydrated = hydrateCommitmentTimeBucketsForDisplay([bucket])[0] ?? bucket;
	const windowLabel = `${formatTimePoint(hydrated.start, minutesEnabled)}–${formatTimePoint(hydrated.end, minutesEnabled)} UTC`;
	const commitmentLabel =
		normalizeCommitmentType(hydrated.commitment_type) === CommitmentType.QUANTITY
			? `${hydrated.commitment_value ?? '—'} qty`
			: `${currencySymbol}${hydrated.commitment_value ?? '—'}`;
	const priceLabel = formatBucketPriceLabel(hydrated.price, currencySymbol);
	const overageLabel = hydrated.overage_factor && hydrated.overage_factor !== '1' ? `${hydrated.overage_factor}× overage` : null;
	return [windowLabel, commitmentLabel, priceLabel, overageLabel].filter(Boolean).join(' · ');
}

function bucketPriceChanged(draft: CommitmentTimeBucketDraft, existing?: CommitmentTimeBucket): boolean {
	if (!existing?.price) return true;

	const selectValue = resolveDraftBillingModelSelect(draft);
	const { billing_model, tier_mode } = resolveBillingModelFromSelect(selectValue);
	const existingPrice = existing.price;

	if (existingPrice.billing_model !== billing_model) return true;
	if (billing_model === BILLING_MODEL.TIERED && existingPrice.tier_mode !== tier_mode) return true;

	const draftAmount = draft.bucket_amount?.trim() ? removeFormatting(draft.bucket_amount) : '';
	if (draftAmount !== (existingPrice.amount ?? '')) return true;

	if (billing_model === BILLING_MODEL.PACKAGE) {
		const divideBy = parseInt(draft.transform_quantity_divide_by ?? '1', 10);
		if ((existingPrice.transform_quantity?.divide_by ?? 1) !== divideBy) return true;
	}

	if (billing_model === BILLING_MODEL.TIERED) {
		const draftTiers = (draft.bucket_tiers ?? [])
			.filter((tier) => tier.unit_amount.trim() || tier.flat_amount?.trim())
			.map((tier) => ({
				up_to: tier.up_to ?? null,
				unit_amount: removeFormatting(tier.unit_amount),
				flat_amount: tier.flat_amount?.trim() ? removeFormatting(tier.flat_amount) : '0',
			}));
		const existingTiers = (existingPrice.tiers ?? []).map((tier) => ({
			up_to: tier.up_to ?? null,
			unit_amount: tier.unit_amount ?? '',
			flat_amount: tier.flat_amount ?? '0',
		}));
		if (JSON.stringify(draftTiers) !== JSON.stringify(existingTiers)) return true;
	}

	return false;
}

function bucketPriceContextFromLineItemRecord(lineItem: LineItem): BucketPriceContext | null {
	const meterId = lineItem.meter_id || lineItem.price?.meter_id;
	if (!meterId) return null;

	const price = lineItem.price;

	return {
		meter_id: meterId,
		currency: lineItem.currency.toLowerCase(),
		billing_period: (lineItem.billing_period ?? price?.billing_period) as BILLING_PERIOD,
		type: price?.type ?? PRICE_TYPE.USAGE,
		price_unit_type: price?.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		invoice_cadence: price?.invoice_cadence ?? INVOICE_CADENCE.ARREAR,
		display_name: lineItem.display_name,
	};
}

export type LineItemCommitmentUpdateResult = { ok: true; payload: UpdateSubscriptionLineItemRequest } | { ok: false; error: string };

/** Build PUT /subscriptions/lineitems/:id payload for window commitment updates. */
export function buildLineItemCommitmentUpdatePayload(
	commitmentState: SubscriptionChargeCommitmentState,
	lineItem: LineItem,
	meter?: Meter | null,
): LineItemCommitmentUpdateResult {
	if (!commitmentState.windowCommitment) {
		return { ok: true, payload: { commitment_windowed: false, commitment_time_buckets: [] } };
	}

	const priceContext = bucketPriceContextFromLineItemRecord(lineItem);
	if (!priceContext) {
		return { ok: false, error: 'commitmentConfig.addCharge.selectMeterForBuckets' };
	}

	const bucketSize = meter?.aggregation?.bucket_size;
	const validation = normalizeTimeBucketDraftsOrError(commitmentState.timeBuckets, commitmentState.commitmentType, bucketSize, {
		requireCommitmentFields: true,
		requireBucketPrice: true,
		priceContext,
	});

	if ('error' in validation) {
		return { ok: false, error: validation.error };
	}

	const existingById = new Map((lineItem.commitment_time_buckets ?? []).filter((b) => b.id).map((b) => [b.id!, b]));

	const minutesEnabled = getMinutesEnabledForMeter(meter);

	const buckets = commitmentState.timeBuckets.map((draft) => {
		const commitmentType = resolveDraftCommitmentType(draft, commitmentState.commitmentType);
		const cleaned = cleanTimeBucketDraftForSave(draft, commitmentType);
		const existing = draft.id ? existingById.get(draft.id) : undefined;
		const includePrice = !draft.id || bucketPriceChanged(cleaned, existing);

		if (draft.id && existing && !includePrice) {
			const normalized = timeBucketFromDraft(cleaned, commitmentType, minutesEnabled);
			return {
				id: draft.id,
				start: normalized.start,
				end: normalized.end,
				commitment_type: normalized.commitment_type,
				commitment_value: normalized.commitment_value,
				overage_factor: normalized.overage_factor,
				true_up_enabled: normalized.true_up_enabled,
			};
		}

		return timeBucketFromDraft(cleaned, commitmentType, minutesEnabled, priceContext);
	});

	return {
		ok: true,
		payload: {
			commitment_windowed: true,
			commitment_time_buckets: buckets,
		},
	};
}

export function getMinutesEnabledForMeter(meter?: Meter | null): boolean {
	return getCommitmentTimeBucketConstraints(meter?.aggregation?.bucket_size).minutesEnabled;
}

function bucketPriceContextFromLineItem(item: CreateSubscriptionLineItemRequest, currency: string): BucketPriceContext | null {
	const meterId = item.price?.meter_id;
	if (!meterId) return null;

	return {
		meter_id: meterId,
		currency,
		billing_period: (item.price?.billing_period as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
		type: item.price?.type ?? PRICE_TYPE.USAGE,
		price_unit_type: item.price?.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		invoice_cadence: item.price?.invoice_cadence ?? INVOICE_CADENCE.ARREAR,
		display_name: item.display_name ?? item.price?.display_name,
	};
}

type ApplyWindowCommitmentInput = {
	meter_id?: string;
	currency?: string;
	billing_period?: BILLING_PERIOD;
	type?: PRICE_TYPE;
	price_unit_type?: PRICE_UNIT_TYPE;
	invoice_cadence?: INVOICE_CADENCE;
	display_name?: string;
};

export function formatWindowCommitmentError(
	error: string,
	t: (key: string, options?: { defaultValue?: string; step?: string }) => string,
): string {
	switch (error) {
		case 'commitmentConfig.addCharge.selectMeterForBuckets':
			return t('commitmentConfig.addCharge.selectMeterForBuckets');
		case 'No time buckets configured':
			return t('commitmentConfig.timeBuckets.emptyShort');
		case 'Please complete commitment fields for all time buckets':
			return t('commitmentConfig.timeBuckets.errors.incompleteCommitment');
		default: {
			const minuteStepMatch = /^Minute must be a multiple of (\d+)$/.exec(error);
			if (minuteStepMatch) {
				return t('commitmentConfig.errors.minuteStep', { step: minuteStepMatch[1] });
			}
			const hourStepMatch = /^Hour must be a multiple of (\d+)$/.exec(error);
			if (hourStepMatch) {
				return t('commitmentConfig.errors.hourStep', { step: hourStepMatch[1] });
			}
			return error;
		}
	}
}

/**
 * Attach window commitment time buckets to a subscription line item request.
 * Returns an i18n error key or raw validation message when invalid.
 */
export function applyWindowCommitmentToLineItem(
	request: CreateSubscriptionLineItemRequest,
	commitmentState: SubscriptionChargeCommitmentState,
	partial: ApplyWindowCommitmentInput,
	meter?: Meter | null,
): { error: string } | null {
	if (!commitmentState.windowCommitment) {
		return null;
	}

	if (!partial.meter_id) {
		return { error: 'commitmentConfig.addCharge.selectMeterForBuckets' };
	}

	const result = normalizeTimeBucketDraftsOrError(
		commitmentState.timeBuckets,
		commitmentState.commitmentType,
		meter?.aggregation?.bucket_size,
		{
			requireCommitmentFields: true,
			requireBucketPrice: true,
			priceContext: {
				meter_id: partial.meter_id,
				currency: (partial.currency ?? 'usd').toLowerCase(),
				billing_period: partial.billing_period ?? BILLING_PERIOD.MONTHLY,
				type: partial.type ?? PRICE_TYPE.USAGE,
				price_unit_type: partial.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
				invoice_cadence: partial.invoice_cadence ?? INVOICE_CADENCE.ARREAR,
				display_name: partial.display_name,
			},
		},
	);

	if ('error' in result) {
		return { error: result.error };
	}

	request.commitment_windowed = true;
	request.commitment_time_buckets = result.buckets;
	return null;
}

/** Ensure added subscription line items send complete bucket prices for POST /subscriptions. */
export function sanitizeSubscriptionLineItemForApi(
	item: CreateSubscriptionLineItemRequest,
	currency: string,
	meter?: Meter | null,
): CreateSubscriptionLineItemRequest {
	if (!item.commitment_windowed || !item.commitment_time_buckets?.length) {
		return item;
	}

	const priceContext = bucketPriceContextFromLineItem(item, currency);
	if (!priceContext) return item;

	const buckets = normalizeCommitmentTimeBuckets(item.commitment_time_buckets, meter?.aggregation?.bucket_size).map((bucket) => {
		const draft = bucket as CommitmentTimeBucketDraft;
		const hasInlinePrice = bucket.price && (bucket.price.amount || bucket.price.tiers?.length || bucket.price.billing_model);

		return {
			...bucket,
			price: hasInlinePrice ? bucket.price : buildBucketPriceFromDraft(draft, priceContext),
		};
	});

	return {
		...item,
		commitment_windowed: true,
		commitment_time_buckets: buckets,
	};
}
