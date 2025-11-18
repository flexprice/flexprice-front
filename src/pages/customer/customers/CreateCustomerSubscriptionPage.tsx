import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Button, SelectOption } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { UsageTable, SubscriptionForm } from '@/components/organisms';

import { AddonApi, CustomerApi, PlanApi, SubscriptionApi, TaxApi, CouponApi } from '@/api';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RouteNames } from '@/core/routes/Routes';
import { ServerError } from '@/core/axios/types';

import { BILLING_CADENCE, SubscriptionPhase, Coupon, TAXRATE_ENTITY_TYPE, EXPAND, BILLING_CYCLE } from '@/models';
import { InternalCreditGrantRequest, creditGrantToInternal, internalToCreateRequest } from '@/types/dto/CreditGrant';
import { BILLING_PERIOD } from '@/constants/constants';

import {
	ExpandedPlan,
	CreateSubscriptionRequest,
	AddAddonToSubscriptionRequest,
	TaxRateOverride,
	EntitlementOverrideRequest,
} from '@/types/dto';
import { OverrideLineItemRequest, SubscriptionPhaseCreateRequest } from '@/types/dto/Subscription';

import { cn } from '@/lib/utils';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride, getLineItemOverrides } from '@/utils/common/price_override_helpers';
import { extractSubscriptionBoundaries, extractFirstPhaseData } from '@/utils/subscription/phaseConversion';

import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';

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
	billingCycle: BILLING_CYCLE;
	commitmentAmount: string;
	overageFactor: string;
	startDate: string;
	endDate?: string;
	phases: SubscriptionPhaseCreateRequest[];
	selectedPhase: number;
	phaseStates: SubscriptionPhaseState[];
	isPhaseEditing: boolean;
	originalPhases: SubscriptionPhase[];
	priceOverrides: Record<string, ExtendedPriceOverride>;
	linkedCoupon: Coupon | null;
	lineItemCoupons: Record<string, Coupon>;
	addons?: AddAddonToSubscriptionRequest[];
	customerId: string;
	tax_rate_overrides: TaxRateOverride[];
	entitlementOverrides: Record<string, EntitlementOverrideRequest>;
	creditGrants: InternalCreditGrantRequest[];
};

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

