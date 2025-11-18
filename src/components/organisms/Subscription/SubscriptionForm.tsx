import { Select, FormHeader, Label, DecimalUsageInput, DatePicker } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ExpandedPlan } from '@/types';
import { useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import CreditGrantTable from '@/components/molecules/CreditGrant/CreditGrantTable';
import SubscriptionAddonTable from '@/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable';
import { BILLING_CYCLE } from '@/models/Subscription';
import {
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_SCOPE,
} from '@/models/CreditGrant';
import { BILLING_PERIOD } from '@/constants/constants';
import { SubscriptionFormState } from '@/pages';
import { useQuery } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import AddonApi from '@/api/AddonApi';
import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import { SubscriptionDiscountTable, EntitlementOverridesTable } from '@/components/molecules';
import SubscriptionTaxAssociationTable from '@/components/molecules/SubscriptionTaxAssociationTable';
import PhaseList from './PhaseList';
import { SubscriptionPhaseCreateRequest, EntitlementOverrideRequest } from '@/types/dto/Subscription';
import PriceTable from './PriceTable';
import { usePriceOverrides } from '@/hooks/usePriceOverrides';
import { Coupon } from '@/models/Coupon';
import { InternalCreditGrantRequest, creditGrantToInternal } from '@/types/dto/CreditGrant';
import { uniqueId } from 'lodash';

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

	const getEmptyCreditGrant = (): InternalCreditGrantRequest => {
		return {
			id: uniqueId('credit-grant-'),
			name: 'Free Credits',
			scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
			credits: 0,
			cadence: CREDIT_GRANT_CADENCE.ONETIME,
			period: CREDIT_GRANT_PERIOD.MONTHLY,
			period_count: 1,
			expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
			expiration_duration: 0,
			expiration_duration_unit: CREDIT_GRANT_PERIOD_UNIT.DAYS,
			priority: 0,
			metadata: {},
			subscription_id: uniqueId('sub_'),
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

	// Combine plan credit grants (read-only) with user-added credit grants (editable)
	const relevantCreditGrants = useMemo(() => {
		const planGrants: InternalCreditGrantRequest[] =
			state.selectedPlan && selectedPlanCreditGrants && (selectedPlanCreditGrants.items.length ?? 0) > 0
				? selectedPlanCreditGrants.items.map(creditGrantToInternal)
				: [];

		// User-added credit grants from state (these are editable)
		const userGrants: InternalCreditGrantRequest[] = (state.creditGrants || []) as InternalCreditGrantRequest[];

		// Return combined list: plan grants first (read-only), then user grants (editable)
		return [...planGrants, ...userGrants];
	}, [selectedPlanCreditGrants, state.selectedPlan, state.creditGrants]);

	// Fetch plan entitlements
	const { data: planEntitlements } = useQuery({
		queryKey: ['planEntitlements', state.selectedPlan],
		queryFn: async () => {
			if (!state.selectedPlan) return null;
			try {
				return await PlanApi.getPlanEntitlements(state.selectedPlan);
			} catch (error) {
				console.warn('Failed to fetch plan entitlements:', error);
				return null;
			}
		},
		enabled: !!state.selectedPlan,
		retry: false,
		refetchOnWindowFocus: false,
	});

	// Fetch addon entitlements
	const addonIds = useMemo(() => state.addons?.map((addon) => addon.addon_id) || [], [state.addons]);
	const { data: addonEntitlementsData } = useQuery({
		queryKey: ['addonEntitlements', addonIds],
		queryFn: async () => {
			if (addonIds.length === 0) return [];
			try {
				const promises = addonIds.map((addonId) => AddonApi.getAddonEntitlements(addonId));
				const results = await Promise.all(promises);
				return results;
			} catch (error) {
				console.warn('Failed to fetch addon entitlements:', error);
				return [];
			}
		},
		enabled: addonIds.length > 0,
		retry: false,
		refetchOnWindowFocus: false,
	});

	// Combine all entitlements
	const allEntitlements = useMemo(() => {
		const planEnts = planEntitlements?.items || [];
		const addonEnts = addonEntitlementsData?.flatMap((result) => result?.items || []) || [];
		return [...planEnts, ...addonEnts];
	}, [planEntitlements, addonEntitlementsData]);

	// Clean up entitlement overrides when addons change
	useEffect(() => {
		const currentEntitlementIds = new Set(allEntitlements.map((ent) => ent.id));

		setState((prev) => {
			const cleanedOverrides: Record<string, EntitlementOverrideRequest> = {};

			// Only keep overrides for entitlements that still exist
			Object.entries(prev.entitlementOverrides).forEach(([entitlementId, override]) => {
				if (currentEntitlementIds.has(entitlementId)) {
					cleanedOverrides[entitlementId] = override;
				}
			});

			// Only update if something changed
			if (Object.keys(cleanedOverrides).length !== Object.keys(prev.entitlementOverrides).length) {
				return {
					...prev,
					entitlementOverrides: cleanedOverrides,
				};
			}

			return prev;
		});
	}, [allEntitlements]);

	const handleEntitlementOverride = (entitlementId: string, override: EntitlementOverrideRequest) => {
		setState((prev) => ({
			...prev,
			entitlementOverrides: {
				...prev.entitlementOverrides,
				[entitlementId]: override,
			},
		}));
	};

	const handleEntitlementOverrideReset = (entitlementId: string) => {
		setState((prev) => {
			const newOverrides = { ...prev.entitlementOverrides };
			delete newOverrides[entitlementId];
			return {
				...prev,
				entitlementOverrides: newOverrides,
			};
		});
	};

	return (
		<div className='p-6 rounded-lg border border-gray-300 space-y-6 bg-white'>
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
					label='Currency*'
					disabled={isDisabled}
					placeholder='Select currency'
				/>
			)}

			{/* Subscription Cycle */}
			{state.selectedPlan && (
				<BillingCycleSelector
					value={state.billingCycle}
					onChange={(value) => setState((prev) => ({ ...prev, billingCycle: value }))}
					disabled={isDisabled}
				/>
			)}

			{/* Conditional: Show Subscription Fields OR Phases */}
			{state.selectedPlan && phases.length === 0 && (
				<>
					{/* Subscription Dates */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
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

					{/* Subscription Level Price Table */}
					{currentPrices.length > 0 && (
						<div className='mt-6 pt-6 border-t border-gray-200'>
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

					{/* Subscription Level Discounts */}
					<div className='mt-6'>
						<SubscriptionDiscountTable
							coupon={state.linkedCoupon}
							onChange={(coupon) => setState((prev) => ({ ...prev, linkedCoupon: coupon }))}
							disabled={isDisabled}
							currency={state.currency}
							allLineItemCoupons={state.lineItemCoupons}
						/>
					</div>
				</>
			)}

			{/* Subscription Phases Section - Show when phases exist OR as add phase button */}
			{state.selectedPlan && phases !== undefined && onPhasesChange && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
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
						subscriptionData={{
							startDate: state.startDate,
							endDate: state.endDate,
							linkedCoupon: state.linkedCoupon,
							lineItemCoupons: state.lineItemCoupons,
							priceOverrides: state.priceOverrides,
						}}
						onConvertToPhases={() => {
							// Clear subscription-level data after conversion
							// IMPORTANT: Clear endDate to avoid deadlock when adding more phases
							setState((prev) => ({
								...prev,
								endDate: undefined,
								linkedCoupon: null,
								lineItemCoupons: {},
								priceOverrides: {},
							}));
						}}
						onConvertBackToSubscription={(subscriptionData) => {
							// Restore subscription-level data when converting back from phases
							setState((prev) => ({
								...prev,
								startDate: subscriptionData.startDate,
								endDate: subscriptionData.endDate,
								linkedCoupon: subscriptionData.linkedCoupon,
								lineItemCoupons: subscriptionData.lineItemCoupons,
								priceOverrides: subscriptionData.priceOverrides,
							}));

							// Re-initialize price overrides hook with restored data
							Object.entries(subscriptionData.priceOverrides).forEach(([priceId, override]) => {
								overridePrice(priceId, override);
							});
						}}
					/>
				</div>
			)}

			{/* Commitment and Overage - Always visible */}
			{state.selectedPlan && (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200'>
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
			)}

			{/* Credit Grants (Subscription Level) */}
			{state.selectedPlan && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
					<CreditGrantTable
						getEmptyCreditGrant={() => getEmptyCreditGrant()}
						data={relevantCreditGrants}
						onChange={(data: InternalCreditGrantRequest[]) => {
							// Filter out plan credit grants (they have plan_id set and are read-only)
							// Only keep user-added credit grants (subscription-scoped or new ones)
							const planGrantIds = new Set((selectedPlanCreditGrants?.items || []).map((grant) => grant.id));
							const userGrants = data.filter((grant) => !planGrantIds.has(grant.id));

							// Store only user-added credit grants in state
							setState((prev) => ({
								...prev,
								creditGrants: userGrants,
							}));
						}}
						disabled={isDisabled || isCreditGrantDisabled}
					/>
				</div>
			)}

			{/* Tax Rate Overrides */}
			{state.selectedPlan && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
					<SubscriptionTaxAssociationTable
						data={state.tax_rate_overrides || []}
						onChange={(data) => setState((prev) => ({ ...prev, tax_rate_overrides: data }))}
						disabled={isDisabled}
					/>
				</div>
			)}

			{/* Addons Section */}
			{state.selectedPlan && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
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

			{/* Entitlements Section */}
			{state.selectedPlan && allEntitlements.length > 0 && (
				<div className='space-y-4 mt-4 pt-3 border-t border-gray-200'>
					<FormHeader className='mb-0' title='Entitlements' variant='sub-header' />
					<div className='rounded-xl border border-gray-300 space-y-6 mt-2'>
						<EntitlementOverridesTable
							entitlements={allEntitlements}
							overrides={state.entitlementOverrides}
							onOverrideChange={handleEntitlementOverride}
							onOverrideReset={handleEntitlementOverrideReset}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default SubscriptionForm;
