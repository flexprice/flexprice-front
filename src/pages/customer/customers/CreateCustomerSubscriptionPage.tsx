// React imports
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Third-party libraries
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Internal components
import { Button, SelectOption } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { Preview, UsageTable, SubscriptionForm } from '@/components/organisms';

// API imports
import { AddonApi, CustomerApi, PlanApi, SubscriptionApi, TaxApi, CouponApi } from '@/api';

// Core services and routes
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RouteNames } from '@/core/routes/Routes';

// Models and types - consolidated from index files
import { BILLING_CADENCE, SubscriptionPhase, Coupon, TAXRATE_ENTITY_TYPE, EXPAND, BILLING_CYCLE } from '@/models';
import { ExpandedPlan, CreateSubscriptionRequest, AddAddonToSubscriptionRequest, TaxRateOverride } from '@/types';

// Constants and utilities
import { BILLING_PERIOD } from '@/constants/constants';
import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride, getLineItemOverrides } from '@/utils/common/price_override_helpers';
// Store
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';

type Params = {
	id: string;
	subscription_id?: string;
};

export enum SubscriptionPhaseState {
	EDIT = 'edit',
	SAVED = 'saved',
	NEW = 'new',
}

export type SubscriptionFormState = {
	selectedPlan: string;
	prices: ExpandedPlan | null;
	billingPeriod: BILLING_PERIOD;
	currency: string;
	billingPeriodOptions: SelectOption[];

	// Subscription Level Properties (moved from phase)
	billingCycle: BILLING_CYCLE;
	commitmentAmount: string;
	overageFactor: string;
	startDate: string;
	endDate?: string;

	// Subscription Phase Management
	phases: SubscriptionPhaseCreateRequest[];
	selectedPhase: number;
	phaseStates: SubscriptionPhaseState[];
	isPhaseEditing: boolean;
	originalPhases: SubscriptionPhase[];

	// Price Overrides
	priceOverrides: Record<string, ExtendedPriceOverride>;

	// Subscription Level Coupon (single coupon)
	linkedCoupon: Coupon | null;

	// Line Item Coupons - maps price_id to single Coupon object
	lineItemCoupons: Record<string, Coupon>;

	// Addons
	addons?: AddAddonToSubscriptionRequest[];
	customerId: string;

	// Tax Rate Overrides
	tax_rate_overrides: TaxRateOverride[];
};

// Data Fetching Hooks
const usePlans = () => {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const plansResponse = await PlanApi.getActiveExpandedPlan({ limit: 1000, offset: 0 });

			try {
				const filteredPlans = plansResponse.filter((plan) => {
					const hasPrices = plan.prices && plan.prices.length > 0;
					return hasPrices;
				});

				return filteredPlans;
			} catch (error) {
				toast.error('Error processing plans data');
				throw error;
			}
		},
	});
};

