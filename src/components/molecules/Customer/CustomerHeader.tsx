import CustomerApi from '@/api/CustomerApi';
import { useQuery } from '@tanstack/react-query';

const fetchCustomer = async (customerId: string) => {
	return await CustomerApi.getCustomerById(customerId);
};

interface CustomerHeaderProps {
	customerId: string;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customerId }) => {
	const { data: customer, isLoading } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => fetchCustomer(customerId!),

		// staleTime: 1000 * 60 * 5,
	});

	if (isLoading) {
		return (
			<div className='items-center justify-center'>
				<div className='py-6 px-4 rounded-xl border border-gray-300'>
					<div className='h-6 w-32 bg-gray-200 rounded animate-pulse mb-2'></div>
					<div className='flex place-items-start space-x-3'>
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
	return (
		<div className='items-center justify-center'>
			<div className='flex place-items-center space-x-3'>
				<span className='size-9 bg-contain rounded-md bg-gray-400 flex items-center justify-center text-white text-lg'>
					{customer?.name
						?.split(' ')
						.map((n) => n[0]?.toUpperCase())
						.join('')
						.slice(0, 2)}
				</span>
				<div className='flex flex-col'>
					<div className='text-base font-semibold text-gray-800'>{customer?.name}</div>
					<div className='text-sm font-normal text-gray-600'>{customer?.email}</div>
				</div>
			</div>
		</div>
	);
};

export default CustomerHeader;
