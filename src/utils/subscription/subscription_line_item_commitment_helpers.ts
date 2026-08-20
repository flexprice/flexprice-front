import { removeFormatting } from '@/components/atoms/Input/Input';
import { BILLING_PERIOD } from '@/constants/constants';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BUCKET_SIZE } from '@/models/Meter';
import { PRICE_TYPE, PRICE_UNIT_TYPE, BILLING_MODEL, type Price } from '@/models/Price';
import type { LineItem } from '@/models/Subscription';
import type { CommitmentTimeBucket, CommitmentTimeBucketPrice } from '@/types/dto/CommitmentTimeBucket';
import type { CreateSubscriptionLineItemRequest, UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import { CommitmentType, type LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';
import {
	normalizeCommitmentTimeBuckets,
	getCommitmentTimeBucketConstraints,
	validateCommitment,
	resolveCommitmentTypeFromConfig,
	mapCommitmentValidationError,
} from '@/utils/common/commitment_helpers';
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
	commitmentType: CommitmentType;
	commitmentAmount: string;
	commitmentQuantity: string;
	overageFactor: string;
	enableTrueUp: boolean;
	commitmentDuration: string;
	windowCommitment: boolean;
	timeBuckets: CommitmentTimeBucketDraft[];
};

export const DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE: SubscriptionChargeCommitmentState = {
	commitmentType: CommitmentType.AMOUNT,
	commitmentAmount: '',
	commitmentQuantity: '',
	overageFactor: '1.0',
	enableTrueUp: false,
	commitmentDuration: '',
	windowCommitment: false,
	timeBuckets: [],
};

type CommitmentLineItemSource = {
	commitment_amount?: string | number;
	commitment_quantity?: string | number;
	commitment_type?: string;
	commitment_overage_factor?: string | number;
	commitment_true_up_enabled?: boolean;
	commitment_windowed?: boolean;
	commitment_duration?: string | BILLING_PERIOD;
	commitment_time_buckets?: CommitmentTimeBucket[];
};

function commitmentAmountToString(value?: string | number | null): string {
	if (value == null || value === '') return '';
	return String(value);
}

function commitmentQuantityToString(value?: string | number | null): string {
	if (value == null || value === '') return '';
	return String(value);
}

function subscriptionChargeCommitmentConfigFromState(state: SubscriptionChargeCommitmentState): Partial<LineItemCommitmentConfig> {
	const config: Partial<LineItemCommitmentConfig> = {
		commitment_type: state.commitmentType,
		overage_factor: parseFloat(state.overageFactor) || 1.0,
		enable_true_up: state.enableTrueUp,
		is_window_commitment: state.windowCommitment,
		commitment_duration: state.commitmentDuration ? (state.commitmentDuration as BILLING_PERIOD) : undefined,
	};

	if (state.commitmentType === CommitmentType.AMOUNT) {
		config.commitment_amount = state.commitmentAmount ? parseFloat(removeFormatting(state.commitmentAmount)) : undefined;
	} else {
		config.commitment_quantity = state.commitmentQuantity ? parseInt(state.commitmentQuantity, 10) : undefined;
	}

	return config;
}

function hasConfiguredBaseCommitment(config: Partial<LineItemCommitmentConfig>): boolean {
	const hasAmount = config.commitment_amount !== undefined && config.commitment_amount !== null && config.commitment_amount > 0;
	const hasQuantity = config.commitment_quantity !== undefined && config.commitment_quantity !== null && config.commitment_quantity > 0;
	return hasAmount || hasQuantity;
}

function applyBaseCommitmentConfigToRequest<
	T extends Pick<
		CreateSubscriptionLineItemRequest,
		| 'commitment_amount'
		| 'commitment_quantity'
		| 'commitment_type'
		| 'commitment_overage_factor'
		| 'commitment_true_up_enabled'
		| 'commitment_duration'
	>,
>(request: T, config: Partial<LineItemCommitmentConfig>): void {
	const commitmentType = resolveCommitmentTypeFromConfig(config);
	request.commitment_type = commitmentType;

	if (config.commitment_amount != null) {
		request.commitment_amount = config.commitment_amount;
	}
	if (config.commitment_quantity != null) {
		request.commitment_quantity = config.commitment_quantity;
	}
	if (config.overage_factor != null) {
		request.commitment_overage_factor = config.overage_factor;
	}
	if (config.enable_true_up != null) {
		request.commitment_true_up_enabled = config.enable_true_up;
	}
	if (config.commitment_duration) {
		request.commitment_duration = config.commitment_duration;
	}
}

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
	return lineItemWindowCommitmentStateFromBuckets(item, item.commitment_time_buckets ?? []);
}

