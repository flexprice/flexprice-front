import { removeFormatting } from '@/components/atoms/Input/inputFormatting';
import { BILLING_PERIOD } from '@/constants/constants';
import { BUCKET_SIZE } from '@/models/Meter';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, PRICE_TYPE, PRICE_UNIT_TYPE, TIER_MODE } from '@/models/Price';
import type { CreatePriceTier } from '@/models/Price';
import type { CommitmentTimeBucket, CommitmentTimeBucketPrice } from '@/types/dto/CommitmentTimeBucket';
import type { CommitmentTimePoint } from '@/types/dto/CommitmentTimeBucket';
import { CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import { validateCommitmentTimeBuckets, getCommitmentTimeBucketConstraints } from '@/utils/common/commitment_helpers';

export const UNSET_TIME_VALUE = -1;

/** UI select value; maps to TIERED + SLAB tier mode. */
export type BillingModelSelectValue = BILLING_MODEL | 'SLAB_TIERED';

export type BucketTierDraft = {
	up_to?: number | null;
	unit_amount: string;
	flat_amount?: string;
};

export type CommitmentTimeBucketDefaults = {
	commitment_type?: CommitmentType;
	commitment_value?: string;
	overage_factor?: string;
	true_up_enabled?: boolean;
	bucket_amount?: string;
	billing_model?: BillingModelSelectValue;
	bucket_tiers?: BucketTierDraft[];
	transform_quantity_divide_by?: string;
};

export type CommitmentTimeBucketDraft = {
	id?: string;
	start: CommitmentTimePoint;
	end: CommitmentTimePoint;
	commitment_type?: CommitmentType;
	commitment_value?: string;
	overage_factor?: string;
	true_up_enabled?: boolean;
	bucket_amount?: string;
	billing_model?: BillingModelSelectValue;
	bucket_tiers?: BucketTierDraft[];
	transform_quantity_divide_by?: string;
};

export type BucketPriceContext = {
	meter_id: string;
	currency: string;
	billing_period: BILLING_PERIOD;
	type?: PRICE_TYPE;
	price_unit_type?: PRICE_UNIT_TYPE;
	invoice_cadence?: INVOICE_CADENCE;
	display_name?: string;
};

export type BucketPriceSource = {
	billing_model?: BILLING_MODEL;
	tier_mode?: TIER_MODE;
	amount?: string;
	tiers?: Array<{ up_to?: number | null; unit_amount?: string; flat_amount?: string }> | null;
	transform_quantity?: { divide_by?: number } | null;
};

export function billingModelSelectValueFromPrice(price?: BucketPriceSource): BillingModelSelectValue {
	if (!price) return BILLING_MODEL.FLAT_FEE;

	const hasTiers = (price.tiers?.length ?? 0) > 0;
	const tierMode = price.tier_mode;

	if (price.billing_model === BILLING_MODEL.TIERED && tierMode === TIER_MODE.SLAB) {
		return 'SLAB_TIERED';
	}
	if (price.billing_model === BILLING_MODEL.TIERED) {
		return BILLING_MODEL.TIERED;
	}
	if (hasTiers) {
		return tierMode === TIER_MODE.SLAB ? 'SLAB_TIERED' : BILLING_MODEL.TIERED;
	}
	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		return BILLING_MODEL.PACKAGE;
	}
	if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
		return BILLING_MODEL.FLAT_FEE;
	}
	// Legacy prices may omit billing_model but include transform_quantity
	if (price.transform_quantity?.divide_by) {
		return BILLING_MODEL.PACKAGE;
	}

	return price.billing_model ?? BILLING_MODEL.FLAT_FEE;
}

