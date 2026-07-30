import { FC } from 'react';
import type { TFunction } from 'i18next';
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
} from '@/utils';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Coupon } from '@/models';
import { formatCouponName } from '@/utils';
import { ExtendedPriceOverride } from '@/utils';
import { cn } from '@/lib/utils';

interface Props {
	data: Price & { pricing_unit?: PriceUnit };
	appliedCoupon?: Coupon | null;
	priceOverride?: ExtendedPriceOverride;
	/** When true (e.g. price.entity_type === SUBSCRIPTION), show orange icon and "Overridden price" content */
	isSubscriptionOverride?: boolean;
}

type TierBlockRow = { variant: 'tier'; tierNumber: number; detailLines: string[] };
type SimpleBulletRow = { variant: 'simple'; text: string };
type OverrideRow = TierBlockRow | SimpleBulletRow;

const TierBreakdown: FC<{ normalized: NormalizedPriceDisplay; hasOverrides?: boolean; t: TFunction<'common'> }> = ({
	normalized,
	hasOverrides,
	t,
}) => {
	const { tiers, tierMode, symbol } = normalized;

	if (!tiers || tiers.length === 0) return null;

	const formatRange = (tier: CreatePriceTier, index: number, allTiers: CreatePriceTier[]) => {
		const from = index === 0 ? 0 : allTiers[index - 1]?.up_to || 0;
		if (tier.up_to === null || tier.up_to === undefined || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}
		return `${from} - ${tier.up_to}`;
	};

	const title = tierMode === TIER_MODE.VOLUME ? t('priceTooltip.volumeTierPricing') : t('priceTooltip.slabTierPricing');

	return (
		<div className='space-y-3'>
			<div className='font-medium border-b border-gray-200 pb-2 text-base text-gray-900'>
				{title}
				{hasOverrides && <span className='text-xs text-orange-600 ms-2'>{t('priceTooltip.overriddenBadge')}</span>}
			</div>
			<div className='space-y-2'>
				{tiers.map((tier, index) => (
					<div key={index} className='flex flex-col gap-1'>
						<div className='flex items-center justify-between gap-6'>
							<div className='text-sm text-muted-foreground'>
								{t('priceTooltip.rangeUnits', { range: formatRange(tier, index, tiers) })}
							</div>
							<div className='text-end'>
								<div className='text-sm text-muted-foreground'>
									{t('priceTooltip.perUnit', {
										symbol,
										amount: formatAmount(tier.unit_amount),
									})}
								</div>
								{Number(tier.flat_amount) > 0 && (
									<div className='text-xs text-gray-500'>
										{t('priceTooltip.flatFeeLine', {
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
	);
};

function buildOverrideRows(
	original: NormalizedPriceDisplay,
	overridden: NormalizedPriceDisplay,
	originalPrice: Price,
	t: TFunction<'common'>,
): OverrideRow[] {
	const rows: OverrideRow[] = [];

	if (overridden.billingModel !== original.billingModel) {
		rows.push({
			variant: 'simple',
			text: t('priceTooltip.billingModelChange', {
				from: getBillingModelLabel(original.billingModel),
				to: getBillingModelLabel(overridden.billingModel),
			}),
		});
	}

	if (overridden.tierMode !== original.tierMode) {
		rows.push({
			variant: 'simple',
			text: t('priceTooltip.tierModeChange', {
				from: getTierModeLabel(original.tierMode),
				to: getTierModeLabel(overridden.tierMode),
			}),
		});
	}

	if (overridden.amount !== original.amount) {
		rows.push({
			variant: 'simple',
			text: t('priceTooltip.amountChange', {
				from: `${original.symbol}${formatAmount(original.amount)}`,
				to: `${overridden.symbol}${formatAmount(overridden.amount)}`,
			}),
		});
	}

	const quantityOverride = (overridden as { quantity?: number }).quantity;
	if (quantityOverride && quantityOverride !== 1 && originalPrice.type === PRICE_TYPE.USAGE) {
		rows.push({
			variant: 'simple',
			text: t('priceTooltip.quantityChange', { to: quantityOverride }),
		});
	}

	if (
		overridden.transformQuantity &&
		(original.billingModel === BILLING_MODEL.PACKAGE || overridden.billingModel === BILLING_MODEL.PACKAGE)
	) {
		const originalDivideBy = original.transformQuantity?.divide_by || 1;
		const newDivideBy = overridden.transformQuantity.divide_by;
		if (originalDivideBy !== newDivideBy) {
			rows.push({
				variant: 'simple',
				text: t('priceTooltip.packageSizeChange', { from: originalDivideBy, to: newDivideBy }),
			});
		}
	}

	if (overridden.tiers && overridden.tiers.length > 0) {
		const originalTiers = original.tiers || [];
		const newTiers = overridden.tiers;

		if (originalTiers.length !== newTiers.length) {
			rows.push({
				variant: 'simple',
				text: t('priceTooltip.tiersCountChange', { from: originalTiers.length, to: newTiers.length }),
			});
		} else {
			let addedNewTierMessage = false;
			const tierBlocks: TierBlockRow[] = [];

			newTiers.forEach((newTier: CreatePriceTier, index: number) => {
				const originalTier = originalTiers[index];
				if (originalTier) {
					const detailLines: string[] = [];

					const originalFrom = index === 0 ? 0 : originalTiers[index - 1]?.up_to || 0;
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					if (originalFrom !== newFrom) {
						detailLines.push(t('priceTooltip.tierFromChange', { from: originalFrom, to: newFrom }));
					}

					const originalUpTo = originalTier.up_to;
					const newUpTo = newTier.up_to;
					if (originalUpTo !== newUpTo) {
						const originalUpToDisplay = originalUpTo === null || originalUpTo === undefined ? '∞' : originalUpTo.toString();
						const newUpToDisplay = newUpTo === null || newUpTo === undefined ? '∞' : newUpTo.toString();
						detailLines.push(t('priceTooltip.tierUpToChange', { from: originalUpToDisplay, to: newUpToDisplay }));
					}

					if (originalTier.unit_amount !== newTier.unit_amount) {
						detailLines.push(
							t('priceTooltip.tierPerUnitChange', {
								from: `${overridden.symbol}${formatAmount(originalTier.unit_amount)}`,
								to: `${overridden.symbol}${formatAmount(newTier.unit_amount)}`,
							}),
						);
					}

					if ((originalTier.flat_amount || '0') !== (newTier.flat_amount || '0')) {
						detailLines.push(
							t('priceTooltip.tierFlatFeeChange', {
								from: `${overridden.symbol}${formatAmount(originalTier.flat_amount || '0')}`,
								to: `${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`,
							}),
						);
					}

					if (detailLines.length > 0) {
						tierBlocks.push({ variant: 'tier', tierNumber: index + 1, detailLines });
					}
				} else {
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					const newUpToDisplay = newTier.up_to === null || newTier.up_to === undefined ? '∞' : newTier.up_to.toString();
					addedNewTierMessage = true;
					rows.push({
						variant: 'simple',
						text: t('priceTooltip.tierNAdded', {
							n: index + 1,
							from: newFrom,
							upTo: newUpToDisplay,
							perUnit: `${overridden.symbol}${formatAmount(newTier.unit_amount)}`,
							flat: `${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`,
						}),
					});
				}
			});

			if (tierBlocks.length > 0) {
				rows.push(...tierBlocks);
			} else if (!addedNewTierMessage) {
				rows.push({ variant: 'simple', text: t('priceTooltip.tierStructureModified') });
			}
		}
	}

	if (rows.length === 0) {
		rows.push({ variant: 'simple', text: t('priceTooltip.priceConfigModified') });
	}

	return rows;
}

function OverrideChangesList({
	original,
	overridden,
	originalPrice,
	t,
}: {
	original: NormalizedPriceDisplay;
	overridden: NormalizedPriceDisplay;
	originalPrice: Price;
	t: TFunction<'common'>;
}) {
	const rows = buildOverrideRows(original, overridden, originalPrice, t);

	return (
		<div className='space-y-2'>
			{rows.map((change, index) =>
				change.variant === 'tier' ? (
					<div key={index} className='text-sm text-gray-600 space-y-1'>
						<div className='font-medium'>{t('priceTooltip.tierNDetailsHeader', { n: change.tierNumber })}</div>
						<div className='ms-2 space-y-1'>
							{change.detailLines.map((detail, detailIndex) => (
								<div key={detailIndex} className='text-xs'>
									• {detail}
								</div>
							))}
						</div>
					</div>
				) : (
					<div key={index} className='text-sm text-gray-600'>
						• {change.text}
					</div>
				),
			)}
		</div>
	);
}

const PriceTooltipContent: FC<{
	normalized: NormalizedPriceDisplay;
	hasOverrides: boolean;
	hasDiscount: boolean;
	discountInfo: ReturnType<typeof calculateDiscountedPrice> | null;
	couponName?: string;
	originalNormalized?: NormalizedPriceDisplay;
	originalPrice?: Price;
	isSubscriptionOverride?: boolean;
}> = ({ normalized, hasOverrides, hasDiscount, discountInfo, couponName, originalNormalized, originalPrice, isSubscriptionOverride }) => {
	const { t } = useTranslation('common');
	const isTiered =
		(normalized.billingModel === BILLING_MODEL.TIERED || normalized.billingModel === 'SLAB_TIERED') &&
		Array.isArray(normalized.tiers) &&
		normalized.tiers.length > 0;

	return (
		<TooltipContent
			sideOffset={5}
			className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
			<div className='space-y-3'>
				{isSubscriptionOverride && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>{t('priceTooltip.overriddenPrice')}</div>
						{isTiered ? (
							<TierBreakdown normalized={normalized} hasOverrides={false} t={t} />
						) : (
							<div className='text-sm text-gray-900'>
								{normalized.billingModel === BILLING_MODEL.FLAT_FEE
									? t('priceTooltip.displayPerUnit', {
											symbol: normalized.symbol,
											amount: formatAmount(normalized.amount),
										})
									: formatPriceDisplay(normalized)}
							</div>
						)}
					</div>
				)}

				{!isSubscriptionOverride && hasDiscount && discountInfo && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>{t('priceTooltip.priceHeading')}</div>
						<div className='space-y-1'>
							<div className='line-through text-gray-400 text-sm'>
								{normalized.symbol}
								{formatAmount(discountInfo.originalAmount.toString())}
							</div>
							<div className='text-gray-900 font-medium'>
								{normalized.symbol}
								{formatAmount(discountInfo.discountedAmount.toString())}
							</div>
							{couponName && <div className='text-xs text-gray-500 mt-1'>{couponName}</div>}
						</div>
					</div>
				)}

				{!isSubscriptionOverride && hasOverrides && !isTiered && originalNormalized && originalPrice && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>{t('priceTooltip.priceOverrideApplied')}</div>
						<OverrideChangesList original={originalNormalized} overridden={normalized} originalPrice={originalPrice} t={t} />
					</div>
				)}

				{!isSubscriptionOverride && isTiered && (
					<div className='space-y-2'>
						<TierBreakdown normalized={normalized} hasOverrides={hasOverrides} t={t} />
					</div>
				)}

				{!isSubscriptionOverride && !hasDiscount && !hasOverrides && !isTiered && (
					<div className='space-y-1'>
						<div className='font-medium text-gray-900'>{t('priceTooltip.priceHeading')}</div>
						<div className='text-sm text-gray-900'>
							{normalized.billingModel === BILLING_MODEL.FLAT_FEE
								? t('priceTooltip.displayPerUnit', {
										symbol: normalized.symbol,
										amount: formatAmount(normalized.amount),
									})
								: formatPriceDisplay(normalized)}
						</div>
					</div>
				)}
			</div>
		</TooltipContent>
	);
};

const PriceTooltip: FC<Props> = ({ data, appliedCoupon, priceOverride, isSubscriptionOverride }) => {
	const originalNormalized = normalizePriceDisplay(data);
	const overriddenNormalized = priceOverride ? normalizePriceDisplay(data, priceOverride) : null;

	const displayData = overriddenNormalized || originalNormalized;
	const hasOverrides = !!overriddenNormalized;

	const discountInfo = appliedCoupon && !priceOverride ? calculateDiscountedPrice(data, appliedCoupon) : null;
	const hasDiscount = !!discountInfo;
	const couponName = appliedCoupon ? formatCouponName(appliedCoupon) : undefined;

	const iconColor = hasOverrides || isSubscriptionOverride ? 'text-orange-600' : hasDiscount ? 'text-blue-500' : 'text-gray-500';

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className={cn(iconColor, 'h-4 w-4 hover:opacity-80 transition-colors duration-150')} />
				</TooltipTrigger>
				<PriceTooltipContent
					normalized={displayData}
					hasOverrides={hasOverrides}
					hasDiscount={hasDiscount}
					discountInfo={discountInfo}
					couponName={couponName}
					originalNormalized={hasOverrides ? originalNormalized : undefined}
					originalPrice={hasOverrides ? data : undefined}
					isSubscriptionOverride={isSubscriptionOverride}
				/>
			</Tooltip>
		</TooltipProvider>
	);
};

export default PriceTooltip;
