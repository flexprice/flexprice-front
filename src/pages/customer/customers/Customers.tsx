import { AddButton, Input, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent, FilterState } from '@/components/molecules';
import CustomerTable from '@/components/molecules/Customer/CustomerTable';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import Customer from '@/models/Customer';
import CustomerApi from '@/utils/api_requests/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CustomerPage = () => {
	const { limit, offset, page } = usePagination();

	const fetchCustomers = async () => {
		return await CustomerApi.getCustomerByQuery({ limit, offset, external_id: filters.searchQuery, name: filters.searchQuery });
	};

	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);
	const [filters, setfilters] = useState<FilterState>({
		searchQuery: '',
		sortBy: '',
		sortDirection: 'asc',
	});

	const {
		data: customerData,
		isLoading,
		isError,
		isFetching,
	} = useQuery({
		queryKey: ['fetchCustomers', page, filters.searchQuery],
		queryFn: fetchCustomers,
	});

	// Render empty state when no customers and no search query
	if (!isLoading && customerData?.items?.length === 0 && !filters.searchQuery) {
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

	// Handle error state
	if (isError) {
		toast.error('Error fetching customers');
		return null;
	}

	return (
		<Page
			heading='Customers'
			headingCTA={
				<div className='flex justify-between items-center gap-2 items-center'>
					<Input
						className='min-w-[400px]'
						suffix={<Search className='size-[14px] text-gray-500' />}
						placeholder='Search by Name or lookup key'
						value={filters.searchQuery}
						onChange={(e) => setfilters({ ...filters, searchQuery: e })}
						size='sm'
					/>
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
				{/* <Toolbar
					config={{
						searchPlaceholder: 'Search by Name or lookup key',
						enableSearch: true,
					}}
					filters={filters}
					onFilterChange={(filterState) => setfilters(filterState as FilterState)}
				/> */}
				{/* Conditional rendering for table or empty search state */}
				{filters.searchQuery && isFetching ? (
					<div className='flex justify-center py-4'>
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
			<CreateCustomerDrawer open={customerDrawerOpen} onOpenChange={setcustomerDrawerOpen} data={activeCustomer} />
		</Page>
	);
};

export default CustomerPage;
