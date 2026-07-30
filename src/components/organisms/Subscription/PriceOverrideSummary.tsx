import { FC } from 'react';
import { Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { SubscriptionLineItemOverrideRequest } from '@/utils/common/price_override_helpers';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Check } from 'lucide-react';
import { Card } from '@/components/atoms';
import { useTranslation } from 'react-i18next';

interface Props {
	overrides: SubscriptionLineItemOverrideRequest[];
	prices: Price[];
	className?: string;
}

const PriceOverrideSummary: FC<Props> = ({ overrides, prices, className }) => {
	const { t } = useTranslation('customers');
	if (overrides.length === 0) return null;

	const getDisplaySymbol = (price: Price): string => {
		if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
			// For CUSTOM prices, return price unit code
			return price.price_unit_config?.price_unit || price.price_unit || price.currency;
		}
		return getCurrencySymbol(price.currency);
	};

	const getDisplayAmount = (price: Price): string => {
		if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
			return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
		}
		return price.amount || '0';
	};

	const getOverrideDescription = (override: SubscriptionLineItemOverrideRequest, price: Price): string => {
		const descriptions: string[] = [];
		const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;
		const displaySymbol = getDisplaySymbol(price);

		// Handle amount/price_unit_amount based on price unit type
		if (isCustomPriceUnit) {
			// For CUSTOM prices, use price_unit_amount
			if (override.price_unit_amount !== undefined) {
				const originalAmount = formatAmount(getDisplayAmount(price));
				const newAmount = formatAmount(override.price_unit_amount);
				descriptions.push(`Amount: ${displaySymbol}${originalAmount} → ${displaySymbol}${newAmount}`);
			}
		} else {
			// For FIAT prices, use amount
			if (override.amount !== undefined) {
				const originalAmount = formatAmount(price.amount);
				const newAmount = formatAmount(override.amount.toString());
				descriptions.push(`Amount: ${displaySymbol}${originalAmount} → ${displaySymbol}${newAmount}`);
			}
		}

		if (override.quantity !== undefined) {
			descriptions.push(`Quantity: ${override.quantity}`);
		}

		if (override.billing_model !== undefined) {
			descriptions.push(`Billing Model: ${override.billing_model.replace('_', ' ')}`);
		}

		if (override.tier_mode !== undefined) {
			descriptions.push(`Tier Mode: ${override.tier_mode}`);
		}

		// Handle tiers/price_unit_tiers based on price unit type
		if (isCustomPriceUnit) {
			// For CUSTOM prices, use price_unit_tiers
			if (override.price_unit_tiers !== undefined && override.price_unit_tiers.length > 0) {
				descriptions.push(`Tiers: ${override.price_unit_tiers.length} tier(s)`);
			}
		} else {
			// For FIAT prices, use tiers
			if (override.tiers !== undefined && override.tiers.length > 0) {
				descriptions.push(`Tiers: ${override.tiers.length} tier(s)`);
			}
		}

		if (override.transform_quantity !== undefined) {
			const { divide_by, round } = override.transform_quantity;
			descriptions.push(`Package: ${divide_by} units, round ${round}`);
		}

		return descriptions.join(', ');
	};

	return (
		<Card className={`border bg-gray-50 rounded-lg p-4 ${className}`}>
			<div className='flex items-start gap-3'>
				<Check className='w-5 h-5  mt-0.5 flex-shrink-0' />
				<div className='flex-1 min-w-0'>
					<h4 className='font-medium mb-3'>{t('organisms.priceOverrideSummary.title', { count: overrides.length })}</h4>
					<div className='space-y-3'>
						{overrides.map((override) => {
							const price = prices.find((p) => p.id === override.price_id);
							if (!price) return null;

							const overrideDescription = getOverrideDescription(override, price);

							return (
								<div key={override.price_id} className='flex items-center justify-between text-sm text-muted-foreground'>
									<span className='truncate'>
										{price.meter?.name || price.description || t('organisms.priceOverrideSummary.chargeFallback')}
									</span>
									<span className='ms-2 flex-shrink-0 text-xs'>{overrideDescription}</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</Card>
	);
};

export default PriceOverrideSummary;