const useAddons = (addonIds: string[]) => {
	return useQuery({
		queryKey: ['addons', addonIds],
		queryFn: async () => {
			if (addonIds.length === 0) return { items: [] };
			const response = await AddonApi.ListAddon({ limit: 1000, offset: 0 });
			const filteredItems = response.items.filter((addon) => addonIds.includes(addon.id));
			return { ...response, items: filteredItems };
		},
		enabled: addonIds.length > 0,
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

const CreateCustomerSubscriptionPage: React.FC = () => {
	const { id: customerId, subscription_id } = useParams<Params>();
	const navigate = useNavigate();
	const updateBreadcrumb = useBreadcrumbsStore((state) => state.updateBreadcrumb);

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

	const [subscriptionState, setSubscriptionState] = useState<SubscriptionFormState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: BILLING_PERIOD.MONTHLY,
		currency: '',
		billingPeriodOptions: [],
		billingCycle: BILLING_CYCLE.ANNIVERSARY,
		commitmentAmount: '',
		overageFactor: '',
		startDate: new Date().toISOString(),
		endDate: undefined,
		phases: [],
		selectedPhase: 0,
		phaseStates: [],
		isPhaseEditing: false,
		originalPhases: [],
		priceOverrides: {},
		linkedCoupon: null,
		lineItemCoupons: {},
		addons: [],
		customerId: customerId!,
		tax_rate_overrides: [],
		entitlementOverrides: {},
		creditGrants: [],
	});

	const { data: plans, isLoading: plansLoading, isError: plansError } = usePlans();
	const { data: customerData } = useCustomerData(customerId);
	const { data: subscriptionData } = useSubscriptionData(subscription_id);

	const { data: couponsResponse } = useQuery({
		queryKey: ['coupons'],
		queryFn: () => CouponApi.getAllCoupons({ limit: 1000, offset: 0 }),
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
	const allCouponsData = couponsResponse?.items || [];

	const addonIds = useMemo(() => subscriptionState.addons?.map((addon) => addon.addon_id) || [], [subscriptionState.addons]);
	useAddons(addonIds);

	const isPriceActive = (price: { start_date?: string }) => {
		if (!price.start_date) return true;
		const now = new Date();
		const startDate = new Date(price.start_date);
		if (isNaN(startDate.getTime())) return true;
		return startDate <= now;
	};

	useEffect(() => {
		if (customerData?.external_id) {
			updateBreadcrumb(2, customerData.external_id);
		}
	}, [customerData, updateBreadcrumb]);

	useEffect(() => {
		if (subscriptionData?.details && plans) {
			const planDetails = plans.find((plan) => plan.id === subscriptionData.details.plan_id);
			if (planDetails) {
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
					billingCycle: subscriptionData.details.billing_cycle || BILLING_CYCLE.ANNIVERSARY,
					startDate: subscriptionData.details.start_date,
					endDate: subscriptionData.details.end_date || undefined,
					commitmentAmount: subscriptionData.details.commitment_amount?.toString() ?? '',
					overageFactor: subscriptionData.details.overage_factor?.toString() ?? '',
					phases: [],
					selectedPhase: -1,
					phaseStates: [],
					isPhaseEditing: false,
					originalPhases: [],
					priceOverrides: {},
					linkedCoupon: null,
					lineItemCoupons: {},
					addons: [],
					customerId: customerId!,
					tax_rate_overrides: [],
					entitlementOverrides: {},
					creditGrants: (subscriptionData.details.credit_grants || []).map(creditGrantToInternal),
				});
			}
		}
	}, [subscriptionData, plans, customerId]);

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
			overageFactor,
			commitmentAmount,
			entitlementOverrides,
			creditGrants,
		} = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			toast.error('Please select a plan and billing period.');
			return;
		}

		if (!startDate) {
			toast.error('Please select a start date for the subscription.');
			return;
		}

		for (let i = 0; i < phases.length; i++) {
			if (!phases[i].start_date) {
				toast.error(`Please select a start date for phase ${i + 1}`);
				return;
			}
		}

		if (subscriptionState.isPhaseEditing) {
			toast.error('Please save your changes before submitting.');
			return;
		}

		let finalStartDate: string;
		let finalEndDate: string | undefined;
		let finalCoupons: string[] | undefined;
		let finalLineItemCoupons: Record<string, string[]> | undefined;
		let finalOverrideLineItems: OverrideLineItemRequest[] | undefined;
		let sanitizedPhases: SubscriptionPhaseCreateRequest[] | undefined;

		if (phases.length > 0) {
			const boundaries = extractSubscriptionBoundaries(phases);
			finalStartDate = boundaries.startDate;
			finalEndDate = boundaries.endDate;

			const firstPhaseData = extractFirstPhaseData(phases);
			finalCoupons = firstPhaseData.coupons;
			finalLineItemCoupons = firstPhaseData.line_item_coupons;
			finalOverrideLineItems = firstPhaseData.override_line_items;

			sanitizedPhases = phases.map((phase) => ({
				start_date: phase.start_date,
				end_date: phase.end_date || undefined,
				coupons: phase.coupons || undefined,
				line_item_coupons: phase.line_item_coupons || undefined,
				override_line_items: phase.override_line_items || undefined,
				metadata: phase.metadata || undefined,
			}));
		} else {
			finalStartDate = new Date(startDate).toISOString();
			finalEndDate = endDate ? new Date(endDate).toISOString() : undefined;

			const currentPrices =
				prices?.prices?.filter(
					(price) =>
						price.billing_period.toLowerCase() === billingPeriod.toLowerCase() &&
						price.currency.toLowerCase() === currency.toLowerCase() &&
						isPriceActive(price),
				) || [];
			finalOverrideLineItems = getLineItemOverrides(currentPrices, priceOverrides);

			finalCoupons = linkedCoupon ? [linkedCoupon.id] : undefined;
			finalLineItemCoupons =
				Object.keys(lineItemCoupons).length > 0
					? Object.fromEntries(Object.entries(lineItemCoupons).map(([priceId, coupon]) => [priceId, [coupon.id]]))
					: undefined;

			sanitizedPhases = undefined;
		}

		const payload: CreateSubscriptionRequest = {
			billing_cadence: BILLING_CADENCE.RECURRING,
			billing_period: billingPeriod.toUpperCase() as BILLING_PERIOD,
			billing_period_count: 1,
			billing_cycle: billingCycle,
			currency: currency.toLowerCase(),
			customer_id: customerId!,
			plan_id: selectedPlan,
			start_date: finalStartDate,
			end_date: finalEndDate,
			commitment_amount: commitmentAmount && commitmentAmount.trim() !== '' ? parseFloat(commitmentAmount) : undefined,
			overage_factor: overageFactor && overageFactor.trim() !== '' ? parseFloat(overageFactor) : undefined,
			lookup_key: '',
			phases: sanitizedPhases,
			override_line_items: finalOverrideLineItems && finalOverrideLineItems.length > 0 ? finalOverrideLineItems : undefined,
			addons: subscriptionState.addons && subscriptionState.addons.length > 0 ? subscriptionState.addons : undefined,
			coupons: finalCoupons,
			line_item_coupons: finalLineItemCoupons,
			tax_rate_overrides: tax_rate_overrides.length > 0 ? tax_rate_overrides : undefined,
			override_entitlements: Object.keys(entitlementOverrides).length > 0 ? Object.values(entitlementOverrides) : undefined,
			credit_grants: creditGrants.length > 0 ? creditGrants.map(internalToCreateRequest) : undefined,
		};

		createSubscription(payload);
	};

	const navigateBack = () => navigate(`${RouteNames.customers}/${customerId}`);

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

			<div className='flex-[4]'></div>
		</div>
	);
};

export default CreateCustomerSubscriptionPage;
