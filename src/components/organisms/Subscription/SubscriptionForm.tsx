import {
	Select,
	FormHeader,
	Label,
	DecimalUsageInput,
	DatePicker,
	Input,
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Tooltip,
} from '@/components/atoms';
import { Switch } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toSentenceCase, getCurrencySymbol } from '@/utils/common/helper_functions';
import { PlanResponse } from '@/types';
import { useMemo, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import SubscriptionCreditGrantTable from '@/components/molecules/CreditGrant/SubscriptionCreditGrantTable';
import SubscriptionAddonTable from '@/components/molecules/SubscriptionAddonTable/SubscriptionAddonTable';
import { BILLING_CYCLE } from '@/models/Subscription';
import {
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_SCOPE,
	ENTITLEMENT_ENTITY_TYPE,
	ENTITY_STATUS,
	EXPAND,
	Customer,
	PRICE_TYPE,
} from '@/models';
import { BILLING_PERIOD, PAYMENT_TERMS_NONE, paymentTermsOptions } from '@/constants/constants';
import { SubscriptionFormState } from '@/pages';
import { useQuery } from '@tanstack/react-query';
import { usePlanPrices } from '@/hooks/usePlanPrices';
import CreditGrantApi from '@/api/CreditGrantApi';
import EntitlementApi from '@/api/EntitlementApi';
import AddonApi from '@/api/AddonApi';
import { AddAddonToSubscriptionRequest } from '@/types/dto/Addon';
import { SubscriptionDiscountTable, EntitlementOverridesTable } from '@/components/molecules';
import { DataType, FilterOperator } from '@/types/common/QueryBuilder';
import SubscriptionTaxAssociationTable from '@/components/molecules/SubscriptionTaxAssociationTable';
import PhaseList from './PhaseList';
import { SubscriptionPhaseCreateRequest, EntitlementOverrideRequest } from '@/types/dto/Subscription';
import SubscriptionPriceTable from './SubscriptionPriceTable';
import AddSubscriptionChargeDialog from './AddSubscriptionChargeDialog';
import { CustomerSearchSelect, InheritedCustomersTable } from '@/components/molecules/Customer';
import { usePriceOverrides } from '@/hooks/usePriceOverrides';
import { Coupon } from '@/models/Coupon';
import { InternalCreditGrantRequest, creditGrantToInternal } from '@/types/dto/CreditGrant';
import { uniqueId } from 'lodash';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import {
	filterPlanPricesForSubscriptionCharges,
	isOneTimePlanPrice,
	uniqueRecurringBillingPeriodsFromPrices,
} from '@/utils/subscription/planPricesForSubscriptionUi';
import { Info } from 'lucide-react';

const BillingAccordionInfoTooltip = ({ description, ariaLabel }: { description: string; ariaLabel: string }) => (
	<Tooltip
		delayDuration={0}
		side='top'
		align='end'
		sideOffset={6}
		content={<span className='block max-w-xs text-xs font-normal leading-relaxed text-popover-foreground'>{description}</span>}
		className='max-w-xs'>
		<span
			className='inline-flex size-[22px] shrink-0 items-center justify-center rounded-md text-zinc-400 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
			tabIndex={0}
			aria-label={ariaLabel}
			onPointerDown={(e) => e.stopPropagation()}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => {
				if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
			}}>
			<Info className='size-3.5' strokeWidth={1.5} aria-hidden />
		</span>
	</Tooltip>
);

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
							'text-[15px] font-normal text-gray-500 px-3 py-1 rounded-[6px]',
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
	isLoadingPlanDetails,
	isPlanDetailsError,
	isDisabled,
	phases = [],
	onPhasesChange,
	allCoupons = [],
	subscriberCustomer,
}: {
	state: SubscriptionFormState;
	setState: React.Dispatch<React.SetStateAction<SubscriptionFormState>>;
	plans: PlanResponse[] | undefined;
	plansLoading: boolean;
	plansError: boolean;
	isLoadingPlanDetails?: boolean;
	isPlanDetailsError?: boolean;
	isDisabled: boolean;
	phases?: SubscriptionPhaseCreateRequest[];
	onPhasesChange?: (phases: SubscriptionPhaseCreateRequest[]) => void;
	allCoupons?: Coupon[];
	/** Subscription customer; used for invoicing "Self" option and labels */
	subscriberCustomer?: Customer;
}) => {
	// Fetch plan prices via shared hook (same cache key + canonical active filter as CreateCustomerSubscriptionPage)
	const { data: selectedPlanPrices } = usePlanPrices(state.selectedPlan);

	// Current prices for subscription-level and phase management (hook already returns only active prices).
	// Includes plan one-time (ONETIME) prices for the selected currency regardless of recurring billing period.
	const currentPrices = selectedPlanPrices?.items
		? filterPlanPricesForSubscriptionCharges(selectedPlanPrices.items, state.billingPeriod, state.currency)
		: [];

	const hasFixedSubscriptionChargePrice = useMemo(() => {
		if (!selectedPlanPrices?.items?.length) return false;
		const filtered = filterPlanPricesForSubscriptionCharges(selectedPlanPrices.items, state.billingPeriod, state.currency);
		return filtered.some((p) => p.type === PRICE_TYPE.FIXED);
	}, [selectedPlanPrices?.items, state.billingPeriod, state.currency]);

	useEffect(() => {
		if (!hasFixedSubscriptionChargePrice) return;
		setState((prev) => {
			if (prev.autoInvoiceThreshold === '') return prev;
			return { ...prev, autoInvoiceThreshold: '' };
		});
	}, [hasFixedSubscriptionChargePrice, setState]);

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

	// Get available billing periods and currencies from selectedPlanPrices
	const availableBillingPeriods = useMemo(() => {
		if (!selectedPlanPrices?.items) return [];
		const periods = uniqueRecurringBillingPeriodsFromPrices(selectedPlanPrices.items);
		return periods.map((period) => ({
			label: toSentenceCase(period.replace('_', ' ')),
			value: period,
		}));
	}, [selectedPlanPrices]);

	const availableCurrencies = useMemo(() => {
		const items = selectedPlanPrices?.items;
		if (!items?.length || !state.billingPeriod) return [];
		const recurringForPeriod = items.filter(
			(price) => !isOneTimePlanPrice(price) && price.billing_period.toLowerCase() === state.billingPeriod.toLowerCase(),
		);
		const source = recurringForPeriod.length > 0 ? recurringForPeriod : items.filter(isOneTimePlanPrice);
		const currencies = [...new Set(source.map((price) => price.currency))];
		return currencies.map((currency) => ({
			label: currency.toUpperCase(),
			value: currency,
		}));
	}, [selectedPlanPrices, state.billingPeriod]);

	const handlePlanChange = (value: string) => {
		// Just set the plan ID - prices will be fetched via useQuery automatically
		setState((prev) => ({
			...prev,
			selectedPlan: value,
			// Clear price overrides and coupons when changing plans
			priceOverrides: {},
			linkedCoupon: null,
			lineItemCoupons: {},
			inheritanceCustomers: [],
		}));
	};

	const handleBillingPeriodChange = (value: string) => {
		if (!selectedPlanPrices?.items) {
			toast.error('Invalid billing period.');
			return;
		}

		// Get available currencies for the new billing period (recurring only; fallback to one-time if plan has no recurring for that period)
		const recurringForPeriod = selectedPlanPrices.items.filter(
			(price) => !isOneTimePlanPrice(price) && price.billing_period.toLowerCase() === value.toLowerCase(),
		);
		const source = recurringForPeriod.length > 0 ? recurringForPeriod : selectedPlanPrices.items.filter(isOneTimePlanPrice);
		const currencies = [...new Set(source.map((price) => price.currency))];
		const defaultCurrency = currencies.includes(state.currency) ? state.currency : currencies[0];

		setState({
			...state,
			billingPeriod: value as BILLING_PERIOD,
			currency: defaultCurrency,
			commitmentDuration: value.toUpperCase(),
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
			metadata: {},
		};
	};

	// Fetch plan-level credit grants to display them alongside subscription-level grants
	const { data: selectedPlanCreditGrants } = useQuery({
		queryKey: ['creditGrants', state.selectedPlan],
		queryFn: async () => {
			if (!state.selectedPlan) return null;
			const response = await CreditGrantApi.list({
				plan_ids: [state.selectedPlan],
				scope: CREDIT_GRANT_SCOPE.PLAN,
			});
			return response;
		},
		enabled: !!state.selectedPlan,
	});

	// Track which credit grants were originally from plan level
	const planLevelCreditGrantIds = useMemo(() => {
		const ids = new Set<string>();
		if (selectedPlanCreditGrants?.items) {
			selectedPlanCreditGrants.items.forEach((grant) => ids.add(grant.id));
		}
		return ids;
	}, [selectedPlanCreditGrants]);

	// Track edited plan-level grant IDs (these will be converted to subscription scope)
	const [editedPlanGrantIds, setEditedPlanGrantIds] = useState<Set<string>>(new Set());
	// Add subscription charge dialog open state (single-phase only)
	const [isAddChargeDialogOpen, setAddChargeDialogOpen] = useState(false);
	// When set, dialog is in edit mode for this added line item (tempId)
	const [editingAddedChargeTempId, setEditingAddedChargeTempId] = useState<string | null>(null);

	// Combine plan credit grants with user-added credit grants (all editable now)
	const relevantCreditGrants = useMemo(() => {
		const planGrants: InternalCreditGrantRequest[] =
			state.selectedPlan && selectedPlanCreditGrants && (selectedPlanCreditGrants.items.length ?? 0) > 0
				? selectedPlanCreditGrants.items.map(creditGrantToInternal)
				: [];

		// User-added credit grants from state (subscription-level)
		const userGrants: InternalCreditGrantRequest[] = (state.creditGrants || []) as InternalCreditGrantRequest[];

		// If there are edited/deleted plan grants, all grants are in state.creditGrants
		// So we should only show those grants, not the original plan grants
		const hasEditedOrDeletedPlanGrants = Array.from(planLevelCreditGrantIds).some((planGrantId) => {
			// Check if this plan grant was deleted or is now in state.creditGrants (edited)
			const isDeleted = !userGrants.find((g) => g.id === planGrantId) && editedPlanGrantIds.has(planGrantId);
			const isInUserGrants = userGrants.find((g) => g.id === planGrantId);
			return isDeleted || isInUserGrants;
		});

		if (hasEditedOrDeletedPlanGrants) {
			// All grants are managed in state.creditGrants, don't show original plan grants
			return userGrants;
		}

		// No edits/deletes: show original plan grants + subscription-level user grants
		return [...planGrants, ...userGrants];
	}, [selectedPlanCreditGrants, state.selectedPlan, state.creditGrants, planLevelCreditGrantIds, editedPlanGrantIds]);

	const handleMarkGrantAsEdited = (grantId: string) => {
		setEditedPlanGrantIds((prev) => new Set(prev).add(grantId));
	};

	// Fetch plan entitlements
	const { data: planEntitlements } = useQuery({
		queryKey: ['planEntitlements', state.selectedPlan],
		queryFn: async () => {
			if (!state.selectedPlan) return null;
			try {
				return await EntitlementApi.search({
					filters: [
						{
							field: 'entity_type',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITLEMENT_ENTITY_TYPE.PLAN },
						},
						{
							field: 'entity_id',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: state.selectedPlan },
						},
						{
							field: 'status',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: ENTITY_STATUS.PUBLISHED },
						},
					],
					expand: generateExpandQueryParams([EXPAND.FEATURES]),
					limit: 10000,
					offset: 0,
				});
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
				const promises = addonIds.map((addonId) => AddonApi.GetEntitlements(addonId));
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
		<div className='p-6 rounded-[6px] border border-gray-300 space-y-6 bg-white'>
			<FormHeader title='Subscription Details' variant='sub-header' />

			{/* Plan Selection */}
			{!plansLoading && (
				<div className='space-y-2'>
					<Select
						value={state.selectedPlan}
						options={plansWithCharges}
						onChange={handlePlanChange}
						label='Plan*'
						disabled={isDisabled || isLoadingPlanDetails}
						placeholder='Select plan'
						error={plansError ? 'Failed to load plans' : isPlanDetailsError ? 'Failed to load plan details' : undefined}
					/>
					{isLoadingPlanDetails && state.selectedPlan && <p className='text-sm text-gray-500'>Loading plan details...</p>}
				</div>
			)}

			{/* Billing Period Selection */}
			{state.selectedPlan && !isLoadingPlanDetails && availableBillingPeriods.length > 0 && (
				<Select
					key={availableBillingPeriods.map((opt) => opt.value).join(',')}
					value={state.billingPeriod}
					options={availableBillingPeriods}
					onChange={handleBillingPeriodChange}
					label='Billing Period*'
					disabled={isDisabled || isLoadingPlanDetails}
					placeholder='Select billing period'
				/>
			)}

			{/* Currency Selection */}
			{state.selectedPlan && !isLoadingPlanDetails && availableCurrencies.length > 0 && (
				<Select
					key={availableCurrencies.map((opt) => opt.value).join(',')}
					value={state.currency}
					options={availableCurrencies}
					onChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
					label='Currency*'
					disabled={isDisabled || isLoadingPlanDetails}
					placeholder='Select currency'
				/>
			)}

			{/* Subscription Cycle */}
			{state.selectedPlan && !isLoadingPlanDetails && (
				<BillingCycleSelector
					value={state.billingCycle}
					onChange={(value) =>
						setState((prev) => ({
							...prev,
							billingCycle: value,
							billingAnchor: value === BILLING_CYCLE.CALENDAR ? undefined : prev.billingAnchor,
						}))
					}
					disabled={isDisabled || isLoadingPlanDetails}
				/>
			)}

			{/* Add subscription charge dialog (single-phase only) */}
			{state.selectedPlan && !isLoadingPlanDetails && phases.length === 0 && (
				<AddSubscriptionChargeDialog
					isOpen={isAddChargeDialogOpen}
					onOpenChange={(open) => {
						setAddChargeDialogOpen(open);
						if (!open) setEditingAddedChargeTempId(null);
					}}
					onSave={(item) => {
						if (editingAddedChargeTempId) {
							setState((prev) => ({
								...prev,
								addedSubscriptionLineItems: (prev.addedSubscriptionLineItems ?? []).map((i) => (i.tempId === item.tempId ? item : i)),
							}));
						} else {
							setState((prev) => ({
								...prev,
								addedSubscriptionLineItems: [...(prev.addedSubscriptionLineItems ?? []), item],
							}));
						}
						setEditingAddedChargeTempId(null);
						setAddChargeDialogOpen(false);
					}}
					defaultCurrency={state.currency}
					defaultBillingPeriod={state.billingPeriod}
					initialItem={
						editingAddedChargeTempId != null
							? (state.addedSubscriptionLineItems?.find((i) => i.tempId === editingAddedChargeTempId) ?? null)
							: null
					}
				/>
			)}

			{/* Conditional: Show Subscription Fields OR Phases */}
			{state.selectedPlan && !isLoadingPlanDetails && phases.length === 0 && (
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

					{state.selectedPlan && !isLoadingPlanDetails && phases.length === 0 && state.billingCycle === BILLING_CYCLE.ANNIVERSARY && (
						<div className=''>
							<DatePicker
								label='Billing Date'
								date={state.billingAnchor ? new Date(state.billingAnchor) : undefined}
								setDate={(date) => setState((prev) => ({ ...prev, billingAnchor: date ? date.toISOString() : undefined }))}
								disabled={isDisabled}
								placeholder='Select billing date'
							/>
						</div>
					)}

					{/* Subscription Level Price Table (always show in single-phase so Add charge is available) */}
					<div className='mt-6 pt-6 border-t border-gray-200'>
						<SubscriptionPriceTable
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
							onCommitmentChange={(priceId, config) => {
								// Update the commitment field on the price override
								if (config) {
									overridePrice(priceId, { commitment: config });
								} else {
									// Remove commitment from override
									const currentOverride = overriddenPrices[priceId];
									if (currentOverride) {
										const { commitment: _commitment, ...restOverride } = currentOverride;
										if (Object.keys(restOverride).length > 1) {
											// Has other overrides, just remove commitment
											overridePrice(priceId, restOverride);
										} else {
											// Only had commitment, remove entire override
											resetOverride(priceId);
										}
									}
								}
							}}
							disabled={isDisabled}
							subscriptionLevelCoupon={state.linkedCoupon}
							addedLineItems={state.addedSubscriptionLineItems}
							onAddCharge={() => {
								setEditingAddedChargeTempId(null);
								setAddChargeDialogOpen(true);
							}}
							onRemoveAddedCharge={(tempId) =>
								setState((prev) => ({
									...prev,
									addedSubscriptionLineItems: (prev.addedSubscriptionLineItems ?? []).filter((i) => i.tempId !== tempId),
								}))
							}
							onEditAddedCharge={(item) => {
								setEditingAddedChargeTempId(item.tempId);
								setAddChargeDialogOpen(true);
							}}
						/>
					</div>

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
			{state.selectedPlan && !isLoadingPlanDetails && phases !== undefined && onPhasesChange && (
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
			{state.selectedPlan && !isLoadingPlanDetails && (
				<>
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
						<Select
							label='Commitment Period'
							value={state.commitmentDuration}
							options={[
								{ label: 'Monthly', value: 'MONTHLY' },
								{ label: 'Quarterly', value: 'QUARTERLY' },
								{ label: 'Half-Yearly', value: 'HALF_YEARLY' },
								{ label: 'Annual', value: 'ANNUAL' },
							]}
							onChange={(value) => setState((prev) => ({ ...prev, commitmentDuration: value }))}
							placeholder='Same as billing period'
							disabled={isDisabled}
						/>
					</div>
					{/* Overage Factor + Enable True Up */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
						<DecimalUsageInput
							label='Overage Factor'
							value={state.overageFactor}
							onChange={(value) => setState((prev) => ({ ...prev, overageFactor: value }))}
							placeholder='e.g. 1.5'
							disabled={isDisabled}
							precision={2}
							min={0}
						/>
						<div className='flex flex-col space-y-2'>
							<Label label='Enable True-up fee' />
							<Switch
								checked={state.enable_true_up}
								onCheckedChange={(checked) => setState((prev) => ({ ...prev, enable_true_up: checked }))}
								disabled={isDisabled}
							/>
						</div>
					</div>
				</>
			)}

			{/* Credit Grants (Subscription Level) */}
			{state.selectedPlan && !isLoadingPlanDetails && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
					<SubscriptionCreditGrantTable
						getEmptyCreditGrant={() => getEmptyCreditGrant()}
						data={relevantCreditGrants}
						onChange={(data: InternalCreditGrantRequest[]) => {
							// Check if any plan-level grants were edited or deleted by inspecting the data
							const hasEditedOrDeletedPlanGrants = Array.from(planLevelCreditGrantIds).some((planGrantId) => {
								const grantInData = data.find((g) => g.id === planGrantId);
								// Deleted: not in data anymore
								if (!grantInData) return true;
								// Edited: scope changed from PLAN to SUBSCRIPTION
								if (grantInData.scope === CREDIT_GRANT_SCOPE.SUBSCRIPTION) return true;
								return false;
							});

							// Check if there are any new subscription-level grants (not from plan)
							const hasNewSubscriptionGrants = data.some(
								(grant) => !planLevelCreditGrantIds.has(grant.id) && grant.scope === CREDIT_GRANT_SCOPE.SUBSCRIPTION,
							);

							// If plan grants were modified OR new subscription grants were added, convert all to subscription level
							const shouldConvertAll = hasEditedOrDeletedPlanGrants || (hasNewSubscriptionGrants && planLevelCreditGrantIds.size > 0);

							if (shouldConvertAll) {
								// If any plan-level grant was edited/deleted OR new subscription grant added,
								// convert ALL remaining plan grants to subscription scope
								const convertedGrants = data.map((grant) => {
									// If it's an unedited plan-level grant (still has PLAN scope), convert it now
									if (planLevelCreditGrantIds.has(grant.id) && grant.scope !== CREDIT_GRANT_SCOPE.SUBSCRIPTION) {
										return {
											...grant,
											scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
											subscription_id: uniqueId('sub_'),
											plan_id: undefined,
										};
									}
									// Already converted or subscription-level grant, keep as is
									return grant;
								});

								// Store all grants (all are now subscription-level) and mark as modified
								setState((prev) => ({
									...prev,
									creditGrants: convertedGrants,
									hasModifiedPlanCreditGrants: true,
								}));
							} else {
								// No plan grants edited/deleted and no new subscription grants: only store subscription-level grants
								// Plan-level grants will be sent automatically by the backend
								const userGrants = data.filter((grant) => !planLevelCreditGrantIds.has(grant.id));
								setState((prev) => ({
									...prev,
									creditGrants: userGrants,
									hasModifiedPlanCreditGrants: false,
								}));
							}
						}}
						disabled={isDisabled}
						planLevelCreditGrantIds={planLevelCreditGrantIds}
						onMarkAsEdited={handleMarkGrantAsEdited}
						subscriptionId={uniqueId('sub_')}
					/>
				</div>
			)}

			{/* Tax Rate Overrides */}
			{state.selectedPlan && !isLoadingPlanDetails && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
					<SubscriptionTaxAssociationTable
						data={state.tax_rate_overrides || []}
						onChange={(data) => setState((prev) => ({ ...prev, tax_rate_overrides: data }))}
						disabled={isDisabled}
					/>
				</div>
			)}

			{/* Addons Section */}
			{state.selectedPlan && !isLoadingPlanDetails && (
				<div className='mt-6 pt-6 border-t border-gray-200'>
					<SubscriptionAddonTable
						getEmptyAddon={getEmptyAddon}
						data={state.addons || []}
						onChange={(data) => {
							setState((prev) => ({ ...prev, addons: data }));
						}}
						disabled={isDisabled}
						billingPeriod={state.billingPeriod}
						currency={state.currency}
					/>
				</div>
			)}

			{/* Entitlements Section */}
			{state.selectedPlan && !isLoadingPlanDetails && allEntitlements.length > 0 && (
				<div className='space-y-4 mt-4 pt-3 border-t border-gray-200'>
					<FormHeader className='mb-0' title='Entitlements' variant='sub-header' />
					<div className='rounded-[6px] border border-gray-300 space-y-6 mt-2'>
						<EntitlementOverridesTable
							entitlements={allEntitlements}
							overrides={state.entitlementOverrides}
							onOverrideChange={handleEntitlementOverride}
							onOverrideReset={handleEntitlementOverrideReset}
						/>
					</div>
				</div>
			)}

			{/* Advanced Configuration */}
			{state.selectedPlan && !isLoadingPlanDetails && (
				<div className='mt-6 pt-6 border-t border-gray-200 space-y-6'>
					<FormHeader title='Billing Configuration' variant='sub-header' />
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<Select
							value={state.paymentTerms ?? PAYMENT_TERMS_NONE}
							options={paymentTermsOptions}
							onChange={(value) => setState((prev) => ({ ...prev, paymentTerms: value === PAYMENT_TERMS_NONE ? undefined : value }))}
							label='Payment terms'
							disabled={isDisabled || isLoadingPlanDetails}
							placeholder='Select payment terms'
						/>
						<CustomerSearchSelect
							selfCustomer={subscriberCustomer}
							value={state.invoicingCustomer}
							excludeId={state.customerId}
							onChange={(customer) => {
								setState((prev) => ({
									...prev,
									invoicingCustomer: customer?.id && customer.id !== prev.customerId ? customer : undefined,
								}));
							}}
							display={{
								label: 'Billing customer',
								placeholder: 'Self',
							}}
							searchPlaceholder='Search for billing customer...'
							disabled={isDisabled}
						/>
					</div>

					<div className='space-y-3 md:col-span-2'>
						<InheritedCustomersTable
							data={state.inheritanceCustomers}
							onChange={(customers) => setState((prev) => ({ ...prev, inheritanceCustomers: customers }))}
							disabled={isDisabled}
							subscriberCustomerId={state.customerId}
						/>
					</div>

					<Accordion
						type='multiple'
						className='overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]'>
						<AccordionItem value='trial'>
							<AccordionTrigger className='px-5 py-4'>
								<span className='flex min-w-0 flex-1 items-center'>
									<span className='min-w-0 flex-1 truncate'>Free trial</span>
									<span className='ml-auto flex shrink-0 items-center pl-2'>
										<BillingAccordionInfoTooltip
											ariaLabel='About free trial'
											description='Optional trial length for this subscription in days. Leave empty to use the plan default (or no trial if the plan defines none).'
										/>
									</span>
								</span>
							</AccordionTrigger>
							<AccordionContent className='border-t border-zinc-100 bg-white px-5 pb-5 pt-4'>
								<div className='max-w-xs'>
									<Input
										id='subscription-billing-trial-days'
										aria-label='Trial period days'
										variant='number'
										value={state.subscriptionTrialPeriodDays}
										onChange={(value) => setState((prev) => ({ ...prev, subscriptionTrialPeriodDays: value }))}
										suffix='days'
										placeholder='14'
										disabled={isDisabled || isLoadingPlanDetails}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value='proration'>
							<AccordionTrigger className='px-5 py-4'>
								<span className='flex min-w-0 flex-1 items-center'>
									<span className='min-w-0 flex-1 truncate'>Proration behavior</span>
									<span className='ml-auto flex shrink-0 items-center pl-2'>
										<BillingAccordionInfoTooltip
											ariaLabel='About proration'
											description='When enabled, mid-cycle subscription changes generate proration line items so invoices reflect time spent on each price.'
										/>
									</span>
								</span>
							</AccordionTrigger>
							<AccordionContent className='border-t border-zinc-100 bg-white px-5 pb-5 pt-4'>
								<div className='flex flex-row items-center justify-between gap-4 w-full'>
									<p className='text-[13px] leading-relaxed text-zinc-600 min-w-0 flex-1'>
										Create proration line items when the subscription changes mid-cycle.
									</p>
									<Switch
										id='subscription-billing-proration'
										className='shrink-0'
										checked={state.prorationCreateLineItems}
										onCheckedChange={(checked) => setState((prev) => ({ ...prev, prorationCreateLineItems: checked }))}
										disabled={isDisabled}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>

						<AccordionItem value='auto-invoice'>
							<AccordionTrigger className='px-5 py-4'>
								<span className='flex min-w-0 flex-1 items-center'>
									<span className='min-w-0 flex-1 truncate'>Auto invoice threshold</span>
									<span className='ml-auto flex shrink-0 items-center pl-2'>
										<BillingAccordionInfoTooltip
											ariaLabel='About auto invoice threshold'
											description='Usage amount that can trigger an invoice before the period ends. Available when charges are usage-based; fixed-price subscription charges disable this field.'
										/>
									</span>
								</span>
							</AccordionTrigger>
							<AccordionContent className='border-t border-zinc-100 bg-white px-5 pb-5 pt-4'>
								<div className='flex-1 min-w-[12rem] max-w-md'>
									<DecimalUsageInput
										id='subscription-billing-auto-invoice-threshold-amount'
										ariaLabel='Auto invoice threshold amount'
										suffix={state.currency ? getCurrencySymbol(state.currency) : undefined}
										value={state.autoInvoiceThreshold}
										onChange={(value) => setState((prev) => ({ ...prev, autoInvoiceThreshold: value }))}
										placeholder='100.00'
										disabled={isDisabled || isLoadingPlanDetails || hasFixedSubscriptionChargePrice}
										precision={2}
										min={0}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion >
				</div >
			)}
		</div >
	);
};

export default SubscriptionForm;
