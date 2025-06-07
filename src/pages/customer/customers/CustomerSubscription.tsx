import { Button, SelectOption } from '@/components/atoms';
import Preview from '@/components/organisms/Subscription/Preview';
import UsageTable from '@/components/organisms/Subscription/UsageTable';
import { cn } from '@/lib/utils';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import { PlanApi } from '@/api/PlanApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { NormalizedPlan, normalizePlan } from '@/utils/models/transformed_plan';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiDocsContent } from '@/components/molecules';
import { invalidateQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { RouteNames } from '@/core/routes/Routes';
import useEnvironment from '@/hooks/useEnvironment';
import { BILLING_CYCLE, SubscriptionPhase } from '@/models/Subscription';
import { CreateCustomerSubscriptionPayload } from '@/types/dto';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { uniqueId } from 'lodash';
import { SubscriptionForm } from '@/components/organisms';

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
	prices: NormalizedPlan | null;
	billingPeriod: BILLING_PERIOD;
	currency: string;
	billingPeriodOptions: SelectOption[];

	// Subscription Phase
	phases: SubscriptionPhase[];
	selectedPhase: number;
	phaseStates: SubscriptionPhaseState[];
	isPhaseEditing: boolean;
	originalPhases: SubscriptionPhase[];
};

// Data Fetching Hooks
const usePlans = () => {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const plansResponse = await PlanApi.getActiveExpandedPlan({ limit: 1000, offset: 0 });
			const normalizedPlans = plansResponse.map(normalizePlan);
			return normalizedPlans.filter((plan) => Object.keys(plan.charges).length > 0);
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

const CustomerSubscription: React.FC = () => {
	const { id: customerId, subscription_id } = useParams<Params>();
	const { isDevelopment } = useEnvironment();
	const navigate = useNavigate();
	const updateBreadcrumb = useBreadcrumbsStore((state) => state.updateBreadcrumb);

	// Fetch data using React Query
	const { data: plans, isLoading: plansLoading, isError: plansError } = usePlans();
	const { data: customerData } = useCustomerData(customerId);
	const { data: subscriptionData } = useSubscriptionData(subscription_id);

	// Local state
	const [subscriptionState, setSubscriptionState] = useState<SubscriptionFormState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: BILLING_PERIOD.MONTHLY,
		currency: '',
		billingPeriodOptions: [],
		phases: [],
		selectedPhase: 0,
		phaseStates: [],
		isPhaseEditing: false,
		originalPhases: [],
	});

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
				// Create initial phase
				const initialPhase: SubscriptionPhase = {
					billing_cycle: subscriptionData.details.billing_cycle as BILLING_CYCLE,
					start_date: new Date(subscriptionData.details.start_date),
					end_date: subscriptionData.details.end_date ? new Date(subscriptionData.details.end_date) : null,
					line_items: [],
					credit_grants: [],
					prorate_charges: false,
				};

				setSubscriptionState({
					selectedPlan: subscriptionData.details.plan_id,
					prices: planDetails,
					billingPeriod: subscriptionData.details.billing_period.toLowerCase() as BILLING_PERIOD,
					currency: subscriptionData.details.currency,
					billingPeriodOptions: Object.keys(planDetails.charges).map((period) => ({
						label: toSentenceCase(period.replace('_', ' ')),
						value: period,
					})),
					phases: [initialPhase],
					selectedPhase: 0,
					phaseStates: [SubscriptionPhaseState.SAVED],
					isPhaseEditing: false,
					originalPhases: [initialPhase],
				});
			}
		}
	}, [subscriptionData, plans]);

	// Create subscription mutation
	const { mutate: createSubscription, isPending: isCreating } = useMutation({
		mutationKey: ['createSubscription'],
		mutationFn: async (data: CreateCustomerSubscriptionPayload) => {
			return await CustomerApi.createCustomerSubscription(data);
		},
		onSuccess: async () => {
			toast.success('Subscription created successfully');
			navigate(`${RouteNames.customers}/${customerId}`);

			if (isDevelopment) {
				invalidateQueries(['debug-customers', 'debug-subscriptions']);
			}
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Error creating subscription');
		},
	});

	const handleSubscriptionSubmit = () => {
		const { billingPeriod, selectedPlan, currency, phases } = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			toast.error('Please select a plan and billing period.');
			return;
		}

		if (phases.length === 0) {
			toast.error('Please add at least one phase.');
			return;
		}

		phases.forEach((phase, index) => {
			if (!phase.billing_cycle) {
				toast.error(`Please select a billing cycle for ${index + 1}	phase`);
				return;
			}

			if (!phase.start_date) {
				toast.error(`Please select a start date for ${index + 1}	phase`);
				return;
			}
		});

		// Check for any unsaved changes
		if (subscriptionState.isPhaseEditing && subscriptionState.phases.length > 1) {
			toast.error('Please save your changes before submitting.');
			return;
		}

		// TODO: Remove this once the feature is released
		const tempSubscriptionId = uniqueId('tempsubscription_');
		const sanitizedPhases = phases.map((phase) => ({
			...phase,
			start_date: phase.start_date,
			end_date: phase.end_date,
			commitment_amount: phase.commitment_amount,
			overage_factor: phase.overage_factor ?? 1,
			credit_grants: phase.credit_grants?.map((grant) => ({
				...grant,
				id: undefined as any,
				currency: currency.toLowerCase(),
				subscription_id: tempSubscriptionId,
				period: grant.period,
			})),
		}));
		const firstPhase = sanitizedPhases[0];

		const payload: CreateCustomerSubscriptionPayload = {
			billing_cadence: BILLING_CADENCE.RECURRING,
			billing_period: billingPeriod.toUpperCase() as BILLING_PERIOD,
			billing_period_count: 1,

			// TODO: remove lower case currency after the feature is released
			currency: currency.toLowerCase(),
			customer_id: customerId!,
			invoice_cadence: INVOICE_CADENCE.ARREAR,
			plan_id: selectedPlan,
			start_date: (firstPhase.start_date as Date).toISOString(),
			end_date: firstPhase.end_date ? (firstPhase.end_date as Date).toISOString() : null,
			lookup_key: '',
			trial_end: null,
			trial_start: null,
			billing_cycle: firstPhase.billing_cycle,
			phases: sanitizedPhases.length > 1 ? sanitizedPhases : undefined,
			credit_grants: firstPhase.credit_grants,
			commitment_amount: firstPhase.commitment_amount,

			// TODO: remove this once the feature is released
			overage_factor: firstPhase.overage_factor ?? 1,
		};

		console.log('payload', payload);

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
				/>

				{subscriptionState.selectedPlan && !subscription_id && (
					<div className='flex items-center justify-start space-x-4'>
						<Button onClick={navigateBack} className='bg-gray-100 text-black px-4 py-2 rounded-md hover:bg-primary-dark'>
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
						<Preview
							data={subscriptionState.prices?.charges[subscriptionState.billingPeriod][subscriptionState.currency] ?? []}
							selectedPlan={subscriptionState.prices}
							phases={subscriptionState.phases}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default CustomerSubscription;
