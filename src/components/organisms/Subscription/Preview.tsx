import { Price } from '@/models/Price';
import { useMemo, useCallback } from 'react';
import {
	formatBillingPeriodForDisplay,
	calculateCouponDiscount,
	getCurrencySymbol,
	calculateTotalCouponDiscount,
} from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/constants/constants';
import { BILLING_CYCLE } from '@/models/Subscription';
import formatDate from '@/utils/common/format_date';
import { calculateAnniversaryBillingAnchor, calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { cn } from '@/lib/utils';
import { Calendar, Receipt } from 'lucide-react';
import TimelinePreview, { PreviewTimelineItem } from './TimelinePreview';
import { ExpandedPlan } from '@/types';
import { Coupon } from '@/models/Coupon';
import { ExtendedPriceOverride, getCurrentPriceAmount } from '@/utils/common/price_override_helpers';
import { TaxRateOverride } from '@/types/dto/tax';
import { AddAddonToSubscriptionRequest, AddonResponse } from '@/types/dto/Addon';
import { useQuery } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';
import { SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';

const PERIOD_DURATION: Record<BILLING_PERIOD, string> = {
	[BILLING_PERIOD.DAILY]: '1 day',
	[BILLING_PERIOD.WEEKLY]: '1 week',
	[BILLING_PERIOD.MONTHLY]: '1 month',
	[BILLING_PERIOD.QUARTERLY]: '3 months',
	[BILLING_PERIOD.HALF_YEARLY]: '6 months',
	[BILLING_PERIOD.ANNUAL]: '1 year',
} as const;

interface PreviewProps {
	data: Price[];
	className?: string;
	selectedPlan?: ExpandedPlan | null;
	phases: SubscriptionPhaseCreateRequest[];
	billingCycle?: BILLING_CYCLE;
	coupons?: Coupon[];
	allCoupons?: Coupon[];
	priceOverrides?: Record<string, ExtendedPriceOverride>;
	lineItemCoupons?: Record<string, Coupon>;
	taxRateOverrides?: TaxRateOverride[];
	addons?: AddAddonToSubscriptionRequest[];
}

const hasAdvanceCharge = (charges: Price[]): boolean => {
	return charges?.some((charge) => charge.invoice_cadence === 'ADVANCE') ?? false;
};

const getBillingDescription = (charges: Price[], billingPeriod: BILLING_PERIOD, date: Date): string => {
	const period = PERIOD_DURATION[billingPeriod] || formatBillingPeriodForDisplay(billingPeriod).toLowerCase();
	return hasAdvanceCharge(charges) ? `Bills immediately for ${period}` : `Bills on ${formatDate(date)} for ${period}`;
};

const calculateFirstInvoiceDate = (startDate: Date, billingPeriod: BILLING_PERIOD, billingCycle: BILLING_CYCLE): Date => {
	return billingCycle === BILLING_CYCLE.CALENDAR
		? calculateCalendarBillingAnchor(startDate, billingPeriod)
		: calculateAnniversaryBillingAnchor(startDate, billingPeriod);
};

const calculateTotalWithLineItemCoupons = (
	charges: Price[],
	priceOverrides: Record<string, ExtendedPriceOverride>,
	lineItemCoupons: Record<string, Coupon>,
): { total: number; lineItemDiscounts: Record<string, number>; totalDiscount: number } => {
	let total = 0;
	let totalDiscount = 0;
	const lineItemDiscounts: Record<string, number> = {};

	charges.forEach((charge) => {
		const currentAmount = getCurrentPriceAmount(charge, priceOverrides);
		const chargeAmount = parseFloat(currentAmount);

		if (charge.type === 'FIXED') {
			const chargeCoupon = lineItemCoupons[charge.id];
			const chargeDiscount = chargeCoupon ? calculateCouponDiscount(chargeCoupon, chargeAmount) : 0;
			lineItemDiscounts[charge.id] = chargeDiscount;
			totalDiscount += chargeDiscount;
			total += Math.max(0, chargeAmount - chargeDiscount);
		} else {
			total += chargeAmount;
		}
	});

	return { total, lineItemDiscounts, totalDiscount };
};

const calculateAddonTotal = (
	addons: AddAddonToSubscriptionRequest[],
	allAddons: AddonResponse[],
	billingPeriod: string,
	currency: string,
): { total: number; addonDetails: Array<{ name: string; amount: number }> } => {
	let total = 0;
	const addonDetails: Array<{ name: string; amount: number }> = [];

	addons.forEach((addonRequest) => {
		const addon = allAddons.find((a) => a.id === addonRequest.addon_id);
		if (addon?.prices) {
			const matchingPrice = addon.prices.find(
				(price: Price) =>
					price.billing_period.toLowerCase() === billingPeriod.toLowerCase() &&
					price.currency.toLowerCase() === currency.toLowerCase() &&
					price.type === 'FIXED',
			);

			if (matchingPrice) {
				const amount = parseFloat(matchingPrice.amount);
				total += amount;
				addonDetails.push({ name: addon.name, amount });
			}
		}
	});

	return { total, addonDetails };
};

const calculateTaxAmount = (subtotal: number, taxRateOverrides: TaxRateOverride[], currency: string): number => {
	if (!taxRateOverrides?.length) return 0;
	const applicableTaxes = taxRateOverrides.filter((tax) => tax.currency.toLowerCase() === currency.toLowerCase() && tax.auto_apply);
	return applicableTaxes.length > 0 ? subtotal * 0.1 : 0;
};

const Preview = ({
	data,
	className,
	phases,
	billingCycle = BILLING_CYCLE.ANNIVERSARY,
	coupons = [],
	allCoupons: allCouponsProp = [],
	priceOverrides = {},
	lineItemCoupons = {},
	taxRateOverrides = [],
	addons = [],
}: PreviewProps) => {
	const { data: allAddons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.ListAddon({ limit: 1000, offset: 0 });
			return response.items;
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const recurringCharges = useMemo(() => data.filter((charge) => charge.type === 'FIXED'), [data]);
	const billingPeriod = useMemo(() => data[0]?.billing_period.toUpperCase() as BILLING_PERIOD, [data]);
	const currency = useMemo(() => recurringCharges[0]?.currency || 'USD', [recurringCharges]);
	const allCoupons = useMemo(() => allCouponsProp || [], [allCouponsProp]);

	const getCouponById = useCallback(
		(couponId: string): Coupon | undefined => {
			return coupons.find((c) => c.id === couponId) || allCoupons.find((c) => c.id === couponId);
		},
		[coupons, allCoupons],
	);

	const { total: addonTotal, addonDetails } = useMemo(() => {
		return calculateAddonTotal(addons, allAddons, billingPeriod, currency);
	}, [addons, allAddons, billingPeriod, currency]);

	const firstPhase = phases[0];
	const startDate = firstPhase?.start_date;
	const firstInvoiceDate = useMemo(() => {
		return startDate ? calculateFirstInvoiceDate(new Date(startDate), billingPeriod, billingCycle) : undefined;
	}, [billingCycle, billingPeriod, startDate]);

	const billingDescription = useMemo(() => {
		return firstInvoiceDate ? getBillingDescription(data, billingPeriod, firstInvoiceDate) : '';
	}, [data, billingPeriod, firstInvoiceDate]);

	const resolvePhaseCoupons = useCallback(
		(phase: SubscriptionPhaseCreateRequest) => {
			const phaseCoupons = phase.coupons?.map((couponId) => getCouponById(couponId)).filter((c): c is Coupon => c !== undefined) || [];

			const phaseLineItemCoupons: Record<string, Coupon> = {};
			if (phase.line_item_coupons) {
				Object.entries(phase.line_item_coupons).forEach(([priceId, couponIds]) => {
					if (couponIds?.[0]) {
						const coupon = getCouponById(couponIds[0]);
						if (coupon) phaseLineItemCoupons[priceId] = coupon;
					}
				});
			}

			return { phaseCoupons, phaseLineItemCoupons };
		},
		[getCouponById],
	);

	const timelineItems = useMemo(() => {
		if (!phases?.length) return [];

		const items: PreviewTimelineItem[] = phases.map((phase, index) => {
			const { phaseCoupons, phaseLineItemCoupons } = resolvePhaseCoupons(phase);
			const phaseInfo = [];
			if (phaseCoupons.length > 0) {
				phaseInfo.push(`${phaseCoupons.length} phase coupon${phaseCoupons.length > 1 ? 's' : ''}`);
			}
			if (Object.keys(phaseLineItemCoupons).length > 0) {
				phaseInfo.push(
					`${Object.keys(phaseLineItemCoupons).length} phase line-item coupon${Object.keys(phaseLineItemCoupons).length > 1 ? 's' : ''}`,
				);
			}

			return {
				icon: <Calendar className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
				subtitle: (
					<div>
						<div className='font-medium'>{index === 0 ? 'Subscription Start' : 'Phase Update'}</div>
						{phaseInfo.length > 0 && <div className='text-xs text-gray-500 mt-1'>{phaseInfo.join(', ')}</div>}
						{phase.end_date && <div className='text-xs text-gray-500 mt-1'>Ends: {formatDate(phase.end_date)}</div>}
					</div>
				),
				label: formatDate(phase.start_date),
			};
		});

		const { phaseCoupons: firstPhaseCoupons, phaseLineItemCoupons: firstPhaseLineItemCoupons } = resolvePhaseCoupons(phases[0]);
		const allCouponsForInvoice = [...coupons, ...firstPhaseCoupons];
		const allLineItemCouponsForInvoice = { ...lineItemCoupons, ...firstPhaseLineItemCoupons };

		const { total: invoiceRecurringTotal, totalDiscount: invoiceLineItemDiscount } = calculateTotalWithLineItemCoupons(
			recurringCharges,
			priceOverrides,
			allLineItemCouponsForInvoice,
		);
		const invoiceSubscriptionDiscount = calculateTotalCouponDiscount(allCouponsForInvoice, invoiceRecurringTotal);
		const invoiceSubtotal = Math.max(0, invoiceRecurringTotal - invoiceSubscriptionDiscount);
		const invoiceTotalBeforeTax = invoiceSubtotal + addonTotal;
		const invoiceTaxAmount = calculateTaxAmount(invoiceTotalBeforeTax, taxRateOverrides, currency);
		const invoiceFinalTotal = invoiceTotalBeforeTax + invoiceTaxAmount;

		const totalLineItemCoupons = Object.keys(allLineItemCouponsForInvoice).length;
		const totalCoupons = allCouponsForInvoice.length + totalLineItemCoupons;

		const invoicePreview: PreviewTimelineItem = {
			icon: <Receipt className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
			subtitle: (
				<div>
					<div className='space-y-1'>
						<p className='text-sm text-gray-600'>
							Plan: {getCurrencySymbol(currency || 'USD')}
							{invoiceRecurringTotal.toFixed(2)}
						</p>

						{addonTotal > 0 && (
							<>
								<p className='text-sm text-gray-600'>
									Addons: {getCurrencySymbol(currency || 'USD')}
									{addonTotal.toFixed(2)}
								</p>
								{addonDetails.map((addon, index) => (
									<p key={index} className='text-xs text-gray-500 ml-4'>
										• {addon.name}: {getCurrencySymbol(currency || 'USD')}
										{addon.amount.toFixed(2)}
									</p>
								))}
							</>
						)}

						{(invoiceLineItemDiscount > 0 || invoiceSubscriptionDiscount > 0) && (
							<>
								{invoiceLineItemDiscount > 0 && (
									<p className='text-sm text-blue-600'>
										Line-item discounts: -{getCurrencySymbol(currency || 'USD')}
										{invoiceLineItemDiscount.toFixed(2)}
									</p>
								)}
								{invoiceSubscriptionDiscount > 0 && (
									<p className='text-sm text-blue-600'>
										Subscription discount: -{getCurrencySymbol(currency || 'USD')}
										{invoiceSubscriptionDiscount.toFixed(2)}
									</p>
								)}
							</>
						)}

						{invoiceTaxAmount > 0 && (
							<p className='text-sm text-gray-600'>
								Tax: {getCurrencySymbol(currency || 'USD')}
								{invoiceTaxAmount.toFixed(2)}
							</p>
						)}

						<p className='text-sm text-gray-900 font-semibold border-t border-gray-200 pt-1'>
							Net payable: {getCurrencySymbol(currency || 'USD')}
							{invoiceFinalTotal.toFixed(2)}
						</p>
					</div>

					{totalCoupons > 0 && (
						<p className='text-xs text-gray-500 mt-2'>
							{totalCoupons} coupon{totalCoupons > 1 ? 's' : ''} applied
							{invoiceLineItemDiscount > 0 && totalLineItemCoupons > 0 && (
								<span className='ml-1'>
									({totalLineItemCoupons} line-item, {allCouponsForInvoice.length} subscription)
								</span>
							)}
						</p>
					)}

					<p className='text-sm text-gray-600 mt-2'>{billingDescription}</p>
				</div>
			),
			label: `First invoice: ${firstInvoiceDate ? formatDate(firstInvoiceDate) : ''}`,
		};

		const updatedItems = items.length > 0 ? [items[0], invoicePreview, ...items.slice(1)] : [invoicePreview];

		const lastPhase = phases[phases.length - 1];
		if (lastPhase?.end_date) {
			updatedItems.push({
				icon: <Calendar className='h-[22px] w-[22px] text-gray-500 shrink-0' />,
				subtitle: 'Subscription ends',
				label: formatDate(lastPhase.end_date),
			});
		}

		return updatedItems;
	}, [
		phases,
		firstInvoiceDate,
		billingDescription,
		coupons,
		lineItemCoupons,
		recurringCharges,
		priceOverrides,
		addonTotal,
		addonDetails,
		taxRateOverrides,
		currency,
		resolvePhaseCoupons,
	]);

	return (
		<div className={cn('w-full', className)}>
			<TimelinePreview items={timelineItems} />
		</div>
	);
};

export default Preview;
