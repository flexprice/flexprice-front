import { Subscription } from '@/models/Subscription';
import { useMutation } from '@tanstack/react-query';
import { CirclePause, CirclePlay, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import SubscriptionApi from '@/utils/api_requests/SubscriptionApi';
import { DatePicker, Modal, Input, Button, FormHeader, Spacer } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import DropdownMenu, { DropdownMenuOption } from '@/components/molecules/DropdownMenu/DropdownMenu';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import { addDays, format } from 'date-fns';

interface Props {
	subscription: Subscription;
}

const SubscriptionActionButton: React.FC<Props> = ({ subscription }) => {
	const [state, setState] = useState({
		isPauseModalOpen: false,
		isResumeModalOpen: false,
		isCancelModalOpen: false,
		pauseStartDate: new Date(),
		pauseDays: '',
		pauseReason: '',
	});

	const pauseEndDate = useMemo(() => {
		if (!state.pauseDays) return null;
		return addDays(state.pauseStartDate, parseInt(state.pauseDays));
	}, [state.pauseStartDate, state.pauseDays]);

	const { mutate: pauseSubscription, isPending: isPauseLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.pauseSubscription(id, {
				pause_start: state.pauseStartDate.toISOString(),
				pause_days: parseInt(state.pauseDays),
				pause_mode: 'immediate',
			}),
		onSuccess: async () => {
			setState((prev) => ({ ...prev, isPauseModalOpen: false }));
			toast.success('Subscription paused successfully');
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
		},
		onError: () => {
			toast.error('Failed to pause subscription');
		},
	});

	const { mutate: resumeSubscription, isPending: isResumeLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.resumeSubscription(id, {
				resume_mode: 'immediate',
			}),
		onSuccess: async () => {
			setState((prev) => ({ ...prev, isResumeModalOpen: false }));
			toast.success('Subscription resumed successfully');
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
		},
		onError: () => {
			toast.error('Failed to resume subscription');
		},
	});

	const { mutate: cancelSubscription, isPending: isCancelLoading } = useMutation({
		mutationFn: (id: string) => SubscriptionApi.cancelSubscription(id),
		onSuccess: async () => {
			setState((prev) => ({ ...prev, isCancelModalOpen: false }));
			toast.success('Subscription cancelled successfully');
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
		},
		onError: () => {
			toast.error('Failed to cancel subscription');
		},
	});

	const isPaused = subscription.subscription_status.toUpperCase() === 'PAUSED';
	const isCancelled = subscription.subscription_status.toUpperCase() === 'CANCELLED';

	const menuOptions: DropdownMenuOption[] = [
		...(!isPaused && !isCancelled
			? [
					{
						label: 'Pause Subscription',
						icon: <CirclePause className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isPauseModalOpen: true })),
						disabled: isPaused || isCancelled,
					},
				]
			: []),
		...(isPaused && !isCancelled
			? [
					{
						label: 'Resume Subscription',
						icon: <CirclePlay className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isResumeModalOpen: true })),
						disabled: isCancelled,
					},
				]
			: []),
		// ...(!isCancelled
		// 	? [
		// 		{
		// 			label: 'Cancel Subscription',
		// 			icon: <X className='h-4 w-4' />,
		// 			onSelect: () => setState((prev) => ({ ...prev, isCancelModalOpen: true })),
		// 			disabled: isCancelled,
		// 			className: 'text-destructive',
		// 		},
		// 	]
		// 	: []),
		{
			label: 'Cancel Subscription',
			icon: <X className='h-4 w-4' />,
			onSelect: () => setState((prev) => ({ ...prev, isCancelModalOpen: true })),
			disabled: isCancelled,
			className: 'text-destructive',
		},
	];

	return (
		<>
			<DropdownMenu options={menuOptions} />

			{/* Pause Modal */}
			<Modal
				isOpen={state.isPauseModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isPauseModalOpen: open }))}
				className='bg-white rounded-lg p-6 w-[560px] max-w-[90vw]'>
				<div className=''>
					<FormHeader
						title='Pause Subscription'
						variant='sub-header'
						subtitle='Pausing the subscription will stop the subscription from charging the customer for the selected period.'
					/>
					<Spacer className='!my-6' />
					<div className='flex gap-4 w-full items-end'>
						<DatePicker
							label='Pause Start Date'
							date={state.pauseStartDate}
							setDate={(date) => setState((prev) => ({ ...prev, pauseStartDate: date || new Date() }))}
							minDate={new Date()}
							className='!w-full '
						/>

						<Input
							label='Number of days'
							value={state.pauseDays}
							onChange={(value) => setState((prev) => ({ ...prev, pauseDays: value }))}
							suffix='days'
							placeholder='Enter number of days'
							variant='integer'
							className='!h-10'
							labelClassName='!text-muted-foreground font-normal mb-0'
						/>
					</div>

					{state.pauseDays && pauseEndDate && (
						<p className='text-sm text-muted-foreground  mt-4'>
							The subscription of <span className='text-black'>{subscription.customer?.name}</span> to{' '}
							<span className='text-black'>{subscription.plan?.name}</span> will be paused from{' '}
							<span className='text-black'>{format(state.pauseStartDate, 'do MMM')}</span> to{' '}
							<span className='text-black'>{format(pauseEndDate, 'do MMM')}</span>. The subscription will resume from{' '}
							<span className='text-black'>{format(addDays(pauseEndDate, 1), 'do MMM')}</span> and the customer will not be charged until{' '}
							<span className='text-black'>{format(pauseEndDate, 'do MMM')}</span>.
						</p>
					)}

					<div className='flex justify-end gap-3 pt-4'>
						<Button
							variant='outline'
							onClick={() => setState((prev) => ({ ...prev, isPauseModalOpen: false }))}
							disabled={isPauseLoading}
							className='px-6'>
							Cancel
						</Button>
						<Button onClick={() => pauseSubscription(subscription.id)} disabled={isPauseLoading || !state.pauseDays} className='px-6'>
							{isPauseLoading ? 'Pausing...' : 'Schedule Pause'}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Resume Modal */}
			<Modal
				isOpen={state.isResumeModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isResumeModalOpen: open }))}
				className='bg-white rounded-lg p-6 w-[800px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader title='Resume Subscription' variant='sub-header' />
					<Spacer className='!my-6' />
					<p className='text-sm text-muted-foreground  mt-4'>
						{`Resuming the subscription will start a new billing cycle from ${format(new Date(), 'do MMM')} and generate a new invoice. Customers using advance charging will be charged immediately.`}
					</p>
					<div className='flex justify-end gap-3 pt-4'>
						<Button
							variant='outline'
							onClick={() => setState((prev) => ({ ...prev, isResumeModalOpen: false }))}
							disabled={isResumeLoading}>
							Cancel
						</Button>
						<Button onClick={() => resumeSubscription(subscription.id)} disabled={isResumeLoading}>
							{isResumeLoading ? 'Resuming...' : 'Yes, Resume'}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Cancel Modal */}
			<Modal
				isOpen={state.isCancelModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isCancelModalOpen: open }))}
				className='bg-white rounded-lg p-6 w-[800px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader
						title='Cancel Subscription'
						variant='sub-header'
						subtitle='This action cannot be undone. The subscription will be cancelled immediately.'
					/>
					<div className='flex justify-end gap-3 pt-4'>
						<Button
							variant='outline'
							onClick={() => setState((prev) => ({ ...prev, isCancelModalOpen: false }))}
							disabled={isCancelLoading}>
							No, Keep It
						</Button>
						<Button variant='destructive' onClick={() => cancelSubscription(subscription.id)} disabled={isCancelLoading}>
							{isCancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
};

export default SubscriptionActionButton;
