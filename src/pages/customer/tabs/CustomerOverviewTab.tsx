import { useNavigate, useParams, useOutletContext } from 'react-router';
import { AddButton, Card, CardHeader, Loader, Spacer, ShortPagination } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { SubscriptionTable } from '@/components/organisms';
import { Subscription, SUBSCRIPTION_STATUS, PRICE_ENTITY_TYPE, ENTITY_STATUS } from '@/models';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable';
import { UpcomingCreditGrantApplicationsTable, IntegrationMappingCard } from '@/components/molecules';
import SubscriptionApi from '@/api/SubscriptionApi';
import { PriceApi } from '@/api';
import { useMemo } from 'react';
import { QueryBuilder } from '@/components/molecules';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import useFilterSortingWithPersistence from '@/hooks/useFilterSortingWithPersistence';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import {
	FilterField,
	FilterFieldType,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { BILLING_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { searchPlansForFilter } from '@/utils/filterSearchHelpers';
import { PlanApi } from '@/api';
import { useTranslation } from 'react-i18next';

type ContextType = {
	isArchived: boolean;
};

// Filter options for customer subscriptions (no customer_id - scoped by route)
const subscriptionFilterOptions: FilterField[] = [
	{
		field: 'plan_id',
		label: 'Plan',
		fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		asyncConfig: {
			searchFn: searchPlansForFilter,
		},
	},
	{
		field: 'subscription_status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: SUBSCRIPTION_STATUS.ACTIVE, label: 'Active' },
			{ value: SUBSCRIPTION_STATUS.CANCELLED, label: 'Cancelled' },
			{ value: SUBSCRIPTION_STATUS.INCOMPLETE, label: 'Incomplete' },
			{ value: SUBSCRIPTION_STATUS.TRIALING, label: 'Trialing' },
			{ value: SUBSCRIPTION_STATUS.DRAFT, label: 'Draft' },
		],
	},
	{
		field: 'billing_cadence',
		label: 'Billing Cadence',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_CADENCE).map((cadence) => ({
			value: cadence,
			label: cadence.charAt(0).toUpperCase() + cadence.slice(1).toLowerCase(),
		})),
	},
	{
		field: 'billing_period',
		label: 'Billing Period',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_PERIOD).map((period) => ({
			value: period,
			label: toSentenceCase(period.replace('_', ' ')),
		})),
	},
];

