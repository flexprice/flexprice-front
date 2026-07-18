import type { InvoiceConfig } from '@/types/dto/BillingSettings';

function resolveTimezone(timezone: string | undefined): string {
	const candidate = timezone?.trim() || 'UTC';
	if (candidate === 'UTC') return 'UTC';

	try {
		Intl.DateTimeFormat(undefined, { timeZone: candidate });
		return candidate;
	} catch {
		return 'UTC';
	}
}

function formatDatePart(config: Pick<InvoiceConfig, 'format' | 'timezone'>): string {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: resolveTimezone(config.timezone),
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	const parts = formatter.formatToParts(now);
	const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
	const month = parts.find((part) => part.type === 'month')?.value ?? '01';
	const day = parts.find((part) => part.type === 'day')?.value ?? '01';
	const shortYear = year.slice(-2);

	switch (config.format) {
		case 'YYYY':
			return year;
		case 'YY':
			return shortYear;
		case 'YYYYMMDD':
			return `${year}${month}${day}`;
		case 'YYMMDD':
			return `${shortYear}${month}${day}`;
		case 'YYYYMM':
		default:
			return `${year}${month}`;
	}
}

export function buildInvoiceNumberPreview(config: InvoiceConfig): string {
	const sequence = String(Math.max(0, config.start_sequence)).padStart(Math.max(1, config.suffix_length), '0');
	const datePart = formatDatePart(config);
	const separator = config.separator ?? '';

	const segments = [config.prefix, datePart, sequence].filter((segment) => segment.length > 0);
	if (segments.length <= 1) return segments[0] ?? '';

	return segments.reduce((result, segment, index) => {
		if (index === 0) return segment;
		return `${result}${separator}${segment}`;
	}, '');
}
