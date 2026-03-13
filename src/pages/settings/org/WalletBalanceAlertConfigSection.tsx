import { Card, CardHeader, Button, Input, Loader, Select, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import {
	DEFAULT_WALLET_BALANCE_ALERT_CONFIG,
	type WalletBalanceAlertConfig,
	type WalletAlertLevel,
	type WalletAlertCondition,
} from '@/types/dto/OrgSettings';
import { useState } from 'react';

const SETTING_KEY = 'wallet_balance_alert_config';

const CONDITION_OPTIONS: SelectOption[] = [
	{ value: 'below', label: 'Below' },
	{ value: 'above', label: 'Above' },
];

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

function AlertLevelRow({
	label,
	value,
	onChange,
	error,
}: {
	label: string;
	value: WalletAlertLevel | null;
	onChange: (v: WalletAlertLevel | null) => void;
	error?: string;
}) {
	const enabled = value !== null;
	return (
		<div className='flex flex-wrap items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50'>
			<div className='flex items-center gap-2'>
				<input
					type='checkbox'
					checked={enabled}
					onChange={(e) => {
						if (e.target.checked) {
							onChange({ threshold: '0', condition: 'below' });
						} else {
							onChange(null);
						}
					}}
					className='h-4 w-4 rounded border-gray-300'
				/>
				<span className='text-sm font-medium text-zinc-700'>{label}</span>
			</div>
			{enabled && value && (
				<>
					<Input placeholder='Threshold' value={value.threshold} onChange={(v) => onChange({ ...value, threshold: v })} className='w-24' />
					<Select
						options={CONDITION_OPTIONS}
						value={value.condition}
						onChange={(v) => onChange({ ...value, condition: v as WalletAlertCondition })}
						className='w-28'
					/>
				</>
			)}
			{error && (
				<p className='w-full text-sm text-red-600' role='alert'>
					{error}
				</p>
			)}
		</div>
	);
}

export function WalletBalanceAlertConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<WalletBalanceAlertConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_WALLET_BALANCE_ALERT_CONFIG,
		});

	const [inlineErrors, setInlineErrors] = useState<{ level?: string }>({});

	const validate = (): boolean => {
		if (formValue.alert_enabled) {
			const hasOne = formValue.critical !== null || formValue.warning !== null || formValue.info !== null;
			if (!hasOne) {
				setInlineErrors({ level: 'At least one of Critical, Warning, or Info must be configured when alerts are enabled.' });
				return false;
			}
		}
		setInlineErrors({});
		return true;
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

	return (
		<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
			<CardHeader
				title='Wallet balance alerts'
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
				{inlineErrors.level && (
					<div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800' role='alert'>
						{inlineErrors.level}
					</div>
				)}
				<div className='flex items-center gap-2'>
					<input
						id='alert_enabled'
						type='checkbox'
						checked={formValue.alert_enabled}
						onChange={(e) => setFormValue((prev) => ({ ...prev, alert_enabled: e.target.checked }))}
						className='h-4 w-4 rounded border-gray-300'
					/>
					<label htmlFor='alert_enabled' className='text-sm text-zinc-700'>
						Alert enabled
					</label>
				</div>
				<div className='space-y-2'>
					<AlertLevelRow
						label='Critical'
						value={formValue.critical}
						onChange={(v) => setFormValue((prev) => ({ ...prev, critical: v }))}
						error={getFieldError(backendDetails, 'critical')}
					/>
					<AlertLevelRow
						label='Warning'
						value={formValue.warning}
						onChange={(v) => setFormValue((prev) => ({ ...prev, warning: v }))}
						error={getFieldError(backendDetails, 'warning')}
					/>
					<AlertLevelRow
						label='Info'
						value={formValue.info}
						onChange={(v) => setFormValue((prev) => ({ ...prev, info: v }))}
						error={getFieldError(backendDetails, 'info')}
					/>
				</div>
			</div>
		</Card>
	);
}
