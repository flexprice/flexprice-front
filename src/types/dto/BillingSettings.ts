export type InvoiceNumberFormat = 'YYYYMM' | 'YYYY' | 'YYYYMMDD' | 'YYMMDD' | 'YY';

/** Matches FlexPrice `invoice_config` setting value (see internal/types/invoice.go). */
export interface InvoiceConfig {
	prefix: string;
	separator: string;
	format: InvoiceNumberFormat;
	timezone: string;
	start_sequence: number;
	suffix_length: number;
	due_date_days: number;
	auto_complete_purchased_credit_transaction?: boolean;
	finalization_delay_seconds?: number;
}

/** Matches FlexPrice `subscription_config` setting value. */
export interface SubscriptionConfig {
	auto_cancellation_enabled: boolean;
	grace_period_days: number;
}

export const FALLBACK_INVOICE_CONFIG: InvoiceConfig = {
	prefix: 'INV',
	separator: '-',
	format: 'YYYYMM',
	timezone: 'UTC',
	start_sequence: 1,
	suffix_length: 5,
	due_date_days: 1,
	auto_complete_purchased_credit_transaction: false,
	finalization_delay_seconds: 7200,
};

export const FALLBACK_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
	auto_cancellation_enabled: false,
	grace_period_days: 3,
};

const INVOICE_NUMBER_FORMATS: InvoiceNumberFormat[] = ['YYYYMM', 'YYYY', 'YYYYMMDD', 'YYMMDD', 'YY'];

function isInvoiceNumberFormat(value: unknown): value is InvoiceNumberFormat {
	return typeof value === 'string' && INVOICE_NUMBER_FORMATS.includes(value as InvoiceNumberFormat);
}

function readString(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (value !== undefined && value !== null) return String(value);
	}
	return undefined;
}

function readNumber(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (value !== undefined && value !== null && !Number.isNaN(Number(value))) return Number(value);
	}
	return undefined;
}

export function normalizeInvoiceConfig(config: InvoiceConfig): InvoiceConfig {
	return {
		prefix: config.prefix.trim() || FALLBACK_INVOICE_CONFIG.prefix,
		separator: config.separator,
		format: config.format,
		timezone: config.timezone.trim() || FALLBACK_INVOICE_CONFIG.timezone,
		start_sequence: Math.max(0, config.start_sequence),
		suffix_length: Math.min(10, Math.max(1, Number(config.suffix_length) || 1)),
		due_date_days: Math.max(0, config.due_date_days),
		auto_complete_purchased_credit_transaction:
			config.auto_complete_purchased_credit_transaction ?? FALLBACK_INVOICE_CONFIG.auto_complete_purchased_credit_transaction,
		finalization_delay_seconds: Math.max(0, config.finalization_delay_seconds ?? FALLBACK_INVOICE_CONFIG.finalization_delay_seconds ?? 0),
	};
}

export type InvoiceConfigValidationErrorKey =
	| 'prefixRequired'
	| 'timezoneRequired'
	| 'invalidSequenceDigits'
	| 'sequenceDigitsMin'
	| 'sequenceDigitsMax';

export function getInvoiceConfigValidationErrorKey(config: InvoiceConfig): InvoiceConfigValidationErrorKey | null {
	if (!config.prefix.trim()) return 'prefixRequired';
	if (!config.timezone.trim()) return 'timezoneRequired';

	const suffixLength = Number(config.suffix_length);
	if (!Number.isFinite(suffixLength) || !Number.isInteger(suffixLength)) return 'invalidSequenceDigits';
	if (suffixLength < 1) return 'sequenceDigitsMin';
	if (suffixLength > 10) return 'sequenceDigitsMax';

	return null;
}

export function parseSequenceDigitsInput(raw: string): number | null {
	const trimmed = raw.trim();
	if (trimmed === '') return null;
	const value = Number(trimmed);
	if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
	return value;
}

export function parseInvoiceConfig(value: unknown): InvoiceConfig {
	if (!value || typeof value !== 'object') {
		return { ...FALLBACK_INVOICE_CONFIG };
	}

	const raw = value as Record<string, unknown>;
	const formatCandidate = raw.format ?? raw.date_format ?? raw.invoice_number_format;

	return {
		prefix: readString(raw, 'prefix', 'invoice_number_prefix') ?? FALLBACK_INVOICE_CONFIG.prefix,
		separator: readString(raw, 'separator', 'invoice_number_separator') ?? FALLBACK_INVOICE_CONFIG.separator,
		format: isInvoiceNumberFormat(formatCandidate) ? formatCandidate : FALLBACK_INVOICE_CONFIG.format,
		timezone: readString(raw, 'timezone', 'invoice_number_timezone') ?? FALLBACK_INVOICE_CONFIG.timezone,
		start_sequence: readNumber(raw, 'start_sequence', 'invoice_number_start_sequence') ?? FALLBACK_INVOICE_CONFIG.start_sequence,
		suffix_length:
			readNumber(raw, 'suffix_length', 'invoice_number_suffix_length', 'sequence_digits') ?? FALLBACK_INVOICE_CONFIG.suffix_length,
		due_date_days: readNumber(raw, 'due_date_days', 'payment_due_days') ?? FALLBACK_INVOICE_CONFIG.due_date_days,
		auto_complete_purchased_credit_transaction:
			typeof raw.auto_complete_purchased_credit_transaction === 'boolean'
				? raw.auto_complete_purchased_credit_transaction
				: FALLBACK_INVOICE_CONFIG.auto_complete_purchased_credit_transaction,
		finalization_delay_seconds: readNumber(raw, 'finalization_delay_seconds') ?? FALLBACK_INVOICE_CONFIG.finalization_delay_seconds,
	};
}

/** Payload shape for PUT /v1/settings/invoice_config (matches Go InvoiceConfig json tags). */
export function serializeInvoiceConfig(config: InvoiceConfig): Record<string, unknown> {
	const normalized = normalizeInvoiceConfig(config);

	return {
		prefix: normalized.prefix,
		separator: normalized.separator,
		format: normalized.format,
		timezone: normalized.timezone,
		start_sequence: normalized.start_sequence,
		suffix_length: normalized.suffix_length,
		due_date_days: normalized.due_date_days,
		auto_complete_purchased_credit_transaction: normalized.auto_complete_purchased_credit_transaction,
		finalization_delay_seconds: normalized.finalization_delay_seconds,
	};
}

export function parseSubscriptionConfig(value: unknown): SubscriptionConfig {
	if (!value || typeof value !== 'object') {
		return FALLBACK_SUBSCRIPTION_CONFIG;
	}

	const raw = value as Partial<SubscriptionConfig>;
	return {
		auto_cancellation_enabled: raw.auto_cancellation_enabled ?? FALLBACK_SUBSCRIPTION_CONFIG.auto_cancellation_enabled,
		grace_period_days: Number(raw.grace_period_days ?? FALLBACK_SUBSCRIPTION_CONFIG.grace_period_days),
	};
}

export function serializeSubscriptionConfig(config: SubscriptionConfig): SubscriptionConfig {
	return {
		auto_cancellation_enabled: config.auto_cancellation_enabled,
		grace_period_days: Math.max(1, config.grace_period_days),
	};
}
