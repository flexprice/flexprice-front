import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent, Toolbar, FilterState } from '@/components/molecules';
import CustomerTable from '@/components/molecules/Customer/CustomerTable';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/core/constants/guides';
import usePagination from '@/hooks/usePagination';
import Customer from '@/models/Customer';
import CustomerApi from '@/utils/api_requests/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CustomerPage = () => {
	const { limit, offset, page } = usePagination();

	const fetchCustomers = async () => {
		return await CustomerApi.getAllCustomers({ limit, offset });
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
	} = useQuery({
		queryKey: ['fetchCustomers', page],
		queryFn: fetchCustomers,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching customers');
		return null;
	}

	if (customerData?.items?.length === 0) {
		return (
			<>
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
			</>
		);
	}

	return (
		<Page
			heading='Customers'
			headingCTA={
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
			}>
			<ApiDocsContent tags={['Customers']} />
			<div>
				<Toolbar
					config={{
						searchPlaceholder: 'Search by customer name',
						enableSearch: true,
					}}
					filters={filters}
					onFilterChange={(filterState) => setfilters(filterState as FilterState)}
				/>
				<CustomerTable
					onEdit={(data) => {
						setactiveCustomer(data);
						setcustomerDrawerOpen(true);
					}}
					data={customerData?.items || []}
				/>
				<Spacer className='!h-4' />
				<ShortPagination unit='Customers' totalItems={customerData?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default CustomerPage;
