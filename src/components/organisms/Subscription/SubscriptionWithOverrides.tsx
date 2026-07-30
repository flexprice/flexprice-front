import { FC, useState } from 'react';
import { Price } from '@/models/Price';
import SubscriptionPriceTable from './SubscriptionPriceTable';
import { usePriceOverrides } from '@/hooks/usePriceOverrides';
import { SubscriptionLineItemOverrideRequest, getPriceOverridesSummary } from '@/utils/common/price_override_helpers';
import { Button, Chip } from '@/components/atoms';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
	prices: Price[];
	onCreateSubscription: (lineItemOverrides: SubscriptionLineItemOverrideRequest[]) => void;
	className?: string;
}

const SubscriptionWithOverrides: FC<Props> = ({ prices, onCreateSubscription, className }) => {
	const { t } = useTranslation(['customers', 'common']);
	const {
		overriddenPrices,
		overridePrice,
		resetOverride,
		resetAllOverrides,
		getLineItemOverridesForBackend,
		hasAnyOverrides,
		getOverridesCount,
	} = usePriceOverrides(prices);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleCreateSubscription = async () => {
		setIsSubmitting(true);
		try {
			const lineItemOverrides = getLineItemOverridesForBackend();
			await onCreateSubscription(lineItemOverrides);
		} catch (error) {
			console.error('Failed to create subscription:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const overridesSummary = getPriceOverridesSummary(prices, overriddenPrices);

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header with override summary */}
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-semibold text-gray-900'>{t('organisms.subscriptionWithOverrides.chargesTitle')}</h3>
					{overridesSummary && <p className='text-sm text-gray-600 mt-1'>{overridesSummary}</p>}
				</div>
				{hasAnyOverrides() && (
					<div className='flex items-center gap-2'>
						<Chip
							variant='warning'
							className='bg-blue-50 border-blue-200 text-blue-700'
							label={
								getOverridesCount() > 1
									? t('organisms.subscriptionWithOverrides.overridePlural', { count: getOverridesCount() })
									: t('organisms.subscriptionWithOverrides.overrideSingle', { count: getOverridesCount() })
							}
						/>
						<Button variant='outline' size='sm' onClick={resetAllOverrides}>
							{t('organisms.subscriptionWithOverrides.resetAll')}
						</Button>
					</div>
				)}
			</div>

			{/* Price table with override functionality */}
			<SubscriptionPriceTable
				data={prices}
				onPriceOverride={overridePrice}
				onResetOverride={resetOverride}
				overriddenPrices={overriddenPrices}
			/>

			{/* Override information */}
			{hasAnyOverrides() && (
				<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
					<div className='flex items-start gap-3'>
						<AlertCircle className='w-5 h-5 text-blue-600 mt-0.5' />
						<div className='flex-1'>
							<h4 className='font-medium text-blue-900 mb-2'>{t('organisms.subscriptionWithOverrides.priceOverridesTitle')}</h4>
							<div className='space-y-2'>
								{Object.entries(overriddenPrices).map(([priceId, override]) => {
									const price = prices.find((p) => p.id === priceId);
									if (!price) return null;

									return (
										<div key={priceId} className='space-y-2'>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-blue-800'>
													{price.meter?.name || price.description || t('organisms.subscriptionWithOverrides.chargeFallback')}
												</span>
												<span className='text-blue-700 font-medium'>
													{price.currency} {price.amount} → {price.currency} {override.amount || price.amount}
												</span>
											</div>
											{/* Show package details only when relevant */}
											{override.billing_model === 'PACKAGE' && override.transform_quantity && (
												<div className='text-xs text-blue-600 ms-4'>{override.transform_quantity.divide_by} units</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Action buttons */}
			<div className='flex gap-3 pt-4'>
				<Button variant='outline' onClick={resetAllOverrides} disabled={!hasAnyOverrides()}>
					{t('organisms.subscriptionWithOverrides.reset')}
				</Button>
				<Button onClick={handleCreateSubscription} disabled={isSubmitting} className='flex-1'>
					{isSubmitting ? t('organisms.subscriptionWithOverrides.creating') : t('organisms.subscriptionWithOverrides.create')}
				</Button>
			</div>
		</div>
	);
};

export default SubscriptionWithOverrides;
