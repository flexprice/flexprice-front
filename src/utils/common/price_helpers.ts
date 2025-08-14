import { Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_MODEL, PRICE_TYPE } from '@/models/Price';
import { getCurrencySymbol } from './helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';

interface Props {
	price: Price;
	symbol?: string;
}

export const getPriceTableCharge = ({ price, symbol }: Props) => {
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;
	const currencySymbol = isCustomPriceUnit ? symbol : getCurrencySymbol(price.currency);

	// Helper function to get the appropriate amount
	const getAmount = () => {
		if (isCustomPriceUnit) {
			return price.price_unit_config?.amount || '0';
		}
		return price.amount;
	};

	// Helper function to get tiered pricing unit amount
	const getTieredUnitAmount = () => {
		const customTierAmount = price.price_unit_config?.price_unit_tiers?.[0]?.unit_amount;
		const regularTierAmount = price.tiers?.[0]?.unit_amount;
		return customTierAmount || regularTierAmount || '0';
	};

	// Handle fixed pricing
	if (price.type === PRICE_TYPE.FIXED) {
		return `${currencySymbol} ${formatAmount(getAmount())}`;
	}

	// Handle variable pricing based on billing model
	switch (price.billing_model) {
		case BILLING_MODEL.PACKAGE: {
			const divideBy = (price.transform_quantity as { divide_by: number }).divide_by;
			return `${currencySymbol} ${formatAmount(getAmount())} / ${formatAmount(divideBy.toString())} units`;
		}

		case BILLING_MODEL.FLAT_FEE:
			return `${currencySymbol} ${formatAmount(getAmount())} / unit`;

		case BILLING_MODEL.TIERED: {
			const unitAmount = getTieredUnitAmount();
			return `Starts at ${currencySymbol} ${formatAmount(unitAmount)} / unit`;
		}

		default:
			return price.display_amount;
	}
};

export const getActualPriceForTotal = (price: Price) => {
	let result = 0;

	// Handle custom price units where amount might be in price_unit_config
	const getAmount = () => {
		if (price.amount !== undefined && price.amount !== null) {
			return price.amount.toString();
		}
		// Check if amount is in price_unit_config for custom price units
		if (price.price_unit_config?.amount) {
			return price.price_unit_config.amount.toString();
		}
		return '0';
	};

	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		result = parseFloat(getAmount());
	} else if (price.billing_model === BILLING_MODEL.TIERED) {
		// For tiered pricing with custom price units, check price_unit_config first
		let flatAmount = '0';
		if (price.price_unit_config?.price_unit_tiers?.[0]?.flat_amount) {
			flatAmount = price.price_unit_config.price_unit_tiers[0].flat_amount;
		} else if (price.tiers?.[0]?.flat_amount) {
			flatAmount = price.tiers[0].flat_amount;
		}
		result = parseFloat(flatAmount);
	} else {
		result = parseFloat(getAmount());
	}

	return result;
};

export const calculateDiscountedPrice = (price: Price, coupon: any) => {
	if (!coupon || price.type !== 'FIXED') return null;

	// Handle custom price units where amount might be in price_unit_config
	const getAmount = () => {
		if (price.amount !== undefined && price.amount !== null) {
			return price.amount.toString();
		}
		// Check if amount is in price_unit_config for custom price units
		if (price.price_unit_config?.amount) {
			return price.price_unit_config.amount.toString();
		}
		return '0';
	};

	const originalAmount = parseFloat(getAmount());
	let discountedAmount = originalAmount;

	if (coupon.type === 'fixed') {
		// Fixed amount discount
		const discountAmount = parseFloat(coupon.amount_off || '0');
		discountedAmount = Math.max(0, originalAmount - discountAmount);
	} else if (coupon.type === 'percentage') {
		// Percentage discount
		const discountPercentage = parseFloat(coupon.percentage_off || '0');
		discountedAmount = originalAmount * (1 - discountPercentage / 100);
	}

	return {
		originalAmount,
		discountedAmount,
		savings: originalAmount - discountedAmount,
	};
};