export function resolveBillingModelFromSelect(value: BillingModelSelectValue): {
	billing_model: BILLING_MODEL;
	tier_mode?: TIER_MODE;
} {
	if (value === 'SLAB_TIERED') {
		return { billing_model: BILLING_MODEL.TIERED, tier_mode: TIER_MODE.SLAB };
	}
	if (value === BILLING_MODEL.TIERED) {
		return { billing_model: BILLING_MODEL.TIERED, tier_mode: TIER_MODE.VOLUME };
	}
	return { billing_model: value };
}

/** Resolve the billing model select value from draft fields (explicit model, tiers, or defaults). */
export function resolveDraftBillingModelSelect(
	draft: CommitmentTimeBucketDraft,
	defaults?: CommitmentTimeBucketDefaults,
): BillingModelSelectValue {
	if (draft.billing_model) return draft.billing_model;
	if (draft.bucket_tiers?.some((tier) => tier.unit_amount.trim())) {
		return 'SLAB_TIERED';
	}
	if (draft.transform_quantity_divide_by?.trim()) {
		return BILLING_MODEL.PACKAGE;
	}
	if (defaults?.billing_model) return defaults.billing_model;
	return BILLING_MODEL.FLAT_FEE;
}

/** Resolve commitment type from draft fields, falling back when unset. */
export function resolveDraftCommitmentType(
	draft: CommitmentTimeBucketDraft,
	fallback: CommitmentType = CommitmentType.AMOUNT,
): CommitmentType {
	return normalizeCommitmentType(draft.commitment_type, fallback);
}

export function buildCommitmentTimeBucketDefaults(
	price: BucketPriceSource,
	{
		commitmentType,
		commitmentValue,
		overageFactor,
		trueUpEnabled,
	}: {
		commitmentType: CommitmentType;
		commitmentValue?: string;
		overageFactor?: string;
		trueUpEnabled?: boolean;
	},
): CommitmentTimeBucketDefaults {
	return {
		commitment_type: commitmentType,
		commitment_value: commitmentValue,
		overage_factor: overageFactor,
		true_up_enabled: trueUpEnabled,
		...bucketDefaultsFromPrice(price),
	};
}

export function bucketDefaultsFromPrice(price?: BucketPriceSource): CommitmentTimeBucketDefaults {
	return {
		billing_model: BILLING_MODEL.FLAT_FEE,
		bucket_amount: price?.amount,
	};
}

export function createDefaultSlabTiers(): BucketTierDraft[] {
	return [
		{ up_to: 1, unit_amount: '', flat_amount: '0' },
		{ up_to: null, unit_amount: '', flat_amount: '0' },
	];
}

/** Normalize API/UI commitment type strings to the enum. */
export function normalizeCommitmentType(
	value?: string | CommitmentType | null,
	fallback: CommitmentType = CommitmentType.AMOUNT,
): CommitmentType {
	if (value === CommitmentType.QUANTITY || value === 'quantity') return CommitmentType.QUANTITY;
	if (value === CommitmentType.AMOUNT || value === 'amount') return CommitmentType.AMOUNT;
	return fallback;
}

export function isTieredBillingModel(model: BillingModelSelectValue): boolean {
	return model === BILLING_MODEL.TIERED || model === 'SLAB_TIERED';
}

export function isSlabBillingModel(model: BillingModelSelectValue): boolean {
	return model === 'SLAB_TIERED';
}

export const EMPTY_BUCKET_TIER_ROW = { from: 0, up_to: null as number | null, unit_amount: '', flat_amount: '0' };