export function lineItemHasWindowCommitment(
	lineItem: Pick<CommitmentLineItemSource, 'commitment_windowed' | 'commitment_time_buckets'>,
): boolean {
	return !!lineItem.commitment_windowed || (lineItem.commitment_time_buckets?.length ?? 0) > 0;
}

export function lineItemHasCommitment(
	lineItem: Pick<CommitmentLineItemSource, 'commitment_amount' | 'commitment_quantity' | 'commitment_windowed' | 'commitment_time_buckets'>,
): boolean {
	if (lineItemHasWindowCommitment(lineItem)) return true;

	const amount = lineItem.commitment_amount;
	if (amount != null && amount !== '' && Number(amount) > 0) return true;

	const quantity = lineItem.commitment_quantity;
	if (quantity != null && quantity !== '' && Number(quantity) > 0) return true;

	return false;
}

/** Collect unique bucket price IDs that need fetching when inline price is omitted. */
export function collectCommitmentBucketPriceIds(buckets: CommitmentTimeBucket[]): string[] {
	return [...new Set(buckets.filter((bucket) => !bucket.price && bucket.price_id).map((bucket) => bucket.price_id!))];
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
	lineItem: CommitmentLineItemSource,
	buckets: CommitmentTimeBucket[],
): SubscriptionChargeCommitmentState {
	const hydratedBuckets = hydrateCommitmentTimeBucketsForDisplay(buckets);
	const commitmentType = lineItem.commitment_type
		? normalizeCommitmentType(lineItem.commitment_type)
		: resolveCommitmentTypeFromBuckets(hydratedBuckets);

	return {
		commitmentType,
		commitmentAmount: commitmentAmountToString(lineItem.commitment_amount),
		commitmentQuantity: commitmentQuantityToString(lineItem.commitment_quantity),
		overageFactor: lineItem.commitment_overage_factor != null ? String(lineItem.commitment_overage_factor) : '1.0',
		enableTrueUp: lineItem.commitment_true_up_enabled ?? false,
		commitmentDuration: lineItem.commitment_duration ? String(lineItem.commitment_duration).toUpperCase() : '',
		windowCommitment: lineItemHasWindowCommitment(lineItem),
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

/** Build PUT /subscriptions/lineitems/:id payload for commitment updates. */
export function buildLineItemCommitmentUpdatePayload(
	commitmentState: SubscriptionChargeCommitmentState,
	lineItem: LineItem,
	/**
	 * Bucket size to validate/normalize time buckets against. Pass the pending price override's
	 * bucket_size when the same submission also changes it - otherwise buckets get validated and
	 * normalized against the line item's current (stale) bucket_size while the merged update sends
	 * the new one, which can reject valid edits or persist misaligned time ranges.
	 */
	effectiveBucketSize?: BUCKET_SIZE | string | null,
): LineItemCommitmentUpdateResult {
	const config = subscriptionChargeCommitmentConfigFromState(commitmentState);
	const validationError = validateCommitment(config);
	if (validationError) {
		return { ok: false, error: validationError };
	}

	const payload: UpdateSubscriptionLineItemRequest = {};

	if (hasConfiguredBaseCommitment(config) || commitmentState.windowCommitment) {
		applyBaseCommitmentConfigToRequest(payload, config);
	}

	if (!commitmentState.windowCommitment) {
		return {
			ok: true,
			payload: {
				...payload,
				commitment_windowed: false,
				commitment_time_buckets: [],
			},
		};
	}

	const priceContext = bucketPriceContextFromLineItemRecord(lineItem);
	if (!priceContext) {
		return { ok: false, error: 'commitmentConfig.addCharge.selectMeterForBuckets' };
	}

	const bucketSize = effectiveBucketSize !== undefined ? effectiveBucketSize : lineItem.price?.bucket_size;
	const validation = normalizeTimeBucketDraftsOrError(commitmentState.timeBuckets, commitmentState.commitmentType, bucketSize, {
		requireCommitmentFields: true,
		requireBucketPrice: true,
		requireNonEmpty: false,
		priceContext,
	});

	if ('error' in validation) {
		return { ok: false, error: validation.error };
	}

	const existingById = new Map((lineItem.commitment_time_buckets ?? []).filter((b) => b.id).map((b) => [b.id!, b]));

	const minutesEnabled = getCommitmentTimeBucketConstraints(bucketSize).minutesEnabled;

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
			...payload,
			commitment_windowed: true,
			commitment_time_buckets: buckets,
		},
	};
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
	bucket_size?: BUCKET_SIZE | string | null;
};

