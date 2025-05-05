import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent, QueryBuilder } from '@/components/molecules';
import CustomerTable from '@/components/molecules/Customer/CustomerTable';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import Customer from '@/models/Customer';
import CustomerApi from '@/api/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
import { BaseEntityStatus } from '@/types/common';

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
			{ value: BaseEntityStatus.PUBLISHED, label: 'Active' },
			{ value: BaseEntityStatus.ARCHIVED, label: 'Inactive' },
		],
	},
];

const CustomerPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [],
		initialSorts: [],
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
		isError,
	} = useQuery({
		queryKey: ['fetchCustomers', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
		queryFn: fetchCustomers,
	});

	if (isError) {
		toast.error('Error fetching customers');
		return null;
	}

	const showEmptyPage = !isLoading && customerData?.items.length === 0 && filters.length === 0 && sorts.length === 0;

	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Customer'
				tags={['Customers']}
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
