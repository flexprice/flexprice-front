/* eslint-disable i18next/no-literal-string */
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BILLING_MODEL, Price, PRICE_TYPE, TIER_MODE, CreatePriceTier } from '@/models';
import { PriceUnit } from '@/models/PriceUnit';
import {
	normalizePriceDisplay,
	calculateDiscountedPrice,
	formatPriceDisplay,
	getBillingModelLabel,
	getTierModeLabel,
	NormalizedPriceDisplay,
	formatCouponName,
	ExtendedPriceOverride,
} from '@/utils';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Coupon } from '@/models';
import { cn } from '@/lib/utils';

interface Props {
	data: Price & { pricing_unit?: PriceUnit };
	appliedCoupon?: Coupon | null;
	priceOverride?: ExtendedPriceOverride;
}

const DiscountedPriceDisplay: FC<{
	originalAmount: number;
	discountedAmount: number;
	symbol: string;
	couponName: string;
}> = ({ originalAmount, discountedAmount, symbol, couponName }) => (
	<div className='flex items-center gap-2'>
		<div className='flex flex-col'>
			<div className='line-through text-gray-400 text-sm'>
				{symbol}
				{formatAmount(originalAmount.toString())}
			</div>
			<div className='text-gray-900 font-medium'>
				{symbol}
				{formatAmount(discountedAmount.toString())}
			</div>
		</div>
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className='h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors duration-150' />
				</TooltipTrigger>
				<TooltipContent sideOffset={5} className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-3 py-2 rounded-lg'>
					<div className='font-medium'>{couponName}</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</div>
);

