import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import CustomerTable from '@/components/molecules/Customer/CustomerTable';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import Customer from '@/models/Customer';
import CustomerApi from '@/api/CustomerApi';
import { useState, useEffect, useMemo } from 'react';
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
import { ENTITY_STATUS } from '@/models/base';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'email',
		label: 'Email',
		direction: SortDirection.ASC,
	},
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'external_id',
		label: 'Lookup Key',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'email',
		label: 'Email',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'created_at',
		label: 'Created At',
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

const CustomerPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [
			{
				field: 'name',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-name',
			},
			{
				field: 'external_id',
				operator: FilterOperator.CONTAINS,
				valueString: '',
				dataType: DataType.STRING,
				id: 'initial-external-id',
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
				field: 'updated_at',
				label: 'Updated At',
				direction: SortDirection.DESC,
			},
		],
		debounceTime: 300,
	});

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const fetchCustomers = async () => {
		return await CustomerApi.getCustomersByFilters({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	const {
		data: customerData,
		isLoading,
		probeData,
		isError,
		error,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchCustomers', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchCustomers,
		},
		probe: {
			queryKey: ['fetchCustomers', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await CustomerApi.getCustomersByFilters({
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
		return !isLoading && probeData?.items.length === 0 && customerData?.items.length === 0;
	}, [isLoading, probeData, customerData]);

	if (isError) {
		const err = error as ServerError;
		toast.error(err.error.message || 'Error fetching customers');
		return null;
	}

	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Customer'
				tags={['Customers']}
				emptyStateCard={{
					heading: 'Create your first customer',
					description: 'Create a plan to display pricing and start billing customers.',
					buttonLabel: 'Create Customer',
					buttonAction: () => {
						setactiveCustomer(undefined);
						setcustomerDrawerOpen(true);
					},
				}}
				tutorials={GUIDES.customers.tutorials}
				onAddClick={() => {
					setactiveCustomer(undefined);
					setcustomerDrawerOpen(true);
				}}>
				<CreateCustomerDrawer open={customerDrawerOpen} onOpenChange={setcustomerDrawerOpen} data={activeCustomer} />
			</EmptyPage>
		);
	}

	return (
		<Page
			heading='Customers'
			headingCTA={
				<div className='flex justify-between gap-2 items-center'>
					<CreateCustomerDrawer
						trigger={
							<AddButton
								label='Add Customer'
								onClick={() => {
									setactiveCustomer(undefined);
								}}
							/>
						}
						open={customerDrawerOpen}
						onOpenChange={setcustomerDrawerOpen}
						data={activeCustomer}
					/>
				</div>
			}>
			<ApiDocsContent tags={['Customers']} />
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
						<CustomerTable
							onEdit={(data) => {
								setactiveCustomer(data);
								setcustomerDrawerOpen(true);
							}}
							data={customerData?.items || []}
						/>
						<Spacer className='!h-4' />
						<ShortPagination unit='Customers' totalItems={customerData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default CustomerPage;
