import {
	Subscription,
	SUBSCRIPTION_PRORATION_BEHAVIOR,
	SUBSCRIPTION_CANCELLATION_TYPE,
	SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY,
	SUBSCRIPTION_STATUS,
} from '@/models/Subscription';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CirclePause, CirclePlay, X, Plus, Pencil, Play, ArrowUpCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import SubscriptionApi from '@/api/SubscriptionApi';
import { PlanApi } from '@/api/PlanApi';
import { DatePicker, Modal, Input, Button, FormHeader, Spacer, Select, Toggle } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import DropdownMenu, { DropdownMenuOption } from '@/components/molecules/DropdownMenu/DropdownMenu';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { addDays, format } from 'date-fns';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { ServerError } from '@/core/axios/types';
import { PlanResponse } from '@/types/dto';
import { PreviewSubscriptionChangeResponse, ExecuteSubscriptionChangeResponse } from '@/types/dto/Subscription';

interface ComponentState {
	isPauseModalOpen: boolean;
	isResumeModalOpen: boolean;
	isCancelModalOpen: boolean;
	isAddPhaseModalOpen: boolean;
	isActivateModalOpen: boolean;
	isChangePlanModalOpen: boolean;
	pauseStartDate: Date;
	pauseDays: string;
	pauseReason: string;
	activateStartDate: Date;
	cancelCancellationType: SUBSCRIPTION_CANCELLATION_TYPE;
	cancelProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR;
	cancelGenerateInvoice: boolean;
	cancelReason: string;
	selectedPlanId: string;
	changeProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR;
	changeGenerateInvoice: boolean;
	changeAt: string;
	metadata: Record<string, any>;
	previewData?: PreviewSubscriptionChangeResponse;
}

interface Props {
	subscription: Subscription;
}

