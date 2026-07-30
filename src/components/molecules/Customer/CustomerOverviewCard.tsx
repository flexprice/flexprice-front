import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation(['customers', 'common']);
	const { data: customer, isLoading } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => fetchCustomer(customerId),

		// staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const billingDetails: Detail[] = [
		{
			label: t('overview.labels.customer'),
			value: customer?.name || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
		},
		{
			label: t('overview.labels.email'),
			value: customer?.email || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
		},

		{
			label: t('overview.labels.billingId'),
			value: customer?.external_id || '--',
			labelStyle: 'semibold',
			valueVariant: 'foreground',
			tag: {
				text: t('overview.billingStripeTag'),
				variant: 'subtle',
			},
		},
		{
			variant: 'divider',
			className: 'my-6',
		},
		{
			variant: 'heading',
			label: t('overview.labels.billingDetailsHeading'),
			className: 'mb-4',
		},
		{
			label: t('overview.labels.address'),
			value: customer?.address_line1 || '--',
			colSpan: 2,
			valueVariant: 'muted',
		},
		{
			label: t('overview.labels.country'),
			value: customer?.address_country ? Country.getCountryByCode(customer.address_country)?.name : '--',
			valueVariant: 'muted',
		},
		{
			label: t('overview.labels.state'),
			value: customer?.address_state || '--',
			valueVariant: 'muted',
		},
		{
			label: t('overview.labels.city'),
			value: customer?.address_city || '--',
			valueVariant: 'muted',
		},
		{
			label: t('overview.labels.postalCode'),
			value: customer?.address_postal_code || '--',
			valueVariant: 'muted',
		},
	];

	if (isLoading) {
		return (
			<div className='py-6 px-4 rounded-xl border border-gray-300'>
				<p className='text-gray-600'>{t('overview.loadingCustomerDetails')}</p>
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
							<FormHeader title={t('overview.sectionTitle')} variant='sub-header' />
							<CreateCustomerDrawer
								trigger={
									<Button className='flex gap-2 mx-0 px-2' variant={'outline'}>
										<Pencil /> {t('common:actions.edit')}
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
