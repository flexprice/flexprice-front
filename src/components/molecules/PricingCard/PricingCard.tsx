import { useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
// The reusable cross-cutting primitives live in `@/lib/exportable` (bundledI18n + validation);
// `@/pricing/i18n` and `@/pricing/schema` are thin pricing-specific wrappers over them.
import { usePricingT } from '@/pricing/i18n';
import { Check, Coins, Eye, Gauge, Info, Mail, MessageSquare, Phone, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import { PlanType } from '@/constants/planTypes';
import { cn } from '@/lib/utils';
import { PRICE_TYPE } from '@/models/Price';
import { normalizeCardProps } from '@/pricing/schema';
import { JsonObject } from '@/types/common';
export interface UsageCharge {
	amount?: string;
	currency?: string;
	billing_model: string;
	type?: PRICE_TYPE;
	tiers?: Array<{
		up_to: number | null;
		unit_amount: string;
		flat_amount: string;
	}> | null;
	matter_name?: string;
	meter_name?: string;
}

export interface PricingCardProps {
	id: string;
	name: string;
	description: string;
	price: {
		amount?: string;
		currency?: string;
		billingPeriod?: string;
		type?: PRICE_TYPE;
		displayType: PlanType;
	};
	usageCharges?: UsageCharge[];
	entitlements: Array<{
		id: string;
		feature_id: string;
		name: string;
		type: 'STATIC' | 'BOOLEAN' | 'METERED' | 'CONFIG';
		value: string | number | boolean | JsonObject | null;
		description?: string;
		usage_reset_period?: string;
	}>;
	onPurchase?: () => void;
	/** Invoked when the plan CTA ("View plan") is clicked. Consumers wire their own navigation. */
	onSelectPlan?: (id: string) => void;
	/** Optional link target for a feature name. Return undefined to render plain text (default). */
	getFeatureHref?: (featureId: string) => string | undefined;
	className?: string;
	showUsageCharges?: boolean;
	/** When true, AI/onboarding preview: full charge/entitlement lists, optional credits, no "View plan" CTA. */
	isPreview?: boolean;
	/** Product catalog / widgets: same card chrome, icons, and colors as setup preview, but keeps "View plan" and list truncation. */
	useModernChrome?: boolean;
	/** Per-plan credit grants (listed under entitlements when preview or modern chrome). */
	creditGrants?: Array<{
		name: string;
		credits: number;
		cadence: 'onetime' | 'recurring';
		/** Lowercase cadence label for display, e.g. monthly, annual, weekly. */
		period?: string | null;
	}>;
}

const formatEntitlementValue = ({
	type,
	value,
	name,
	usage_reset_period,
	feature_id,
	t,
	getFeatureHref,
}: {
	type: string;
	value: string | number | boolean | JsonObject | null;
	name: string;
	usage_reset_period: string;
	feature_id: string;
	t: TFunction<'common'>;
	getFeatureHref?: (featureId: string) => string | undefined;
}) => {
	const featureHref = feature_id ? getFeatureHref?.(feature_id) : undefined;
	const feature = featureHref ? (
		<a
			href={featureHref}
			className='hover:underline decoration-dashed decoration-[0.5px] decoration-muted-foreground/50 underline-offset-4'>
			{name}
		</a>
	) : (
		name
	);

	switch (type) {
		case 'STATIC':
			return (
				<>
					{value} {feature}
				</>
			);
		case 'BOOLEAN':
			return (
				<>
					{value ? (
						feature
					) : (
						<>
							{name} {t('pricingCard.notIncluded')}
						</>
					)}
				</>
			);
		case 'METERED':
			return (
				<>
					{formatAmount((value ?? '').toString())} {feature}
					{usage_reset_period ? t('pricingCard.perBillingPeriod', { period: formatBillingPeriodForPrice(usage_reset_period) }) : ''}
				</>
			);
		case 'CONFIG':
			return feature;
		default:
			return `${value} ${feature}`;
	}
};

const formatUsageCharge = (charge: UsageCharge, t: TFunction<'common'>) => {
	if (!charge.amount) return '';

	const sym = getCurrencySymbol(charge.currency || '');
	const amt = `${sym}${formatAmount(charge.amount)}`;

	if (charge.billing_model === 'PACKAGE') {
		return t('pricingCard.perPackage', { amount: amt });
	} else if (charge.billing_model === 'FLAT_FEE') {
		return t('pricingCard.perUnit', { amount: amt });
	} else if (charge.billing_model === 'TIERED' && charge.tiers?.length) {
		const startAmt = `${sym}${formatAmount(charge.tiers[0].unit_amount)}`;
		return t('pricingCard.startingAtPerUnit', { amount: startAmt });
	}
	return t('pricingCard.perUnit', { amount: amt });
};

/** Compact usage line for AI pricing preview (/unit instead of per unit). */
const formatUsageChargeCompact = (charge: UsageCharge, t: TFunction<'common'>) => {
	if (!charge.amount) return '';
	const sym = getCurrencySymbol(charge.currency || '');
	const amt = formatAmount(charge.amount);
	if (charge.billing_model === 'PACKAGE') {
		return t('pricingCard.compactPerPkg', { amount: `${sym}${amt}` });
	}
	if (charge.billing_model === 'TIERED' && charge.tiers?.length) {
		return t('pricingCard.compactFromPerUnit', { amount: `${sym}${formatAmount(charge.tiers[0].unit_amount)}` });
	}
	return t('pricingCard.compactPerUnit', { amount: `${sym}${amt}` });
};

/** Matches default/template grant titles — redundant with plan cadence (e.g. /month on price). */
function isBoilerplateCreditGrantName(raw: string): boolean {
	const n = raw.trim().toLowerCase().replace(/\s+/g, ' ');
	if (!n) return true;
	return /^(monthly|annual|quarterly|weekly|daily) included credits?$/.test(n);
}

function getEntitlementVisual(type: string, name: string): { Icon: LucideIcon; iconClass: string } {
	const n = name.toLowerCase();
	if (type === 'METERED') {
		if (n.includes('email') || n.includes('mail')) return { Icon: Mail, iconClass: 'text-sky-600' };
		if (n.includes('sms') || n.includes('chat') || n.includes('message')) return { Icon: MessageSquare, iconClass: 'text-violet-600' };
		if (n.includes('phone') || n.includes('call') || n.includes('minute')) return { Icon: Phone, iconClass: 'text-emerald-600' };
		if (n.includes('api') || n.includes('request') || n.includes('agent')) return { Icon: Zap, iconClass: 'text-amber-600' };
		return { Icon: Gauge, iconClass: 'text-indigo-600' };
	}
	return { Icon: Sparkles, iconClass: 'text-emerald-600' };
}

function formatEntitlementPreviewLine(ent: PricingCardProps['entitlements'][0], t: TFunction<'common'>): string {
	const period = ent.usage_reset_period ? `/${formatBillingPeriodForPrice(ent.usage_reset_period)}` : '';
	switch (ent.type) {
		case 'STATIC':
			return `${ent.value} ${ent.name}`;
		case 'BOOLEAN':
			return ent.value ? String(ent.name) : t('pricingCard.previewBooleanNotIncluded', { name: ent.name });
		case 'METERED':
			return `${formatAmount(String(ent.value))} ${ent.name}${period}`;
		case 'CONFIG':
			return String(ent.name);
		default:
			return `${ent.value} ${ent.name}`;
	}
}

const UsageChargeTooltip: React.FC<{ charge: UsageCharge; t: TFunction<'common'> }> = ({ charge, t }) => {
	if (charge.billing_model !== 'TIERED' || !charge.tiers) {
		return null;
	}

	type Tier = NonNullable<UsageCharge['tiers']>[number];
	const formatRange = (tier: Tier, index: number, allTiers: Tier[]) => {
		const from = index === 0 ? 1 : (allTiers[index - 1].up_to ?? 0) + 1;
		if (tier.up_to === null || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}
		return `${from} - ${tier.up_to}`;
	};

	const sym = getCurrencySymbol(charge.currency || '');

	return (
		<TooltipContent
			sideOffset={5}
			className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
			<div className='space-y-3'>
				<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>
					{t('pricingCard.volumePricing')}
				</div>
				<div className='space-y-2'>
					{charge.tiers.map((tier, index) => (
						<div key={index} className='flex flex-col gap-1'>
							<div className='flex items-center justify-between gap-6'>
								<div className='!font-normal text-muted-foreground'>
									{t('pricingCard.unitsLabel', { range: formatRange(tier, index, charge.tiers || []) })}
								</div>
								<div className='text-end'>
									<div className='!font-normal text-muted-foreground'>
										{t('pricingCard.perUnitShort', {
											amount: `${sym}${formatAmount(tier.unit_amount)}`,
										})}
									</div>
									{Number(tier.flat_amount) > 0 && (
										<div className='text-xs text-gray-500'>
											{t('pricingCard.flatFeeShort', { amount: `${sym}${formatAmount(tier.flat_amount)}` })}
										</div>
									)}
								</div>
							</div>
							{index < (charge.tiers?.length || 0) - 1 && <div className='h-px bg-gray-100' />}
						</div>
					))}
				</div>
			</div>
		</TooltipContent>
	);
};

const VISIBLE_LIMIT = 3;

const PricingCard: React.FC<PricingCardProps> = (rawProps) => {
	// Validate/normalize own props at the boundary so a direct SDK/JS consumer passing a wrong
	// shape degrades (fields coerced, invalid displayType → FIXED, missing arrays → []) instead
	// of white-screening. Idempotent for trusted dashboard data. Every entry point (this card +
	// PricingTable) validates independently.
	const {
		id,
		name,
		price = { displayType: PlanType.FIXED },
		usageCharges = [],
		entitlements = [],
		creditGrants = [],
		className = '',
		showUsageCharges = false,
		isPreview = false,
		useModernChrome = false,
		onSelectPlan,
		getFeatureHref,
	} = normalizeCardProps(rawProps);
	// Host i18n when available (dashboard: Arabic/white-label), else bundled English defaults.
	const t = usePricingT();
	const [showAllCharges, setShowAllCharges] = useState(false);
	const [showAllEntitlements, setShowAllEntitlements] = useState(false);

	const isSetupPreview = isPreview;
	const visualModern = isSetupPreview || useModernChrome;

	const priceDisplayConfig = useMemo(
		() =>
			({
				[PlanType.FREE]: { text: t('pricingCard.free'), useCurrencyZeroDisplay: false, showBillingPeriod: false, subtext: '' },
				[PlanType.HYBRID_FREE]: { text: '', useCurrencyZeroDisplay: true, showBillingPeriod: true, subtext: t('pricingCard.plusUsage') },
				[PlanType.HYBRID_PAID]: { text: '', useCurrencyZeroDisplay: false, showBillingPeriod: true, subtext: t('pricingCard.plusUsage') },
				[PlanType.USAGE_ONLY]: { text: '', useCurrencyZeroDisplay: true, showBillingPeriod: true, subtext: t('pricingCard.plusUsage') },
				[PlanType.FIXED]: { text: '', useCurrencyZeroDisplay: false, showBillingPeriod: true, subtext: '' },
			}) as const,
		[t],
	);

	// Fall back to FIXED chrome when displayType is missing/invalid so `config` is never undefined.
	const config = priceDisplayConfig[price.displayType] ?? priceDisplayConfig[PlanType.FIXED];
	const displayAmount = config.text || `${getCurrencySymbol(price.currency || '')}${formatAmount(price.amount || '')}`;
	const hasUsageCharges = usageCharges.length > 0;

	const chargeLimit = isSetupPreview ? usageCharges.length : VISIBLE_LIMIT;
	const entLimit = isSetupPreview ? entitlements.length : VISIBLE_LIMIT;

	const visibleCharges = showAllCharges ? usageCharges : usageCharges.slice(0, chargeLimit);
	const hiddenChargesCount = isSetupPreview ? 0 : usageCharges.length - VISIBLE_LIMIT;

	const visibleEntitlements = showAllEntitlements ? entitlements : entitlements.slice(0, entLimit);
	const hiddenEntitlementsCount = isSetupPreview ? 0 : entitlements.length - VISIBLE_LIMIT;

	return (
		<div
			className={cn(
				'flexprice-ui',
				'border transition-all shadow-md',
				visualModern
					? 'rounded-2xl border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-5 shadow-sm ring-1 ring-slate-100 hover:border-slate-300/90'
					: 'border-gray-200 bg-white hover:border-gray-300 rounded-3xl p-7',
				className,
			)}>
			{/* Header */}
			<div className={cn(visualModern ? 'space-y-1.5' : 'space-y-2')}>
				<h3 className={cn('font-[300] text-gray-900', visualModern ? 'text-lg' : 'text-xl')}>{name}</h3>
				{/* <p className='text-sm font-normal text-gray-500 leading-relaxed'>{description}</p> */}
			</div>

			{/* Price */}
			<div className={cn(visualModern ? 'mt-5 space-y-3' : 'mt-6 space-y-4')}>
				{/* Base Price */}
				<div className='flex flex-col'>
					<div className='flex items-baseline'>
						<span className={cn('font-normal text-gray-900', visualModern ? 'text-[28px]' : 'text-4xl')}>
							{config.useCurrencyZeroDisplay ? `${getCurrencySymbol(price.currency || '')}0` : displayAmount}
						</span>
						{config.showBillingPeriod && (
							<span className={cn('ms-2 text-gray-500', visualModern ? 'text-xs' : 'text-sm text3')}>
								/{formatBillingPeriodForPrice(price.billingPeriod || '')}
								{config.subtext && (!visualModern || isSetupPreview) && (
									<span className={cn('ms-1', visualModern ? 'text-[11px] font-semibold text-indigo-600' : 'font-medium text-lg')}>
										{config.subtext}
									</span>
								)}
							</span>
						)}
					</div>
				</div>

				{/* Usage Charges Section */}
				{hasUsageCharges && showUsageCharges && (
					<div className={cn('border-t', visualModern ? 'mt-3 border-slate-100 pt-3.5' : 'pt-4')}>
						<div
							className={cn(
								'font-medium text-gray-900',
								visualModern ? 'mb-2 text-[10px] uppercase tracking-wide text-gray-400' : 'mb-2 text-sm',
							)}>
							{visualModern ? t('pricingCard.usageSectionModern') : t('pricingCard.usageSectionClassic')}
						</div>
						<div className={cn(visualModern ? 'space-y-2' : 'space-y-2')}>
							{visibleCharges.map((charge, index) => (
								<div
									key={index}
									className={cn(
										'flex items-start justify-between gap-2',
										visualModern ? 'text-[11px] leading-snug text-slate-700' : 'gap-3 text-sm text-gray-600',
									)}>
									<span className={cn('min-w-0 flex-1', !visualModern && 'leading-snug')}>{charge.meter_name}</span>
									<div className='flex items-center gap-1.5 shrink-0'>
										<span className={cn('whitespace-nowrap text-end font-medium', visualModern ? 'text-slate-800' : 'text-gray-700')}>
											{visualModern ? formatUsageChargeCompact(charge, t) : formatUsageCharge(charge, t)}
										</span>
										{charge.billing_model === 'TIERED' && charge.tiers && (
											<TooltipProvider delayDuration={0}>
												<Tooltip>
													<TooltipTrigger>
														<Info
															className={cn(
																'text-gray-400 transition-colors duration-150 hover:text-gray-500',
																visualModern ? 'h-3.5 w-3.5' : 'h-4 w-4',
															)}
														/>
													</TooltipTrigger>
													<UsageChargeTooltip charge={charge} t={t} />
												</Tooltip>
											</TooltipProvider>
										)}
									</div>
								</div>
							))}
							{!showAllCharges && hiddenChargesCount > 0 && (
								<button
									type='button'
									onClick={() => setShowAllCharges(true)}
									className={cn(
										'mt-1 flex items-center gap-1.5 text-xs transition-colors',
										visualModern ? 'text-slate-400 hover:text-slate-600' : 'text-gray-400 hover:text-gray-600',
									)}>
									<Eye className='h-3.5 w-3.5' />
									{t('pricingCard.moreCount', { count: hiddenChargesCount })}
								</button>
							)}
							{showAllCharges && usageCharges.length > VISIBLE_LIMIT && (
								<button
									type='button'
									onClick={() => setShowAllCharges(false)}
									className={cn(
										'mt-1 flex items-center gap-1.5 text-xs transition-colors',
										visualModern ? 'text-slate-400 hover:text-slate-600' : 'text-gray-400 hover:text-gray-600',
									)}>
									{t('pricingCard.showLess')}
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* View plan — below price, above included / credits. Only rendered when a consumer wires
			    `onSelectPlan`, so the CTA is never an enabled no-op. */}
			{!isSetupPreview && onSelectPlan && (
				<div className={cn(visualModern ? 'mt-5' : 'mt-6')}>
					<Button
						onClick={() => {
							onSelectPlan(id);
						}}
						className={cn(
							'w-full py-3 text-sm font-medium transition-colors',
							visualModern
								? 'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50'
								: 'rounded-2xl bg-gray-50 text-gray-900 hover:bg-gray-100',
						)}
						variant='outline'>
						{t('pricingCard.viewPlan')}
					</Button>
				</div>
			)}

			{/* Features + credits (credits: simple rows under entitlements when modern / preview) */}
			{(entitlements.length > 0 || !isSetupPreview || (visualModern && creditGrants.length > 0)) && (
				<div className={cn(visualModern ? 'mt-4 border-t border-slate-100 pt-4' : 'mt-7')}>
					{entitlements.length > 0 ? (
						<>
							{visualModern && (
								<p className='mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400'>{t('pricingCard.includedHeading')}</p>
							)}
							<ul className={cn(visualModern ? 'space-y-2.5' : 'space-y-3.5')}>
								{visibleEntitlements.map((entitlement) => {
									if (visualModern) {
										const { Icon, iconClass } = getEntitlementVisual(entitlement.type, entitlement.name);
										return (
											<li key={entitlement.id} className='flex items-center gap-2'>
												<Icon className={cn('h-3.5 w-3.5 shrink-0', iconClass)} strokeWidth={2} aria-hidden />
												<span className='min-w-0 flex-1 text-[11px] font-normal leading-snug text-slate-700'>
													{isSetupPreview ? (
														formatEntitlementPreviewLine(entitlement, t)
													) : (
														<>
															{formatEntitlementValue({
																type: entitlement.type,
																value: entitlement.value,
																name: entitlement.name,
																usage_reset_period: entitlement.usage_reset_period || '',
																feature_id: entitlement.feature_id,
																t,
																getFeatureHref,
															})}
														</>
													)}
												</span>
												{entitlement.description && (
													<TooltipProvider delayDuration={0}>
														<Tooltip>
															<TooltipTrigger className='cursor-pointer shrink-0'>
																<Info className='h-3.5 w-3.5 text-gray-400 transition-colors hover:text-gray-500' />
															</TooltipTrigger>
															<TooltipContent
																sideOffset={5}
																className='max-w-[200px] rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white'>
																{entitlement.description}
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}
											</li>
										);
									}
									return (
										<li key={entitlement.id} className='flex items-center gap-3'>
											<Check className='h-[18px] w-[18px] flex-shrink-0 text-gray-600' />
											<span className='flex-1 text-[15px] font-normal text-gray-600'>
												{formatEntitlementValue({
													type: entitlement.type,
													value: entitlement.value,
													name: entitlement.name,
													usage_reset_period: entitlement.usage_reset_period || '',
													feature_id: entitlement.feature_id,
													t,
													getFeatureHref,
												})}
											</span>
											{entitlement.description && (
												<TooltipProvider delayDuration={0}>
													<Tooltip>
														<TooltipTrigger className='cursor-pointer'>
															<Info className='h-4 w-4 text-gray-400 transition-colors duration-150 hover:text-gray-500' />
														</TooltipTrigger>
														<TooltipContent sideOffset={5} className='max-w-[200px] rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white'>
															{entitlement.description}
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											)}
										</li>
									);
								})}
								{!showAllEntitlements && hiddenEntitlementsCount > 0 && (
									<li>
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type='button'
														onClick={() => setShowAllEntitlements(true)}
														className={cn(
															'flex items-center gap-1.5 text-xs transition-colors',
															visualModern ? 'text-slate-400 hover:text-slate-600' : 'text-gray-400 hover:text-gray-600',
														)}>
														<Eye className='h-3.5 w-3.5' />
														{t('pricingCard.moreCount', { count: hiddenEntitlementsCount })}
													</button>
												</TooltipTrigger>
												<TooltipContent
													sideOffset={5}
													className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[280px]'>
													<div className='space-y-2'>
														{entitlements.slice(VISIBLE_LIMIT).map((ent, i) => {
															if (visualModern) {
																const { Icon, iconClass } = getEntitlementVisual(ent.type, ent.name);
																return (
																	<div key={i} className='flex items-start gap-2 text-[11px] leading-snug text-slate-700'>
																		<Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', iconClass)} strokeWidth={2} aria-hidden />
																		<span>
																			{formatEntitlementValue({
																				type: ent.type,
																				value: ent.value,
																				name: ent.name,
																				usage_reset_period: ent.usage_reset_period || '',
																				feature_id: '',
																				t,
																				getFeatureHref,
																			})}
																		</span>
																	</div>
																);
															}
															return (
																<div key={i} className='flex items-start gap-2 text-sm text-gray-600'>
																	<Check className='h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0' />
																	<span>
																		{formatEntitlementValue({
																			type: ent.type,
																			value: ent.value,
																			name: ent.name,
																			usage_reset_period: ent.usage_reset_period || '',
																			feature_id: '',
																			t,
																			getFeatureHref,
																		})}
																	</span>
																</div>
															);
														})}
													</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</li>
								)}
								{showAllEntitlements && entitlements.length > VISIBLE_LIMIT && (
									<li>
										<button
											type='button'
											onClick={() => setShowAllEntitlements(false)}
											className={cn(
												'flex items-center gap-1.5 text-xs transition-colors',
												visualModern ? 'text-slate-400 hover:text-slate-600' : 'text-gray-400 hover:text-gray-600',
											)}>
											{t('pricingCard.showLess')}
										</button>
									</li>
								)}
							</ul>
						</>
					) : (
						<div className='text-center'>
							<button
								onClick={() => onSelectPlan?.(id)}
								className='text-sm text-gray-900 underline decoration-dashed decoration-[0.5px] decoration-muted-foreground/50 underline-offset-4 hover:text-gray-700 transition-colors'>
								{t('pricingCard.addEntitlements')}
							</button>
						</div>
					)}

					{visualModern && creditGrants.length > 0 && (
						<div className={cn(entitlements.length > 0 || !isSetupPreview ? 'mt-3 border-t border-slate-100 pt-3' : '')}>
							<p className='mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400'>{t('pricingCard.creditsHeading')}</p>
							<ul className='space-y-2.5'>
								{creditGrants.map((g, i) => (
									<li key={`${g.name}-${i}`} className='flex items-center gap-2'>
										<Coins className='h-3.5 w-3.5 shrink-0 text-slate-400' strokeWidth={2} aria-hidden />
										<span className='min-w-0 flex-1 text-[11px] font-normal leading-snug text-slate-700'>
											<span className='font-medium text-slate-800'>
												{t('pricingCard.creditsAmount', { formatted: g.credits.toLocaleString() })}
											</span>
											{!isBoilerplateCreditGrantName(g.name) && <span className='text-slate-600'> · {g.name}</span>}
											{g.cadence === 'recurring' && g.period && <span className='text-slate-500'> /{g.period}</span>}
											{g.cadence === 'onetime' && (
												<span className='text-slate-500'>
													{' · '}
													{t('pricingCard.oneTime')}
												</span>
											)}
											{g.cadence === 'recurring' && !g.period && (
												<span className='text-slate-500'>
													{' · '}
													{t('pricingCard.recurring')}
												</span>
											)}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PricingCard;
