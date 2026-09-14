import { Metadata } from '@/models/base';
import { BILLING_MODEL } from '@/models/Price';

/**
 * Frontend-only billing model. The backend has no percentage billing model - a percentage charge is
 * persisted as a FLAT_FEE whose `amount` holds the decimal equivalent (5% -> "0.05"), tagged with
 * `metadata.billing_model = "percentage"` so the UI can render it back as a percentage.
 *
 * Mirrors the existing 'SLAB_TIERED' convenience value, which is likewise a selector-only value that
 * maps onto a real backend billing model.
 */
export const PERCENTAGE_BILLING_MODEL = 'PERCENTAGE' as const;

export type PercentageBillingModel = typeof PERCENTAGE_BILLING_MODEL;

/** Metadata key/value pair that marks a FLAT_FEE price as percentage-based. */
export const PERCENTAGE_METADATA_KEY = 'billing_model';
export const PERCENTAGE_METADATA_VALUE = 'percentage';

/** How many decimal places separate a percentage from its decimal equivalent (5 <-> 0.05). */
const PERCENT_DECIMAL_PLACES = 2;

/**
 * Shifts the decimal point of a numeric string by `places` (positive shifts right / multiplies by
 * 10^places, negative shifts left / divides).
 *
 * Deliberately string-based rather than `Number(value) / 100`: floating point makes that conversion
 * lossy for ordinary inputs (`1.1 / 100` is 0.011000000000000001), and the result here is persisted
 * as the price amount, so the error would be permanent. Non-numeric input is returned untouched -
 * the caller validates, this only converts.
 */
export const shiftDecimalString = (value: string, places: number): string => {
	const trimmed = value.trim();
	if (trimmed === '') return '';

	const isNegative = trimmed.startsWith('-');
	const unsigned = isNegative ? trimmed.slice(1) : trimmed;
	if (!/^\d*\.?\d*$/.test(unsigned) || unsigned === '' || unsigned === '.') return value;

	const [integerPart = '', fractionPart = ''] = unsigned.split('.');
	const digits = `${integerPart}${fractionPart}`;

	// Index within `digits` where the decimal point lands after the shift, padding with zeros on
	// whichever side the point runs off.
	let pointIndex = integerPart.length + places;
	let padded = digits;
	if (pointIndex < 0) {
		padded = `${'0'.repeat(-pointIndex)}${padded}`;
		pointIndex = 0;
	} else if (pointIndex > padded.length) {
		padded = `${padded}${'0'.repeat(pointIndex - padded.length)}`;
	}

	const newInteger = padded.slice(0, pointIndex).replace(/^0+(?=\d)/, '') || '0';
	const newFraction = padded.slice(pointIndex).replace(/0+$/, '');
	const result = newFraction ? `${newInteger}.${newFraction}` : newInteger;

	return isNegative && Number(result) !== 0 ? `-${result}` : result;
};

/** User-entered percentage -> the decimal amount sent to the backend. `"2.5"` -> `"0.025"`. */
export const percentageToDecimalAmount = (percentage: string): string => shiftDecimalString(percentage, -PERCENT_DECIMAL_PLACES);

/** Stored decimal amount -> the percentage shown to the user. `"0.025"` -> `"2.5"`. */
export const decimalAmountToPercentage = (amount: string): string => shiftDecimalString(amount, PERCENT_DECIMAL_PLACES);

/** True when a price's metadata marks its flat-fee amount as percentage-based. */
export const isPercentageMetadata = (metadata?: Metadata | null): boolean =>
	metadata?.[PERCENTAGE_METADATA_KEY] === PERCENTAGE_METADATA_VALUE;

/**
 * True when this price should be read as a percentage: the percentage marker is present and the
 * charge really is the FLAT_FEE it claims to be. A stale marker left on a price that was since
 * switched to PACKAGE/TIERED must not turn its tiers into percentages.
 */
export const isPercentagePrice = (price: { billing_model?: BILLING_MODEL | string; metadata?: Metadata | null }): boolean =>
	isPercentageMetadata(price.metadata) && (price.billing_model === undefined || price.billing_model === BILLING_MODEL.FLAT_FEE);

/**
 * True when the *effective* charge - a price plus whatever override sits on top of it - still reads
 * as a percentage.
 *
 * The percentage marker lives in the price's metadata and an override cannot touch it, so the only
 * thing an override can do is move the charge off FLAT_FEE. Once it does (PACKAGE / TIERED /
 * SLAB_TIERED) the overridden amount is a plain currency amount and must not go through the
 * percentage conversion, or a stored `10` reads as `1000%`. An override that leaves the billing
 * model alone keeps the price's own answer.
 */
export const isPercentageOverride = (
	price: { billing_model?: BILLING_MODEL | string; metadata?: Metadata | null },
	override?: { billing_model?: BILLING_MODEL | string | null } | null,
): boolean => isPercentagePrice({ metadata: price.metadata, billing_model: override?.billing_model || price.billing_model });

/** Adds the percentage marker to existing metadata, leaving other keys intact. */
export const withPercentageMetadata = (metadata?: Metadata | null): Metadata => ({
	...(metadata ?? {}),
	[PERCENTAGE_METADATA_KEY]: PERCENTAGE_METADATA_VALUE,
});

/**
 * Removes the percentage marker, so switching an existing percentage charge to another billing model
 * stops it from rendering as a percentage. Returns undefined when nothing else remains, to avoid
 * sending an empty metadata object.
 */
export const withoutPercentageMetadata = (metadata?: Metadata | null): Metadata | undefined => {
	if (!metadata) return undefined;
	const { [PERCENTAGE_METADATA_KEY]: existing, ...rest } = metadata;
	// Only strip our own marker - a `billing_model` key set to anything else belongs to the caller.
	const next = existing === PERCENTAGE_METADATA_VALUE ? rest : metadata;
	return Object.keys(next).length > 0 ? next : undefined;
};