export function formatWindowCommitmentError(
	error: string,
	t: (key: string, options?: { defaultValue?: string; step?: string }) => string,
): string {
	const mappedValidation = mapCommitmentValidationError(error, t);
	if (mappedValidation !== error) {
		return mappedValidation;
	}

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
 * Attach base line-item commitment fields to a subscription line item request.
 * Returns a validation message when invalid.
 */
export function applyBaseCommitmentToLineItem(
	request: CreateSubscriptionLineItemRequest,
	commitmentState: SubscriptionChargeCommitmentState,
): { error: string } | null {
	const config = subscriptionChargeCommitmentConfigFromState(commitmentState);
	const validationError = validateCommitment(config);
	if (validationError) {
		return { error: validationError };
	}

	if (!hasConfiguredBaseCommitment(config) && !commitmentState.windowCommitment) {
		return null;
	}

	if (hasConfiguredBaseCommitment(config) || commitmentState.windowCommitment) {
		applyBaseCommitmentConfigToRequest(request, config);
	}

	return null;
}

/**
 * Attach window commitment time buckets to a subscription line item request.
 * Returns an i18n error key or raw validation message when invalid.
 */
export function applyWindowCommitmentToLineItem(
	request: CreateSubscriptionLineItemRequest,
	commitmentState: SubscriptionChargeCommitmentState,
	partial: ApplyWindowCommitmentInput,
): { error: string } | null {
	const baseError = applyBaseCommitmentToLineItem(request, commitmentState);
	if (baseError) {
		return baseError;
	}

	if (!commitmentState.windowCommitment) {
		return null;
	}

	if (!partial.meter_id) {
		return { error: 'commitmentConfig.addCharge.selectMeterForBuckets' };
	}

	const result = normalizeTimeBucketDraftsOrError(commitmentState.timeBuckets, commitmentState.commitmentType, partial.bucket_size, {
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
	});

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
): CreateSubscriptionLineItemRequest {
	if (!item.commitment_windowed || !item.commitment_time_buckets?.length) {
		return item;
	}

	const priceContext = bucketPriceContextFromLineItem(item, currency);
	if (!priceContext) return item;

	const buckets = normalizeCommitmentTimeBuckets(item.commitment_time_buckets, item.price?.bucket_size).map((bucket) => {
		const draft = bucket as CommitmentTimeBucketDraft;
		const hasInlinePrice = bucket.price && (bucket.price.amount || bucket.price.tiers?.length || bucket.price.billing_model);

		return {
			...bucket,
			price: hasInlinePrice ? bucket.price : buildBucketPriceFromDraft(draft, priceContext),
		};
	});

	return {
		...item,
		price: item.price ? { ...item.price, currency: item.price.currency ?? currency.toLowerCase() } : item.price,
		commitment_windowed: true,
		commitment_time_buckets: buckets,
	};
}
