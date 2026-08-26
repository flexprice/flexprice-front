import { StatusChip, TableAvatar, Page } from '@/components/atoms';
import { ApiDocsContent, RedirectCell } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import InvoiceTableMenu from '@/components/molecules/InvoiceTable/InvoiceTableMenu';
import { QueryableDataArea } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import InvoiceApi from '@/api/InvoiceApi';
import CustomerApi from '@/api/CustomerApi';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { searchCustomersForFilter } from '@/utils/filterSearchHelpers';
import { ENTITY_STATUS } from '@/models';
import Customer from '@/models/Customer';
import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { EXPAND } from '@/models/expand';
import { PAYMENT_STATUS } from '@/constants';
import { BILLING_PERIOD } from '@/constants/constants';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import formatDate, { TABLE_SHORT_DATE_FORMAT } from '@/utils/common/format_date';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InvoiceFilter } from '@/types/dto';
import { getInvoiceIssuedAt, getInvoiceListStatus, getInvoicePlanLabel } from './invoiceListDisplay';
import type { InvoiceListStatusKind } from './invoiceListDisplay';

const initialFilters: FilterCondition[] = [
	{
		field: 'invoice_number',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-invoice-number',
	},
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const INVOICE_STATUS_I18N: Record<InvoiceListStatusKind, string> = {
	paid: 'invoices.status.paid',
	pending: 'invoices.status.pending',
	overdue: 'invoices.status.overdue',
	draft: 'common:status.draft',
	void: 'invoices.status.void',
	refunded: 'invoices.status.refunded',
	failed: 'invoices.status.failed',
};

const INVOICE_TYPE_I18N: Record<INVOICE_TYPE, string> = {
	[INVOICE_TYPE.SUBSCRIPTION]: 'invoices.list.invoiceTypes.subscription',
	[INVOICE_TYPE.ONE_OFF]: 'invoices.list.invoiceTypes.oneOff',
	[INVOICE_TYPE.CREDIT]: 'invoices.list.invoiceTypes.credit',
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

/** Invoice enriched with subscription customer data (client-side only) */
type EnrichedInvoice = Invoice & { subscription_customer?: Customer };

/**
 * Fetch subscription customers for invoices where subscription_customer_id differs from customer_id.
 * Returns a map of customer_id -> Customer.
 */
async function fetchSubscriptionCustomers(invoices: Invoice[]): Promise<Map<string, Customer>> {
	const subCustIds = new Set<string>();
	for (const inv of invoices) {
		if (inv.subscription_customer_id && inv.subscription_customer_id !== inv.customer_id) {
			subCustIds.add(inv.subscription_customer_id);
		}
	}
	if (subCustIds.size === 0) return new Map();

	try {
		const ids = [...subCustIds];
		const res = await CustomerApi.getCustomersByFilters({
			customer_ids: ids,
			limit: ids.length,
			offset: 0,
			filters: [],
			sort: [],
			status: ENTITY_STATUS.PUBLISHED,
		});
		const map = new Map<string, Customer>();
		for (const c of res.items ?? []) {
			map.set(c.id, c);
		}
		return map;
	} catch {
		return new Map();
	}
}

function invoiceHasDistinctSubscriptionCustomer(inv: Invoice): boolean {
	return Boolean(inv.subscription_customer_id && inv.subscription_customer_id !== inv.customer_id);
}

const InvoicesPage = () => {
	const navigate = useNavigate();
	const { t } = useTranslation(['billing', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [showSubscriptionCustomerColumn, setShowSubscriptionCustomerColumn] = useState(false);

	const onInvoicesDataChange = useCallback((d: { items: EnrichedInvoice[]; pagination: { total?: number } } | undefined) => {
		const items = d?.items ?? [];
		setShowSubscriptionCustomerColumn(items.some(invoiceHasDistinctSubscriptionCustomer));
	}, []);

	const enrichedFetchFn = useCallback(async (params: InvoiceFilter) => {
		const result = await InvoiceApi.listInvoices({
			...params,
			invoice_status: Object.values(INVOICE_STATUS),
			skip_line_items: true,
			expand: generateExpandQueryParams([EXPAND.CUSTOMER, EXPAND.SUBSCRIPTION, EXPAND.PLAN]),
		});
		const rawItems = result.items ?? [];
		const hasMismatchOnPage = rawItems.some(invoiceHasDistinctSubscriptionCustomer);

		const custMap = hasMismatchOnPage ? await fetchSubscriptionCustomers(rawItems) : new Map<string, Customer>();
		const items: EnrichedInvoice[] = rawItems.map((inv) => {
			if (invoiceHasDistinctSubscriptionCustomer(inv)) {
				return { ...inv, subscription_customer: custMap.get(inv.subscription_customer_id!) };
			}
			return inv;
		});
		return { ...result, items };
	}, []);

	const sortingOptions: SortOption[] = useMemo(
		() => [
			{
				field: 'invoice_number',
				label: t('invoices.list.sort.invoiceNumber'),
				direction: SortDirection.ASC,
			},
			{
				field: 'amount_due',
				label: t('invoices.list.sort.amountDue'),
				direction: SortDirection.DESC,
			},
			{
				field: 'created_at',
				label: t('invoices.list.sort.createdAt'),
				direction: SortDirection.DESC,
			},
			{
				field: 'due_date',
				label: t('invoices.list.sort.dueDate'),
				direction: SortDirection.ASC,
			},
		],
		[t],
	);

	const filterOptions: FilterField[] = useMemo(
		() => [
			{
				field: 'invoice_number',
				label: t('invoices.list.filters.invoiceNumber'),
				fieldType: FilterFieldType.INPUT,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
				dataType: DataType.STRING,
			},
			{
				field: 'customer_id',
				label: t('invoices.list.filters.customer'),
				fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				asyncConfig: {
					searchFn: searchCustomersForFilter,
				},
			},
			{
				field: 'invoice_status',
				label: t('invoices.list.filters.invoiceStatus'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: INVOICE_STATUS.DRAFT, label: t('invoices.list.invoiceStatuses.draft') },
					{ value: INVOICE_STATUS.FINALIZED, label: t('invoices.list.invoiceStatuses.finalized') },
					{ value: INVOICE_STATUS.VOIDED, label: t('invoices.list.invoiceStatuses.voided') },
				],
			},
			{
				field: 'payment_status',
				label: t('invoices.list.filters.paymentStatus'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: PAYMENT_STATUS.PENDING, label: t('invoices.status.pending') },
					{ value: PAYMENT_STATUS.PROCESSING, label: t('invoices.status.processing') },
					{ value: PAYMENT_STATUS.INITIATED, label: t('invoices.status.initiated') },
					{ value: PAYMENT_STATUS.SUCCEEDED, label: t('invoices.status.succeeded') },
					{ value: PAYMENT_STATUS.FAILED, label: t('invoices.status.failed') },
					{ value: PAYMENT_STATUS.REFUNDED, label: t('invoices.status.refunded') },
					{ value: PAYMENT_STATUS.PARTIALLY_REFUNDED, label: t('invoices.status.partiallyRefunded') },
				],
			},
			{
				field: 'invoice_type',
				label: t('invoices.list.filters.invoiceType'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: INVOICE_TYPE.SUBSCRIPTION, label: t('invoices.list.invoiceTypes.subscription') },
					{ value: INVOICE_TYPE.ONE_OFF, label: t('invoices.list.invoiceTypes.oneOff') },
					{ value: INVOICE_TYPE.CREDIT, label: t('invoices.list.invoiceTypes.credit') },
				],
			},
			{
				field: 'created_at',
				label: t('invoices.list.filters.createdAt'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'due_date',
				label: t('invoices.list.filters.dueDate'),
				fieldType: FilterFieldType.DATEPICKER,
				operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
				dataType: DataType.DATE,
			},
			{
				field: 'status',
				label: t('invoices.list.filters.status'),
				fieldType: FilterFieldType.MULTI_SELECT,
				operators: [FilterOperator.IN, FilterOperator.NOT_IN],
				dataType: DataType.ARRAY,
				options: [
					{ value: ENTITY_STATUS.PUBLISHED, label: t('common:status.active') },
					{ value: ENTITY_STATUS.ARCHIVED, label: t('common:status.inactive') },
				],
			},
		],
		[t],
	);

	const initialSorts: SortOption[] = useMemo(
		() => [
			{
				field: 'created_at',
				label: t('invoices.list.sort.createdAt'),
				direction: SortDirection.DESC,
			},
		],
		[t],
	);

	const columns: ColumnData<EnrichedInvoice>[] = useMemo(() => {
		const subscriptionCustomerColumn: ColumnData<EnrichedInvoice> = {
			title: t('invoices.list.columns.subscriptionCustomer'),
			render: (row: EnrichedInvoice) => {
				if (!invoiceHasDistinctSubscriptionCustomer(row)) {
					return t('common:labels.na');
				}
				const subCust = row.subscription_customer;
				if (!subCust?.name || !subCust?.id) {
					return t('common:labels.na');
				}
				return <RedirectCell redirectUrl={`${RouteNames.customers}/${subCust.id}`}>{subCust.name}</RedirectCell>;
			},
		};

		return [
			{
				title: t('invoices.list.columns.invoiceNumber'),
				fieldVariant: 'title',
				render: (row: EnrichedInvoice) =>
					row.invoice_status?.toUpperCase() === INVOICE_STATUS.DRAFT ? (
						<span className='text-content-subtle text-[0.8125rem]'>{t('invoices.list.toBeGenerated')}</span>
					) : (
						<span>{row.invoice_number || t('common:labels.na')}</span>
					),
			},
			{
				title: t('invoices.list.columns.customer'),
				render: (row: EnrichedInvoice) => {
					const name = row.customer?.name;
					if (!name || !row.customer?.id) {
						return t('common:labels.na');
					}
					return (
						<div className='flex min-w-0 items-center gap-2'>
							<TableAvatar name={name} />
							<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer.id}`}>{name}</RedirectCell>
						</div>
					);
				},
			},
			{
				title: t('invoices.list.columns.plan'),
				render: (row: EnrichedInvoice) =>
					getInvoicePlanLabel(
						row,
						(period) => t(`subscriptions.listPage.billingPeriod.${BILLING_PERIOD_I18N_KEYS[period]}`),
						(type) => t(INVOICE_TYPE_I18N[type] ?? 'invoices.list.invoiceTypes.oneOff'),
					),
			},
			{
				title: t('invoices.list.columns.amount'),
				render: (row) => <span>{`${getCurrencySymbol(row.currency)}${row.amount_due}`}</span>,
			},
			...(showSubscriptionCustomerColumn ? [subscriptionCustomerColumn] : []),
			{
				title: t('invoices.list.columns.issued'),
				render: (row: EnrichedInvoice) => {
					const issuedAt = getInvoiceIssuedAt(row);
					return <span>{issuedAt ? formatDate(issuedAt, undefined, TABLE_SHORT_DATE_FORMAT) : t('common:labels.na')}</span>;
				},
			},
			{
				title: t('invoices.list.columns.status'),
				render: (row: EnrichedInvoice) => {
					const { status, kind } = getInvoiceListStatus(row);
					return <StatusChip status={status} label={t(INVOICE_STATUS_I18N[kind])} />;
				},
			},
			{
				fieldVariant: 'interactive',
				hideOnEmpty: true,
				width: 56,
				render: (row: EnrichedInvoice) => {
					return <InvoiceTableMenu data={row} />;
				},
			},
		];
	}, [showSubscriptionCustomerColumn, t]);

	return (
		<Page className='max-w-none' heading={t('invoices.title')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Invoices} />
			<QueryableDataArea<EnrichedInvoice>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
				}}
				dataConfig={{
					queryKey: 'fetchInvoices',
					fetchFn: enrichedFetchFn,
					onMainDataChange: onInvoicesDataChange,
					probeFetchFn: async (params) =>
						InvoiceApi.listInvoices({
							...params,
							limit: 1,
							offset: 0,
							filters: [],
							sort: [],
							skip_line_items: true,
						}),
				}}
				tableConfig={{
					columns,
					variant: 'card',
					tableClassName: 'table-fixed',
					onRowClick: (row) => {
						navigate(`/billing/invoices/${row.id}`);
					},
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: t('invoices.list.paginationUnit'),
				}}
				emptyStateConfig={{
					heading: t('invoices.title'),
					description: t('invoices.list.emptyDescription'),
					tags: API_DOCS_TAGS.Invoices,
					tutorials: guides.invoices.tutorials,
				}}
			/>
		</Page>
	);
};

export default InvoicesPage;