const SubscriptionActionButton: React.FC<Props> = ({ subscription }) => {
	const navigate = useNavigate();
	const [state, setState] = useState<ComponentState>({
		isPauseModalOpen: false,
		isResumeModalOpen: false,
		isCancelModalOpen: false,
		isAddPhaseModalOpen: false,
		isActivateModalOpen: false,
		isChangePlanModalOpen: false,
		pauseStartDate: new Date(),
		pauseDays: '',
		pauseReason: '',
		activateStartDate: new Date(),
		cancelCancellationType: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
		cancelProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
		cancelGenerateInvoice: false,
		cancelReason: '',
		selectedPlanId: '',
		changeProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
		changeGenerateInvoice: false,
		changeAt: '',
		metadata: {},
	});

	const resetCancelState = () => {
		setState((prev) => ({
			...prev,
			isCancelModalOpen: false,
			cancelCancellationType: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE,
			cancelProrationBehavior: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE,
			cancelGenerateInvoice: false,
			cancelReason: '',
		}));
	};

	// Fetch available plans for upgrade/downgrade
	const { data: plansData, isLoading: plansLoading } = useQuery({
		queryKey: ['plans'],
		queryFn: () => PlanApi.getPlansByFilter({ limit: 100 }),
	});

	const availablePlans = useMemo(() => {
		if (!plansData?.items) return [];
		return plansData.items.filter((plan: PlanResponse) => plan.id !== subscription.plan_id);
	}, [plansData, subscription.plan_id]);

	const { mutate: previewChange, isPending: isPreviewLoading } = useMutation({
		mutationFn: (data: { subscriptionId: string; planId: string }) =>
			SubscriptionApi.previewSubscriptionChange(data.subscriptionId, {
				target_plan_id: data.planId,
				billing_cadence: subscription.billing_cadence,
				billing_period: subscription.billing_period,
				billing_period_count: subscription.billing_period_count,
				billing_cycle: subscription.billing_cycle,
				change_at: state.changeAt,
				proration_behavior: state.changeProrationBehavior,
				invoice_behavior: state.changeGenerateInvoice
					? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
					: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP,
				metadata: state.metadata,
			}),
		onSuccess: (previewData) => {
			// Store preview data and show confirmation
			setState((prev) => ({
				...prev,
				previewData,
			}));
			// Auto-execute after successful preview
			executeChange({ subscriptionId: subscription.id, planId: state.selectedPlanId });
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to preview subscription change');
		},
	});

	const { mutate: executeChange, isPending: isExecuteLoading } = useMutation({
		mutationFn: (data: { subscriptionId: string; planId: string }) =>
			SubscriptionApi.executeSubscriptionChange(data.subscriptionId, {
				target_plan_id: data.planId,
				billing_cadence: subscription.billing_cadence,
				billing_period: subscription.billing_period,
				billing_period_count: subscription.billing_period_count,
				billing_cycle: subscription.billing_cycle,
				change_at: state.changeAt,
				proration_behavior: state.changeProrationBehavior,
				invoice_behavior: state.changeGenerateInvoice
					? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
					: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP,
				metadata: state.metadata,
			}),
		onSuccess: async (response: ExecuteSubscriptionChangeResponse) => {
			setState((prev) => ({ ...prev, isChangePlanModalOpen: false, selectedPlanId: '', previewData: undefined }));
			toast.success('Subscription changed successfully');
			// API returns new_subscription when the subscription was replaced (e.g. downgrade creates new sub).
			// Navigate to the new subscription so we don't refetch the old (cancelled) one and trigger 404 / error boundary.
			if (response.new_subscription?.id && response.new_subscription.id !== subscription.id) {
				navigate(`${RouteNames.customers}/${subscription.customer_id}/subscription/${response.new_subscription.id}`);
				await refetchQueries(['subscriptionDetails', response.new_subscription.id]);
			} else {
				await refetchQueries(['subscriptionDetails', subscription.id]);
			}
			await refetchQueries(['subscriptions']);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to change subscription');
		},
	});

	const getCancelImmediatelyInvoicePolicy = () =>
		state.cancelGenerateInvoice
			? SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.GENERATE_INVOICE
			: SUBSCRIPTION_CANCEL_IMMEDIATELY_INVOICE_POLICY.SKIP;

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
		onError: (error: ServerError) => {
			setState((prev) => ({ ...prev, isPauseModalOpen: false }));
			toast.error(error.error.message || 'Failed to pause subscription');
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
		onError: (err: ServerError) => {
			setState((prev) => ({ ...prev, isResumeModalOpen: false }));
			toast.error(err.error.message || 'Failed to resume subscription');
		},
	});

	const { mutate: cancelSubscription, isPending: isCancelLoading } = useMutation({
		mutationFn: (id: string) =>
			SubscriptionApi.cancelSubscription(id, {
				proration_behavior: state.cancelProrationBehavior,
				cancellation_type: state.cancelCancellationType,
				cancel_immediately_inovice_policy: getCancelImmediatelyInvoicePolicy(),
				...(state.cancelReason.trim() ? { reason: state.cancelReason.trim() } : {}),
			}),
		onSuccess: async () => {
			resetCancelState();
			toast.success('Subscription cancelled successfully');
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
		},
		onError: (err: ServerError) => {
			resetCancelState();
			toast.error(err.error.message || 'Failed to cancel subscription');
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
			await refetchQueries(['subscriptionDetails']);
			await refetchQueries(['subscriptions']);
			await refetchQueries(['subscriptionInvoices']);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to activate subscription');
		},
	});

	const isPaused = subscription.subscription_status.toUpperCase() === 'PAUSED';
	const isCancelled = subscription.subscription_status.toUpperCase() === 'CANCELLED';
	const isDraft = subscription.subscription_status === SUBSCRIPTION_STATUS.DRAFT;

	const menuOptions: DropdownMenuOption[] = [
		...(isDraft
			? [
					{
						label: 'Activate Subscription',
						icon: <Play className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isActivateModalOpen: true })),
					},
				]
			: []),
		{
			label: 'Edit Subscription',
			icon: <Pencil className='h-4 w-4' />,
			onSelect: () => navigate(`${RouteNames.subscriptions}/${subscription.id}/edit`),
			disabled: isCancelled,
		},
		...(!isPaused && !isCancelled && !isDraft
			? [
					{
						label: 'Change Plan',
						icon: <ArrowUpCircle className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isChangePlanModalOpen: true })),
						disabled: isCancelled || availablePlans.length === 0,
					},
					{
						label: 'Pause Subscription',
						icon: <CirclePause className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isPauseModalOpen: true })),
						disabled: isPaused || isCancelled,
					},
					{
						label: 'Add Subscription Phase',
						icon: <Plus className='h-4 w-4' />,
						onSelect: () => setState((prev) => ({ ...prev, isAddPhaseModalOpen: true })),
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
						title='Cancel Subscription'
						variant='sub-header'
						subtitle='This action cannot be undone. Choose cancellation and invoice behavior before continuing.'
						titleClassName='!mb-1'
						subtitleClassName='!text-sm !max-w-[440px] !leading-6'
					/>
					<div className='space-y-4'>
						<Select
							label='Cancellation Type'
							value={state.cancelCancellationType}
							options={[
								{ label: 'Immediate', value: SUBSCRIPTION_CANCELLATION_TYPE.IMMEDIATE },
								{ label: 'End of period', value: SUBSCRIPTION_CANCELLATION_TYPE.END_OF_PERIOD },
							]}
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									cancelCancellationType: value as SUBSCRIPTION_CANCELLATION_TYPE,
								}))
							}
						/>
						<Select
							label='Proration Behavior'
							value={state.cancelProrationBehavior}
							options={[
								{ label: 'None', value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
								{ label: 'Create prorations', value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS },
							]}
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									cancelProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
								}))
							}
						/>
						<Toggle
							title='Invoice behavior'
							label='Generate invoice'
							description='Enable to generate an invoice for usage till the cancellation date.'
							checked={state.cancelGenerateInvoice}
							onChange={(checked) => setState((prev) => ({ ...prev, cancelGenerateInvoice: checked }))}
						/>
						<Input
							label='Reason (optional)'
							value={state.cancelReason}
							onChange={(value) => setState((prev) => ({ ...prev, cancelReason: value }))}
							placeholder='Why is this subscription being cancelled?'
						/>
					</div>
					<div className='flex justify-end gap-3 pt-4'>
						<Button variant='outline' onClick={() => resetCancelState()} disabled={isCancelLoading}>
							No, Keep It
						</Button>
						<Button variant='destructive' onClick={() => cancelSubscription(subscription.id)} disabled={isCancelLoading}>
							{isCancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
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
						title='Activate Subscription'
						variant='sub-header'
						subtitle='Activating the subscription will start the billing cycle from the selected start date.'
					/>
					<Spacer className='!my-6' />
					<div className='w-full'>
						<DatePicker
							label='Start Date'
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
							Cancel
						</Button>
						<Button
							onClick={() => activateSubscription(subscription.id)}
							disabled={isActivating || !state.activateStartDate}
							className='px-6'>
							{isActivating ? 'Activating...' : 'Activate'}
						</Button>
					</div>
				</div>
			</Modal>
			{/* Change Plan Modal */}
			<Modal
				isOpen={state.isChangePlanModalOpen}
				onOpenChange={(open) => setState((prev) => ({ ...prev, isChangePlanModalOpen: open }))}
				className='bg-white rounded-lg p-6 w-[640px] max-w-[90vw]'>
				<div className='space-y-4'>
					<FormHeader
						title='Upgrade Subscription Plan'
						variant='sub-header'
						subtitle='Select a new plan for this subscription. Preview changes before executing.'
					/>
					<Spacer className='!my-6' />

					<div className='space-y-4'>
						<Select
							label='Select New Plan'
							value={state.selectedPlanId}
							options={availablePlans.map((plan: PlanResponse) => ({
								value: plan.id,
								label: plan.name,
							}))}
							onChange={(value: string) => {
								setState((prev) => ({ ...prev, selectedPlanId: value, previewData: undefined }));
							}}
							placeholder='Choose a plan...'
							disabled={plansLoading || availablePlans.length === 0}
						/>

						<Select
							label='Proration Behavior'
							value={state.changeProrationBehavior}
							options={[
								{ label: 'None', value: SUBSCRIPTION_PRORATION_BEHAVIOR.NONE },
								{ label: 'Create Prorations', value: SUBSCRIPTION_PRORATION_BEHAVIOR.CREATE_PRORATIONS },
							]}
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									changeProrationBehavior: value as SUBSCRIPTION_PRORATION_BEHAVIOR,
									previewData: undefined,
								}))
							}
						/>

						<Select
							label='Change At'
							value={state.changeAt}
							options={[
								{ label: 'Immediate', value: 'immediate' },
								{ label: 'End of Period', value: 'end_of_period' },
							]}
							placeholder='Select an option'
							onChange={(value) =>
								setState((prev) => ({
									...prev,
									changeAt: value,
									previewData: undefined,
								}))
							}
						/>

						<Toggle
							title='Invoice behavior'
							label='Generate invoice'
							description='Enable to generate an invoice for usage till the change date.'
							checked={state.changeGenerateInvoice}
							onChange={(checked) =>
								setState((prev) => ({
									...prev,
									changeGenerateInvoice: checked,
									previewData: undefined,
								}))
							}
						/>

						{isPreviewLoading && (
							<div className='flex items-center justify-center py-4'>
								<div className='text-sm text-muted-foreground'>Loading preview...</div>
							</div>
						)}

						{state.previewData && !isPreviewLoading && (
							<div className='bg-muted/50 rounded-lg p-4 space-y-3'>
								<h4 className='font-medium text-sm'>Change Preview</h4>
								<div className='text-sm space-y-2'>
									<div className='flex justify-between'>
										<span>Proration Amount:</span>
										<span className='font-medium'>${parseFloat(state.previewData.proration_details.credit_amount).toFixed(2)}</span>
									</div>
									<div className='flex justify-between'>
										<span>Charge Amount:</span>
										<span className='font-medium'>${parseFloat(state.previewData.proration_details.charge_amount).toFixed(2)}</span>
									</div>
									<div className='flex justify-between'>
										<span>Net Amount:</span>
										<span className='font-medium'>${parseFloat(state.previewData.proration_details.net_amount).toFixed(2)}</span>
									</div>
									<div className='flex justify-between'>
										<span>Next Invoice Total:</span>
										<span className='font-medium'>${parseFloat(state.previewData.next_invoice_preview.total).toFixed(2)}</span>
									</div>
									<div className='flex justify-between'>
										<span>Effective Date:</span>
										<span className='font-medium'>{format(new Date(state.previewData.effective_date), 'do MMM yyyy')}</span>
									</div>
								</div>

								{state.previewData.warnings.length > 0 && (
									<div className='text-xs text-muted-foreground border-t pt-2'>
										<p>Warnings:</p>
										<ul className='list-disc list-inside space-y-1 mt-1'>
											{state.previewData.warnings.map((warning: string, index: number) => (
												<li key={index}>{warning}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						)}

						<div className='flex justify-end gap-3 pt-4 border-t'>
							<Button
								variant='outline'
								onClick={() => setState((prev) => ({ ...prev, isChangePlanModalOpen: false, selectedPlanId: '', previewData: undefined }))}
								disabled={isExecuteLoading || isPreviewLoading}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									// First preview, then execute
									previewChange({ subscriptionId: subscription.id, planId: state.selectedPlanId });
								}}
								disabled={!state.selectedPlanId || !state.changeAt || isPreviewLoading || isExecuteLoading}>
								{isPreviewLoading ? 'Loading...' : 'Execute Changes'}
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	);
};

export default SubscriptionActionButton;
