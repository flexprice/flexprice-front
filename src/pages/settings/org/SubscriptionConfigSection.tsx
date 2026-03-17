import { Card, CardHeader, Button, Input, Loader, Textarea } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { DEFAULT_SUBSCRIPTION_CONFIG, type SubscriptionConfig } from '@/types/dto/OrgSettings';
import { useState } from 'react';

const SETTING_KEY = 'subscription_config';

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function SubscriptionConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<SubscriptionConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_SUBSCRIPTION_CONFIG,
		});

	const [inlineErrors, setInlineErrors] = useState<Partial<Record<keyof SubscriptionConfig, string>>>({});

	const jsonEditor = useJsonEditor({
		initialValue: formValue,
		sendCompleteConfig: true,
		validate: (value) => {
			if (value.grace_period_days < 1) {
				return 'Grace period must be at least 1';
			}
			if (typeof value.grace_period_days !== 'number' || Number.isNaN(value.grace_period_days)) {
				return 'Grace period is required';
			}
			return null;
		},
		onSave: (data) => {
			saveMutation.mutate(data as SubscriptionConfig);
			setFormValue((prev) => ({ ...prev, ...(data as SubscriptionConfig) }));
		},
	});

	const validate = (): boolean => {
		const errs: Partial<Record<keyof SubscriptionConfig, string>> = {};
		if (formValue.grace_period_days < 1) {
			errs.grace_period_days = 'Must be at least 1';
		}
		if (typeof formValue.grace_period_days !== 'number' || Number.isNaN(formValue.grace_period_days)) {
			errs.grace_period_days = errs.grace_period_days || 'Required';
		}
		setInlineErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSave = () => {
		if (!validate()) return;
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
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

	const graceError = inlineErrors.grace_period_days ?? getFieldError(backendDetails, 'grace_period_days');

	return (
		<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
			<CardHeader
				title='Subscription settings'
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
						<div>
							<label htmlFor='grace_period_days' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
								Grace period (days)
							</label>
							<Input
								id='grace_period_days'
								type='number'
								min={1}
								value={formValue.grace_period_days}
								onChange={(value) =>
									setFormValue((prev) => ({
										...prev,
										grace_period_days: value ? parseInt(value, 10) : 0,
									}))
								}
								className={graceError ? 'border-red-500' : ''}
							/>
							{graceError && (
								<p className='mt-1 text-sm text-red-600' role='alert'>
									{graceError}
								</p>
							)}
						</div>
						<div className='flex items-center gap-2'>
							<input
								id='auto_cancellation_enabled'
								type='checkbox'
								checked={formValue.auto_cancellation_enabled}
								onChange={(e) =>
									setFormValue((prev) => ({
										...prev,
										auto_cancellation_enabled: e.target.checked,
									}))
								}
								className='h-4 w-4 rounded border-gray-300'
							/>
							<label htmlFor='auto_cancellation_enabled' className='text-sm text-zinc-700'>
								Auto-cancellation enabled
							</label>
						</div>
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
								description='Edit the subscription configuration directly in JSON format. Only changed values will be saved.'
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
