import { Card, CardHeader, Button, Input, Loader, Select, Textarea, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { DEFAULT_CUSTOMER_ONBOARDING_CONFIG, type CustomerOnboardingConfig, type CustomerOnboardingAction } from '@/types/dto/OrgSettings';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const SETTING_KEY = 'customer_onboarding';

const ACTION_TYPE_OPTIONS: SelectOption[] = [
	{ value: 'create_customer', label: 'Create customer' },
	{ value: 'create_wallet', label: 'Create wallet' },
	{ value: 'create_subscription', label: 'Create subscription' },
	{ value: 'create_feature_and_price', label: 'Create feature and price' },
];

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

function ActionRow({
	action,
	onChange,
	onRemove,
	canRemove,
}: {
	action: CustomerOnboardingAction;
	onChange: (a: CustomerOnboardingAction) => void;
	onRemove: () => void;
	canRemove: boolean;
}) {
	const type = action.action;
	return (
		<div className='p-4 rounded-lg border border-gray-200 bg-white space-y-3'>
			<div className='flex items-center justify-between gap-2'>
				<Select
					options={ACTION_TYPE_OPTIONS}
					value={type}
					onChange={(value) => {
						switch (value) {
							case 'create_customer':
								onChange({ action: 'create_customer' });
								break;
							case 'create_wallet':
								onChange({ action: 'create_wallet', currency: 'USD' });
								break;
							case 'create_subscription':
								onChange({ action: 'create_subscription', plan_id: '' });
								break;
							case 'create_feature_and_price':
								onChange({ action: 'create_feature_and_price', plan_id: '' });
								break;
							default:
								onChange(action);
						}
					}}
					className='w-48'
				/>
				{canRemove && (
					<Button type='button' variant='outline' size='sm' onClick={onRemove} aria-label='Remove action'>
						<Trash2 className='h-4 w-4' />
					</Button>
				)}
			</div>
			{type === 'create_customer' && 'default_user_id' in action && (
				<div>
					<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Default user ID (optional)</label>
					<Input
						value={action.default_user_id ?? ''}
						onChange={(v) => onChange({ ...action, default_user_id: v || undefined })}
						placeholder='Optional'
					/>
				</div>
			)}
			{type === 'create_wallet' && 'currency' in action && (
				<div className='grid grid-cols-2 gap-3'>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Currency</label>
						<Input value={action.currency} onChange={(v) => onChange({ ...action, currency: v })} />
					</div>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Conversion rate (optional)</label>
						<Input
							type='number'
							value={action.conversion_rate != null ? String(action.conversion_rate) : ''}
							onChange={(v) =>
								onChange({
									...action,
									conversion_rate: v ? parseFloat(v) : undefined,
								})
							}
							placeholder='Optional'
						/>
					</div>
				</div>
			)}
			{type === 'create_subscription' && 'plan_id' in action && (
				<div className='grid grid-cols-2 gap-3'>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Plan ID</label>
						<Input value={action.plan_id} onChange={(v) => onChange({ ...action, plan_id: v })} />
					</div>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Billing cycle</label>
						<Select
							options={[
								{ value: 'anniversary', label: 'Anniversary' },
								{ value: 'calendar', label: 'Calendar' },
							]}
							value={action.billing_cycle ?? ''}
							onChange={(v) => onChange({ ...action, billing_cycle: (v as 'anniversary' | 'calendar') || undefined })}
							placeholder='Optional'
						/>
					</div>
					<div className='col-span-2'>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Start date (optional)</label>
						<Input
							value={action.start_date ?? ''}
							onChange={(v) => onChange({ ...action, start_date: v || undefined })}
							placeholder='Optional'
						/>
					</div>
				</div>
			)}
			{type === 'create_feature_and_price' && 'plan_id' in action && (
				<div className='grid grid-cols-2 gap-3'>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Plan ID</label>
						<Input value={action.plan_id} onChange={(v) => onChange({ ...action, plan_id: v })} />
					</div>
					<div>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Feature type</label>
						<Select
							options={[
								{ value: 'metered', label: 'Metered' },
								{ value: 'boolean', label: 'Boolean' },
								{ value: 'static', label: 'Static' },
							]}
							value={action.feature_type ?? ''}
							onChange={(v) =>
								onChange({
									...action,
									feature_type: (v as 'metered' | 'boolean' | 'static') || undefined,
								})
							}
							placeholder='Optional'
						/>
					</div>
					<div className='col-span-2'>
						<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Price start date/time (optional)</label>
						<Input
							value={action.price_start_date_time ?? ''}
							onChange={(v) => onChange({ ...action, price_start_date_time: v || undefined })}
							placeholder='Optional'
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export function CustomerOnboardingSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<CustomerOnboardingConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_CUSTOMER_ONBOARDING_CONFIG,
		});

	const [inlineError, setInlineError] = useState<string | null>(null);

	const jsonEditor = useJsonEditor({
		initialValue: formValue,
		sendCompleteConfig: true,
		validate: (value) => {
			if (value.actions.length === 0) {
				return 'At least one action is required. First action must be Create customer.';
			}
			if (value.actions[0].action !== 'create_customer') {
				return 'First action must be Create customer.';
			}
			return null;
		},
		onSave: (data) => {
			saveMutation.mutate(data as CustomerOnboardingConfig);
			setFormValue((prev) => ({ ...prev, ...(data as CustomerOnboardingConfig) }));
		},
	});

	const validate = (): boolean => {
		if (formValue.actions.length === 0) {
			setInlineError('At least one action is required. First action must be Create customer.');
			return false;
		}
		if (formValue.actions[0].action !== 'create_customer') {
			setInlineError('First action must be Create customer.');
			return false;
		}
		setInlineError(null);
		return true;
	};

	const handleSave = () => {
		if (!validate()) return;
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
	};

	const updateAction = (index: number, next: CustomerOnboardingAction) => {
		setFormValue((prev) => {
			const actions = [...prev.actions];
			actions[index] = next;
			return { ...prev, actions };
		});
	};

	const addAction = () => {
		setFormValue((prev) => ({
			...prev,
			actions: [...prev.actions, { action: 'create_customer' }],
		}));
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
				title='Customer onboarding workflow'
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
						{inlineError && (
							<div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800' role='alert'>
								{inlineError}
							</div>
						)}
						<p className='text-sm text-zinc-600'>
							Workflow type: <strong>customer_onboarding</strong>. First action must be Create customer.
						</p>
						<div className='flex items-center justify-between'>
							<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide'>Actions</label>
							<Button type='button' variant='outline' size='sm' onClick={addAction}>
								<Plus className='h-3.5 w-3.5 mr-1' />
								Add action
							</Button>
						</div>
						<div className='space-y-3'>
							{formValue.actions.map((action, index) => (
								<ActionRow
									key={index}
									action={action}
									onChange={(next) => updateAction(index, next)}
									onRemove={() => removeAction(index)}
									canRemove={formValue.actions.length > 1}
								/>
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
								description='Edit the customer onboarding configuration directly in JSON format. Only changed values will be saved.'
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
