import { FormHeader } from '@/components/atoms';
import { SubscriptionUsage } from '@/models/Subscription';
import CustomerApi from '@/api/CustomerApi';
import formatDate from '@/utils/common/format_date';
import { useQuery } from '@tanstack/react-query';

const fetchCustomer = async (customerId: string) => {
	return await CustomerApi.getCustomerById(customerId);
};

interface CustomerCardProps {
	customerId: string;
	subscriptionData?: SubscriptionUsage | null;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customerId, subscriptionData }) => {
	const { data: customer, isLoading } = useQuery({
		queryKey: ['fetchCustomerCard', customerId],
		queryFn: () => fetchCustomer(customerId),

		// staleTime: 1000 * 60 * 5,
	});

	const details = [
		{
			label: 'Name',
			value: customer?.name || '--',
		},

		{
			label: 'Email',
			value: customer?.email || '--',
		},

		{
			label: 'Slug',
			value: customer?.external_id || '--',
		},
	];

	// Loading Skeleton
	if (isLoading) {
		return (
			<div className='flex items-center justify-center'>
				<div className='py-6 px-4 rounded-xl border border-gray-300'>
					<div className='h-6 w-32 bg-gray-200 rounded animate-pulse mb-4'></div>
					<div className='flex items-start space-x-3'>
						<div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse'></div>
						<div className='flex flex-col space-y-2 flex-1'>
							<div className='h-5 w-32 bg-gray-200 rounded animate-pulse'></div>
							<div className='h-4 w-48 bg-gray-200 rounded animate-pulse'></div>
							<div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Customer Details
	return (
		<div className='items-center justify-center'>
			<div className='card bg-white'>
				<FormHeader title='Customer Details' variant='sub-header' />
				<div className='flex items-center space-x-4'>
					<div className='w-full space-y-4'>
						{details.map((detail, index) => (
							<div key={index} className='grid grid-cols-2 gap-4'>
								<div className='text-sm font-light text-gray-600'>{detail.label}</div>
								<div className='text-sm font-normal text-gray-800 text-right'>{detail.value || '--'}</div>
							</div>
						))}
						<div className='grid grid-cols-2 gap-4'>
							{subscriptionData && (
								<>
									<div className='text-sm font-light text-gray-600'>Subscription Amount</div>
									<div className='text-sm font-normal text-gray-800 text-right'>{subscriptionData.display_amount || '--'}</div>

									<div className='text-sm font-light text-gray-600'>Subscription Start Date</div>
									<div className='text-sm font-normal text-gray-800 text-right'>
										{formatDate(subscriptionData.start_time.toString()) || '--'}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CustomerCard;
