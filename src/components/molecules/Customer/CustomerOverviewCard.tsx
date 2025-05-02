import { Button, FormHeader, Spacer } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useQuery } from '@tanstack/react-query';
import CreateCustomerDrawer from './CreateCustomerDrawer';
import { Pencil } from 'lucide-react';
import { Country } from 'country-state-city';
import { Detail, DetailsCard } from '../DetailsCard';

const fetchCustomer = async (customerId: string) => {
	return await CustomerApi.getCustomerById(customerId);
};

interface CustomerCardProps {
	customerId: string;
}

const CustomerOverviewCard: React.FC<CustomerCardProps> = ({ customerId }) => {
	const { data: customer, isLoading } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => fetchCustomer(customerId),

		// staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const billingDetails: Detail[] = [
		{
			label: 'Customer',
			value: customer?.name || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
		},
		{
			label: 'Email',
			value: customer?.email || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
		},
		{
			label: 'Phone',
			value: customer?.phone || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
		},
		{
			label: 'Billing ID',
			value: customer?.external_id || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
			tag: {
				text: 'stripe',
				variant: 'subtle',
			},
		},
		{
			variant: 'divider',
			className: 'my-6',
		},
		{
			variant: 'heading',
			label: 'Billing Details',
			className: 'mb-4',
		},
		{
			label: 'Address',
			value: customer?.address_line1 || '--',
			colSpan: 2,
			valueVariant: 'muted',
		},
		{
			label: 'Country',
			value: customer?.address_country ? Country.getCountryByCode(customer.address_country)?.name : '--',
			valueVariant: 'muted',
		},
		{
			label: 'State',
			value: customer?.address_state || '--',
			valueVariant: 'muted',
		},
		{
			label: 'City',
			value: customer?.address_city || '--',
			valueVariant: 'muted',
		},
		{
			label: 'Timezone',
			value: customer?.timezone || '--',
			valueVariant: 'muted',
		},
	];

	if (isLoading) {
		return (
			<div className='py-6 px-4 rounded-xl border border-gray-300'>
				<p className='text-gray-600'>Loading customer details...</p>
			</div>
		);
	}

	return (
		<div>
			{billingDetails.filter((detail) => detail.value !== '--').length > 0 && (
				<div>
					<Spacer className='!h-4' />
					<DetailsCard data={billingDetails} childrenAtTop cardStyle='default' variant='stacked' gridCols={4}>
						<div className='flex justify-between items-center mb-4'>
							<FormHeader title='Customer Details' variant='sub-header' />
							<CreateCustomerDrawer
								trigger={
									<Button className='flex gap-2 mx-0 px-2' variant={'outline'}>
										<Pencil /> Edit
									</Button>
								}
								data={customer}
							/>
						</div>
					</DetailsCard>
				</div>
			)}
		</div>
	);
};

export default CustomerOverviewCard;
