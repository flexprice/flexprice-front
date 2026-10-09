/** Pads a decimal string to at least two fraction digits without rounding. */
export const formatRateValue = (rate: string): string => {
	const [whole, fraction = ''] = rate.trim().split('.');
	return `${whole}.${fraction.padEnd(2, '0')}`;
};

/** "1 USD = 83.00 INR": one unit of `from` expressed in `to`. */
export const formatFxRate = (from: string, to: string, rate: string): string =>
	`1 ${from.toUpperCase()} = ${formatRateValue(rate)} ${to.toUpperCase()}`;

export const formatFxPair = (from: string, to: string): string => `${from.toUpperCase()} → ${to.toUpperCase()}`;
