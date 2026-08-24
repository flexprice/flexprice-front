import { BILLING_PERIOD } from '@/constants/constants';
import { BUCKET_SIZE } from '@/models/Meter';
import { BILLING_MODEL, Price } from '@/models/Price';
import { CommitmentType, LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import type { CommitmentTimeBucket, CommitmentTimeBucketPrice, CommitmentTimePoint } from '@/types/dto/CommitmentTimeBucket';
import {
	buildBucketPriceFromDraft,
	cleanTimeBucketDraftForSave,
	normalizeCommitmentType,
	resolveDraftBillingModelSelect,
	resolveBillingModelFromSelect,
	timeBucketToDraft,
	type BucketPriceContext,
} from '@/utils/common/commitment_time_bucket_draft';
import type { ExtendedPriceOverride } from './price_override_helpers';

/**
 * Check if a price has commitment configured
 */
export const hasCommitment = (priceId: string, commitments: LineItemCommitmentsMap): boolean => {
	return commitments[priceId] !== undefined;
};

/**
 * Get commitment config for a specific price
 */
export const getCommitmentConfig = (priceId: string, commitments: LineItemCommitmentsMap): LineItemCommitmentConfig | undefined => {
	return commitments[priceId];
};

/**
 * Validate commitment configuration
 * Returns error message if invalid, null if valid
 * Matches backend validation logic: only validates if commitment is configured
 */
export const validateCommitment = (config: Partial<LineItemCommitmentConfig>): string | null => {
	const hasAmountCommitment = config.commitment_amount !== undefined && config.commitment_amount !== null && config.commitment_amount > 0;
	const hasQuantityCommitment =
		config.commitment_quantity !== undefined && config.commitment_quantity !== null && config.commitment_quantity > 0;
	const hasCommitment = hasAmountCommitment || hasQuantityCommitment;

	// No commitment configured, nothing to validate
	if (!hasCommitment) {
		return null;
	}

	// Rule 1: Cannot set both commitment_amount and commitment_quantity
	if (hasAmountCommitment && hasQuantityCommitment) {
		return 'Cannot set both commitment_amount and commitment_quantity';
	}

	// Rule 2: Validate commitment type matches the provided field
	if (config.commitment_type) {
		if (hasAmountCommitment && config.commitment_type !== CommitmentType.AMOUNT) {
			return 'When commitment_amount is set, commitment_type must be "amount"';
		}
		if (hasQuantityCommitment && config.commitment_type !== CommitmentType.QUANTITY) {
			return 'When commitment_quantity is set, commitment_type must be "quantity"';
		}
	}

	// Rule 3: Overage factor is required and must be at least 1.0 when commitment is set
	if (config.overage_factor === undefined || config.overage_factor === null) {
		return 'Overage factor is required when commitment is set';
	}

	if (config.overage_factor < 1) {
		return 'Overage factor must be at least 1.0';
	}

	// Rule 4: Validate commitment values are non-negative
	if (hasAmountCommitment && config.commitment_amount! < 0) {
		return 'Commitment amount must be non-negative';
	}

	if (hasQuantityCommitment && config.commitment_quantity! < 0) {
		return 'Commitment quantity must be non-negative';
	}

	return null;
};

/**
 * Format commitment configuration for display
 */
export const formatCommitmentSummary = (config: LineItemCommitmentConfig): string => {
	const parts: string[] = [];

	// Determine commitment type from the fields if not explicitly set
	const commitmentType =
		config.commitment_type ||
		(config.commitment_amount !== undefined && config.commitment_amount !== null
			? CommitmentType.AMOUNT
			: config.commitment_quantity !== undefined && config.commitment_quantity !== null
				? CommitmentType.QUANTITY
				: null);

	if (commitmentType === CommitmentType.AMOUNT && config.commitment_amount != null) {
		parts.push(`$${config.commitment_amount.toLocaleString()} commitment`);
	} else if (commitmentType === CommitmentType.QUANTITY && config.commitment_quantity != null) {
		parts.push(`${config.commitment_quantity.toLocaleString()} units commitment`);
	} else if (config.is_window_commitment && config.commitment_time_buckets?.length) {
		parts.push(`${config.commitment_time_buckets.length} time bucket(s)`);
	}

	if (config.overage_factor && config.overage_factor !== 1) {
		parts.push(`${config.overage_factor}x overage`);
	}

	if (config.enable_true_up) {
		parts.push('true-up enabled');
	}

	if (config.is_window_commitment) {
		parts.push('windowed');
	}

	if (config.commitment_duration) {
		parts.push(`${config.commitment_duration.toLowerCase().replace('_', ' ')} period`);
	}

	return parts.join(' • ');
};

const HOUR_BUCKET_SIZES: BUCKET_SIZE[] = [
	BUCKET_SIZE.WindowSizeHour,
	BUCKET_SIZE.WindowSize3Hour,
	BUCKET_SIZE.WindowSize6Hour,
	BUCKET_SIZE.WindowSize12Hour,
];

const MINUTE_BUCKET_SIZES: BUCKET_SIZE[] = [BUCKET_SIZE.WindowSizeMinute, BUCKET_SIZE.WindowSize15Min, BUCKET_SIZE.WindowSize30Min];

/**
 * Effective window size for a price: price-level bucket_size wins, falling back to the
 * meter's when the price has none. Mirrors the backend's ResolveBucketSize (price-then-meter) -
 * legacy prices synced from a bucketed meter before price-level bucket_size existed are never
 * migrated, so they carry the window size on the meter only.
 */
export const resolveBucketSize = (price?: Price | null): BUCKET_SIZE | string | null => {
	return price?.bucket_size ?? price?.meter?.aggregation?.bucket_size ?? null;
};

/**
 * Check if a price/meter supports window commitment
 * Window commitment is only available for meters with bucket_size configured
 */
export const supportsWindowCommitment = (price: Price): boolean => {
	return resolveBucketSize(price) !== null;
};

export const isHourBucketSize = (bucketSize?: BUCKET_SIZE | string | null): boolean => {
	if (!bucketSize) return false;
	return HOUR_BUCKET_SIZES.includes(bucketSize as BUCKET_SIZE);
};

export type CommitmentTimeBucketConstraints = {
	minutesEnabled: boolean;
	minuteStep: number;
	hourStep: number;
};

/** Window-size rules for commitment time bucket start/end pickers and validation. */
export function getCommitmentTimeBucketConstraints(bucketSize?: BUCKET_SIZE | string | null): CommitmentTimeBucketConstraints {
	switch (bucketSize) {
		case BUCKET_SIZE.WindowSize15Min:
			return { minutesEnabled: true, minuteStep: 15, hourStep: 1 };
		case BUCKET_SIZE.WindowSize30Min:
			return { minutesEnabled: true, minuteStep: 30, hourStep: 1 };
		case BUCKET_SIZE.WindowSizeMinute:
			return { minutesEnabled: true, minuteStep: 1, hourStep: 1 };
		case BUCKET_SIZE.WindowSize3Hour:
			return { minutesEnabled: false, minuteStep: 1, hourStep: 3 };
		case BUCKET_SIZE.WindowSize6Hour:
			return { minutesEnabled: false, minuteStep: 1, hourStep: 6 };
		case BUCKET_SIZE.WindowSize12Hour:
			return { minutesEnabled: false, minuteStep: 1, hourStep: 12 };
		case BUCKET_SIZE.WindowSizeHour:
		default:
			return { minutesEnabled: false, minuteStep: 1, hourStep: 1 };
	}
}

export function buildCommitmentTimeValues(max: number, step: number): number[] {
	const values: number[] = [];
	for (let i = 0; i <= max; i += step) {
		values.push(i);
	}
	return values;
}

function isUnsetTimeValue(value: number): boolean {
	return value < 0;
}

function validateCommitmentTimePoint(point: CommitmentTimePoint, constraints: CommitmentTimeBucketConstraints): string | null {
	if (isUnsetTimeValue(point.hour)) return null;

	if (point.hour < 0 || point.hour > 23) {
		return 'Hour must be between 0 and 23';
	}
	if (constraints.hourStep > 1 && point.hour % constraints.hourStep !== 0) {
		return `Hour must be a multiple of ${constraints.hourStep}`;
	}

	if (constraints.minutesEnabled) {
		if (isUnsetTimeValue(point.minute)) return null;
		if (point.minute < 0 || point.minute > 59) {
			return 'Minute must be between 0 and 59';
		}
		if (constraints.minuteStep > 1 && point.minute % constraints.minuteStep !== 0) {
			return `Minute must be a multiple of ${constraints.minuteStep}`;
		}
	}

	return null;
}

/** Returns false when a complete time point violates the meter window-size step rules. */
export function isCommitmentTimePointAligned(point: CommitmentTimePoint, constraints: CommitmentTimeBucketConstraints): boolean {
	return validateCommitmentTimePoint(point, constraints) === null;
}

/**
 * Time buckets are only configurable when the meter window size is hours or minutes.
 */
export const supportsCommitmentTimeBuckets = (price: Price): boolean => {
	const bucketSize = resolveBucketSize(price);
	if (!bucketSize) return false;
	return isHourBucketSize(bucketSize) || MINUTE_BUCKET_SIZES.includes(bucketSize as BUCKET_SIZE);
};

export const normalizeCommitmentTimeBuckets = (
	buckets: CommitmentTimeBucket[],
	bucketSize?: BUCKET_SIZE | string | null,
): CommitmentTimeBucket[] => {
	const { minutesEnabled } = getCommitmentTimeBucketConstraints(bucketSize);
	return buckets.map((bucket) => ({
		...bucket,
		start: {
			hour: bucket.start.hour,
			minute: minutesEnabled ? bucket.start.minute : 0,
		},
		end: {
			hour: bucket.end.hour,
			minute: minutesEnabled ? bucket.end.minute : 0,
		},
	}));
};

const getCommitmentValueString = (config: LineItemCommitmentConfig): string | undefined => {
	if (config.commitment_type === CommitmentType.QUANTITY || config.commitment_quantity != null) {
		return config.commitment_quantity != null ? String(config.commitment_quantity) : undefined;
	}
	if (config.commitment_amount != null) {
		return String(config.commitment_amount);
	}
	return undefined;
};

const resolveCommitmentType = (config: LineItemCommitmentConfig): CommitmentType => {
	return normalizeCommitmentType(
		config.commitment_type ?? (config.commitment_quantity != null ? CommitmentType.QUANTITY : CommitmentType.AMOUNT),
	);
};

/** Build the inline price payload for a commitment time bucket. */
export const priceToCommitmentBucketPrice = (price: Price, override?: Pick<ExtendedPriceOverride, 'amount'>): CommitmentTimeBucketPrice => {
	const bucketPrice: CommitmentTimeBucketPrice = {
		type: price.type,
		price_unit_type: price.price_unit_type,
		billing_period: price.billing_period as BILLING_PERIOD,
		billing_period_count: 1,
		billing_model: price.billing_model,
		invoice_cadence: price.invoice_cadence,
		currency: price.currency.toLowerCase(),
		amount: override?.amount ?? price.amount,
	};

	if (price.meter_id) bucketPrice.meter_id = price.meter_id;
	if (price.filter_values) bucketPrice.filter_values = price.filter_values;
	if (price.tier_mode) bucketPrice.tier_mode = price.tier_mode;
	if (price.tiers?.length) bucketPrice.tiers = price.tiers;
	if (price.transform_quantity) bucketPrice.transform_quantity = price.transform_quantity;
	if (price.price_unit_config) bucketPrice.price_unit_config = price.price_unit_config;
	if (price.display_name) bucketPrice.display_name = price.display_name;
	if (price.description) bucketPrice.description = price.description;
	if (price.trial_period_days != null) bucketPrice.trial_period_days = price.trial_period_days;

	return bucketPrice;
};

function bucketPriceContextFromPlanPrice(price: Price): BucketPriceContext {
	return {
		meter_id: price.meter_id,
		currency: price.currency.toLowerCase(),
		billing_period: price.billing_period as BILLING_PERIOD,
		type: price.type,
		price_unit_type: price.price_unit_type,
		invoice_cadence: price.invoice_cadence,
		display_name: price.display_name,
	};
}

function omitLookupKey(price: CommitmentTimeBucketPrice): CommitmentTimeBucketPrice {
	const { lookup_key: _lookupKey, ...withoutLookupKey } = price as CommitmentTimeBucketPrice & { lookup_key?: string };
	void _lookupKey;
	return withoutLookupKey;
}

function bucketHasPerBucketPricing(bucket: CommitmentTimeBucket): boolean {
	const draft = timeBucketToDraft(bucket);
	const selectValue = resolveDraftBillingModelSelect(draft);
	const { billing_model } = resolveBillingModelFromSelect(selectValue);

	return (
		billing_model !== BILLING_MODEL.FLAT_FEE ||
		!!draft.bucket_amount?.trim() ||
		!!draft.bucket_tiers?.some((tier) => tier.unit_amount.trim()) ||
		!!draft.transform_quantity_divide_by?.trim() ||
		!!bucket.price?.tiers?.length ||
		!!bucket.price?.tier_mode ||
		!!bucket.price?.transform_quantity
	);
}

function buildApiBucketPrice(
	bucket: CommitmentTimeBucket,
	price: Price,
	commitmentType: CommitmentType,
	override?: Pick<ExtendedPriceOverride, 'amount'>,
): CommitmentTimeBucketPrice {
	const priceContext = bucketPriceContextFromPlanPrice(price);

	if (bucketHasPerBucketPricing(bucket)) {
		const draft = timeBucketToDraft(bucket);
		const built = buildBucketPriceFromDraft(cleanTimeBucketDraftForSave(draft, commitmentType), priceContext);
		return { ...omitLookupKey(built), billing_period_count: 1 };
	}

	return { ...omitLookupKey(priceToCommitmentBucketPrice(price, override)), billing_period_count: 1 };
}

/** Enrich UI time buckets with per-bucket commitment fields required by POST /subscriptions. */
export const enrichCommitmentTimeBucketsForApi = (
	buckets: CommitmentTimeBucket[],
	config: LineItemCommitmentConfig,
	price: Price,
	override?: Pick<ExtendedPriceOverride, 'amount'>,
): CommitmentTimeBucket[] => {
	const normalized = normalizeCommitmentTimeBuckets(buckets, resolveBucketSize(price));
	const commitmentValue = getCommitmentValueString(config);
	const commitmentType = resolveCommitmentType(config);

	return normalized.map((bucket) => {
		const commitment_value = bucket.commitment_value ?? commitmentValue;
		const bucketPrice = buildApiBucketPrice(bucket, price, commitmentType, override);

		return {
			...bucket,
			price: bucketPrice,
			commitment_type: bucket.commitment_type ?? commitmentType,
			commitment_value,
			overage_factor: bucket.overage_factor ?? String(config.overage_factor ?? 1),
			true_up_enabled: bucket.true_up_enabled ?? config.enable_true_up ?? false,
		};
	});
};

export const timePointToMinutes = (point: { hour: number; minute: number }): number => point.hour * 60 + point.minute;

export const validateCommitmentTimeBuckets = (buckets: CommitmentTimeBucket[], bucketSize?: BUCKET_SIZE | string | null): string | null => {
	const constraints = getCommitmentTimeBucketConstraints(bucketSize);

	for (const { start, end } of buckets) {
		const startError = validateCommitmentTimePoint(start, constraints);
		if (startError) return startError;

		const endError = validateCommitmentTimePoint(end, constraints);
		if (endError) return endError;

		const startMinutes = timePointToMinutes({
			hour: start.hour,
			minute: constraints.minutesEnabled ? start.minute : 0,
		});
		const endMinutes = timePointToMinutes({
			hour: end.hour,
			minute: constraints.minutesEnabled ? end.minute : 0,
		});

		if (startMinutes === endMinutes) {
			return 'Start and end time cannot be the same';
		}
	}

	return null;
};

/**
 * Extract line item commitments from price overrides
 * Converts the frontend ExtendedPriceOverride format to backend LineItemCommitmentsMap.
 * Commitment time buckets are stored on the override at the top level for UI ergonomics; we
 * fold them into the commitment config here so the whole config rides on line_item_commitments
 * (avoiding a duplicate line_items[] entry on the backend).
 */
export type ExtractLineItemCommitmentsOptions = {
	prices?: Price[];
};

export const extractLineItemCommitments = (
	priceOverrides: Record<string, ExtendedPriceOverride>,
	options?: ExtractLineItemCommitmentsOptions,
): LineItemCommitmentsMap => {
	const commitments: LineItemCommitmentsMap = {};
	const pricesById = new Map((options?.prices ?? []).map((price) => [price.id, price]));

	Object.entries(priceOverrides).forEach(([priceId, override]) => {
		const hasBuckets = override.commitment_time_buckets && override.commitment_time_buckets.length > 0;
		if (!override.commitment && !hasBuckets) {
			return;
		}

		const price = pricesById.get(priceId);
		const shouldEnrichBuckets = hasBuckets && !!override.commitment && !!price;

		if (shouldEnrichBuckets) {
			const enrichedBuckets = enrichCommitmentTimeBucketsForApi(
				override.commitment_time_buckets!,
				override.commitment!,
				price,
				override.amount ? { amount: override.amount } : undefined,
			);
			const { commitment_time_buckets: _buckets, ...parentConfig } = override.commitment!;

			commitments[priceId] = {
				...parentConfig,
				commitment_time_buckets: enrichedBuckets,
			};
			return;
		}

		commitments[priceId] = {
			...(override.commitment ?? {}),
			...(hasBuckets ? { commitment_time_buckets: override.commitment_time_buckets } : {}),
		};
	});

	return commitments;
};

/**
 * Merge line item commitments into price overrides
 * Used when loading existing subscription data
 */
export const mergeCommitmentsIntoOverrides = (
	priceOverrides: Record<string, any>,
	commitments: LineItemCommitmentsMap,
): Record<string, any> => {
	const merged = { ...priceOverrides };

	Object.entries(commitments).forEach(([priceId, commitment]) => {
		if (merged[priceId]) {
			merged[priceId] = {
				...merged[priceId],
				commitment,
			};
		} else {
			merged[priceId] = {
				price_id: priceId,
				commitment,
			};
		}
	});

	return merged;
};

export type CommitmentValidationTarget = 'amountField' | 'quantityField' | 'overageField' | 'bothFields' | 'banner';

/** Maps raw `validateCommitment` messages (stable English) to which inputs should surface the error. */
export function classifyCommitmentValidation(raw: string): CommitmentValidationTarget {
	if (/^Overage factor/i.test(raw)) return 'overageField';
	if (/^Cannot set both/i.test(raw)) return 'bothFields';
	if (/When commitment_quantity is set/i.test(raw) || /^Commitment quantity/i.test(raw)) return 'quantityField';
	if (/When commitment_amount is set/i.test(raw) || /^Commitment amount/i.test(raw)) return 'amountField';
	return 'banner';
}

export function mapCommitmentValidationError(raw: string, t: (key: string, options?: Record<string, unknown>) => string): string {
	const minuteStepMatch = /^Minute must be a multiple of (\d+)$/.exec(raw);
	if (minuteStepMatch) {
		return t('commitmentConfig.errors.minuteStep', { step: minuteStepMatch[1] });
	}

	const hourStepMatch = /^Hour must be a multiple of (\d+)$/.exec(raw);
	if (hourStepMatch) {
		return t('commitmentConfig.errors.hourStep', { step: hourStepMatch[1] });
	}

	const table: Record<string, string> = {
		'Cannot set both commitment_amount and commitment_quantity': t('commitmentConfig.errors.bothAmountAndQuantity'),
		'When commitment_amount is set, commitment_type must be "amount"': t('commitmentConfig.errors.typeMismatchAmount'),
		'When commitment_quantity is set, commitment_type must be "quantity"': t('commitmentConfig.errors.typeMismatchQuantity'),
		'Overage factor is required when commitment is set': t('commitmentConfig.errors.overageRequired'),
		'Overage factor must be at least 1.0': t('commitmentConfig.errors.overageGtOne'),
		'Commitment amount must be non-negative': t('commitmentConfig.errors.amountNonNegative'),
		'Commitment quantity must be non-negative': t('commitmentConfig.errors.quantityNonNegative'),
		'Hour must be between 0 and 23': t('commitmentConfig.errors.hourRange'),
		'Minute must be between 0 and 59': t('commitmentConfig.errors.minuteRange'),
		'Start and end time cannot be the same': t('commitmentConfig.timeBuckets.errors.sameTime'),
		'Please select start and end times for all time buckets': t('commitmentConfig.timeBuckets.errors.incomplete'),
		'Please complete commitment fields for all time buckets': t('commitmentConfig.timeBuckets.errors.incompleteCommitment'),
	};
	return table[raw] ?? raw;
}

export function resolveCommitmentTypeFromConfig(config: Partial<LineItemCommitmentConfig>): CommitmentType {
	if (config.commitment_type) return normalizeCommitmentType(config.commitment_type);
	if (config.commitment_quantity !== undefined && config.commitment_quantity !== null) {
		return CommitmentType.QUANTITY;
	}
	if (config.commitment_amount !== undefined && config.commitment_amount !== null) {
		return CommitmentType.AMOUNT;
	}
	return CommitmentType.AMOUNT;
}

export function bucketPriceContextFromPrice(price: Price): BucketPriceContext | undefined {
	if (!price.meter_id) return undefined;

	return {
		meter_id: price.meter_id,
		currency: price.currency,
		billing_period: price.billing_period as BILLING_PERIOD,
		type: price.type,
		price_unit_type: price.price_unit_type,
		invoice_cadence: price.invoice_cadence,
		display_name: price.display_name,
	};
}
