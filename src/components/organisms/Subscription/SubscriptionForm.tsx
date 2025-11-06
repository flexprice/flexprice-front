import { Select, FormHeader, Label, DecimalUsageInput, DatePicker } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ExpandedPlan } from '@/types';
import { useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import CreditGrantTable from '@/components/molecules/CreditGrant/CreditGrantTable';
import SubscriptionAddonTable from '@/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable';
import { BILLING_CYCLE } from '@/models/Subscription';
import { CREDIT_GRANT_SCOPE, CreditGrant } from '@/models/CreditGrant';
import { BILLING_PERIOD } from '@/constants/constants';
import { SubscriptionFormState } from '@/pages';
import { useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import { SubscriptionDiscountTable } from '@/components/molecules';
import SubscriptionTaxAssociationTable from '@/components/molecules/SubscriptionTaxAssociationTable';
import PhaseList from './PhaseList';
import { SubscriptionPhaseCreateRequest, CreateCreditGrantRequest } from '@/types/dto/Subscription';
import PriceTable from './PriceTable';
import { usePriceOverrides } from '@/hooks/usePriceOverrides';
import { Coupon } from '@/models/Coupon';

// Helper components
const BillingCycleSelector = ({
	value,
	onChange,
	disabled,
}: {
	value: BILLING_CYCLE;
	onChange: (value: BILLING_CYCLE) => void;
	disabled?: boolean;
}) => {
	const options = [
		{ label: 'Anniversary', value: BILLING_CYCLE.ANNIVERSARY },
		{ label: 'Calendar', value: BILLING_CYCLE.CALENDAR },
	];

	return (
		<div className='space-y-2'>
			<Label label='Subscription Cycle' />
			<div className='flex items-center space-x-2'>
				{options.map((option, index) => (
					<div
						key={index}
						data-state={value === option.value ? 'active' : 'inactive'}
						className={cn(
							'text-[15px] font-normal text-gray-500 px-3 py-1 rounded-md',
							'data-[state=active]:text-gray-900 data-[state=active]:bg-gray-100',
							'hover:text-gray-900 transition-colors',
							'data-[state=inactive]:border data-[state=inactive]:border-border data-[state=active]:border-primary',
							'bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
							'cursor-pointer',
						)}
						onClick={() => !disabled && onChange(option.value)}>
						{option.label}
					</div>
				))}
			</div>
		</div>
	);
};

const SubscriptionForm = ({
	state,
	setState,
	plans,
	plansLoading,
	plansError,
	isDisabled,
	phases = [],
	onPhasesChange,
	allCoupons = [],
}: {
	state: SubscriptionFormState;
	setState: React.Dispatch<React.SetStateAction<SubscriptionFormState>>;
	plans: ExpandedPlan[] | undefined;
	plansLoading: boolean;
	plansError: boolean;
	isDisabled: boolean;
	phases?: SubscriptionPhaseCreateRequest[];
	onPhasesChange?: (phases: SubscriptionPhaseCreateRequest[]) => void;
	allCoupons?: Coupon[];
}) => {
	// Helper function to check if price should be shown (start_date <= now or no start_date)
	const isPriceActive = (price: { start_date?: string }) => {
		if (!price.start_date) return true; // No start_date means it's active
		const now = new Date();
		const startDate = new Date(price.start_date);
		// Check if date is valid
		if (isNaN(startDate.getTime())) return true; // Invalid date, treat as active
		return startDate <= now;
	};

	// Current prices for subscription-level and phase management
	const currentPrices =
		state.prices?.prices?.filter(
			(price) =>
				price.billing_period.toLowerCase() === state.billingPeriod.toLowerCase() &&
				price.currency.toLowerCase() === state.currency.toLowerCase() &&
				isPriceActive(price),
		) || [];

	// Price overrides functionality for subscription-level
	const { overriddenPrices, overridePrice, resetOverride } = usePriceOverrides(currentPrices);

	// Initialize hook from state if editing existing subscription with overrides (only once on mount)
	const hasInitializedRef = useRef(false);
	useEffect(() => {
		if (!hasInitializedRef.current && state.priceOverrides && Object.keys(state.priceOverrides).length > 0) {
			Object.entries(state.priceOverrides).forEach(([priceId, override]) => {
				overridePrice(priceId, override);
			});
			hasInitializedRef.current = true;
		} else if (!hasInitializedRef.current) {
			// Mark as initialized even if there are no overrides to avoid sync on mount
			hasInitializedRef.current = true;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	// Sync price overrides with state (hook -> state)
	// Only sync after initialization to avoid overwriting state on mount
	useEffect(() => {
		if (hasInitializedRef.current) {
			setState((prev) => ({
				...prev,
				priceOverrides: overriddenPrices,
			}));
		}
	}, [overriddenPrices, setState]);

	const plansWithCharges = useMemo(() => {
		return (
			plans?.map((plan) => ({
				label: plan.name,
				value: plan.id,
			})) ?? []
		);
	}, [plans]);

	// Get available billing periods and currencies for the selected plan
	const selectedPlanData = useMemo(() => {
		if (!state.selectedPlan || !plans) return null;
		return plans.find((plan) => plan.id === state.selectedPlan);
	}, [state.selectedPlan, plans]);

	const availableBillingPeriods = useMemo(() => {
		if (!selectedPlanData?.prices) return [];
		const periods = [...new Set(selectedPlanData.prices.map((price) => price.billing_period))];
		return periods.map((period) => ({
			label: toSentenceCase(period.replace('_', ' ')),
			value: period,
		}));
	}, [selectedPlanData]);

	const availableCurrencies = useMemo(() => {
		if (!selectedPlanData?.prices || !state.billingPeriod) return [];
		const currencies = [
			...new Set(
				selectedPlanData.prices
					.filter((price) => price.billing_period.toLowerCase() === state.billingPeriod.toLowerCase())
					.map((price) => price.currency),
			),
		];
		return currencies.map((currency) => ({
			label: currency.toUpperCase(),
			value: currency,
		}));
	}, [selectedPlanData, state.billingPeriod]);

	const handlePlanChange = (value: string) => {
		const selectedPlan = plans?.find((plan) => plan.id === value);

		if (!selectedPlan?.prices || selectedPlan.prices.length === 0) {
			toast.error('Invalid plan or no prices available.');
			return;
		}

		// Get available billing periods
		const billingPeriods = [...new Set(selectedPlan.prices.map((price) => price.billing_period))];
		const defaultBillingPeriod = billingPeriods.includes(state.billingPeriod) ? state.billingPeriod : billingPeriods[0];

		// Get available currencies for the default billing period
		const currencies = [
			...new Set(
				selectedPlan.prices
					.filter((price) => price.billing_period.toLowerCase() === defaultBillingPeriod.toLowerCase())
					.map((price) => price.currency),
			),
		];
		const defaultCurrency = currencies.includes(state.currency) ? state.currency : currencies[0];

		setState({
			...state,
			selectedPlan: value,
			prices: selectedPlan,
			billingPeriod: defaultBillingPeriod as BILLING_PERIOD,
			currency: defaultCurrency,
			billingPeriodOptions: billingPeriods.map((period) => ({
				label: toSentenceCase(period.replace('_', ' ')),
				value: period,
			})),
		});
	};

	const handleBillingPeriodChange = (value: string) => {
		const selectedPlan = state.prices;
		if (!selectedPlan?.prices) {
			toast.error('Invalid billing period.');
			return;
		}

		// Get available currencies for the new billing period
		const currencies = [
			...new Set(
				selectedPlan.prices.filter((price) => price.billing_period.toLowerCase() === value.toLowerCase()).map((price) => price.currency),
			),
		];
		const defaultCurrency = currencies.includes(state.currency) ? state.currency : currencies[0];

		setState({
			...state,
			billingPeriod: value as BILLING_PERIOD,
			currency: defaultCurrency,
		});
	};

	const getEmptyCreditGrant = (): CreateCreditGrantRequest => {
		return {
			amount: 0,
			currency: state.currency || 'USD',
			description: 'Free Credits',
			scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
		};
	};

	const getEmptyAddon = (): Partial<AddAddonToSubscriptionRequest> => {
		return {
			addon_id: '',
			start_date: undefined,
			end_date: undefined,
			metadata: {},
		};
	};

	// Check if the selected plan already has a credit grant
	const { data: selectedPlanCreditGrants, isLoading: isLoadingCreditGrants } = useQuery({
		queryKey: ['creditGrants', state.selectedPlan],
		queryFn: async () => {
			const response = await PlanApi.getPlanCreditGrants(state.selectedPlan);
			return response;
		},
		enabled: !!state.selectedPlan,
	});

	const isCreditGrantDisabled = useMemo(() => {
		return isLoadingCreditGrants || (selectedPlanCreditGrants?.items.length ?? 0) > 0;
	}, [isLoadingCreditGrants, selectedPlanCreditGrants]);

	// In case plan has credit grants show them else show the normal ones
	const relevantCreditGrants = useMemo(() => {
		if (state.selectedPlan && (selectedPlanCreditGrants?.items.length ?? 0) > 0) {
			return selectedPlanCreditGrants?.items as CreditGrant[];
		}
		return [];
	}, [selectedPlanCreditGrants, state.selectedPlan]);

	return (
		<div className='p-4 rounded-lg border border-gray-300 space-y-4'>
			<FormHeader title='Subscription Details' variant='sub-header' />

			{/* Plan Selection */}
			{!plansLoading && (
				<Select
					value={state.selectedPlan}
					options={plansWithCharges}
					onChange={handlePlanChange}
					label='Plan*'
					disabled={isDisabled}
					placeholder='Select plan'
					error={plansError ? 'Failed to load plans' : undefined}
				/>
			)}

			{/* Billing Period Selection */}
			{state.selectedPlan && availableBillingPeriods.length > 0 && (
				<Select
					key={availableBillingPeriods.map((opt) => opt.value).join(',')}
					value={state.billingPeriod}
					options={availableBillingPeriods}
					onChange={handleBillingPeriodChange}
					label='Billing Period*'
					disabled={isDisabled}
					placeholder='Select billing period'
				/>
			)}

			{/* Currency Selection */}
			{state.selectedPlan && availableCurrencies.length > 0 && (
				<Select
					key={availableCurrencies.map((opt) => opt.value).join(',')}
					value={state.currency}
					options={availableCurrencies}
					onChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
					label='Select Currency*'
					placeholder='Select currency'
					disabled={isDisabled}
				/>
			)}

			{/* Subscription Level Fields */}
			{state.selectedPlan && (
				<>
					{/* Billing Cycle */}
					<BillingCycleSelector
						value={state.billingCycle}
						onChange={(value) => setState((prev) => ({ ...prev, billingCycle: value }))}
						disabled={isDisabled}
					/>

					{/* Subscription Dates */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<Label label='Subscription Start Date*' />
							<DatePicker
								date={new Date(state.startDate)}
								setDate={(date) => {
									if (date) {
										setState((prev) => ({ ...prev, startDate: date.toISOString() }));
									}
								}}
								disabled={isDisabled}
							/>
						</div>
						<div>
							<Label label='Subscription End Date' />
							<DatePicker
								date={state.endDate ? new Date(state.endDate) : undefined}
								setDate={(date) => {
									setState((prev) => ({ ...prev, endDate: date ? date.toISOString() : undefined }));
								}}
								placeholder='Forever'
								disabled={isDisabled}
								minDate={new Date(state.startDate)}
							/>
						</div>
					</div>

					{/* Commitment and Overage */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<DecimalUsageInput
							label='Commitment Amount'
							value={state.commitmentAmount}
							onChange={(value) => setState((prev) => ({ ...prev, commitmentAmount: value }))}
							placeholder='e.g. $100.00'
							disabled={isDisabled}
							precision={2}
							min={0}
						/>
						<DecimalUsageInput
							label='Overage Factor'
							value={state.overageFactor}
							onChange={(value) => setState((prev) => ({ ...prev, overageFactor: value }))}
							placeholder='e.g. 1.5'
							disabled={isDisabled}
							precision={2}
							min={0}
						/>
					</div>
				</>
			)}

			{/* Subscription Level Price Table */}
			{state.selectedPlan && currentPrices.length > 0 && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<PriceTable
						data={currentPrices}
						billingPeriod={state.billingPeriod}
						currency={state.currency}
						onPriceOverride={overridePrice}
						onResetOverride={resetOverride}
						overriddenPrices={overriddenPrices}
						lineItemCoupons={state.lineItemCoupons}
						onLineItemCouponsChange={(priceId, coupon) => {
							setState((prev) => {
								const newLineItemCoupons = { ...prev.lineItemCoupons };
								if (coupon) {
									newLineItemCoupons[priceId] = coupon;
								} else {
									delete newLineItemCoupons[priceId];
								}
								return {
									...prev,
									lineItemCoupons: newLineItemCoupons,
								};
							});
						}}
						disabled={isDisabled}
						subscriptionLevelCoupon={state.linkedCoupon}
					/>
				</div>
			)}

			{/* Credit Grants (Subscription Level) */}
			{state.selectedPlan && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<CreditGrantTable
						getEmptyCreditGrant={() => getEmptyCreditGrant() as unknown as Partial<CreditGrant>}
						data={relevantCreditGrants}
						onChange={() => {
							// Credit grants are read-only if they come from the plan
							// Otherwise they would be managed at subscription level
						}}
						disabled={isDisabled || isCreditGrantDisabled}
					/>
				</div>
			)}

			{/* Tax Rate Overrides */}
			{state.selectedPlan && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<SubscriptionTaxAssociationTable
						data={state.tax_rate_overrides || []}
						onChange={(data) => setState((prev) => ({ ...prev, tax_rate_overrides: data }))}
						disabled={isDisabled}
					/>
				</div>
			)}

			{/* Addons Section */}
			{state.selectedPlan && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<SubscriptionAddonTable
						getEmptyAddon={getEmptyAddon}
						data={state.addons || []}
						onChange={(data) => {
							setState((prev) => ({ ...prev, addons: data }));
						}}
						disabled={isDisabled}
					/>
				</div>
			)}

			{/* Subscription Level Discounts */}
			{state.selectedPlan && (
				<SubscriptionDiscountTable
					coupon={state.linkedCoupon}
					onChange={(coupon) => setState((prev) => ({ ...prev, linkedCoupon: coupon }))}
					disabled={isDisabled}
					currency={state.currency}
					allLineItemCoupons={state.lineItemCoupons}
				/>
			)}

			{/* Subscription Phases Section */}
			{state.selectedPlan && phases && onPhasesChange && (
				<div className='space-y-3 mt-4 pt-3 border-t border-gray-200'>
					<PhaseList
						phases={phases}
						onChange={onPhasesChange}
						prices={currentPrices}
						billingPeriod={state.billingPeriod}
						currency={state.currency}
						disabled={isDisabled}
						subscriptionStartDate={new Date(state.startDate)}
						subscriptionEndDate={state.endDate ? new Date(state.endDate) : undefined}
						allCoupons={allCoupons}
					/>
				</div>
			)}
		</div>
	);
};

export default SubscriptionForm;
