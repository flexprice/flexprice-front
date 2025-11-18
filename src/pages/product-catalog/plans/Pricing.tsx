import { Loader, Page, Select } from '@/components/atoms';
import usePagination from '@/hooks/usePagination';
import { PlanApi } from '@/api/PlanApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { billlingPeriodOptions } from '@/constants/constants';
import { useState, useMemo } from 'react';
import { ExpandedPlan } from '@/types';
import { GetAllPlansResponse } from '@/api/PlanApi';
import { PricingCard, type PricingCardProps } from '@/components/molecules';
import { ApiDocsContent } from '@/components/molecules';
import { EmptyPage } from '@/components/organisms';
import { PlanDrawer } from '@/components/molecules';
import GUIDES from '@/constants/guides';
import { Price, INVOICE_CADENCE, PRICE_TYPE } from '@/models';

type PriceType = {
	currency: string;
	billing_period: string;
	billing_model: string;
	type: string;
	billing_cadence: string;
	amount?: string;
	meter?: {
		id: string;
		name: string;
	};
	tiers: any;
};

export enum PlanType {
	FREE = 'FREE',
	HYBRID_FREE = 'HYBRID_FREE',
	HYBRID_PAID = 'HYBRID_PAID',
	USAGE_ONLY = 'USAGE_ONLY',
	FIXED = 'FIXED',
}

const parseAmount = (amount: string | undefined): number => {
	if (!amount) return 0;
	const parsed = parseFloat(amount);
	return isNaN(parsed) ? 0 : parsed;
};

const isRecurringPrice = (price: PriceType) => price.type === 'FIXED' && price.billing_cadence === 'RECURRING';

const isUsageBasedPrice = (price: PriceType) => price.type === 'USAGE';

const getPriceDisplayType = (prices: PriceType[]): PlanType => {
	if (!prices || prices.length === 0) return PlanType.USAGE_ONLY;

	const recurringPrices = prices.filter(isRecurringPrice);
	const usagePrices = prices.filter(isUsageBasedPrice);

	// Check if any recurring price has a non-zero amount
	const hasNonZeroRecurring = recurringPrices.some((p) => parseAmount(p.amount) > 0);
	// Check if all recurring prices are zero
	const allRecurringZero = recurringPrices.every((p) => parseAmount(p.amount) === 0);

	// Free plan: Only recurring with amount 0
	if (recurringPrices.length > 0 && !usagePrices.length && allRecurringZero) {
		return PlanType.FREE;
	}

	// Hybrid Free: Recurring with amount 0 + Usage
	if (recurringPrices.length > 0 && usagePrices.length > 0 && allRecurringZero) {
		return PlanType.HYBRID_FREE;
	}

	// Hybrid Paid: Recurring with amount > 0 + Usage
	if (recurringPrices.length > 0 && usagePrices.length > 0) {
		return PlanType.HYBRID_PAID;
	}

	// Usage-only: Only usage based prices
	if (usagePrices.length > 0 && recurringPrices.length === 0) {
		return PlanType.USAGE_ONLY;
	}

	// Fixed: Only recurring with amount > 0
	if (recurringPrices.length > 0 && hasNonZeroRecurring) {
		return PlanType.FIXED;
	}

	// Default to usage-only if nothing else matches
	return PlanType.USAGE_ONLY;
};

const findBestPriceCombination = (
	plans: ExpandedPlan[],
	availableCurrencyOptions: Array<{ value: string }>,
	availablePeriodOptions: Array<{ value: string }>,
) => {
	let maxPlans = 0;
	let bestCurrency = '';
	let bestPeriod = '';

	// First try to find preferred pricing combination
	for (const currency of availableCurrencyOptions) {
		for (const period of availablePeriodOptions) {
			const testFiltered = plans
				.map((plan) => ({
					...plan,
					prices: plan.prices?.filter(
						(price) => price.currency.toUpperCase() === currency.value && price.billing_period === period.value && isRecurringPrice(price),
					),
				}))
				.filter((plan) => plan.prices && plan.prices.length > 0);

			if (testFiltered.length > 0) {
				return {
					currency: currency.value,
					period: period.value,
					hasPreferred: true,
				};
			}
		}
	}

	// Fall back to any pricing type if no preferred found
	for (const currency of availableCurrencyOptions) {
		for (const period of availablePeriodOptions) {
			const testFiltered = plans
				.map((plan) => ({
					...plan,
					prices: plan.prices?.filter((price) => price.currency.toUpperCase() === currency.value && price.billing_period === period.value),
				}))
				.filter((plan) => (plan.prices?.length ?? 0) > 0);

			if (testFiltered.length > maxPlans) {
				maxPlans = testFiltered.length;
				bestCurrency = currency.value;
				bestPeriod = period.value;
			}
		}
	}

	return {
		currency: bestCurrency,
		period: bestPeriod,
		hasPreferred: false,
	};
};

