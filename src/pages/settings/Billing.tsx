import { Card, CardHeader, FormHeader, Loader, Page, Button } from '@/components/atoms';
import { Detail, DetailsCard, FlatTabs } from '@/components/molecules';
import { ApiDocsContent } from '@/components/molecules';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import SubscriptionTable from '@/components/organisms/Subscription/SubscriptionTable';
import useUser from '@/hooks/useUser';
import TenantApi from '@/api/TenantApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UpdateTenantDrawer } from '@/components/molecules';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

const BillingPage = () => {
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
	const { data, isLoading, isError } = useQuery({
		queryKey: ['billing'],
		queryFn: () => {
			return TenantApi.getTenantBillingDetails();
		},
	});

	const { user } = useUser();

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching billing details');
	}

	const billingDetails: Detail[] = [
		{
			label: 'Name',
			value: user?.tenant?.name || '--',
			labelStyle: 'normal',
		},
		{
			label: 'Billing Email',
			value: user?.email || '	--',
			labelStyle: 'normal',
		},
		{
			variant: 'divider',
		},
		{
			label: 'Billing Address',
			value: user?.tenant?.billing_details?.address?.address_line1 + ' ' + user?.tenant?.billing_details?.address?.address_line2 || '--',
			labelStyle: 'normal',
		},
		{
			label: 'Billing City',
			value: user?.tenant?.billing_details?.address?.address_city || '--',
			labelStyle: 'normal',
		},
		{
			label: 'Billing State',
			value: user?.tenant?.billing_details?.address?.address_state || '--',
			labelStyle: 'normal',
		},
		{
			label: 'Billing Country',
			value: user?.tenant?.billing_details?.address?.address_country || '--',
			labelStyle: 'normal',
		},
		{
			label: 'Billing Postal Code',
			value: user?.tenant?.billing_details?.address?.address_postal_code || '--',
			labelStyle: 'normal',
		},
	];

	return (
		<Page heading='Billing'>
			<ApiDocsContent tags={['Billing']} />

			<FlatTabs
				tabs={[
					{
						value: 'usage',
						label: 'Usage',
						content: (
							<div className='space-y-6'>
								{/* customer entitlements table */}
								<Card variant='notched'>
									<CardHeader title='Usage' />
									<CustomerUsageTable data={data?.usage.features ?? []} allowRedirect={false} />
								</Card>
							</div>
						),
					},
					{
						value: 'subscriptions',
						label: 'Subscriptions',
						content: (
							<div className='space-y-6'>
								{/* customer subscriptions table */}
								<Card variant='notched'>
									<CardHeader title='Subscriptions' />
									<SubscriptionTable data={data?.subscriptions ?? []} allowRedirect={false} />
								</Card>
							</div>
						),
					},
					{
						value: 'information',
						label: 'General',
						content: (
							<div className='space-y-6'>
								{/* billing email */}
								<div className='flex items-center justify-between'>
									<FormHeader title={'Billing Details'} variant='form-component-title' />
									<Button variant='outline' size='sm' onClick={() => setIsEditDrawerOpen(true)}>
										<Pencil className='size-4' />
									</Button>
								</div>
								<DetailsCard variant='stacked' data={billingDetails} childrenAtTop cardStyle='borderless'></DetailsCard>
							</div>
						),
					},
				]}
			/>
			<div className='space-y-6'>
				{/* <Card variant='notched'>
					<CardHeader title='Invoices' />
					<div className='flex items-center gap-2 mt-6'>
						<Input value={user?.email} disabled />
					</div>
				</Card> */}
			</div>

			<UpdateTenantDrawer data={user} open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen} />
		</Page>
	);
};

export default BillingPage;
