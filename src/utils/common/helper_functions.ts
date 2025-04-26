import { ChargesForBillingPeriodOne } from '@/components/organisms/Subscription/PriceTable';
import { getAllISOCodes } from 'iso-country-currency';
import { v4 as uuidv4 } from 'uuid';
export const getCurrencyOptions = () => {
	const codes = getAllISOCodes();
	return [...codes.filter((code) => code.currency === 'USD'), ...codes.filter((code) => code.currency !== 'USD')];
};

export function getCurrencySymbol(currency: string): string {
	try {
		const info = getAllISOCodes().filter((code) => code.currency === currency.toUpperCase());
		return info[0].symbol;
	} catch (error) {
		console.error('Error getting currency symbol', error);
		return currency;
	}
}

export const formatBillingModel = (billingModel: string) => {
	switch (billingModel.toUpperCase()) {
		case 'FLAT_FEE':
			return 'Flat Fee';
		case 'PACKAGE':
			return 'Package';
		case 'TIERED':
			return 'Tiered';
		default:
			return '--';
	}
};

/**
 * Formats billing period for price display (e.g., "50rs/month", "100rs/day")
 * @param billingPeriod - The billing period to format
 * @returns The billing period in short form (day, month, year, etc.)
 */
export const formatBillingPeriodForPrice = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case 'DAILY':
			return 'day';
		case 'WEEKLY':
			return 'week';
		case 'MONTHLY':
			return 'month';
		case 'ANNUAL':
			return 'year';
		case 'QUARTERLY':
			return 'quarter';
		case 'HALF_YEARLY':
			return 'half year';
		default:
			return '--';
	}
};

/**
 * Formats billing period for sentence display (e.g., "You will be billed monthly")
 * @param billingPeriod - The billing period to format
 * @returns The billing period in adjective form (monthly, annually, etc.)
 */
export const formatBillingPeriodForDisplay = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case 'DAILY':
			return 'daily';
		case 'WEEKLY':
			return 'weekly';
		case 'MONTHLY':
			return 'monthly';
		case 'ANNUAL':
			return 'annually';
		case 'QUARTERLY':
			return 'quarterly';
		case 'HALF_YEARLY':
			return 'half-yearly';
		default:
			return '--';
	}
};

export const getPriceTypeLabel = (type: string): string => {
	switch (type.toUpperCase()) {
		case 'FIXED':
			return 'Recurring';
		case 'USAGE':
			return 'Usage Based';
		default:
			return '--';
	}
};

export const toSentenceCase = (str: string): string => {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getTotalPayableText = (
	recurringCharges: ChargesForBillingPeriodOne[],
	usageCharges: ChargesForBillingPeriodOne[],
	recurringTotal: number,
) => {
	let text = '';

	if (recurringCharges.length > 0) {
		text += `${recurringCharges[0].currency}${recurringTotal}`;
	}

	if (usageCharges.length > 0) {
		if (recurringCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'Depends on usage';
		}
	}

	return text;
};

export const getTotalPayableInfo = (
	recurringCharges: ChargesForBillingPeriodOne[],
	usageCharges: ChargesForBillingPeriodOne[],
	recurringTotal: number,
) => {
	let text = '';

	if (recurringCharges.length > 0) {
		text += `${recurringCharges[0].currency}${recurringTotal}`;
	}

	if (usageCharges.length > 0) {
		if (recurringCharges.length > 0) {
			text += ' + Usage';
		} else {
			text += 'depending on usage';
		}
	}

	return text;
};

export const formatDateShort = (dateString: string): string => {
	const date = new Date(dateString);
	const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
	return date.toLocaleDateString('en-US', options);
};

/**
 * Generates a unique ID using Math.random()
 * @returns A unique ID
 */
export const generateUniqueId = (): string => {
	return uuidv4().replace(/-/g, '');
};
