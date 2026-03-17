import { Card, CardHeader, Button, Input, Loader, Select, Textarea, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import {
	DEFAULT_PREPARE_PROCESSED_EVENTS_CONFIG,
	type PrepareProcessedEventsConfig,
	type PrepareProcessedEventsAction,
	type MeterAggregationType,
	type ResetUsageType,
} from '@/types/dto/OrgSettings';
import { Plus, Trash2 } from 'lucide-react';

const SETTING_KEY = 'prepare_processed_events_config';

const AGGREGATION_OPTIONS: SelectOption[] = [
	{ value: 'COUNT', label: 'COUNT' },
	{ value: 'SUM', label: 'SUM' },
	{ value: 'AVG', label: 'AVG' },
	{ value: 'COUNT_UNIQUE', label: 'COUNT_UNIQUE' },
	{ value: 'LATEST', label: 'LATEST' },
	{ value: 'SUM_WITH_MULTIPLIER', label: 'SUM_WITH_MULTIPLIER' },
	{ value: 'MAX', label: 'MAX' },
	{ value: 'WEIGHTED_SUM', label: 'WEIGHTED_SUM' },
];

const RESET_USAGE_OPTIONS: SelectOption[] = [
	{ value: 'BILLING_PERIOD', label: 'Billing period' },
	{ value: 'NEVER', label: 'Never' },
];

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function PrepareProcessedEventsConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<PrepareProcessedEventsConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_PREPARE_PROCESSED_EVENTS_CONFIG,
		});

	const jsonEditor = useJsonEditor({
		initialValue: formValue,
		sendCompleteConfig: true,
		onSave: (data) => {
			saveMutation.mutate(data as PrepareProcessedEventsConfig);
			setFormValue((prev) => ({ ...prev, ...(data as PrepareProcessedEventsConfig) }));
		},
	});

	const handleSave = () => {
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
	};

	const addAction = () => {
		setFormValue((prev) => ({
			...prev,
			actions: [
				...prev.actions,
				{
					action: 'create_feature_and_price',
					feature_type: undefined,
					meter: undefined,
					price: undefined,
				},
			],
		}));
	};

	const updateAction = (index: number, patch: Partial<PrepareProcessedEventsAction>) => {
		setFormValue((prev) => {
			const actions = [...prev.actions];
			const current = actions[index];
			if (current.action === 'create_feature_and_price' && patch.action !== 'rollout_to_subscriptions') {
				actions[index] = { ...current, ...patch } as Extract<PrepareProcessedEventsAction, { action: 'create_feature_and_price' }>;
			} else if (current.action === 'rollout_to_subscriptions' && patch.action !== 'create_feature_and_price') {
				actions[index] = { ...current, ...patch } as Extract<PrepareProcessedEventsAction, { action: 'rollout_to_subscriptions' }>;
			} else if (patch.action === 'rollout_to_subscriptions') {
				actions[index] = { action: 'rollout_to_subscriptions', plan_id: '' };
			} else if (patch.action === 'create_feature_and_price') {
				actions[index] = {
					action: 'create_feature_and_price',
					feature_type: undefined,
					meter: undefined,
					price: undefined,
				};
			} else {
				actions[index] = { ...current, ...patch } as PrepareProcessedEventsAction;
			}
			return { ...prev, actions };
		});
	};

	const removeAction = (index: number) => {
		setFormValue((prev) => ({
			...prev,
			actions: prev.actions.filter((_, i) => i !== index),
		}));
	};

	if (isLoading) {
		return (
			<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
				<div className='p-6'>
					<Loader />
				</div>
			</Card>
		);
	}

	return (
		<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
			<CardHeader
				title='Prepare processed events'
				titleClassName='text-lg font-medium text-zinc-800'
				cta={
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' onClick={handleReset} disabled={resetMutation.isPending}>
							Reset to default
						</Button>
						<Button variant='outline' size='sm' onClick={jsonEditor.toggleEditor}>
							{jsonEditor.showJsonEditor ? 'Form View' : 'JSON Editor'}
						</Button>
						<Button
							size='sm'
							onClick={jsonEditor.showJsonEditor ? jsonEditor.handleJsonSave : handleSave}
							disabled={saveMutation.isPending}
							isLoading={saveMutation.isPending}>
							Save
						</Button>
					</div>
				}
			/>
			<div className='border-t border-gray-100 pt-4 px-6 pb-6 space-y-4'>
				{!jsonEditor.showJsonEditor ? (
					<div className='space-y-4'>
						{isError && (
							<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
								Failed to load settings.{' '}
								<button type='button' onClick={() => refetch()} className='underline font-medium'>
									Retry
								</button>
							</div>
						)}
						<p className='text-sm text-zinc-600'>
							Workflow type: <strong>prepare_processed_events</strong>. Auto-create feature/meter/price from events.
						</p>
						<div className='flex items-center justify-between'>
							<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide'>Actions</label>
							<Button type='button' variant='outline' size='sm' onClick={addAction}>
								<Plus className='h-3.5 w-3.5 mr-1' />
								Add action
							</Button>
						</div>
						<div className='space-y-4'>
							{formValue.actions.map((act, index) => (
								<div key={index} className='p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3'>
									<div className='flex items-center justify-between gap-2'>
										<Select
											options={[
												{ value: 'create_feature_and_price', label: 'Create feature and price' },
												{ value: 'rollout_to_subscriptions', label: 'Rollout to subscriptions' },
											]}
											value={act.action}
											onChange={(v) => {
												if (v === 'rollout_to_subscriptions') {
													updateAction(index, { action: 'rollout_to_subscriptions', plan_id: '' });
												} else {
													updateAction(index, {
														action: 'create_feature_and_price',
														feature_type: undefined,
														meter: undefined,
														price: undefined,
													});
												}
											}}
											className='w-56'
										/>
										<Button type='button' variant='outline' size='sm' onClick={() => removeAction(index)} aria-label='Remove action'>
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
									{act.action === 'rollout_to_subscriptions' && (
										<div>
											<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Plan ID</label>
											<Input value={act.plan_id} onChange={(v) => updateAction(index, { ...act, plan_id: v })} />
										</div>
									)}
									{act.action === 'create_feature_and_price' && (
										<>
											<div>
												<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Feature type</label>
												<Input
													value={act.feature_type ?? ''}
													onChange={(v) => updateAction(index, { ...act, feature_type: v || undefined })}
													placeholder='Optional'
												/>
											</div>
											{act.meter && (
												<div className='grid grid-cols-3 gap-2'>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Meter aggregation</label>
														<Select
															options={AGGREGATION_OPTIONS}
															value={act.meter.aggregation_type}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	meter: { ...act.meter!, aggregation_type: v as MeterAggregationType },
																})
															}
														/>
													</div>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Aggregation field</label>
														<Input
															value={act.meter.aggregation_field ?? ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	meter: { ...act.meter!, aggregation_field: v || undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Reset usage</label>
														<Select
															options={RESET_USAGE_OPTIONS}
															value={act.meter.reset_usage ?? ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	meter: { ...act.meter!, reset_usage: (v as ResetUsageType) || undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
												</div>
											)}
											<div className='flex gap-2'>
												{!act.meter ? (
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() =>
															updateAction(index, {
																...act,
																meter: {
																	aggregation_type: 'COUNT',
																	aggregation_field: undefined,
																	reset_usage: undefined,
																},
															})
														}>
														Add meter
													</Button>
												) : (
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() => updateAction(index, { ...act, meter: undefined })}>
														Remove meter
													</Button>
												)}
												{!act.price ? (
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() =>
															updateAction(index, {
																...act,
																price: {},
															})
														}>
														Add price
													</Button>
												) : (
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() => updateAction(index, { ...act, price: undefined })}>
														Remove price
													</Button>
												)}
											</div>
											{act.price && (
												<div className='grid grid-cols-2 gap-2 pt-2 border-t border-gray-100'>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Billing cadence</label>
														<Input
															value={act.price.billing_cadence ?? ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	price: { ...act.price!, billing_cadence: v || undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Currency</label>
														<Input
															value={act.price.currency ?? ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	price: { ...act.price!, currency: v || undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Amount</label>
														<Input
															type='number'
															value={act.price.amount != null ? String(act.price.amount) : ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	price: { ...act.price!, amount: v ? parseFloat(v) : undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
													<div>
														<label className='block text-xs font-medium text-zinc-500 mb-1'>Type</label>
														<Input
															value={act.price.type ?? ''}
															onChange={(v) =>
																updateAction(index, {
																	...act,
																	price: { ...act.price!, type: v || undefined },
																})
															}
															placeholder='Optional'
														/>
													</div>
												</div>
											)}
										</>
									)}
								</div>
							))}
						</div>
						{getFieldError(backendDetails, 'actions') && (
							<p className='text-sm text-red-600' role='alert'>
								{getFieldError(backendDetails, 'actions')}
							</p>
						)}
					</div>
				) : (
					<div className='space-y-4'>
						{isError && (
							<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
								Failed to load settings.{' '}
								<button type='button' onClick={() => refetch()} className='underline font-medium'>
									Retry
								</button>
							</div>
						)}
						<div>
							<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
								JSON Configuration (Developer Mode)
							</label>
							<Textarea
								value={jsonEditor.jsonValue}
								onChange={jsonEditor.setJsonValue}
								placeholder='Paste or edit JSON configuration here...'
								error={jsonEditor.jsonError}
								description='Edit the prepare processed events configuration directly in JSON format. Only changed values will be saved.'
								textAreaClassName='min-h-[400px] font-mono text-sm'
							/>
							{jsonEditor.jsonError && (
								<p className='mt-1 text-sm text-red-600' role='alert'>
									{jsonEditor.jsonError}
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
