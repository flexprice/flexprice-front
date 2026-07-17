import {
	Subscription,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY,
	SUBSCRIPTION_STATUS,
} from '@/models/Subscription';
import { useMutation } from '@tanstack/react-query';
import { X, Plus, Pencil, Play, Bell } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import SubscriptionApi from '@/api/SubscriptionApi';
import { DatePicker, Label, Modal, Input, Button, FormHeader, Spacer, Select, Toggle } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import DropdownMenu, { DropdownMenuOption, getCopyIdOption } from '@/components/molecules/DropdownMenu/DropdownMenu';
import { AlertSettingsDialog } from '@/components/molecules';
import { ALERT_ENTITY_TYPE } from '@/models/AlertSetting';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';

interface Props {
	subscription: Subscription;
}

const SubscriptionActionButton: React.FC<Props> = ({ subscription }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['customers', 'common']);
	const { t: tc } = useTranslation('common');
	const [state, setState] = useState({
		// isPauseModalOpen: false,
		// isResumeModalOpen: false,
		isCancelModalOpen: false,
		isAddPhaseModalOpen: false,
		isActivateModalOpen: false,
		isAlertSettingsOpen: false,
		// pauseStartDate: new Date(),
		// pauseDays: '',
		// pauseReason: '',
		activateStartDate: new Date(),
		cancelCancellationType: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
		cancelProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
		cancelGenerateInvoice: false,
		cancelReason: '',
		cancelScheduledAt: undefined as Date | undefined,
	});

	const resetCancelState = () => {
		setState((prev) => ({
			...prev,
			isCancelModalOpen: false,
			cancelCancellationType: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
			cancelProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
			cancelGenerateInvoice: false,
			cancelReason: '',
			cancelScheduledAt: undefined,
		}));
	};

	const getCancelImmediatelyInvoicePolicy = () =>
		state.cancelGenerateInvoice
			? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
			: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP;
	// const pauseEndDate = useMemo(() => {
	// 	if (!state.pauseDays) return null;
	// 	return addDays(state.pauseStartDate, parseInt(state.pauseDays));
	// }, [state.pauseStartDate, state.pauseDays]);
	const minCancelScheduledAt = useMemo(() => new Date(), []);

	// const { mutate: pauseSubscription, isPending: isPauseLoading } = useMutation({
	// 	mutationFn: (id: string) =>
	// 		SubscriptionApi.pauseSubscription(id, {
	// 			pause_start: state.pauseStartDate.toISOString(),
	// 			pause_days: parseInt(state.pauseDays),
	// 			pause_mode: 'immediate',
	// 		}),
	// 	onSuccess: async () => {
	// 		setState((prev) => ({ ...prev, isPauseModalOpen: false }));
	// 		toast.success(t('common:toast.subscriptionPaused'));
	// 		await refetchQueries(['subscriptionDetails']);
	// 		await refetchQueries(['subscriptions']);
	// 	},
	// 	onError: (error: Error) => {
	// 		setState((prev) => ({ ...prev, isPauseModalOpen: false }));
	// 		toast.error(error.message || 'Failed to pause subscription');
	// 	},
	// });

	// const { mutate: resumeSubscription, isPending: isResumeLoading } = useMutation({
	// 	mutationFn: (id: string) =>
	// 		SubscriptionApi.resumeSubscription(id, {
	// 			resume_mode: 'immediate',
	// 		}),
	// 	onSuccess: async () => {
	// 		setState((prev) => ({ ...prev, isResumeModalOpen: false }));
	// 		toast.success(t('common:toast.subscriptionResumed'));
	// 		await refetchQueries(['subscriptionDetails']);
	// 		await refetchQueries(['subscriptions']);
	// 	},
	// 	onError: (err: Error) => {
	// 		setState((prev) => ({ ...prev, isResumeModalOpen: false }));
	// 		toast.error(err.message || 'Failed to resume subscription');
	// 	},
	// });

	const cancelScheduledInvalid =
		state.cancelCancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && state.cancelScheduledAt === undefined;

	const { mutate: cancelSubscription, isPending: isCancelLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.cancelSubscription(id, {
				proration_behavior: state.cancelProrationBehavior,
				cancellation_type: state.cancelCancellationType,
				cancel_immediately_inovice_policy: getCancelImmediatelyInvoicePolicy(),
				...(state.cancelReason.trim() ? { reason: state.cancelReason.trim() } : {}),
				...(state.cancelCancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && state.cancelScheduledAt
					? { cancel_at: state.cancelScheduledAt.toISOString() }
					: {}),
			}),
		onSuccess: async () => {
			resetCancelState();
			toast.success(t('common:toast.subscriptionCancelled'));
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
		},
		onError: (err: Error) => {
			resetCancelState();
			toast.error(err.message || 'Failed to cancel subscription');
		},
	});

	const { mutate: activateSubscription, isPending: isActivating } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.activateSubscription(id, {
				start_date: state.activateStartDate.toISOString(),
			}),
		onSuccess: async () => {
			setState((prev) => ({ ...prev, isActivateModalOpen: false }));
			toast.success(t('common:toast.subscriptionActivated'));
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
			await refetchQueries(['subscriptionInvoices']);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to activate subscription');
		},
	});

	const isPaused = subscription.subscription_status.toUpperCase() === 'PAUSED';
	const isCancelled = subscription.subscription_status.toUpperCase() === 'CANCELLED';
	const isDraft = subscription.subscription_status === SUBSCRIPTION_STATUS.DRAFT;
	const readOnly = isInheritedSubscription(subscription);

	const menuOptions: DropdownMenuOption[] = useMemo(
		() => [
			getCopyIdOption(subscription.id, tc, { entityType: 'Subscription' }),
			...(isDraft
				? [
						{
							label: t('customers:organisms.subscriptionAction.menu.activateSubscription'),
							icon: <Play className='h-4 w-4' />,
							onSelect: () => setState((prev) => ({ ...prev, isActivateModalOpen: true })),
							disabled: readOnly,
						},
					]
				: []),
			{
				label: t('customers:organisms.subscriptionAction.menu.editSubscription'),
				icon: <Pencil className='h-4 w-4' />,
				onSelect: () => navigate(`${RouteNames.subscriptions}/${subscription.id}/edit`),
				disabled: isCancelled || readOnly,
			},
			{
				label: t('customers:organisms.subscriptionAction.menu.alertSettings'),
				icon: <Bell className='h-4 w-4' />,
				onSelect: () => setState((prev) => ({ ...prev, isAlertSettingsOpen: true })),
				disabled: readOnly,
			},
			...(!isCancelled && !isDraft
				? [
						{
							label: t('customers:organisms.subscriptionAction.menu.addSubscriptionPhase'),
							icon: <Plus className='h-4 w-4' />,
							onSelect: () => setState((prev) => ({ ...prev, isAddPhaseModalOpen: true })),
							disabled: isPaused || isCancelled || readOnly,
						},
					]
				: []),
			{
				label: t('customers:organisms.subscriptionAction.menu.cancelSubscription'),
				icon: <X className='h-4 w-4' />,
				onSelect: () => setState((prev) => ({ ...prev, isCancelModalOpen: true })),
				disabled: isCancelled || readOnly,
				className: 'text-destructive',
			},
		],
		[isCancelled, isDraft, isPaused, navigate, readOnly, subscription.id, t, tc],
	);

	return (
		<>
			<DropdownMenu options={menuOptions} />

			{/* Cancel Modal */}
			<Modal
				isOpen={state.isCancelModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						resetCancelState();
						return;
					}
					setState((prev) => ({ ...prev, isCancelModalOpen: open }));
				}}
				className='card bg-white w-[560px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader
						title={t('customers:organisms.subscriptionAction.cancelTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.cancelSubtitle')}
						titleClassName='!mb-1'
						subtitleClassName='!text-sm !max-w-[440px] !leading-6'
					/>
					<div className='space-y-4'>
						<Select
							label={t('customers:organisms.subscriptionAction.cancellationType')}
							value={state.cancelCancellationType}
							options={[
								{
									label: t('customers:organisms.subscriptionAction.cancellationImmediate'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
								},
								{
									label: t('customers:organisms.subscriptionAction.cancellationEndOfPeriod'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD,
								},
								{
									label: t('customers:organisms.subscriptionAction.cancellationScheduled'),
									value: SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE,
								},
							]}
							onChange={(value) => {
								const next = value as SUBSCRIPTION_CANCELLATION_TYPE;
								setState((prev) => ({
									...prev,
									cancelCancellationType: next,
									...(next !== SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE ? { cancelScheduledAt: undefined } : {}),
								}));
							}}
						/>
						{state.cancelCancellationType === SUBSCRIPTION_CANCELLATION_TYPE.SCHEDULED_DATE && (
							<div className='space-y-1 w-full'>
								<Label label={t('customers:organisms.subscriptionAction.cancelOn')} />
								<DatePicker
									date={state.cancelScheduledAt}
									setDate={(date) => setState((prev) => ({ ...prev, cancelScheduledAt: date }))}
									className='!w-full'
									popoverClassName='!w-full'
									popoverTriggerClassName='!w-full'
									popoverContentClassName='!w-full'
									placeholder={t('customers:organisms.subscriptionAction.selectCancellationDate')}
									minDate={minCancelScheduledAt}
								/>
							</div>
						)}
						<Select
							label={t('customers:organisms.subscriptionAction.prorationBehavior')}
							value={state.cancelProrationBehavior}
							options={[
								{ label: t('customers:organisms.subscriptionAction.prorationNone'), value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
								{
									label: t('customers:organisms.subscriptionAction.prorationCreate'),
									value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS,
								},
							]}
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									cancelProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
								}))
							}
						/>
						<Toggle
							title={t('customers:organisms.subscriptionAction.invoiceBehaviorTitle')}
							label={t('customers:organisms.subscriptionAction.generateInvoice')}
							description={t('customers:organisms.subscriptionAction.generateInvoiceDesc')}
							checked={state.cancelGenerateInvoice}
							onChange={(checked) => setState((prev) => ({ ...prev, cancelGenerateInvoice: checked }))}
						/>
						<Input
							label={t('customers:organisms.subscriptionAction.reasonOptional')}
							value={state.cancelReason}
							onChange={(value) => setState((prev) => ({ ...prev, cancelReason: value }))}
							placeholder={t('customers:organisms.subscriptionAction.cancelReasonPlaceholder')}
						/>
					</div>
					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' onClick={() => resetCancelState()} disabled={isCancelLoading}>
							{t('customers:organisms.subscriptionAction.keepSubscription')}
						</Button>
						<Button
							variant='destructive'
							onClick={() => cancelSubscription(subscription.id)}
							disabled={isCancelLoading || cancelScheduledInvalid}>
							{isCancelLoading
								? t('customers:organisms.subscriptionAction.cancelling')
								: t('customers:organisms.subscriptionAction.yesCancel')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Activate Modal */}
			<Modal
				isOpen={state.isActivateModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isActivateModalOpen: open }))}
				className='bg-white rounded-lg p-6 w-[560px] max-w-[90vw]'>
				<div className=''>
					<FormHeader
						title={t('customers:organisms.subscriptionAction.activateTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.activateSubtitle')}
					/>
					<Spacer className='!my-6' />
					<div className='w-full'>
						<DatePicker
							label={t('customers:organisms.subscriptionAction.startDate')}
							date={state.activateStartDate}
							setDate={(date) => setState((prev) => ({ ...prev, activateStartDate: date || new Date() }))}
							className='!w-full'
						/>
					</div>

					<div className='flex justify-end gap-3 pt-4'>
						<Button
							variant='outline'
							onClick={() => setState((prev) => ({ ...prev, isActivateModalOpen: false }))}
							disabled={isActivating}
							className='px-6'>
							{t('common:actions.cancel')}
						</Button>
						<Button
							onClick={() => activateSubscription(subscription.id)}
							disabled={isActivating || !state.activateStartDate}
							className='px-6'>
							{isActivating ? t('customers:organisms.subscriptionAction.activating') : t('customers:organisms.subscriptionAction.activate')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Alert Settings Dialog */}
			<AlertSettingsDialog
				open={state.isAlertSettingsOpen}
				onClose={() => setState((prev) => ({ ...prev, isAlertSettingsOpen: false }))}
				entityType={ALERT_ENTITY_TYPE.SUBSCRIPTION}
				entityId={subscription.id}
				currency={subscription.currency}
			/>
		</>
	);
};

export default SubscriptionActionButton;
