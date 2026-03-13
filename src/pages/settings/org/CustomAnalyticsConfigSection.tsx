import { Card, CardHeader, Button, Input, Loader, Select, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import {
	DEFAULT_CUSTOM_ANALYTICS_CONFIG,
	type CustomAnalyticsConfig,
	type CustomAnalyticsRule,
	type CustomAnalyticsTargetType,
} from '@/types/dto/OrgSettings';
import { Plus, Trash2 } from 'lucide-react';

const SETTING_KEY = 'custom_analytics_config';

const TARGET_TYPE_OPTIONS: SelectOption[] = [
	{ value: 'feature', label: 'Feature' },
	{ value: 'meter', label: 'Meter' },
	{ value: 'event_name', label: 'Event name' },
];

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function CustomAnalyticsConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<CustomAnalyticsConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_CUSTOM_ANALYTICS_CONFIG,
		});

	const handleSave = () => {
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
	};

	const addRule = () => {
		setFormValue((prev) => ({
			...prev,
			rules: [...prev.rules, { id: `rule-${Date.now()}`, target_type: 'feature', target_id: '' }],
		}));
	};

	const updateRule = (index: number, patch: Partial<CustomAnalyticsRule>) => {
		setFormValue((prev) => {
			const next = [...prev.rules];
			next[index] = { ...next[index], ...patch };
			return { ...prev, rules: next };
		});
	};

	const removeRule = (index: number) => {
		setFormValue((prev) => ({
			...prev,
			rules: prev.rules.filter((_, i) => i !== index),
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
				title='Custom analytics rules'
				titleClassName='text-lg font-medium text-zinc-800'
				cta={
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' onClick={handleReset} disabled={resetMutation.isPending}>
							Reset to default
						</Button>
						<Button size='sm' onClick={handleSave} disabled={saveMutation.isPending} isLoading={saveMutation.isPending}>
							Save
						</Button>
					</div>
				}
			/>
			<div className='border-t border-gray-100 pt-4 px-6 pb-6 space-y-4'>
				{isError && (
					<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
						Failed to load settings.{' '}
						<button type='button' onClick={() => refetch()} className='underline font-medium'>
							Retry
						</button>
					</div>
				)}
				<div className='flex items-center justify-between'>
					<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide'>Rules</label>
					<Button type='button' variant='outline' size='sm' onClick={addRule}>
						<Plus className='h-3.5 w-3.5 mr-1' />
						Add rule
					</Button>
				</div>
				<div className='space-y-2'>
					{formValue.rules.length === 0 ? (
						<p className='text-sm text-zinc-500'>No rules. Add rules to target feature, meter, or event_name.</p>
					) : (
						formValue.rules.map((rule, index) => (
							<div key={rule.id} className='flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50'>
								<Select
									options={TARGET_TYPE_OPTIONS}
									value={rule.target_type}
									onChange={(v) => updateRule(index, { target_type: v as CustomAnalyticsTargetType })}
									className='w-36'
								/>
								<Input
									placeholder='Target ID'
									value={rule.target_id}
									onChange={(v) => updateRule(index, { target_id: v })}
									className='flex-1 min-w-[120px]'
								/>
								<Button type='button' variant='outline' size='sm' onClick={() => removeRule(index)} aria-label='Remove rule'>
									<Trash2 className='h-4 w-4' />
								</Button>
							</div>
						))
					)}
				</div>
				{getFieldError(backendDetails, 'rules') && (
					<p className='text-sm text-red-600' role='alert'>
						{getFieldError(backendDetails, 'rules')}
					</p>
				)}
			</div>
		</Card>
	);
}
