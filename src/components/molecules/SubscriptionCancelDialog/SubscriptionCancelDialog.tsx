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
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId?: string | null;
	currentPeriodStart?: string | null;
	refetchQueryKeys?: string[];
}

const SubscriptionCancelDialog = ({ isOpen, onOpenChange, subscriptionId, currentPeriodStart, refetchQueryKeys = [] }: Props) => {
	const { t } = useTranslation(['billing', 'common']);
	const [cancellationType, setCancellationType] = useState<SUBSCRIPTION_CANCELLATION_TYPE>(SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE);
	const [prorationBehavior, setProrationBehavior] = useState<SUBSCRIPTION_PRORATION_BEHAVIOR>(SUBSCRIPTION_PRORATION_BEHAVIOR.NONE);
	const [generateInvoice, setGenerateInvoice] = useState(false);
	const [reason, setReason] = useState('');
	const [cancelAtDate, setCancelAtDate] = useState<Date | undefined>(undefined);

	const minCancelAtDate = useMemo(() => (currentPeriodStart ? new Date(currentPeriodStart) : new Date()), [currentPeriodStart]);

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
			toast.success(t('subscriptions.cancelDialog.toastSuccess'));
			await Promise.all(refetchQueryKeys.map((key) => refetchQueries(key)));
		},
		onError: (error: Error) => {
			onOpenChange(false);
			resetState();
			toast.error(error.message || t('subscriptions.cancelDialog.toastError'));
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
					title={t('subscriptions.cancelSubscription')}
					variant='sub-header'
					subtitle={t('subscriptions.cancelDialog.subtitle')}
					titleClassName='!mb-1'
					subtitleClassName='!text-sm !max-w-[440px] !leading-6'
				/>

				<div className='rounded-md border border-border p-4 space-y-4'>
					<p className='text-sm font-medium text-foreground'>{t('subscriptions.cancelDialog.cancellationDetails')}</p>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<Select
							label={t('subscriptions.cancellationType')}
							value={cancellationType}
							options={[
								{
									label: t('subscriptions.cancelDialog.immediateLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
									description: t('subscriptions.cancelDialog.immediateDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.endOfPeriodLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD,
									description: t('subscriptions.cancelDialog.endOfPeriodDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.scheduledDateLabel'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE,
									description: t('subscriptions.cancelDialog.scheduledDateDescription'),
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
							label={t('subscriptions.prorationBehavior')}
							value={prorationBehavior}
							options={[
								{
									label: t('subscriptions.cancelDialog.prorationNoneLabel'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
									description: t('subscriptions.cancelDialog.prorationNoneDescription'),
								},
								{
									label: t('subscriptions.cancelDialog.prorationCreateLabel'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
									description: t('subscriptions.cancelDialog.prorationCreateDescription'),
								},
							]}
							onChange={(value) => setProrationBehavior(value as SUBSCRIPTION_PRORATION_BEHAVIOR)}
						/>
					</div>
					{cancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && (
						<div className='space-y-1 pt-1 w-full'>
							<Label label={t('subscriptions.cancelOn')} />
							<DatePicker
								date={cancelAtDate}
								setDate={setCancelAtDate}
								placeholder={t('subscriptions.selectCancellationDate')}
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
					<p className='text-sm font-medium text-foreground'>{t('subscriptions.cancelDialog.invoiceBehavior')}</p>
					<Toggle
						label={t('subscriptions.generateInvoice')}
						description={t('subscriptions.generateInvoiceHint')}
						checked={generateInvoice}
						onChange={setGenerateInvoice}
					/>
				</div>

				<div className='space-y-1'>
					<Input
						label={t('subscriptions.reasonOptional')}
						value={reason}
						onChange={setReason}
						description={t('subscriptions.reasonHint')}
						placeholder={t('subscriptions.internalNote')}
					/>
				</div>

				<div className='flex justify-end gap-3 pt-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
						{t('subscriptions.cancelDialog.keepSubscription')}
					</Button>
					<Button
						variant='destructive'
						onClick={() => cancelSubscription()}
						disabled={isPending || !subscriptionId || scheduledCancelInvalid}>
						{isPending ? t('subscriptions.cancelDialog.cancelling') : t('subscriptions.cancelDialog.confirmCancel')}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default SubscriptionCancelDialog;
