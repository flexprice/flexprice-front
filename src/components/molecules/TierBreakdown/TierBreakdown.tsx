import { FC } from 'react';
import { Card } from '@/components/atoms';
import { TIER_MODE } from '@/models/Price';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { useTranslation } from 'react-i18next';

interface TierBreakdownItem {
	range: string;
	quantity: string;
	rate: string;
	cost: string;
}

interface Props {
	tiers: TierBreakdownItem[];
	totalCost: string;
	effectiveRate: string;
	tierMode: TIER_MODE;
	currency: string;
	usageQuantity: string;
}

const TierBreakdown: FC<Props> = ({ tiers, totalCost, effectiveRate, tierMode, currency, usageQuantity }) => {
	const { t } = useTranslation('billing');
	const currencySymbol = getCurrencySymbol(currency);
	const volumeRate = `${currencySymbol}${effectiveRate}`;

	return (
		<Card className='p-4'>
			<div className='space-y-4'>
				<div className='flex justify-between items-center'>
					<h3 className='text-lg font-semibold text-gray-900'>{t('tierBreakdown.title')}</h3>
					<div className='text-sm text-gray-600'>
						{t('tierBreakdown.modeLabel')} <span className='font-medium'>{tierMode}</span>
					</div>
				</div>

				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div>
						<span className='text-gray-600'>{t('tierBreakdown.totalUsage')}</span>
						<span className='ms-2 font-medium'>{usageQuantity}</span>
					</div>
					<div>
						<span className='text-gray-600'>{t('tierBreakdown.totalCost')}</span>
						<span className='ms-2 font-medium'>
							{currencySymbol}
							{totalCost}
						</span>
					</div>
				</div>

				{tierMode === TIER_MODE.VOLUME && (
					<div className='bg-blue-50 p-3 rounded-md'>
						<div className='text-sm text-blue-800'>
							<strong>{t('tierBreakdown.volumeModeTitle')}</strong> {t('tierBreakdown.volumeModeBody', { usageQuantity, rate: volumeRate })}
						</div>
					</div>
				)}

				{tierMode === TIER_MODE.SLAB && (
					<div className='bg-green-50 p-3 rounded-md'>
						<div className='text-sm text-green-800'>
							<strong>{t('tierBreakdown.slabModeTitle')}</strong> {t('tierBreakdown.slabModeBody')}
						</div>
					</div>
				)}

				{tiers.length > 0 && (
					<div className='space-y-2'>
						<div className='text-sm font-medium text-gray-700'>{t('tierBreakdown.tierDetails')}</div>
						<div className='space-y-1'>
							{tiers.map((tier, index) => (
								<div key={index} className='flex justify-between text-sm py-1 border-b border-gray-100 last:border-b-0'>
									<div className='flex-1'>
										<span className='text-gray-600'>{t('tierBreakdown.range')}</span>
										<span className='ms-2 font-medium'>{tier.range}</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>{t('tierBreakdown.quantity')}</span>
										<span className='ms-2 font-medium'>{tier.quantity}</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>{t('tierBreakdown.rate')}</span>
										<span className='ms-2 font-medium'>
											{currencySymbol}
											{tier.rate}
										</span>
									</div>
									<div className='flex-1'>
										<span className='text-gray-600'>{t('tierBreakdown.cost')}</span>
										<span className='ms-2 font-medium'>
											{currencySymbol}
											{tier.cost}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
};

export default TierBreakdown;
