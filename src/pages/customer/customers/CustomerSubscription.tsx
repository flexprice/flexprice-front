import { Select, DatePicker, Button, SelectOption, FormHeader } from '@/components/atoms';
import CustomerCard from '@/components/molecules/Customer/CustomerCard';
import Preview from '@/components/organisms/Subscription/Preview';
import ChargeTable from '@/components/organisms/Subscription/PriceTable';
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
import { RouteNames } from '@/core/routes/Routes';
import useEnvironment from '@/hooks/useEnvironment';
import { invalidateQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreateCustomerSubscriptionPayload } from '@/types/dto/Customer';

type Params = {
	id: string;
	subscription_id?: string;
};

type SubscriptionState = {
	selectedPlan: string;
	prices: NormalizedPlan | null;
	billingPeriod: string;
	currency: string;
	billingPeriodOptions: SelectOption[];
	startDate: Date | undefined;
	endDate: Date | undefined;
};

// Custom hook for managing plans
const usePlans = () => {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const plansResponse = await PlanApi.getActiveExpandedPlan({
				limit: 1000,
				offset: 0,
			});
			return plansResponse.map(normalizePlan);
		},
	});
};

// Custom hook for managing customer data
const useCustomerData = (customerId: string | undefined) => {
	return useQuery({
		queryKey: ['customerSubscription', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
};

// Custom hook for managing subscription data
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
	const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
		selectedPlan: '',
		prices: null,
		billingPeriod: '',
		currency: '',
		billingPeriodOptions: [],
		startDate: new Date(),
		endDate: undefined,
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
				setSubscriptionState({
					selectedPlan: subscriptionData.details.plan_id,
					prices: planDetails,
					billingPeriod: subscriptionData.details.billing_period.toLowerCase(),
					currency: subscriptionData.details.currency,
					billingPeriodOptions: Object.keys(planDetails.charges).map((period) => ({
						label: toSentenceCase(period),
						value: period,
					})),
					startDate: new Date(subscriptionData.details.start_date),
					endDate: subscriptionData.details.end_date ? new Date(subscriptionData.details.end_date) : undefined,
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

	// Event handlers
	const handlePlanChange = (value: string) => {
		const filteredPlan = plans?.find((plan) => plan.id === value);

		if (!filteredPlan?.charges || Object.keys(filteredPlan.charges).length === 0) {
			toast.error('Invalid plan or no charges available.');
			return;
		}

		const billingPeriods = Object.keys(filteredPlan.charges);
		const defaultBillingPeriod = billingPeriods.includes(subscriptionState.billingPeriod)
			? subscriptionState.billingPeriod
			: billingPeriods[0];

		const currencies = Object.keys(filteredPlan.charges[defaultBillingPeriod] || {});
		const defaultCurrency = currencies.includes(subscriptionState.currency) ? subscriptionState.currency : currencies[0];

		setSubscriptionState({
			...subscriptionState,
			selectedPlan: value,
			prices: filteredPlan,
			billingPeriod: defaultBillingPeriod,
			currency: defaultCurrency,
			billingPeriodOptions: billingPeriods.map((period) => ({
				label: toSentenceCase(period),
				value: period,
			})),
		});
	};

	const handleBillingPeriodChange = (value: string) => {
		const filteredPlan = subscriptionState.prices;
		if (!filteredPlan?.charges[value]) {
			toast.error('Invalid billing period.');
			return;
		}

		const currencies = Object.keys(filteredPlan.charges[value]);
		const defaultCurrency = currencies.includes(subscriptionState.currency) ? subscriptionState.currency : currencies[0];

		setSubscriptionState({
			...subscriptionState,
			billingPeriod: value,
			currency: defaultCurrency,
		});
	};

	const handleCurrencyChange = (value: string) => {
		setSubscriptionState((prev) => ({ ...prev, currency: value }));
	};

	const handleSubscriptionSubmit = () => {
		const { billingPeriod, selectedPlan, currency, startDate, endDate } = subscriptionState;

		if (!billingPeriod || !selectedPlan) {
			toast.error('Please select a plan and billing period.');
			return;
		}

		createSubscription({
			billing_cadence: 'RECURRING',
			billing_period: billingPeriod.toUpperCase(),
			billing_period_count: 1,
			currency,
			customer_id: customerId!,
			invoice_cadence: 'ARREAR',
			plan_id: selectedPlan,
			start_date: startDate?.toISOString() ?? '',
			end_date: endDate?.toISOString() ?? null,
			lookup_key: '',
			trial_end: null,
			trial_start: null,
		});
	};

	const navigateBack = () => navigate(`/customer-management/customers/details/${customerId}`);

	// Render functions
	const renderSubscriptionForm = () => (
		<div className='p-6 rounded-xl border border-gray-300 space-y-6'>
			<FormHeader title='Subscription Details' variant='sub-header' />

			{!plansLoading && (
				<Select
					value={subscriptionState.selectedPlan}
					options={plans?.map((plan: NormalizedPlan) => ({ label: plan.name, value: plan.id })) ?? []}
					onChange={handlePlanChange}
					label='Plan*'
					disabled={!!subscription_id}
					placeholder='Select plan'
					error={plansError ? 'Failed to load plans' : undefined}
				/>
			)}

			{subscriptionState.selectedPlan && subscriptionState.billingPeriodOptions.length > 0 && (
				<Select
					key={subscriptionState.billingPeriodOptions.map((opt) => opt.value).join(',')}
					value={subscriptionState.billingPeriod}
					options={subscriptionState.billingPeriodOptions}
					onChange={handleBillingPeriodChange}
					label='Billing Period*'
					disabled={!!subscription_id}
					placeholder='Select billing period'
				/>
			)}

			{subscriptionState.selectedPlan && subscriptionState.prices?.charges[subscriptionState.billingPeriod] && (
				<Select
					key={Object.keys(subscriptionState.prices.charges[subscriptionState.billingPeriod]).join(',')}
					value={subscriptionState.currency}
					options={Object.keys(subscriptionState.prices.charges[subscriptionState.billingPeriod]).map((currency) => ({
						label: currency.toUpperCase(),
						value: currency,
					}))}
					onChange={handleCurrencyChange}
					label='Select Currency*'
					placeholder='Select currency'
					disabled={!!subscription_id}
				/>
			)}

			{subscriptionState.prices && subscriptionState.selectedPlan && (
				<ChargeTable data={subscriptionState.prices.charges[subscriptionState.billingPeriod][subscriptionState.currency]} />
			)}

			{subscriptionState.selectedPlan && (
				<div className='flex items-center space-x-4 relative'>
					<div className='relative'>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Subscription Start Date</label>
						<DatePicker
							disabled={!!subscription_id}
							date={subscriptionState.startDate}
							setDate={(date) => setSubscriptionState((prev) => ({ ...prev, startDate: date }))}
						/>
					</div>
					<div className='relative'>
						<label className='block text-sm font-medium text-gray-700 mb-1'>Subscription End Date</label>
						<DatePicker
							disabled={!!subscription_id}
							date={subscriptionState.endDate}
							setDate={(date) => setSubscriptionState((prev) => ({ ...prev, endDate: date }))}
							placeholder='Forever'
						/>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<div className={cn('flex gap-8 mt-5 relative mb-12')}>
			<ApiDocsContent tags={['Subscriptions']} />
			<div className='flex-[6] space-y-6 mb-12 overflow-y-auto pr-4'>
				<CustomerCard customerId={customerId!} subscriptionData={subscriptionData?.usage} />

				{subscriptionData?.usage?.charges && subscriptionData.usage.charges.length > 0 && (
					<div>
						<UsageTable data={subscriptionData.usage} />
					</div>
				)}

				{renderSubscriptionForm()}

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
				<div className='sticky top-24'>
					{subscriptionState.selectedPlan && !subscriptionData?.usage && (
						<Preview
							startDate={subscriptionState.startDate ?? new Date()}
							data={subscriptionState.prices?.charges[subscriptionState.billingPeriod][subscriptionState.currency] ?? []}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default CustomerSubscription;
