import { ActionButton, StatusChip, TableAvatar, Tooltip, AddButton, Page } from '@/components/atoms';
import { ApiDocsContent, RedirectCell } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import SubscriptionApi from '@/api/SubscriptionApi';
import {
	FilterField,
	FilterFieldType,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { BILLING_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { EXPAND } from '@/models/expand';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { searchCustomersForFilter, searchPlansForFilter } from '@/utils/filterSearchHelpers';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { Trash2 } from 'lucide-react';
import { SubscriptionResponse } from '@/types/dto/Subscription';
import { useMemo, useState, useCallback } from 'react';
import SubscriptionCancelDialog from '@/components/molecules/SubscriptionCancelDialog/SubscriptionCancelDialog';
import { useTranslation } from 'react-i18next';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { ENTITY_STATUS } from '@/models';
import { getSubscriptionListStatus } from './subscriptionListDisplay';

const BILLING_CADENCE_I18N_KEYS: Record<BILLING_CADENCE, 'recurring' | 'onetime'> = {
	[BILLING_CADENCE.RECURRING]: 'recurring',
	[BILLING_CADENCE.ONETIME]: 'onetime',
};

const BILLING_PERIOD_I18N_KEYS: Record<BILLING_PERIOD, 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'halfYearly' | 'annual' | 'onetime'> =
	{
		[BILLING_PERIOD.DAILY]: 'daily',
		[BILLING_PERIOD.WEEKLY]: 'weekly',
		[BILLING_PERIOD.MONTHLY]: 'monthly',
		[BILLING_PERIOD.QUARTERLY]: 'quarterly',
		[BILLING_PERIOD.HALF_YEARLY]: 'halfYearly',
		[BILLING_PERIOD.ANNUAL]: 'annual',
		[BILLING_PERIOD.ONETIME]: 'onetime',
	};

const SUBSCRIPTION_STATUS_I18N: Record<ReturnType<typeof getSubscriptionListStatus>['kind'], string> = {
	active: 'common:status.active',
	trial: 'subscriptions.listPage.statusChips.trial',
	cancelled: 'common:status.cancelled',
	incomplete: 'common:status.incomplete',
	draft: 'common:status.draft',
	inactive: 'common:status.inactive',
};

const initialFilters: FilterCondition[] = [
	{
		field: 'subscription_status',
		operator: FilterOperator.IN,
		valueArray: [SUBSCRIPTION_STATUS.ACTIVE],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const SubscriptionsPage = () => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [cancelSubscription, setCancelSubscription] = useState<{ id: string; currentPeriodStart: string } | null>(null);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'created_at',
				label: t('subscriptions.listPage.sortLabels.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'updated_at',
				label: t('subscriptions.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'start_date',
				label: t('subscriptions.listPage.sortLabels.startDate'),
				direction: SortDirection.DESC,
			},
			{
				field: 'end_date',
				label: t('subscriptions.listPage.sortLabels.endDate'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'customer_id',
				label: t('subscriptions.listPage.filterLabels.customer'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchCustomersForFilter,
				},
			},
			{
				field: 'plan_id',
				label: t('subscriptions.listPage.filterLabels.plan'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchPlansForFilter,
				},
			},
			{
				field: 'subscription_status',
				label: t('subscriptions.listPage.filterLabels.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: SUBSCRIPTION_STATUS.ACTIVE, label: t('common:status.active') },
					{ value: SUBSCRIPTION_STATUS.CANCELLED, label: t('common:status.cancelled') },
					{ value: SUBSCRIPTION_STATUS.INCOMPLETE, label: t('common:status.incomplete') },
					{ value: SUBSCRIPTION_STATUS.TRIALING, label: t('common:status.trialing') },
					{ value: SUBSCRIPTION_STATUS.DRAFT, label: t('common:status.draft') },
				],
			},
			{
				field: 'billing_cadence',
				label: t('subscriptions.listPage.filterLabels.billingCadence'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN],
				dataType: DataType.ARRAY,
				options: Object.values(BILLING_CADENCE).map((cadence) => ({
					value: cadence,
					label: t(`subscriptions.listPage.billingCadence.${BILLING_CADENCE_I18N_KEYS[cadence]}`),
				})),
			},
			{
				field: 'billing_period',
				label: t('subscriptions.listPage.filterLabels.billingPeriod'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN],
				dataType: DataType.ARRAY,
				options: Object.values(BILLING_PERIOD).map((period) => ({
					value: period,
					label: t(`subscriptions.listPage.billingPeriod.${BILLING_PERIOD_I18N_KEYS[period]}`),
				})),
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'updated_at',
				label: t('subscriptions.listPage.sortLabels.updatedAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const handleAddSubscription = useCallback(() => {
		navigate(RouteNames.createSubscription, { state: { returnTo: RouteNames.subscriptions } });
	}, [navigate]);

	const handleEmptyCreate = handleAddSubscription;

	const columns: ColumnData<SubscriptionResponse>[] = useMemo(
		() => [
			{
				title: t('subscriptions.listPage.columns.customer'),
				fieldVariant: 'title',
				width: '22%',
				render: (row) => {
					const name = row.customer?.name || row.customer_id;
					return (
						<div className='flex min-w-0 items-center gap-2'>
							<TableAvatar name={name} />
							<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer_id}`}>{name}</RedirectCell>
						</div>
					);
				},
			},
			{
				title: t('subscriptions.listPage.columns.plan'),
				width: '18%',
				render: (row) => <RedirectCell redirectUrl={`${RouteNames.plan}/${row.plan_id}`}>{row.plan?.name || row.plan_id}</RedirectCell>,
			},
			{
				title: t('subscriptions.listPage.columns.status'),
				width: 130,
				render: (row) => {
					const { status, kind } = getSubscriptionListStatus(row.subscription_status);
					return <StatusChip status={status} label={t(SUBSCRIPTION_STATUS_I18N[kind])} />;
				},
			},
			{
				title: t('subscriptions.listPage.columns.billing'),
				width: '12%',
				render: (row) => {
					const periodKey = BILLING_PERIOD_I18N_KEYS[row.billing_period];
					return periodKey ? t(`subscriptions.listPage.billingPeriod.${periodKey}`) : t('common:labels.na');
				},
			},
			{
				title: t('subscriptions.listPage.columns.startDate'),
				width: '14%',
				render: (row) => formatDate(row.start_date, undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
			},
			{
				title: t('subscriptions.listPage.columns.renewalDate'),
				width: '14%',
				render: (row) =>
					row.subscription_status === SUBSCRIPTION_STATUS.CANCELLED
						? t('common:labels.na')
						: formatDate(row.current_period_end, undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
			},
			{
				fieldVariant: 'interactive',
				width: 56,
				render: (row) => {
					if (isInheritedSubscription(row)) {
						return (
							<Tooltip delayDuration={0} content={t('subscriptions.listPage.inheritedReadOnlyTooltip')}>
								<span className='inline-flex cursor-default text-muted-foreground tabular-nums'>—</span>
							</Tooltip>
						);
					}
					return (
						<ActionButton
							id={row.id}
							copyId={{ entityType: 'Subscription' }}
							deleteMutationFn={async () => Promise.resolve()}
							refetchQueryKey='fetchSubscriptions'
							isArchiveDisabled={true}
							entityName={t('subscriptions.listPage.entityNameForActions')}
							edit={{
								path: `${RouteNames.subscriptions}/${row.id}/edit`,
							}}
							archive={{
								enabled: false,
							}}
							customActions={[
								{
									text: t('subscriptions.listPage.cancelAction'),
									icon: <Trash2 />,
									enabled: row.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED,
									onClick: () => setCancelSubscription({ id: row.id, currentPeriodStart: row.current_period_start }),
								},
							]}
						/>
					);
				},
			},
		],
		[t],
	);

	return (
		<>
			<Page className='max-w-none' heading={t('subscriptions.title')} headingCTA={<AddButton onClick={handleAddSubscription} />}>
				<ApiDocsContent tags={API_DOCS_TAGS.Subscriptions} />
				<QueryableDataArea<SubscriptionResponse>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 300,
					}}
					dataConfig={{
						queryKey: 'fetchSubscriptions',
						fetchFn: async (params) => {
							const response = await SubscriptionApi.searchSubscriptions({
								...params,
								expand: generateExpandQueryParams([EXPAND.CUSTOMER, EXPAND.PLAN]),
								status: ENTITY_STATUS.PUBLISHED,
							});
							return {
								...response,
								items: response.items ?? [],
							};
						},
						probeFetchFn: async (params) => {
							const response = await SubscriptionApi.searchSubscriptions({
								...params,
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
								status: ENTITY_STATUS.PUBLISHED,
							});
							return {
								...response,
								items: response.items ?? [],
							};
						},
					}}
					tableConfig={{
						columns,
						variant: 'card',
						tableClassName: 'table-fixed',
						onRowClick: (row) => {
							navigate(`${RouteNames.customers}/${row?.customer_id}/subscription/${row?.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: t('subscriptions.listPage.paginationUnit'),
					}}
					emptyStateConfig={{
						heading: t('subscriptions.title'),
						description: t('subscriptions.listPage.emptyState.description'),
						buttonLabel: t('subscriptions.listPage.emptyState.createButton'),
						buttonAction: handleEmptyCreate,
						tags: API_DOCS_TAGS.Subscriptions,
						tutorials: guides.customers.tutorials,
					}}
				/>
			</Page>
			<SubscriptionCancelDialog
				isOpen={!!cancelSubscription}
				onOpenChange={(open) => {
					if (!open) {
						setCancelSubscription(null);
					}
				}}
				subscriptionId={cancelSubscription?.id}
				currentPeriodStart={cancelSubscription?.currentPeriodStart}
				refetchQueryKeys={['fetchSubscriptions']}
			/>
		</>
	);
};

export default SubscriptionsPage;
