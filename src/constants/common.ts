// =============================================================================
// COMMON CONSTANTS & UTILITIES
// =============================================================================

// =============================================================================
// CURRENCY FORMATTERS
// =============================================================================

export const formatCurrency = (amount: number | string, currency: string): string => {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(numAmount)) return `${getCurrencySymbol(currency)}0.00`;

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(numAmount);
};

export const formatAmount = (amount: number | string, currency?: string): string => {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(numAmount)) return '0.00';

	if (currency) {
		return formatCurrency(numAmount, currency);
	}

	return numAmount.toFixed(2);
};

export const getCurrencySymbol = (currency: string): string => {
	try {
		return (
			new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
			})
				.formatToParts(0)
				.find((part) => part.type === 'currency')?.value || currency
		);
	} catch {
		return currency;
	}
};

// =============================================================================
// DATE FORMATTERS
// =============================================================================

export const formatDate = (date: string | Date): string => {
	if (!date) return '—';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '—';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(dateObj);
};

export const formatDateTime = (date: string | Date): string => {
	if (!date) return '—';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(dateObj.getTime())) return '—';

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(dateObj);
};

// =============================================================================
// UTILITY FORMATTERS
// =============================================================================

export const toSentenceCase = (str: string): string => {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
	return `${value.toFixed(decimals)}%`;
};

export { default as formatNumber } from '@/utils/common/format_number';