export function mapBucketTiersToFormTiers(tiers: BucketTierDraft[]) {
	return tiers.map((tier, index, allTiers) => ({
		from: index === 0 ? 0 : (allTiers[index - 1]?.up_to ?? 0),
		up_to: tier.up_to ?? null,
		unit_amount: tier.unit_amount || '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

export function mapFormTiersToBucketTiers(
	tiers: Array<{ up_to?: number | null; unit_amount?: string; flat_amount?: string }>,
): BucketTierDraft[] {
	return tiers.map((tier) => ({
		up_to: tier.up_to,
		unit_amount: tier.unit_amount || '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

export function getBucketTierFormRows(tiers?: BucketTierDraft[]) {
	const source = tiers?.length ? tiers : createDefaultSlabTiers();
	return source.length > 0 ? mapBucketTiersToFormTiers(source) : [EMPTY_BUCKET_TIER_ROW];
}

export function createEmptyTimeBucketDraft(defaults?: CommitmentTimeBucketDefaults): CommitmentTimeBucketDraft {
	const commitmentValue = defaults?.commitment_value ?? '';
	const billing_model = defaults?.billing_model ?? BILLING_MODEL.FLAT_FEE;
	const isTiered = billing_model === BILLING_MODEL.TIERED || billing_model === 'SLAB_TIERED';

	return {
		start: { hour: UNSET_TIME_VALUE, minute: UNSET_TIME_VALUE },
		end: { hour: UNSET_TIME_VALUE, minute: UNSET_TIME_VALUE },
		commitment_type: defaults?.commitment_type ?? CommitmentType.AMOUNT,
		commitment_value: commitmentValue,
		overage_factor: defaults?.overage_factor ?? '',
		true_up_enabled: defaults?.true_up_enabled ?? false,
		bucket_amount: defaults?.bucket_amount,
		billing_model,
		bucket_tiers: defaults?.bucket_tiers ?? (isTiered ? createDefaultSlabTiers() : undefined),
		transform_quantity_divide_by: defaults?.transform_quantity_divide_by,
	};
}

function mapTiersToDraft(
	tiers?: Array<{ up_to?: number | null; unit_amount?: string; flat_amount?: string }> | null,
): BucketTierDraft[] | undefined {
	if (!tiers?.length) return undefined;
	return tiers.map((tier) => ({
		up_to: tier.up_to ?? null,
		unit_amount: tier.unit_amount ?? '',
		flat_amount: tier.flat_amount ?? '0',
	}));
}

/** Normalize bucket inline prices for read-only display when API returns partial price data. */
export function hydrateCommitmentTimeBucketsForDisplay(buckets: CommitmentTimeBucket[]): CommitmentTimeBucket[] {
	return buckets.map((bucket) => {
		if (!bucket.price) return bucket;

		const { lookup_key: _lookupKey, ...priceWithoutLookupKey } = bucket.price;
		void _lookupKey;

		const billing_model = billingModelSelectValueFromPrice(priceWithoutLookupKey);
		const { billing_model: resolvedModel, tier_mode } = resolveBillingModelFromSelect(billing_model);

		return {
			...bucket,
			price: {
				...priceWithoutLookupKey,
				billing_model: resolvedModel,
				...(resolvedModel === BILLING_MODEL.TIERED
					? {
							tier_mode: tier_mode ?? TIER_MODE.VOLUME,
							tiers: priceWithoutLookupKey.tiers ?? [],
						}
					: {}),
			},
		};
	});
}

export function timeBucketToDraft(bucket: CommitmentTimeBucket): CommitmentTimeBucketDraft {
	const hydratedPrice = bucket.price ? hydrateCommitmentTimeBucketsForDisplay([bucket])[0]?.price : undefined;
	const billing_model = billingModelSelectValueFromPrice(hydratedPrice);
	const tierDrafts = mapTiersToDraft(hydratedPrice?.tiers);

	return {
		id: bucket.id,
		start: bucket.start,
		end: bucket.end,
		commitment_type: bucket.commitment_type ? normalizeCommitmentType(bucket.commitment_type) : undefined,
		commitment_value: bucket.commitment_value,
		overage_factor: bucket.overage_factor,
		true_up_enabled: bucket.true_up_enabled,
		bucket_amount: hydratedPrice?.amount,
		billing_model,
		bucket_tiers: tierDrafts,
		transform_quantity_divide_by: hydratedPrice?.transform_quantity?.divide_by
			? String(hydratedPrice.transform_quantity.divide_by)
			: undefined,
	};
}

function buildTiersFromDraft(draft: CommitmentTimeBucketDraft): CreatePriceTier[] {
	return (draft.bucket_tiers ?? [])
		.filter((tier) => tier.unit_amount.trim() || tier.flat_amount?.trim())
		.map((tier) => ({
			...(tier.up_to != null ? { up_to: tier.up_to } : {}),
			unit_amount: removeFormatting(tier.unit_amount),
			...(tier.flat_amount?.trim() ? { flat_amount: removeFormatting(tier.flat_amount) } : { flat_amount: '0' }),
		}));
}

export function buildBucketPriceFromDraft(draft: CommitmentTimeBucketDraft, context: BucketPriceContext): CommitmentTimeBucketPrice {
	const base: CommitmentTimeBucketPrice = {
		type: context.type ?? PRICE_TYPE.USAGE,
		price_unit_type: context.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		billing_period: context.billing_period,
		billing_period_count: 1,
		billing_model: BILLING_MODEL.FLAT_FEE,
		invoice_cadence: context.invoice_cadence ?? INVOICE_CADENCE.ARREAR,
		currency: context.currency.toLowerCase(),
		meter_id: context.meter_id,
		display_name: context.display_name,
	};

	const selectValue = resolveDraftBillingModelSelect(draft);
	const { billing_model, tier_mode } = resolveBillingModelFromSelect(selectValue);
	const amount = draft.bucket_amount?.trim() ? removeFormatting(draft.bucket_amount) : undefined;

	if (billing_model === BILLING_MODEL.TIERED) {
		return {
			...base,
			billing_model: BILLING_MODEL.TIERED,
			tier_mode: tier_mode ?? TIER_MODE.VOLUME,
			tiers: buildTiersFromDraft(draft),
		};
	}

	if (billing_model === BILLING_MODEL.PACKAGE) {
		const divideBy = parseInt(draft.transform_quantity_divide_by ?? '1', 10);
		return {
			...base,
			billing_model: BILLING_MODEL.PACKAGE,
			...(amount ? { amount } : {}),
			transform_quantity: {
				divide_by: Number.isFinite(divideBy) && divideBy > 0 ? divideBy : 1,
				round: 'up',
			},
		};
	}

	return {
		...base,
		billing_model: BILLING_MODEL.FLAT_FEE,
		...(amount ? { amount } : {}),
	};
}

export function timeBucketFromDraft(
	draft: CommitmentTimeBucketDraft,
	commitmentType: CommitmentType,
	minutesEnabled: boolean,
	priceContext?: BucketPriceContext,
): CommitmentTimeBucket {
	const commitment_value = draft.commitment_value?.trim() || undefined;
	const resolvedCommitmentType = resolveDraftCommitmentType(draft, commitmentType);

	return {
		start: {
			hour: draft.start.hour,
			minute: minutesEnabled ? draft.start.minute : 0,
		},
		end: {
			hour: draft.end.hour,
			minute: minutesEnabled ? draft.end.minute : 0,
		},
		commitment_type: resolvedCommitmentType,
		commitment_value,
		overage_factor: draft.overage_factor?.trim() || '1',
		true_up_enabled: draft.true_up_enabled ?? false,
		...(priceContext ? { price: buildBucketPriceFromDraft(draft, priceContext) } : {}),
	};
}

function isTimePointComplete(point: CommitmentTimePoint, minutesEnabled: boolean): boolean {
	if (point.hour === UNSET_TIME_VALUE) return false;
	if (minutesEnabled && point.minute === UNSET_TIME_VALUE) return false;
	return true;
}

export function cleanTimeBucketDraftForSave(
	draft: CommitmentTimeBucketDraft,
	fallbackCommitmentType: CommitmentType = CommitmentType.AMOUNT,
): CommitmentTimeBucketDraft {
	const commitmentType = resolveDraftCommitmentType(draft, fallbackCommitmentType);
	return {
		...draft,
		commitment_type: commitmentType,
		commitment_value:
			commitmentType === CommitmentType.AMOUNT && draft.commitment_value
				? removeFormatting(draft.commitment_value)
				: draft.commitment_value,
		bucket_amount: draft.bucket_amount ? removeFormatting(draft.bucket_amount) : draft.bucket_amount,
	};
}

export function timeBucketsFromDrafts(
	drafts: CommitmentTimeBucketDraft[],
	fallbackCommitmentType: CommitmentType,
	minutesEnabled: boolean,
	priceContext?: BucketPriceContext,
): CommitmentTimeBucket[] {
	return drafts.map((draft) => {
		const commitmentType = resolveDraftCommitmentType(draft, fallbackCommitmentType);
		return timeBucketFromDraft(cleanTimeBucketDraftForSave(draft, commitmentType), commitmentType, minutesEnabled, priceContext);
	});
}

export type NormalizeTimeBucketDraftsOptions = {
	requireCommitmentFields?: boolean;
	requireBucketPrice?: boolean;
	requireNonEmpty?: boolean;
	priceContext?: BucketPriceContext;
};

/** Validate draft rows and convert to API buckets, or return an error message. */
export function normalizeTimeBucketDraftsOrError(
	drafts: CommitmentTimeBucketDraft[],
	commitmentType: CommitmentType,
	bucketSize?: BUCKET_SIZE | string | null,
	options?: NormalizeTimeBucketDraftsOptions,
): { buckets: CommitmentTimeBucket[] } | { error: string } {
	const { requireCommitmentFields = true, requireBucketPrice = false, requireNonEmpty = true, priceContext } = options ?? {};
	const { minutesEnabled } = getCommitmentTimeBucketConstraints(bucketSize);

	if (requireNonEmpty && drafts.length === 0) {
		return { error: 'No time buckets configured' };
	}

	const incomplete = drafts.some(
		(bucket) =>
			!isTimeBucketDraftComplete(bucket, minutesEnabled, {
				requireCommitmentFields,
				requireBucketPrice,
			}),
	);
	if (incomplete) {
		return { error: 'Please complete commitment fields for all time buckets' };
	}

	const buckets = timeBucketsFromDrafts(drafts, commitmentType, minutesEnabled, priceContext);
	const rangeError = validateCommitmentTimeBuckets(buckets, bucketSize);
	if (rangeError) {
		return { error: rangeError };
	}

	return { buckets };
}

export function isTimeBucketDraftComplete(
	draft: CommitmentTimeBucketDraft,
	minutesEnabled: boolean,
	options?: { requireCommitmentFields?: boolean; requireBucketPrice?: boolean },
): boolean {
	if (!isTimePointComplete(draft.start, minutesEnabled) || !isTimePointComplete(draft.end, minutesEnabled)) {
		return false;
	}

	if (options?.requireCommitmentFields) {
		if (!draft.commitment_value?.trim()) return false;
		const overage = parseFloat(draft.overage_factor ?? '');
		if (!Number.isFinite(overage) || overage < 1) return false;
	}

	if (options?.requireBucketPrice) {
		const selectValue = resolveDraftBillingModelSelect(draft);
		const { billing_model } = resolveBillingModelFromSelect(selectValue);

		if (billing_model === BILLING_MODEL.TIERED) {
			const hasTier = draft.bucket_tiers?.some((tier) => tier.unit_amount.trim());
			if (!hasTier) return false;
		} else if (billing_model === BILLING_MODEL.PACKAGE) {
			if (!draft.bucket_amount?.trim()) return false;
			const divideBy = parseInt(draft.transform_quantity_divide_by ?? '', 10);
			if (!Number.isFinite(divideBy) || divideBy < 1) return false;
		} else if (!draft.bucket_amount?.trim()) {
			return false;
		}
	}

	return true;
}
