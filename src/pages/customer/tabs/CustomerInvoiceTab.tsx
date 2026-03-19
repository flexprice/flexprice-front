import { AddButton, CardHeader, Card } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import InvoiceApi from '@/api/InvoiceApi';
import { useNavigate, useParams, useOutletContext } from 'react-router';
import { Invoice as InvoiceModel, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { RouteNames } from '@/core/routes/Routes';
import { QueryableDataArea } from '@/components/organisms';
import { ColumnData } from '@/components/molecules/Table';
import { getPaymentStatusChip, getStatusChip } from '@/components/molecules/InvoiceTable/InvoiceTable';
import InvoiceTableMenu from '@/components/molecules/InvoiceTable/InvoiceTableMenu';
import { formatBillingPeriod } from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
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
import { PAYMENT_STATUS } from '@/constants';
import { ENTITY_STATUS } from '@/models';

const sortingOptions: SortOption[] = [
	{ field: 'invoice_number', label: 'Invoice Number', direction: SortDirection.ASC },
	{ field: 'amount_due', label: 'Amount Due', direction: SortDirection.DESC },
	{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
	{ field: 'due_date', label: 'Due Date', direction: SortDirection.ASC },
];

const filterOptions: FilterField[] = [
	{
		field: 'invoice_number',
		label: 'Invoice Number',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'invoice_status',
		label: 'Invoice Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: INVOICE_STATUS.DRAFT, label: 'Draft' },
			{ value: INVOICE_STATUS.FINALIZED, label: 'Finalized' },
			{ value: INVOICE_STATUS.VOIDED, label: 'Voided' },
		],
	},
	{
		field: 'payment_status',
		label: 'Payment Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: PAYMENT_STATUS.PENDING, label: 'Pending' },
			{ value: PAYMENT_STATUS.PROCESSING, label: 'Processing' },
			{ value: PAYMENT_STATUS.INITIATED, label: 'Initiated' },
			{ value: PAYMENT_STATUS.SUCCEEDED, label: 'Succeeded' },
			{ value: PAYMENT_STATUS.FAILED, label: 'Failed' },
			{ value: PAYMENT_STATUS.REFUNDED, label: 'Refunded' },
			{ value: PAYMENT_STATUS.PARTIALLY_REFUNDED, label: 'Partially Refunded' },
		],
	},
	{
		field: 'invoice_type',
		label: 'Invoice Type',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: INVOICE_TYPE.SUBSCRIPTION, label: 'Subscription' },
			{ value: INVOICE_TYPE.ONE_OFF, label: 'One Off' },
			{ value: INVOICE_TYPE.CREDIT, label: 'Credit' },
		],
	},
	{
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: 'due_date',
		label: 'Due Date',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: 'status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: ENTITY_STATUS.PUBLISHED, label: 'Active' },
			{ value: ENTITY_STATUS.ARCHIVED, label: 'Inactive' },
		],
	},
];

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
	{
		field: 'invoice_status',
		operator: FilterOperator.IN,
		valueArray: [INVOICE_STATUS.FINALIZED],
		dataType: DataType.ARRAY,
		id: 'initial-invoice-status',
	},
];

const initialSorts: SortOption[] = [
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
];

const CustomerInvoiceTab = () => {
	const { id: customerId } = useParams();
	const navigate = useNavigate();
	const { isArchived } = useOutletContext<{ isArchived: boolean }>();

	const handleShowDetails = (invoice: InvoiceModel) => {
		navigate(`${invoice.id}`);
	};

	const columns: ColumnData<InvoiceModel>[] = [
		{
			title: 'Invoice Number',
			render: (row) => <>{row.invoice_number || '--'}</>,
		},
		{
			title: 'Status',
			render: (row) => getStatusChip(row.invoice_status),
		},
		{
			title: 'Payment Status',
			render: (row) => getPaymentStatusChip(row.payment_status),
		},
		{
			title: 'Billing Period',
			render: (row) => <>{row.period_start && row.period_end ? formatBillingPeriod(row.period_start, row.period_end) : '--'}</>,
		},
		{
			title: 'Total',
			render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.total}`}</>,
		},
		{
			title: 'Amount Due',
			render: (row) => <>{`${getCurrencySymbol(row.currency)} ${row.amount_due}`}</>,
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => <InvoiceTableMenu data={row} />,
		},
	];

	return (
		<div>
			<ApiDocsContent tags={['Invoices']} />
			<Card variant='notched'>
				<CardHeader
					title='Invoices'
					cta={
						!isArchived && (
							<AddButton
								label='Add Invoice'
								onClick={() => {
									navigate(`${RouteNames.customers}/${customerId}/invoices/create`);
								}}
							/>
						)
					}
				/>
				<QueryableDataArea<InvoiceModel>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 300,
						filterPersistenceKey: `fetchCustomerInvoices-${customerId}`,
					}}
					dataConfig={{
						queryKey: `fetchCustomerInvoices-${customerId}`,
						fetchFn: async (params) => InvoiceApi.listInvoices(params),
						probeFetchFn: async (params) =>
							InvoiceApi.listInvoices({
								...params,
								limit: 1,
								offset: 0,
							}),
						additionalQueryParams: {
							customer_id: customerId,
						},
					}}
					tableConfig={{
						columns,
						onRowClick: handleShowDetails,
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: 'Invoices',
					}}
					// Note: Omitting emptyStateConfig prevents the standard EmptyState component full-replacement logic
					// This allows the wrapped Card > CardHeader to remain and the table simply show the "Empty row"
				/>
			</Card>
		</div>
	);
};

export default CustomerInvoiceTab;
