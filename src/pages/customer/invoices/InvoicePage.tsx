import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { InvoiceTable, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import InvoiceApi from '@/api/InvoiceApi';
import { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import useFilterSorting from '@/hooks/useFilterSorting';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants';
import { ENTITY_STATUS } from '@/models/base';

const sortingOptions: SortOption[] = [
	{
		field: 'invoice_number',
		label: 'Invoice Number',
		direction: SortDirection.ASC,
	},
	{
		field: 'amount_due',
		label: 'Amount Due',
		direction: SortDirection.DESC,
	},
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'due_date',
		label: 'Due Date',
		direction: SortDirection.ASC,
	},
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
		field: 'customer_id',
		label: 'Customer ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'invoice_status',
		label: 'Invoice Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
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
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
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
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
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
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
		dataType: DataType.ARRAY,
		options: [
			{ value: ENTITY_STATUS.PUBLISHED, label: 'Active' },
			{ value: ENTITY_STATUS.ARCHIVED, label: 'Inactive' },
		],
	},
];

const InvoicesPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [
			{
				field: 'invoice_number',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-invoice-number',
			},
			{
				field: 'status',
				operator: FilterOperator.IS_ANY_OF,
				valueArray: [ENTITY_STATUS.PUBLISHED],
				dataType: DataType.ARRAY,
				id: 'initial-status',
			},
		],
		initialSorts: [
			{
				field: 'created_at',
				label: 'Created At',
				direction: SortDirection.DESC,
			},
		],
		debounceTime: 300,
	});
	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const fetchInvoices = async () => {
		return await InvoiceApi.getInvoicesByFilters({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	const {
		data: invoiceData,
		isLoading,
		probeData,
		isError,
		error,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchInvoices', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchInvoices,
		},
		probe: {
			queryKey: ['fetchInvoices', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await InvoiceApi.getInvoicesByFilters({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
				});
			},
		},
		shouldProbe: (mainData) => {
			return mainData?.items.length === 0;
		},
	});

	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && invoiceData?.items.length === 0;
	}, [isLoading, probeData, invoiceData]);

	if (isError) {
		const err = error as any;
		toast.error(err?.error?.message || 'Error fetching invoices');
		return null;
	}

	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Invoice'
				tags={['Invoices']}
				emptyStateCard={{
					heading: 'Create your first invoice',
					description: 'Generate an invoice to initiate billing and manage customer payments.',
					buttonLabel: 'Create Invoice',
					buttonAction: () => {
						// TODO: Implement create invoice functionality
						console.log('Create invoice clicked');
					},
				}}
				tutorials={GUIDES.invoices.tutorials}
				onAddClick={() => {
					// TODO: Implement create invoice functionality
					console.log('Create invoice clicked');
				}}
			/>
		);
	}

	return (
		<Page
			heading='Invoices'
			headingCTA={
				<div className='flex justify-between gap-2 items-center'>
					<AddButton
						label='Create Invoice'
						onClick={() => {
							// TODO: Implement create invoice functionality
							console.log('Create invoice clicked');
						}}
					/>
				</div>
			}>
			<ApiDocsContent tags={['Invoices']} />
			<div>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				{isLoading ? (
					<div className='flex justify-center items-center min-h-[200px]'>
						<Loader />
					</div>
				) : (
					<>
						<InvoiceTable data={invoiceData?.items || []} />
						<Spacer className='!h-4' />
						<ShortPagination unit='Invoices' totalItems={invoiceData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default InvoicesPage;