const PricingPage = () => {
	const { limit, offset, page } = usePagination();
	const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>('');
	const [selectedCurrency, setSelectedCurrency] = useState<string>('');
	const [planDrawerOpen, setPlanDrawerOpen] = useState<boolean>(false);

	const fetchPlans = async () => {
		return await PlanApi.getAllActivePlans({
			limit,
			offset,
		});
	};

	const {
		data: plansData,
		isLoading,
		isError,
	} = useQuery<GetAllPlansResponse>({
		queryKey: ['fetchPlansPricingCard', page],
		queryFn: fetchPlans,
	});

	const { uniqueCurrencies, uniqueBillingPeriods, filteredPlans } = useMemo(() => {
		if (!plansData?.items) {
			return { uniqueCurrencies: [], uniqueBillingPeriods: [], filteredPlans: [] };
		}

		const plans = plansData.items as ExpandedPlan[];

		// Collect unique currencies and billing periods
		const currencies = new Set<string>();
		const billingPeriods = new Set<string>();

		plans.forEach((plan) => {
			plan.prices?.forEach((price) => {
				currencies.add(price.currency);
				billingPeriods.add(price.billing_period);
			});
		});

		const allCurrencyOptions = Array.from(currencies).map((currency) => ({
			label: currency.toUpperCase(),
			value: currency.toUpperCase(),
		}));

		const allPeriodOptions = billlingPeriodOptions;

		// Filter available options based on selections
		const availableCurrencyOptions = selectedBillingPeriod
			? allCurrencyOptions.filter((currency) =>
					plans.some((plan) =>
						plan.prices?.some((price) => price.currency.toUpperCase() === currency.value && price.billing_period === selectedBillingPeriod),
					),
				)
			: allCurrencyOptions;

		const availablePeriodOptions = selectedCurrency
			? allPeriodOptions.filter((period) =>
					plans.some((plan) =>
						plan.prices?.some((price) => price.currency.toUpperCase() === selectedCurrency && price.billing_period === period.value),
					),
				)
			: allPeriodOptions;

		// Set default selections if needed
		if (!selectedCurrency || !selectedBillingPeriod) {
			const bestCombo = findBestPriceCombination(plans, availableCurrencyOptions, availablePeriodOptions);

			if (bestCombo.currency && !selectedCurrency) {
				setSelectedCurrency(bestCombo.currency);
			}
			if (bestCombo.period && !selectedBillingPeriod) {
				setSelectedBillingPeriod(bestCombo.period);
			}
		}

		// Filter and transform plans
		const filtered = plans
			.map((plan) => {
				const allMatchingPrices =
					plan.prices?.filter(
						(price) => price.currency.toUpperCase() === selectedCurrency && price.billing_period === selectedBillingPeriod,
					) || [];

				return {
					...plan,
					prices: allMatchingPrices,
				};
			})
			.filter((plan) => plan.prices?.length > 0);

		// Sort plans based on industry standard pricing display order
		const sortedPlans = filtered.sort((a, b) => {
			// Simple helper functions
			const getRecurringAmount = (plan: any) => {
				const recurringPrice = plan.prices?.find((price: PriceType) => price.type === 'FIXED' && price.billing_cadence === 'RECURRING');
				return recurringPrice ? parseFloat(recurringPrice.amount || '0') : 0;
			};

			const getUsageFlag = (plan: any) => {
				return plan.prices?.some((price: PriceType) => price.type === 'USAGE') ? 1 : 0;
			};

			// Get values for comparison
			const r1 = getRecurringAmount(a);
			const r2 = getRecurringAmount(b);
			const u1 = getUsageFlag(a);
			const u2 = getUsageFlag(b);

			// Sort by recurring amount first, then by usage flag
			if (r1 !== r2) return r1 - r2;
			return u1 - u2;
		});

		return {
			uniqueCurrencies: availableCurrencyOptions,
			uniqueBillingPeriods: availablePeriodOptions,
			filteredPlans: sortedPlans,
		};
	}, [plansData, selectedBillingPeriod, selectedCurrency]);

	const transformedPlans: PricingCardProps[] = filteredPlans.map((plan) => {
		const prices = plan.prices as Price[];
		const displayType = getPriceDisplayType(prices || []);
		const recurringPrice = prices?.find(isRecurringPrice);
		const usageCharges =
			prices?.filter(isUsageBasedPrice).map((price) => ({
				amount: price.amount,
				currency: price.currency,
				billing_model: price.billing_model,
				tiers: price.tiers as unknown as { up_to: number | null; unit_amount: string; flat_amount: string }[],
				meter_name: price.meter?.name || 'Usage',
				billing_period: price.billing_period,
				type: price.type as PRICE_TYPE,
				invoice_cadence: price.invoice_cadence as INVOICE_CADENCE,
			})) || [];

		// For display purposes, we prioritize showing the recurring price if it exists
		const displayPrice = recurringPrice || usageCharges[0];

		// const showUsageCharges = ['hybrid-free', 'hybrid-paid', 'usage-only'].includes(displayType);

		return {
			id: plan.id,
			name: plan.name,
			description: plan.description,
			price: {
				amount: displayPrice?.amount,
				currency: displayPrice?.currency,
				billingPeriod: displayPrice?.billing_period,
				type: displayPrice?.type,
				displayType,
			},
			usageCharges,
			entitlements:
				plan.entitlements?.map((e) => ({
					id: e.id,
					feature_id: e.feature?.id || '',
					name: e.feature?.name || '',
					type: e.feature_type.toUpperCase() as 'STATIC' | 'BOOLEAN' | 'METERED',
					value:
						e.feature_type === 'boolean'
							? e.is_enabled
							: e.feature_type === 'metered'
								? e.usage_limit || 'Unlimited'
								: e.static_value || '',
					description: e.feature?.description,
					usage_reset_period: e.usage_reset_period || '',
				})) || [],
		};
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching plans');
		return null;
	}

	if ((plansData?.items ?? []).length === 0) {
		return (
			<div className='space-y-6'>
				<EmptyPage
					heading='Pricing Widgets'
					onAddClick={() => setPlanDrawerOpen(true)}
					emptyStateCard={{
						heading: 'Set Up Your Pricing Widget',
						description: 'Add a plan to manage customer billing, credits, and usage.',
						buttonLabel: 'Create Plan',
						buttonAction: () => setPlanDrawerOpen(true),
					}}
					tags={['Plans']}
					tutorials={GUIDES.plans.tutorials}
				/>
				<PlanDrawer open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlansPricingCard']} />
			</div>
		);
	}

	return (
		<Page
			headingClassName='items-center'
			heading='Pricing Widgets'
			headingCTA={
				<div className='w-full flex justify-start gap-4'>
					<Select
						className='w-40 !rounded-xl'
						value={selectedBillingPeriod}
						options={uniqueBillingPeriods}
						onChange={setSelectedBillingPeriod}
						placeholder='Select billing period'
					/>
					<Select
						className='w-40 !rounded-xl'
						value={selectedCurrency}
						options={uniqueCurrencies}
						onChange={setSelectedCurrency}
						placeholder='Select currency'
					/>
				</div>
			}>
			<ApiDocsContent tags={['Plans', 'Pricing']} />
			{/* filters */}

			<div className='flex flex-col'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
					<div className='contents'>
						{transformedPlans.map((plan, index) => (
							<div className='w-full flex' key={index}>
								<PricingCard {...plan} className='w-full' />
							</div>
						))}
					</div>
					{/* Add empty divs to maintain grid layout when less than 3 items */}
					{transformedPlans.length === 2 && <div className='hidden lg:block' />}
					{transformedPlans.length === 1 && (
						<>
							<div className='hidden md:block' />
							<div className='hidden lg:block' />
						</>
					)}
				</div>
			</div>
		</Page>
	);
};

export default PricingPage;
