import { Card, FormHeader, Page, Spacer } from '@/components/atoms';
import { ColumnData, InvoiceLineItemTable, SubscriptionPauseWarning } from '@/components/molecules';
import SubscriptionActionButton from '@/components/organisms/Subscription/SubscriptionActionButton';
import { getSubscriptionStatus } from '@/components/organisms/Subscription/SubscriptionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteNames } from '@/core/routes/Routes';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { formatBillingPeriodForPrice, formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import CreditGrantApi from '@/api/CreditGrantApi';
import { formatExpirationType } from '@/components/molecules/CreditGrant/CreditGrantTable';
import { CreditGrant, CREDIT_GRANT_EXPIRATION_TYPE } from '@/models/CreditGrant';
import FlexpriceTable from '@/components/molecules/Table';

// Enhanced function to format expiration period with duration units
export const formatExpirationPeriod = (grant: CreditGrant): string => {
	if (grant.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION && grant.expiration_duration && grant.expiration_duration_unit) {
		const duration = grant.expiration_duration;
		const unit = grant.expiration_duration_unit.toLowerCase();

		// Convert plural unit names to singular when duration is 1, and handle pluralization
		let unitName = unit.endsWith('s') ? unit.slice(0, -1) : unit; // Remove 's' from 'days', 'weeks', etc.
		if (duration !== 1) {
			unitName += 's'; // Add 's' back for plural
		}

		return `${duration} ${unitName}`;
	}

	return formatExpirationType(grant.expiration_type);
};

const columns: ColumnData<CreditGrant>[] = [
	{
		title: 'Name',
		fieldName: 'name',
		fieldVariant: 'title',
	},
	{
		title: 'Credits',
		render: (row) => `${row.credits}`,
	},
	{
		title: 'Priority',
		render: (row) => row.priority?.toString() || '--',
	},
	{
		title: 'Cadence',
		render: (row) => {
			const cadence = row.cadence.toLowerCase().replace('_', ' ');
			return cadence.charAt(0).toUpperCase() + cadence.slice(1);
		},
	},
	{
		title: 'Period',
		render: (row) => (row.period ? `${row.period_count} ${formatBillingPeriodForPrice(row.period)}` : '--'),
	},
	{
		title: 'Expiration',
		render: (row) => formatExpirationPeriod(row),
	},
];

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

	const { data: creditGrants } = useQuery({
		queryKey: ['creditGrants', subscription_id],
		queryFn: async () => {
			return await CreditGrantApi.getGrantCredit({
				subscription_ids: [subscription_id!],
			});
		},
		enabled: !!subscription_id,
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

			{/* Credit Grants Section */}
			{creditGrants?.items && creditGrants.items.length > 0 && (
				<Card className='card mt-8'>
					<FormHeader title='Credit Grants' variant='sub-header' titleClassName='font-semibold' />
					<div className='mt-4'>
						<FlexpriceTable data={creditGrants.items} columns={columns} showEmptyRow={false} />
					</div>
				</Card>
			)}

			{/* subscription schedule */}
			{subscriptionDetails?.schedule?.phases?.length && subscriptionDetails?.schedule?.phases?.length > 0 && (
				<Card className='card mt-8'>
					<FormHeader title='Subscription Phases' variant='sub-header' titleClassName='font-semibold' />
					<div className='flex flex-col gap-4 pl-6'>
						{subscriptionDetails?.schedule?.phases?.length ? (
							subscriptionDetails.schedule.phases.map((phase, idx) => (
								<div key={idx} className='flex items-stretch gap-4 relative'>
									{/* Timeline Dot & Line */}
									<div className='flex flex-col items-center mr-2'>
										<div
											className={`w-2.5 h-2.5 rounded-full ${idx === subscriptionDetails.schedule.current_phase_index ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
										{idx < subscriptionDetails.schedule.phases.length - 1 && (
											<div className='w-0.5 flex-1 bg-gray-200' style={{ minHeight: 40 }}></div>
										)}
									</div>
									{/* Phase Card */}
									<div className='flex-1'>
										<div className='rounded-2xl border border-gray-100 bg-[#FAFAFA] px-8 py-5 flex flex-col gap-1'>
											<div className='text-sm font-medium text-gray-400 mb-2'>Phase {idx + 1}</div>
											<div className='grid grid-cols-4 gap-8'>
												<div>
													<div className='text-xs text-gray-400'>Start</div>
													<div className='font-normal text-lg text-gray-900'>{formatDateShort(phase.start_date.toString())}</div>
												</div>
												<div>
													<div className='text-xs text-gray-400'>End</div>
													<div className='font-normal text-lg text-gray-900'>
														{phase.end_date ? formatDateShort(phase.end_date.toString()) : '--'}
													</div>
												</div>
												<div>
													<div className='text-xs text-gray-400'>Commitment</div>
													<div className='font-normal text-lg text-gray-900'>
														{getCurrencySymbol(subscriptionDetails?.currency || '')} {phase.commitment_amount ?? '--'}
													</div>
												</div>
												<div>
													<div className='text-xs text-gray-400'>Overage</div>
													<div className='font-normal text-lg text-gray-900'>{phase.overage_factor ?? '--'}</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							))
						) : (
							<span className='text-[#71717A] text-sm'>No phases found.</span>
						)}
					</div>
				</Card>
			)}

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
