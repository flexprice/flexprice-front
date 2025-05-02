import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { AddButton, Card, CardHeader, NoDataCard } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import SubscriptionTable from '@/components/organisms/Subscription/SubscriptionTable';
import { Subscription } from '@/models/Subscription';
import Loader from '@/components/atoms/Loader';
import toast from 'react-hot-toast';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';

type ContextType = {
	isArchived: boolean;
};

const fetchAllSubscriptions = async (customerId: string) => {
	const subs = await CustomerApi.getCustomerSubscriptions(customerId);
	return subs.items;
};

const Overview = () => {
	const navigate = useNavigate();
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();

	const handleAddSubscription = () => {
		navigate(`/customer-management/customers/${customerId}/add-subscription`);
	};

	const {
		data: subscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['subscriptions', customerId],
		queryFn: () => fetchAllSubscriptions(customerId!),
	});

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId! }),
	});

	if (subscriptionsLoading || usageLoading) {
		return <Loader />;
	}

	if (subscriptionsError || usageError) {
		toast.error('Something went wrong');
	}

	const renderSubscriptionContent = () => {
		if ((subscriptions?.length || 0) > 0) {
			return (
				<Card variant='notched'>
					<CardHeader title='Subscriptions' cta={!isArchived && <AddButton onClick={handleAddSubscription} />} />
					<SubscriptionTable
						onRowClick={(row) => {
							navigate(`/customer-management/customers/${customerId}/subscription/${row.id}`);
						}}
						data={subscriptions as Subscription[]}
					/>
				</Card>
			);
		}

		return (
			<NoDataCard
				title='Subscriptions'
				subtitle={isArchived ? 'No subscriptions found' : 'No active subscriptions'}
				cta={!isArchived && <AddButton onClick={handleAddSubscription} />}
			/>
		);
	};

	return (
		<div className='space-y-6'>
			{renderSubscriptionContent()}

			{/* customer entitlements table */}
			{(usageData?.features?.length || 0) > 0 && (
				<Card variant='notched'>
					<CardHeader title='Entitlements' />
					<CustomerUsageTable data={usageData?.features ?? []} />
				</Card>
			)}
		</div>
	);
};

export default Overview;