const subscriptionSortOptions: SortOption[] = [
	{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
	{ field: 'updated_at', label: 'Updated At', direction: SortDirection.DESC },
	{ field: 'start_date', label: 'Start Date', direction: SortDirection.DESC },
	{ field: 'end_date', label: 'End Date', direction: SortDirection.DESC },
];

const initialSubscriptionFilters: FilterCondition[] = [
	{
		field: 'subscription_status',
		operator: FilterOperator.IN,
		valueArray: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.DRAFT, SUBSCRIPTION_STATUS.INCOMPLETE],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const initialSubscriptionSorts: SortOption[] = [{ field: 'updated_at', label: 'Updated At', direction: SortDirection.DESC }];

const CustomerOverviewTab = () => {
	const { t } = useTranslation('customers');
	const navigate = useNavigate();
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();

	const handleAddSubscription = () => {
		navigate(`${RouteNames.customers}/${customerId}/add-subscription`);
	};

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSortingWithPersistence({
		initialFilters: initialSubscriptionFilters,
		initialSorts: initialSubscriptionSorts,
		debounceTime: 300,
		persistenceKey: 'customerSubscriptions',
	});

	const { limit, offset, reset } = usePagination({
		initialLimit: 10,
		prefix: PAGINATION_PREFIX.CUSTOMER_SUBSCRIPTIONS,
	});

	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	const {
		data: subscriptionsData,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['customerSubscriptions', customerId, limit, offset, sanitizedFilters, sanitizedSorts],
		queryFn: () =>
			SubscriptionApi.searchSubscriptions({
				customer_id: customerId!,
				limit,
				offset,
				filters: sanitizedFilters,
				sort: sanitizedSorts,
				status: ENTITY_STATUS.PUBLISHED,
			}),
		enabled: !!customerId,
	});

	const currentPageItems = useMemo(() => subscriptionsData?.items ?? [], [subscriptionsData?.items]);

	const uniquePlanIds = useMemo(() => [...new Set(currentPageItems.map((s) => s.plan_id).filter(Boolean))] as string[], [currentPageItems]);

	const planSearchFilters = useMemo<TypedBackendFilter[]>(
		() =>
			uniquePlanIds.length > 0
				? [{ field: 'id', operator: FilterOperator.IN, data_type: DataType.ARRAY, value: { array: uniquePlanIds } }]
				: [],
		[uniquePlanIds],
	);

	const { data: plansResponse, isLoading: isPlansLoading } = useQuery({
		queryKey: ['plansByFilter', uniquePlanIds],
		queryFn: () =>
			PlanApi.getPlansByFilter({
				filters: planSearchFilters,
				limit: uniquePlanIds.length || 10,
				offset: 0,
				sort: [],
			}),
		enabled: uniquePlanIds.length > 0,
	});

	const planMap = useMemo(() => {
		const map = new Map<string, { id: string; name: string }>();
		plansResponse?.items?.forEach((plan) => {
			if (plan.id) {
				map.set(plan.id, { id: plan.id, name: plan.name ?? '' });
			}
		});
		return map;
	}, [plansResponse?.items]);

	const subscriptionsWithPlan = useMemo(
		() =>
			currentPageItems.map((s) => ({
				...s,
				plan: s.plan_id ? (planMap.get(s.plan_id) ?? undefined) : undefined,
			})),
		[currentPageItems, planMap],
	);

	const overrideQueries = useQueries({
		queries: currentPageItems.map((sub) => ({
			queryKey: ['subscriptionOverride', sub.id],
			queryFn: async () => {
				const result = await PriceApi.searchPrices({
					filters: [
						{
							field: 'entity_type',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: PRICE_ENTITY_TYPE.SUBSCRIPTION },
						},
						{
							field: 'entity_id',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: sub.id },
						},
					],
					limit: 1,
					offset: 0,
				});
				return {
					subscriptionId: sub.id,
					hasOverride: (result.items?.length || 0) > 0,
				};
			},
			enabled: !!sub.id,
		})),
	});

	type OverrideQueryResult = { subscriptionId: string; hasOverride: boolean };
	const subscriptionOverrides = useMemo(() => {
		const overrideMap = new Map<string, boolean>();
		overrideQueries.forEach((query: { data?: OverrideQueryResult }) => {
			if (query.data) {
				overrideMap.set(query.data.subscriptionId, query.data.hasOverride);
			}
		});
		return overrideMap;
	}, [overrideQueries]);

	const isOverridesLoading = overrideQueries.some((query: { isLoading: boolean }) => query.isLoading);

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId! }),
	});

	const {
		data: upcomingCreditGrantApplications,
		isLoading: upcomingGrantsLoading,
		error: upcomingGrantsError,
	} = useQuery({
		queryKey: ['upcomingCreditGrantApplications', customerId],
		queryFn: () => CustomerApi.getUpcomingCreditGrantApplications(customerId!),
		enabled: !!customerId,
	});

	const {
		data: _customer,
		isLoading: customerLoading,
		error: customerError,
	} = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
	void _customer; // used for cache; loading/error drive UI

	if (subscriptionsLoading || usageLoading || upcomingGrantsLoading || customerLoading || isOverridesLoading || isPlansLoading) {
		return <Loader />;
	}

	if (subscriptionsError || usageError || upcomingGrantsError || customerError) {
		toast.error('Something went wrong');
	}

	const renderSubscriptionContent = () => (
		<Card variant='notched'>
			<CardHeader
				title={t('tabPanels.overview.subscriptionsCardTitle')}
				cta={!isArchived && <AddButton onClick={handleAddSubscription} />}
			/>
			<QueryBuilder
				filterOptions={subscriptionFilterOptions}
				filters={filters}
				onFilterChange={setFilters}
				sortOptions={subscriptionSortOptions}
				selectedSorts={sorts}
				onSortChange={setSorts}
				debounceTime={300}
			/>
			<SubscriptionTable
				onRowClick={(row) => {
					navigate(`${RouteNames.customers}/${customerId}/subscription/${row.id}`);
				}}
				data={subscriptionsWithPlan as Subscription[]}
				subscriptionOverrides={subscriptionOverrides}
			/>
			<Spacer className='!h-4' />
			<ShortPagination
				unit={t('tabPanels.overview.subscriptionsPaginationUnit')}
				totalItems={subscriptionsData?.pagination?.total ?? 0}
				prefix={PAGINATION_PREFIX.CUSTOMER_SUBSCRIPTIONS}
				pageSize={limit}
			/>
		</Card>
	);

	return (
		<div className='space-y-6'>
			{renderSubscriptionContent()}

			{(usageData?.features?.length || 0) > 0 && (
				<Card variant='notched'>
					<CardHeader title={t('tabPanels.overview.entitlementsCardTitle')} />
					<CustomerUsageTable data={usageData?.features ?? []} />
				</Card>
			)}

			<UpcomingCreditGrantApplicationsTable data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId} />

			<IntegrationMappingCard entityType='customer' entityId={customerId!} />
		</div>
	);
};

export default CustomerOverviewTab;
