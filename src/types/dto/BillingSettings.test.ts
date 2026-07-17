import { describe, expect, it } from 'vitest';
import {
	FALLBACK_INVOICE_CONFIG,
	getInvoiceConfigValidationErrorKey,
	normalizeInvoiceConfig,
	parseInvoiceConfig,
	parseSequenceDigitsInput,
	serializeInvoiceConfig,
} from './BillingSettings';

describe('BillingSettings invoice config', () => {
	it('parses API default field names from GET /settings/invoice_config', () => {
		const parsed = parseInvoiceConfig({
			invoice_number_prefix: 'ACME',
			invoice_number_format: 'YYYY',
			invoice_number_start_sequence: 42,
			invoice_number_timezone: 'Asia/Kolkata',
			invoice_number_separator: '_',
			invoice_number_suffix_length: 3,
			due_date_days: 7,
			auto_complete_purchased_credit_transaction: true,
			finalization_delay_seconds: 3600,
		});

		expect(parsed).toEqual({
			prefix: 'ACME',
			separator: '_',
			format: 'YYYY',
			timezone: 'Asia/Kolkata',
			start_sequence: 42,
			suffix_length: 3,
			due_date_days: 7,
			auto_complete_purchased_credit_transaction: true,
			finalization_delay_seconds: 3600,
		});
	});

	it('falls back to built-in defaults for missing API response', () => {
		expect(parseInvoiceConfig(null)).toEqual(FALLBACK_INVOICE_CONFIG);
		expect(parseInvoiceConfig({})).toEqual(FALLBACK_INVOICE_CONFIG);
	});

	it('serializes to API field names for PUT /settings/invoice_config', () => {
		expect(
			serializeInvoiceConfig({
				prefix: 'INV',
				separator: '-',
				format: 'YYYYMM',
				timezone: 'UTC',
				start_sequence: 1,
				suffix_length: 5,
				due_date_days: 1,
				auto_complete_purchased_credit_transaction: false,
				finalization_delay_seconds: 7200,
			}),
		).toEqual({
			prefix: 'INV',
			separator: '-',
			format: 'YYYYMM',
			timezone: 'UTC',
			start_sequence: 1,
			suffix_length: 5,
			due_date_days: 1,
			auto_complete_purchased_credit_transaction: false,
			finalization_delay_seconds: 7200,
		});
	});

	it('normalizes invoice config values before save', () => {
		expect(
			normalizeInvoiceConfig({
				prefix: '  ',
				separator: '',
				format: 'YY',
				timezone: '  ',
				start_sequence: -1,
				suffix_length: 12,
				due_date_days: -3,
			}),
		).toMatchObject({
			prefix: 'INV',
			timezone: 'UTC',
			start_sequence: 0,
			suffix_length: 10,
			due_date_days: 0,
			auto_complete_purchased_credit_transaction: false,
			finalization_delay_seconds: 7200,
		});
	});

	it('validates sequence digits minimum of 1', () => {
		expect(
			getInvoiceConfigValidationErrorKey({
				...FALLBACK_INVOICE_CONFIG,
				suffix_length: 0,
			}),
		).toBe('sequenceDigitsMin');
		expect(parseSequenceDigitsInput('2')).toBe(2);
		expect(parseSequenceDigitsInput('')).toBeNull();
	});
});
