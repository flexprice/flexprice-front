import { Card, FormHeader, Page, Spacer } from '@/components/atoms';
import { InvoiceLineItemTable, SubscriptionPauseWarning } from '@/components/molecules';
import SubscriptionActionButton from '@/components/organisms/Subscription/SubscriptionActionButton';
import { getSubscriptionStatus } from '@/components/organisms/Subscription/SubscriptionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const SubscriptionDetails: FC = () => {
	const { subscription_id, id: customerId } = useParams();
	const { updateBreadcrumb } = useBreadcrumbsStore();
	const { data: subscriptionDetails, isLoading: isSubscriptionDetailsLoading } = useQuery({
		queryKey: ['subscriptionDetails', subscription_id],
		queryFn: async () => {
			return await SubscriptionApi.getSubscriptionById(subscription_id!);
		},
		staleTime: 1,
	});

	const { data: customer } = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: async () => await CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['subscriptionInvoices', subscription_id],
		queryFn: async () => {
			return await SubscriptionApi.getSubscriptionInvoicesPreview({ subscription_id: subscription_id! });
		},
	});

	useEffect(() => {
		if (subscriptionDetails?.plan?.name) {
			updateBreadcrumb(4, subscriptionDetails.plan.name);
		}

		updateBreadcrumb(3, 'Subscription', RouteNames.customers + '/' + customerId);

		if (customer?.external_id) {
			updateBreadcrumb(2, customer.external_id);
		}
	}, [subscriptionDetails, updateBreadcrumb, customer, customerId]);

	if (isLoading || isSubscriptionDetailsLoading) {
		return (
			<Page>
				<Skeleton className='h-48' />
				<Spacer className='!my-4' />
				<Skeleton className='h-60' />
			</Page>
		);
	}

	if (isError) {
		toast.error('Something went wrong');
	}

	const isPaused = subscriptionDetails?.subscription_status.toUpperCase() === 'PAUSED';
	const activePauseDetails = subscriptionDetails?.pauses?.find((pause) => pause.id === subscriptionDetails.active_pause_id);

	return (
		<div>
			{isPaused && activePauseDetails && (
				<SubscriptionPauseWarning
					pauseStartDate={activePauseDetails.pause_start}
					pauseEndDate={activePauseDetails.pause_end}
					resumeDate={activePauseDetails.resumed_at || activePauseDetails.pause_end}
				/>
			)}

			<Card className='card'>
				<div className='flex justify-between items-center'>
					<FormHeader title='Subscription details' variant='sub-header' titleClassName='font-semibold' />
					<SubscriptionActionButton subscription={subscriptionDetails!} />
				</div>
				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Subscription name</p>
					<p className='text-[#09090B] text-sm'>{subscriptionDetails?.plan.name ?? '--'}</p>
				</div>
				<Spacer className='!my-4' />
				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Status</p>
					<p className='text-[#09090B] text-sm'>{getSubscriptionStatus(subscriptionDetails?.subscription_status ?? '')}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Billing cycle</p>
					<p className='text-[#09090B] text-sm'>{subscriptionDetails?.billing_cycle || '--'}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Commitment Amount</p>
					<p className='text-[#09090B] text-sm'>
						{getCurrencySymbol(subscriptionDetails?.currency || '')} {subscriptionDetails?.commitment_amount || '0'}
					</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Overage Factor</p>
					<p className='text-[#09090B] text-sm'>{subscriptionDetails?.overage_factor || '--'}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Start date</p>
					<p className='text-[#09090B] text-sm'>{formatDateShort(subscriptionDetails?.current_period_start ?? '')}</p>
				</div>
				<Spacer className='!my-4' />

				<div className='w-full flex justify-between items-center'>
					<p className='text-[#71717A] text-sm'>Upcoming Invoice</p>
					<p className='text-[#09090B] text-sm'>{`${getCurrencySymbol(data?.currency ?? '')}${data?.amount_due} on ${formatDateShort(subscriptionDetails?.current_period_end ?? '')}`}</p>
				</div>
			</Card>

			{(data?.line_items?.length ?? 0) > 0 && (
				<div className='card !mt-4'>
					<InvoiceLineItemTable
						refetch={refetch}
						currency={data?.currency}
						amount_due={data?.amount_due}
						title='Upcoming Invoices'
						data={data?.line_items ?? []}
					/>
				</div>
			)}
		</div>
	);
};

export default SubscriptionDetails;