const useCustomerData = (customerId: string | undefined) => {
	return useQuery({
		queryKey: ['customerSubscription', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
};

const useSubscriptionData = (subscription_id: string | undefined) => {
	return useQuery({
		queryKey: ['subscription', subscription_id],
		queryFn: async () => {
			const [details, usage] = await Promise.all([
				CustomerApi.getCustomerSubscriptionById(subscription_id!),
				SubscriptionApi.getSubscriptionUsage(subscription_id!),
			]);
			return { details, usage };
		},
		enabled: !!subscription_id,
	});
};

// Hook to fetch addons data
const useAddons = (addonIds: string[] = []) => {
	return useQuery({
		queryKey: ['addons', addonIds],
		queryFn: async () => {
			if (!addonIds.length) return { items: [] };
			const response = await AddonApi.ListAddon({
				addon_ids: addonIds,
				expand: 'prices,entitlements',
			});
			return response;
		},
		enabled: addonIds.length > 0,
	});
};

const CreateCustomerSubscriptionPage: React.FC = () => {
	const { id: customerId, subscription_id } = useParams<Params>();
	const navigate = useNavigate();
	const updateBreadcrumb = useBreadcrumbsStore((state) => state.updateBreadcrumb);

	// Fetch data using React Query
	const { data: customerTaxAssociations } = useQuery({
		queryKey: ['customerTaxAssociations', customerId],
		queryFn: async () => {
			return await TaxApi.listTaxAssociations({
				limit: 100,
				offset: 0,
				entity_id: customerId!,
				expand: EXPAND.TAX_RATE,
				entity_type: TAXRATE_ENTITY_TYPE.CUSTOMER,
			});
		},
		enabled: !!customerId,
	});

	useEffect(() => {
		if (customerTaxAssociations?.items) {
			setSubscriptionState((prev) => ({
				...prev,
				tax_rate_overrides: customerTaxAssociations.items.map((item) => ({
					tax_rate_id: item.tax_rate_id,
					tax_rate_code: item.tax_rate?.code ?? '',
					currency: item.currency.toLowerCase(),
					auto_apply: item.auto_apply,
					priority: item.priority,
					tax_rate_name: item.tax_rate?.name ?? '',
				})),
			}));
		}
	}, [customerTaxAssociations]);

	// Local state
	const [subscriptionState, setSubscriptionState] = useState<SubscriptionFormState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: BILLING_PERIOD.MONTHLY,
		currency: '',
		billingPeriodOptions: [],

		// Subscription Level Properties
		billingCycle: BILLING_CYCLE.ANNIVERSARY,
		commitmentAmount: '',
		overageFactor: '',
		startDate: new Date().toISOString(),
		endDate: undefined,

		// Phase Management
		phases: [],
		selectedPhase: 0,
		phaseStates: [],
		isPhaseEditing: false,
		originalPhases: [],

		// Other properties
		priceOverrides: {},
		linkedCoupon: null,
		lineItemCoupons: {},
		addons: [],
		customerId: customerId!,
		tax_rate_overrides: [],
	});

	// Fetch data using React Query
	const { data: plans, isLoading: plansLoading, isError: plansError } = usePlans();
	const { data: customerData } = useCustomerData(customerId);
	const { data: subscriptionData } = useSubscriptionData(subscription_id);

	// Reuse the same query that SubscriptionDiscountTable uses
	const { data: couponsResponse } = useQuery({
		queryKey: ['coupons'],
		queryFn: () => CouponApi.getAllCoupons({ limit: 1000, offset: 0 }),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
	const allCouponsData = couponsResponse?.items || [];

	// Get addon IDs from subscription state
	const addonIds = useMemo(() => subscriptionState.addons?.map((addon) => addon.addon_id) || [], [subscriptionState.addons]);
	const { data: addons } = useAddons(addonIds);

	// Helper function to count addon ID occurrences
	const getAddonCounts = useMemo(() => {
		const counts = new Map<string, number>();
		subscriptionState.addons?.forEach((addon) => {
			counts.set(addon.addon_id, (counts.get(addon.addon_id) || 0) + 1);
		});
		return counts;
	}, [subscriptionState.addons]);

	// Helper function to check if price should be shown (start_date <= now or no start_date)
	const isPriceActive = (price: { start_date?: string }) => {
		if (!price.start_date) return true; // No start_date means it's active
		const now = new Date();
		const startDate = new Date(price.start_date);
		// Check if date is valid
		if (isNaN(startDate.getTime())) return true; // Invalid date, treat as active
		return startDate <= now;
	};

	// Memoized function to get combined prices from subscription and addons
	const getPrices = useMemo(() => {
		const subscriptionPrices =
			subscriptionState.prices?.prices?.filter(
				(price) =>
					price.billing_period.toLowerCase() === subscriptionState.billingPeriod.toLowerCase() &&
					price.currency.toLowerCase() === subscriptionState.currency.toLowerCase() &&
					isPriceActive(price),
			) || [];

		// Get matching addon prices and create unique instances for each count
		const addonPrices =
			addons?.items?.flatMap((addon) => {
				const count = getAddonCounts.get(addon.id) || 0;
				const matchingPrices =
					addon.prices?.filter(
						(price) =>
							price.billing_period.toLowerCase() === subscriptionState.billingPeriod.toLowerCase() &&
							price.currency.toLowerCase() === subscriptionState.currency.toLowerCase() &&
							isPriceActive(price),
					) || [];

				// Create unique instances for each count with unique IDs
				return Array.from({ length: count }, (_, index) =>
					matchingPrices.map((price) => ({
						...price,
						// Append instance index to make price ID unique for each instance
						id: `${price.id}_instance_${index}`,
					})),
				).flat();
			}) || [];

		return [...subscriptionPrices, ...addonPrices];
	}, [subscriptionState.prices, subscriptionState.billingPeriod, subscriptionState.currency, addons, getAddonCounts]);

	// Coupons are handled in SubscriptionForm

	// Update breadcrumb when customer data changes
	useEffect(() => {
		if (customerData?.external_id) {
			updateBreadcrumb(2, customerData.external_id);
		}
	}, [customerData, updateBreadcrumb]);

	// Initialize subscription state when subscription data is available
	useEffect(() => {
		if (subscriptionData?.details && plans) {
			const planDetails = plans.find((plan) => plan.id === subscriptionData.details.plan_id);
			if (planDetails) {
				// Get available billing periods and currencies
				const billingPeriods = [...new Set(planDetails.prices?.map((price) => price.billing_period) || [])];

				setSubscriptionState({
					selectedPlan: subscriptionData.details.plan_id,
					prices: planDetails,
					billingPeriod: subscriptionData.details.billing_period.toLowerCase() as BILLING_PERIOD,
					currency: subscriptionData.details.currency,
					billingPeriodOptions: billingPeriods.map((period) => ({
						label: toSentenceCase(period.replace('_', ' ')),
						value: period,
					})),

					// Subscription Level Properties
					billingCycle: subscriptionData.details.billing_cycle || BILLING_CYCLE.ANNIVERSARY,
					startDate: subscriptionData.details.start_date,
					endDate: subscriptionData.details.end_date || undefined,
					commitmentAmount: subscriptionData.details.commitment_amount?.toString() ?? '',
					overageFactor: subscriptionData.details.overage_factor?.toString() ?? '',

					// Phase Management - start with empty phases, user can add them
					phases: [],
					selectedPhase: -1, // No phase selected initially
					phaseStates: [],
					isPhaseEditing: false,
					originalPhases: [],

					// Other properties
					priceOverrides: {},
					linkedCoupon: null,
					lineItemCoupons: {},
					addons: [],
					customerId: customerId!,
					tax_rate_overrides: [],
				});
			}
		}
	}, [subscriptionData, plans, customerId]);

	// Create subscription mutation
	const { mutate: createSubscription, isPending: isCreating } = useMutation({
		mutationKey: ['createSubscription'],
		mutationFn: async (data: CreateSubscriptionRequest) => {
			return await SubscriptionApi.createSubscription(data);
		},
		onSuccess: async () => {
			toast.success('Subscription created successfully');

			refetchQueries(['debug-customers']);
			refetchQueries(['debug-subscriptions']);

			navigate(`${RouteNames.customers}/${customerId}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Error creating subscription');
		},
	});

	const handleSubscriptionSubmit = () => {
		const {
			billingPeriod,
			selectedPlan,
			currency,
			billingCycle,
			startDate,
			endDate,
			phases,
			priceOverrides,
			prices,
			linkedCoupon,
			lineItemCoupons,
			tax_rate_overrides,
			addons,
			overageFactor,
			commitmentAmount,
		} = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			toast.error('Please select a plan and billing period.');
			return;
		}

		if (!startDate) {
			toast.error('Please select a start date for the subscription.');
			return;
		}

		// Validate phases if any exist
		phases.forEach((phase, index) => {
			if (!phase.start_date) {
				toast.error(`Please select a start date for phase ${index + 1}`);
				return;
			}
		});

		// Check for any unsaved changes
		if (subscriptionState.isPhaseEditing) {
			toast.error('Please save your changes before submitting.');
			return;
		}

		// Get price overrides for backend
		const currentPrices =
			prices?.prices?.filter(
				(price) =>
					price.billing_period.toLowerCase() === billingPeriod.toLowerCase() &&
					price.currency.toLowerCase() === currency.toLowerCase() &&
					isPriceActive(price),
			) || [];
		const overrideLineItems = getLineItemOverrides(currentPrices, priceOverrides);

		// Phases are already in the correct format (SubscriptionPhaseCreateRequest)
		// Just ensure proper formatting
		const sanitizedPhases = phases.map((phase) => ({
			start_date: phase.start_date,
			end_date: phase.end_date || undefined,
			coupons: phase.coupons || undefined,
			line_item_coupons: phase.line_item_coupons || undefined,
			override_line_items: phase.override_line_items || undefined,
			metadata: phase.metadata || undefined,
		}));

		const payload: CreateSubscriptionRequest = {
			billing_cadence: BILLING_CADENCE.RECURRING,
			billing_period: billingPeriod.toUpperCase() as BILLING_PERIOD,
			billing_period_count: 1,
			billing_cycle: billingCycle,

			// TODO: remove lower case currency after the feature is released
			currency: currency.toLowerCase(),
			customer_id: customerId!,
			plan_id: selectedPlan,

			// Use subscription-level dates
			start_date: new Date(startDate).toISOString(),
			end_date: endDate ? new Date(endDate).toISOString() : undefined,

			// Subscription-level properties
			commitment_amount: commitmentAmount && commitmentAmount.trim() !== '' ? parseFloat(commitmentAmount) : undefined,
			overage_factor: overageFactor && overageFactor.trim() !== '' ? parseFloat(overageFactor) : undefined,

			// Optional properties
			lookup_key: '',
			phases: sanitizedPhases.length > 0 ? sanitizedPhases : undefined,
			override_line_items: overrideLineItems.length > 0 ? overrideLineItems : undefined,
			addons: (addons?.length ?? 0) > 0 ? addons : undefined,
			coupons: linkedCoupon ? [linkedCoupon.id] : undefined,
			line_item_coupons:
				Object.keys(lineItemCoupons).length > 0
					? Object.fromEntries(
							Object.entries(lineItemCoupons).map(([priceId, coupon]) => [
								priceId,
								[coupon.id], // Convert single coupon to array format for API
							]),
						)
					: undefined,

			// Tax rate overrides
			tax_rate_overrides: tax_rate_overrides.length > 0 ? tax_rate_overrides : undefined,
		};

		createSubscription(payload);
	};

	const navigateBack = () => navigate(`${RouteNames.customers}/${customerId}`);

	const showPreview = subscriptionState.selectedPlan && !subscriptionData?.usage;

	return (
		<div className={cn('flex gap-8 mt-5 relative mb-12')}>
			<ApiDocsContent tags={['Subscriptions']} />
			<div className='flex-[6] space-y-6 mb-12 overflow-y-auto pr-4'>
				{subscriptionData?.usage?.charges && subscriptionData.usage.charges.length > 0 && (
					<div>
						<UsageTable data={subscriptionData.usage} />
					</div>
				)}

				<SubscriptionForm
					state={subscriptionState}
					setState={setSubscriptionState}
					plans={plans}
					plansLoading={plansLoading}
					plansError={plansError}
					isDisabled={!!subscription_id}
					phases={subscriptionState.phases}
					onPhasesChange={(newPhases) => {
						setSubscriptionState((prev) => ({
							...prev,
							phases: newPhases,
						}));
					}}
					allCoupons={allCouponsData}
				/>

				{subscriptionState.selectedPlan && !subscription_id && (
					<div className='flex items-center justify-start space-x-4'>
						<Button onClick={navigateBack} variant={'outline'}>
							Cancel
						</Button>
						<Button onClick={handleSubscriptionSubmit} isLoading={isCreating}>
							Add Subscription
						</Button>
					</div>
				)}
			</div>

			<div className='flex-[4]'>
				<div className='sticky top-6'>
					{showPreview && (
						<div className='hidden'>
							<Preview
								data={getPrices}
								selectedPlan={subscriptionState.prices}
								phases={subscriptionState.phases}
								billingCycle={subscriptionState.billingCycle}
								coupons={subscriptionState.linkedCoupon ? [subscriptionState.linkedCoupon] : []}
								allCoupons={allCouponsData}
								priceOverrides={subscriptionState.priceOverrides}
								lineItemCoupons={subscriptionState.lineItemCoupons}
								taxRateOverrides={subscriptionState.tax_rate_overrides}
								addons={subscriptionState.addons || []}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default CreateCustomerSubscriptionPage;
