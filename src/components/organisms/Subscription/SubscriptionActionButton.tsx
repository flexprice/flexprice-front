import {
	Subscription,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY,
	SUBSCRIPTION_STATUS,
} from '@/models/Subscription';
import { useMutation } from '@tanstack/react-query';
import { X, Pencil, Play, Bell, CirclePause, CirclePlay } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import SubscriptionApi from '@/api/SubscriptionApi';
import { DatePicker, Label, Modal, Input, Button, FormHeader, Spacer, Select, Toggle } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import DropdownMenu, { DropdownMenuOption, getCopyIdOption } from '@/components/molecules/DropdownMenu/DropdownMenu';
import { AlertSettingsDialog } from '@/components/molecules';
import { ALERT_ENTITY_TYPE } from '@/models/AlertSetting';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { refetchSubscriptionQueries } from '@/core/services/tanstack/queryKeys';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

interface Props {
	subscription: Subscription;
}

// Pause is immediate only for now; the select is in place for scheduled pause later.
const PAUSE_MODE_IMMEDIATE = 'immediate';

const SubscriptionActionButton: React.FC<Props> = ({ subscription }) => {
	const navigate = useNavigate();
	const { t } = useTranslation(['customers', 'common']);
	const { t: tc } = useTranslation('common');
	const { can } = useCurrentUserPermissions();
	const canWriteSubscription = can('subscription', 'write');
	const canWriteAlertSettings = can('alert_settings', 'write');
	const [state, setState] = useState({
		isPauseModalOpen: false,
		isResumeModalOpen: false,
		isCancelModalOpen: false,
		isActivateModalOpen: false,
		isAlertSettingsOpen: false,
		pauseProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
		pauseReason: '',
		resumeProrationBehavior: subscription.proration_behavior ?? SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
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

	const resetPauseState = () => {
		setState((prev) => ({
			...prev,
			isPauseModalOpen: false,
			pauseProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
			pauseReason: '',
		}));
	};

	const resetResumeState = () => {
		setState((prev) => ({
			...prev,
			isResumeModalOpen: false,
			resumeProrationBehavior: subscription.proration_behavior ?? SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
		}));
	};

	const getCancelImmediatelyInvoicePolicy = () =>
		state.cancelGenerateInvoice
			? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
			: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP;
	const minCancelScheduledAt = useMemo(() => new Date(), []);

	const { mutate: pauseSubscription, isPending: isPauseLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.pauseSubscription(id, {
				proration_behavior: state.pauseProrationBehavior,
				...(state.pauseReason.trim() ? { reason: state.pauseReason.trim() } : {}),
			}),
		onSuccess: async () => {
			resetPauseState();
			toast.success(t('customers:organisms.subscriptionAction.pauseSuccess'));
			await refetchSubscriptionQueries();
			await refetchQueries(['subscriptionInvoices']);
		},
		onError: (err: Error) => {
			resetPauseState();
			toast.error(err.message || t('customers:organisms.subscriptionAction.pauseError'));
		},
	});

	const { mutate: resumeSubscription, isPending: isResumeLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.resumeSubscription(id, {
				proration_behavior: state.resumeProrationBehavior,
			}),
		onSuccess: async () => {
			resetResumeState();
			toast.success(t('customers:organisms.subscriptionAction.resumeSuccess'));
			await refetchSubscriptionQueries();
			await refetchQueries(['subscriptionInvoices']);
		},
		onError: (err: Error) => {
			resetResumeState();
			toast.error(err.message || t('customers:organisms.subscriptionAction.resumeError'));
		},
	});

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
			toast.success('Subscription cancelled successfully');
			await refetchSubscriptionQueries();
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
			toast.success('Subscription activated successfully');
			await refetchSubscriptionQueries();
			await refetchQueries(['subscriptionInvoices']);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to activate subscription');
		},
	});

	const isCancelled = subscription.subscription_status.toUpperCase() === 'CANCELLED';
	const isDraft = subscription.subscription_status === SUBSCRIPTION_STATUS.DRAFT;
	const isActive = subscription.subscription_status === SUBSCRIPTION_STATUS.ACTIVE;
	const isPaused = subscription.subscription_status === SUBSCRIPTION_STATUS.PAUSED;
	const readOnly = isInheritedSubscription(subscription);

	const menuOptions: DropdownMenuOption[] = [
		getCopyIdOption(subscription.id, tc, { entityType: 'Subscription' }),
		...(isDraft
			? [
					{
						label: 'Activate Subscription',
						icon: <Play className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isActivateModalOpen: true })),
						disabled: readOnly || !canWriteSubscription,
						disabledReason: !readOnly && !canWriteSubscription ? t('customers:organisms.subscriptionAction.writeDeniedTooltip') : undefined,
					},
				]
			: []),
		{
			label: 'Edit Subscription',
			icon: <Pencil className='h-4 w-4' />,
			onSelect: () => navigate(`${RouteNames.subscriptions}/${subscription.id}/edit`),
			disabled: isCancelled || readOnly || !canWriteSubscription,
			disabledReason:
				!isCancelled && !readOnly && !canWriteSubscription ? t('customers:organisms.subscriptionAction.writeDeniedTooltip') : undefined,
		},
		{
			label: 'Alert Settings',
			icon: <Bell className='h-4 w-4' />,
			onSelect: () => setState((prev) => ({ ...prev, isAlertSettingsOpen: true })),
			disabled: readOnly || !canWriteAlertSettings,
			disabledReason:
				!readOnly && !canWriteAlertSettings ? t('customers:organisms.subscriptionAction.alertSettingsWriteDeniedTooltip') : undefined,
		},
		...(isActive
			? [
					{
						label: t('customers:organisms.subscriptionAction.pauseSubscription'),
						icon: <CirclePause className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isPauseModalOpen: true })),
						disabled: readOnly || !canWriteSubscription,
						disabledReason: !readOnly && !canWriteSubscription ? t('customers:organisms.subscriptionAction.writeDeniedTooltip') : undefined,
						className: 'text-warning',
					},
				]
			: []),
		...(isPaused
			? [
					{
						label: t('customers:organisms.subscriptionAction.resumeSubscription'),
						icon: <CirclePlay className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isResumeModalOpen: true })),
						disabled: readOnly || !canWriteSubscription,
						disabledReason: !readOnly && !canWriteSubscription ? t('customers:organisms.subscriptionAction.writeDeniedTooltip') : undefined,
						className: 'text-success',
					},
				]
			: []),
		{
			label: 'Cancel Subscription',
			icon: <X className='h-4 w-4' />,
			onSelect: () => setState((prev) => ({ ...prev, isCancelModalOpen: true })),
			disabled: isCancelled || readOnly || !canWriteSubscription,
			disabledReason:
				!isCancelled && !readOnly && !canWriteSubscription ? t('customers:organisms.subscriptionAction.writeDeniedTooltip') : undefined,
			className: 'text-destructive',
		},
	];

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
				className='card bg-surface w-[560px] max-w-[90vw]'>
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
									clearable
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

			{/* Pause Modal */}
			<Modal
				isOpen={state.isPauseModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						resetPauseState();
						return;
					}
					setState((prev) => ({ ...prev, isPauseModalOpen: open }));
				}}
				className='card bg-surface w-[560px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader
						title={t('customers:organisms.subscriptionAction.pauseTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.pauseSubtitle')}
						titleClassName='!mb-1'
						subtitleClassName='!text-sm !max-w-[440px] !leading-6'
					/>
					<div className='space-y-4'>
						<Select
							label={t('customers:organisms.subscriptionAction.pauseMode')}
							value={PAUSE_MODE_IMMEDIATE}
							options={[{ label: t('customers:organisms.subscriptionAction.pauseImmediate'), value: PAUSE_MODE_IMMEDIATE }]}
							disabled
						/>
						<Select
							label={t('customers:organisms.subscriptionAction.prorationBehavior')}
							value={state.pauseProrationBehavior}
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
									pauseProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
								}))
							}
						/>
						<Input
							label={t('customers:organisms.subscriptionAction.reasonOptional')}
							value={state.pauseReason}
							onChange={(value) => setState((prev) => ({ ...prev, pauseReason: value }))}
							placeholder={t('customers:organisms.subscriptionAction.pauseReasonPlaceholder')}
						/>
					</div>
					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' onClick={() => resetPauseState()} disabled={isPauseLoading}>
							{t('customers:organisms.subscriptionAction.keepSubscription')}
						</Button>
						<Button
							className='bg-warning border-warning text-white hover:bg-warning/90'
							onClick={() => pauseSubscription(subscription.id)}
							disabled={isPauseLoading}>
							{isPauseLoading ? t('customers:organisms.subscriptionAction.pausing') : t('customers:organisms.subscriptionAction.yesPause')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Resume Modal */}
			<Modal
				isOpen={state.isResumeModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						resetResumeState();
						return;
					}
					setState((prev) => ({ ...prev, isResumeModalOpen: open }));
				}}
				className='card bg-surface w-[560px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader
						title={t('customers:organisms.subscriptionAction.resumeTitle')}
						variant='sub-header'
						subtitle={t('customers:organisms.subscriptionAction.resumeSubtitle')}
						titleClassName='!mb-1'
						subtitleClassName='!text-sm !max-w-[440px] !leading-6'
					/>
					<Select
						label={t('customers:organisms.subscriptionAction.prorationBehavior')}
						value={state.resumeProrationBehavior}
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
								resumeProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
							}))
						}
					/>
					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' onClick={() => resetResumeState()} disabled={isResumeLoading}>
							{t('common:actions.cancel')}
						</Button>
						<Button
							className='bg-success border-success text-white hover:bg-success/90'
							onClick={() => resumeSubscription(subscription.id)}
							disabled={isResumeLoading}>
							{isResumeLoading
								? t('customers:organisms.subscriptionAction.resuming')
								: t('customers:organisms.subscriptionAction.yesResume')}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Activate Modal */}
			<Modal
				isOpen={state.isActivateModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isActivateModalOpen: open }))}
				className='bg-surface rounded-lg p-6 w-[560px] max-w-[90vw]'>
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
