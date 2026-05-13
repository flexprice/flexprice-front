import SubscriptionApi from '@/api/SubscriptionApi';
import { Button, DatePicker, FormHeader, Input, Label, Modal, Select, Toggle } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import {
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
} from '@/models/Subscription';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId?: string | null;
	refetchQueryKeys?: string[];
}

const SubscriptionCancelDialog = ({ isOpen, onOpenChange, subscriptionId, refetchQueryKeys = [] }: Props) => {
	const [cancellationType, setCancellationType] = useState<SUBSCRIPTION_CANCELLATION_TYPE>(SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE);
	const [prorationBehavior, setProrationBehavior] = useState<SUBSCRIPTION_PRORATION_BEHAVIOR>(SUBSCRIPTION_PRORATION_BEHAVIOR.NONE);
	const [generateInvoice, setGenerateInvoice] = useState(false);
	const [reason, setReason] = useState('');
	const [cancelAtDate, setCancelAtDate] = useState<Date | undefined>(undefined);

	const minCancelAtDate = useMemo(() => new Date(), []);

	const resetState = () => {
		setCancellationType(SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE);
		setProrationBehavior(SUBSCRIPTION_PRORATION_BEHAVIOR.NONE);
		setGenerateInvoice(false);
		setReason('');
		setCancelAtDate(undefined);
	};

	const cancelImmediatelyInvoicePolicy = useMemo(
		() =>
			generateInvoice
				? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
				: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP,
		[generateInvoice],
	);

	const scheduledCancelInvalid = cancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && cancelAtDate === undefined;

	const { mutate: cancelSubscription, isPending } = useMutation({
		mutationFn: async () => {
			if (!subscriptionId) return;
			await SubscriptionApi.cancelSubscription(subscriptionId, {
				cancellation_type: cancellationType,
				proration_behavior: prorationBehavior,
				cancel_immediately_inovice_policy: cancelImmediatelyInvoicePolicy,
				...(reason.trim() ? { reason: reason.trim() } : {}),
				...(cancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && cancelAtDate
					? { cancel_at: cancelAtDate.toISOString() }
					: {}),
			});
		},
		onSuccess: async () => {
			onOpenChange(false);
			resetState();
			toast.success('Subscription cancelled successfully');
			await Promise.all(refetchQueryKeys.map((key) => refetchQueries(key)));
		},
		onError: (error: Error) => {
			onOpenChange(false);
			resetState();
			toast.error(error.message || 'Failed to cancel subscription');
		},
	});

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => {
				onOpenChange(open);
				if (!open) {
					resetState();
				}
			}}
			className='card bg-white w-[620px] max-w-[90vw]'>
			<div className='space-y-5'>
				<FormHeader
					title='Cancel Subscription'
					variant='sub-header'
					subtitle='This action cannot be undone. Review cancellation settings before continuing.'
					titleClassName='!mb-1'
					subtitleClassName='!text-sm !max-w-[440px] !leading-6'
				/>

				<div className='rounded-md border border-border p-4 space-y-4'>
					<p className='text-sm font-medium text-foreground'>Cancellation details</p>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<Select
							label='Cancellation type'
							value={cancellationType}
							options={[
								{
									label: 'Immediate',
									value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
									description: 'Cancel now and apply the selected proration and invoice policy.',
								},
								{
									label: 'End of period',
									value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD,
									description: 'Keep service active until period end, then cancel automatically.',
								},
								{
									label: 'Scheduled date',
									value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE,
									description: 'Cancel on a specific future date you choose.',
								},
							]}
							onChange={(value) => {
								const next = value as SUBSCRIPTION_CANCELLATION_TYPE;
								setCancellationType(next);
								if (next !== SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE) {
									setCancelAtDate(undefined);
								}
							}}
						/>
						<Select
							label='Proration behavior'
							value={prorationBehavior}
							options={[
								{
									label: 'None',
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
									description: 'No proration adjustments are created.',
								},
								{
									label: 'Create prorations',
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
									description: 'Create proration credits or charges based on timing.',
								},
							]}
							onChange={(value) => setProrationBehavior(value as SUBSCRIPTION_PRORATION_BEHAVIOR)}
						/>
					</div>
					{cancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && (
						<div className='space-y-1 pt-1 w-full'>
							<Label label='Cancel on' />
							<DatePicker
								date={cancelAtDate}
								setDate={setCancelAtDate}
								placeholder='Select cancellation date'
								minDate={minCancelAtDate}
								className='!w-full'
								popoverClassName='!w-full'
								popoverTriggerClassName='!w-full'
								popoverContentClassName='!w-full'
							/>
						</div>
					)}
				</div>

				<div className='rounded-md border border-border p-4 space-y-3'>
					<p className='text-sm font-medium text-foreground'>Invoice behavior</p>
					<Toggle
						label='Generate invoice'
						description='Enabled: send generate_invoice. Disabled: send skip.'
						checked={generateInvoice}
						onChange={setGenerateInvoice}
					/>
				</div>

				<div className='space-y-1'>
					<Input
						label='Reason (optional)'
						value={reason}
						onChange={setReason}
						description='This reason is sent only when provided.'
						placeholder='Add an internal note for this cancellation'
					/>
				</div>

				<div className='flex justify-end gap-3 pt-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
						Keep subscription
					</Button>
					<Button
						variant='destructive'
						onClick={() => cancelSubscription()}
						disabled={isPending || !subscriptionId || scheduledCancelInvalid}>
						{isPending ? 'Cancelling...' : 'Cancel subscription'}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default SubscriptionCancelDialog;
