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
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { customerFilterOptions, customerSortOptions, customerInitialFilters, customerInitialSorts } from '@/configs/entityFilterConfigs';

// Using centralized sorting options from entityFilterConfigs.ts
const sortingOptions = customerSortOptions;

// Using centralized filter options from entityFilterConfigs.ts
const filterOptions = customerFilterOptions;

const CustomerPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: customerInitialFilters,
		initialSorts: customerInitialSorts,
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
					filters: [], // No filters for probe query
					sort: [], // No sorting for probe query
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