const OverrideTooltip: FC<{
	original: NormalizedPriceDisplay;
	overridden: NormalizedPriceDisplay;
	originalPrice: Price;
}> = ({ original, overridden, originalPrice }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const detailSep = t('catalog:chargeValue.override.detailSep');
	const changes: string[] = [];

	if (overridden.billingModel !== original.billingModel) {
		changes.push(
			t('catalog:chargeValue.override.billingModelLine', {
				from: getBillingModelLabel(original.billingModel),
				to: getBillingModelLabel(overridden.billingModel),
			}),
		);
	}

	if (overridden.tierMode !== original.tierMode) {
		changes.push(
			t('catalog:chargeValue.override.tierModeLine', {
				from: getTierModeLabel(original.tierMode),
				to: getTierModeLabel(overridden.tierMode),
			}),
		);
	}

	if (overridden.amount !== original.amount) {
		changes.push(
			t('catalog:chargeValue.override.amountLine', {
				from: `${original.symbol}${formatAmount(original.amount)}`,
				to: `${overridden.symbol}${formatAmount(overridden.amount)}`,
			}),
		);
	}

	const quantityOverride = (overridden as NormalizedPriceDisplay & { quantity?: number }).quantity;
	if (quantityOverride && quantityOverride !== 1 && originalPrice.type === PRICE_TYPE.USAGE) {
		changes.push(t('catalog:chargeValue.override.quantityLine', { to: quantityOverride }));
	}

	if (
		overridden.transformQuantity &&
		(original.billingModel === BILLING_MODEL.PACKAGE || overridden.billingModel === BILLING_MODEL.PACKAGE)
	) {
		const originalDivideBy = original.transformQuantity?.divide_by || 1;
		const newDivideBy = overridden.transformQuantity.divide_by;
		if (originalDivideBy !== newDivideBy) {
			changes.push(
				t('catalog:chargeValue.override.packageSizeLine', {
					from: originalDivideBy,
					to: newDivideBy,
				}),
			);
		}
	}

	if (overridden.tiers && overridden.tiers.length > 0) {
		const originalTiers = original.tiers || [];
		const newTiers = overridden.tiers;

		if (originalTiers.length !== newTiers.length) {
			changes.push(
				t('catalog:chargeValue.override.tiersCountLine', {
					from: originalTiers.length,
					to: newTiers.length,
				}),
			);
		} else {
			const tierChanges: string[] = [];
			newTiers.forEach((newTier: CreatePriceTier, index: number) => {
				const originalTier = originalTiers[index];
				if (originalTier) {
					const tierChangesForThisTier: string[] = [];

					const originalFrom = index === 0 ? 0 : originalTiers[index - 1]?.up_to || 0;
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					if (originalFrom !== newFrom) {
						tierChangesForThisTier.push(
							t('catalog:chargeValue.override.tierDetailFrom', {
								from: originalFrom,
								to: newFrom,
							}),
						);
					}

					const originalUpTo = originalTier.up_to;
					const newUpTo = newTier.up_to;
					if (originalUpTo !== newUpTo) {
						const originalUpToDisplay = originalUpTo === null || originalUpTo === undefined ? '∞' : originalUpTo.toString();
						const newUpToDisplay = newUpTo === null || newUpTo === undefined ? '∞' : newUpTo.toString();
						tierChangesForThisTier.push(
							t('catalog:chargeValue.override.tierDetailUpTo', {
								from: originalUpToDisplay,
								to: newUpToDisplay,
							}),
						);
					}

					if (originalTier.unit_amount !== newTier.unit_amount) {
						tierChangesForThisTier.push(
							t('catalog:chargeValue.override.tierDetailPerUnit', {
								from: `${overridden.symbol}${formatAmount(originalTier.unit_amount)}`,
								to: `${overridden.symbol}${formatAmount(newTier.unit_amount)}`,
							}),
						);
					}

					if ((originalTier.flat_amount || '0') !== (newTier.flat_amount || '0')) {
						tierChangesForThisTier.push(
							t('catalog:chargeValue.override.tierDetailFlatFee', {
								from: `${overridden.symbol}${formatAmount(originalTier.flat_amount || '0')}`,
								to: `${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`,
							}),
						);
					}

					if (tierChangesForThisTier.length > 0) {
						tierChanges.push(
							t('catalog:chargeValue.override.tierLine', {
								header: t('catalog:chargeValue.override.tierHeader', { n: index + 1 }),
								details: tierChangesForThisTier.join(detailSep),
							}),
						);
					}
				} else {
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					const newUpToDisplay = newTier.up_to === null || newTier.up_to === undefined ? '∞' : newTier.up_to.toString();
					const perUnit = `${overridden.symbol}${formatAmount(newTier.unit_amount)}`;
					const flatFee = `${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`;
					tierChanges.push(
						t('catalog:chargeValue.override.tierAdded', {
							header: t('catalog:chargeValue.override.tierHeader', { n: index + 1 }),
							details: t('catalog:chargeValue.override.tierAddedDetails', {
								from: newFrom,
								upTo: newUpToDisplay,
								perUnit,
								flatFee,
							}),
						}),
					);
				}
			});

			if (tierChanges.length > 0) {
				changes.push(...tierChanges);
			} else {
				changes.push(t('catalog:chargeValue.override.tierStructureModified'));
			}
		}
	}

	if (changes.length === 0) {
		changes.push(t('catalog:chargeValue.override.priceConfigurationModified'));
	}

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className='h-4 w-4 text-orange-600 hover:text-orange-600 transition-colors duration-150' />
				</TooltipTrigger>
				<TooltipContent
					sideOffset={5}
					className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[300px]'>
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>Price Override Applied</div>
						{changes.map((change, index) => {
							// Check if this is a tier change that should be formatted as a table
							if (change.startsWith('Tier ') && change.includes(':')) {
								const tierInfo = change.split(': ');
								const tierHeader = tierInfo[0];
								const tierDetails = tierInfo[1];

								return (
									<div key={index} className='text-sm text-gray-600 space-y-1'>
										<div className='font-medium'>{tierHeader}:</div>
										<div className='ml-2 space-y-1'>
											{tierDetails.split(', ').map((detail, detailIndex) => (
												<div key={detailIndex} className='text-xs'>
													• {detail}
												</div>
											))}
										</div>
									</div>
								);
							}

							// Regular change format
							return (
								<div key={index} className='text-sm text-gray-600'>
									• {change}
								</div>
							);
						})}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

const TieredPricingTooltip: FC<{
	normalized: NormalizedPriceDisplay;
	hasOverrides: boolean;
}> = ({ normalized, hasOverrides }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const { tiers, tierMode, symbol } = normalized;

	if (!tiers || tiers.length === 0) return null;

	const formatRange = (tier: CreatePriceTier, index: number, allTiers: CreatePriceTier[]) => {
		const from = index === 0 ? 0 : allTiers[index - 1]?.up_to || 0;

		if (tier.up_to === null || tier.up_to === undefined || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}

		return `${from} - ${tier.up_to}`;
	};

	const modeLabel = tierMode === TIER_MODE.VOLUME ? t('catalog:chargeValue.volume') : t('catalog:chargeValue.slab');

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className={cn(hasOverrides && 'text-orange-600', 'h-4 w-4  transition-colors duration-150')} />
				</TooltipTrigger>
				<TooltipContent
					sideOffset={5}
					className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
					<div className='space-y-3'>
						<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>
							{t('catalog:chargeValue.tierPricingTitle', { mode: modeLabel })}
							{hasOverrides && <span className='text-xs text-orange-600 ms-2'>{t('catalog:chargeValue.overridden')}</span>}
						</div>
						<div className='space-y-2'>
							{tiers.map((tier, index) => (
								<div key={index} className='flex flex-col gap-1'>
									<div className='flex items-center justify-between gap-6'>
										<div className='!font-normal text-muted-foreground'>
											{t('catalog:chargeValue.tierRangeWithUnits', { range: formatRange(tier, index, tiers) })}
										</div>
										<div className='text-end'>
											<div className='!font-normal text-muted-foreground'>
												{t('catalog:chargeValue.perUnitLine', {
													symbol,
													amount: formatAmount(tier.unit_amount),
												})}
											</div>
											{Number(tier.flat_amount) > 0 && (
												<div className='text-xs text-gray-500'>
													{t('catalog:chargeValue.flatFeePlusLine', {
														symbol,
														amount: formatAmount(tier.flat_amount || '0'),
													})}
												</div>
											)}
										</div>
									</div>
									{index < tiers.length - 1 && <div className='h-px bg-gray-100' />}
								</div>
							))}
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

const ChargeValueCell: FC<Props> = ({ data, appliedCoupon, priceOverride }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const originalNormalized = normalizePriceDisplay(data);
	const overriddenNormalized = priceOverride ? normalizePriceDisplay(data, priceOverride) : null;

	const displayData = overriddenNormalized || originalNormalized;
	const hasOverrides = !!overriddenNormalized;

	const isTiered =
		(displayData.billingModel === BILLING_MODEL.TIERED || displayData.billingModel === 'SLAB_TIERED') &&
		Array.isArray(displayData.tiers) &&
		displayData.tiers.length > 0;

	const discountInfo = appliedCoupon && !priceOverride ? calculateDiscountedPrice(data, appliedCoupon) : null;

	const couponLabel = appliedCoupon ? formatCouponName(appliedCoupon) : t('catalog:chargeValue.noCouponApplied');

	return (
		<div className='flex items-center gap-2'>
			{discountInfo ? (
				<DiscountedPriceDisplay
					originalAmount={discountInfo.originalAmount}
					discountedAmount={discountInfo.discountedAmount}
					symbol={displayData.symbol}
					couponName={couponLabel}
				/>
			) : (
				<div>{formatPriceDisplay(displayData)}</div>
			)}

			{hasOverrides && !isTiered && overriddenNormalized && (
				<OverrideTooltip original={originalNormalized} overridden={overriddenNormalized} originalPrice={data} />
			)}

			{isTiered && <TieredPricingTooltip normalized={displayData} hasOverrides={hasOverrides} />}
		</div>
	);
};

export default ChargeValueCell;
