import { Card, CardHeader, Button, Input, Loader, Select, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { DEFAULT_INVOICE_CONFIG, INVOICE_FORMAT, type InvoiceConfig, type InvoiceFormat } from '@/types/dto/OrgSettings';
import { useState } from 'react';

const SETTING_KEY = 'invoice_config';

const FORMAT_OPTIONS: SelectOption[] = INVOICE_FORMAT.map((f) => ({ value: f, label: f }));

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function InvoiceConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<InvoiceConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_INVOICE_CONFIG,
		});

	const [inlineErrors, setInlineErrors] = useState<Partial<Record<keyof InvoiceConfig, string>>>({});

	const validate = (): boolean => {
		const errs: Partial<Record<keyof InvoiceConfig, string>> = {};
		if (!formValue.prefix?.trim()) {
			errs.prefix = 'Required (min 1 character)';
		}
		if (typeof formValue.start_sequence !== 'number' || formValue.start_sequence < 0) {
			errs.start_sequence = 'Must be ≥ 0';
		}
		if (typeof formValue.suffix_length !== 'number' || formValue.suffix_length < 1 || formValue.suffix_length > 10) {
			errs.suffix_length = 'Must be between 1 and 10';
		}
		if (formValue.due_date_days !== null && (typeof formValue.due_date_days !== 'number' || formValue.due_date_days < 0)) {
			errs.due_date_days = 'Must be ≥ 0 or empty';
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

	return (
		<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
			<CardHeader
				title='Invoice settings'
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
				<div>
					<label htmlFor='prefix' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Prefix
					</label>
					<Input
						id='prefix'
						value={formValue.prefix}
						onChange={(value) => setFormValue((prev) => ({ ...prev, prefix: value }))}
						className={inlineErrors.prefix || getFieldError(backendDetails, 'prefix') ? 'border-red-500' : ''}
					/>
					{(inlineErrors.prefix || getFieldError(backendDetails, 'prefix')) && (
						<p className='mt-1 text-sm text-red-600' role='alert'>
							{inlineErrors.prefix ?? getFieldError(backendDetails, 'prefix')}
						</p>
					)}
				</div>
				<div>
					<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>Format</label>
					<Select
						options={FORMAT_OPTIONS}
						value={formValue.format}
						onChange={(value) => setFormValue((prev) => ({ ...prev, format: value as InvoiceFormat }))}
					/>
				</div>
				<div>
					<label htmlFor='start_sequence' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Start sequence
					</label>
					<Input
						id='start_sequence'
						type='number'
						min={0}
						value={String(formValue.start_sequence)}
						onChange={(value) =>
							setFormValue((prev) => ({
								...prev,
								start_sequence: value ? parseInt(value, 10) : 0,
							}))
						}
						className={inlineErrors.start_sequence || getFieldError(backendDetails, 'start_sequence') ? 'border-red-500' : ''}
					/>
					{(inlineErrors.start_sequence || getFieldError(backendDetails, 'start_sequence')) && (
						<p className='mt-1 text-sm text-red-600' role='alert'>
							{inlineErrors.start_sequence ?? getFieldError(backendDetails, 'start_sequence')}
						</p>
					)}
				</div>
				<div>
					<label htmlFor='timezone' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Timezone
					</label>
					<Input id='timezone' value={formValue.timezone} onChange={(value) => setFormValue((prev) => ({ ...prev, timezone: value }))} />
				</div>
				<div>
					<label htmlFor='separator' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Separator
					</label>
					<Input
						id='separator'
						value={formValue.separator ?? ''}
						onChange={(value) => setFormValue((prev) => ({ ...prev, separator: value }))}
					/>
				</div>
				<div>
					<label htmlFor='suffix_length' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Suffix length (1–10)
					</label>
					<Input
						id='suffix_length'
						type='number'
						min={1}
						max={10}
						value={String(formValue.suffix_length)}
						onChange={(value) =>
							setFormValue((prev) => ({
								...prev,
								suffix_length: value ? parseInt(value, 10) : 1,
							}))
						}
						className={inlineErrors.suffix_length || getFieldError(backendDetails, 'suffix_length') ? 'border-red-500' : ''}
					/>
					{(inlineErrors.suffix_length || getFieldError(backendDetails, 'suffix_length')) && (
						<p className='mt-1 text-sm text-red-600' role='alert'>
							{inlineErrors.suffix_length ?? getFieldError(backendDetails, 'suffix_length')}
						</p>
					)}
				</div>
				<div>
					<label htmlFor='due_date_days' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
						Due date (days, empty for null)
					</label>
					<Input
						id='due_date_days'
						type='number'
						min={0}
						value={formValue.due_date_days === null ? '' : String(formValue.due_date_days)}
						onChange={(value) =>
							setFormValue((prev) => ({
								...prev,
								due_date_days: value === '' ? null : parseInt(value, 10) || 0,
							}))
						}
						placeholder='Optional'
						className={inlineErrors.due_date_days || getFieldError(backendDetails, 'due_date_days') ? 'border-red-500' : ''}
					/>
					{(inlineErrors.due_date_days || getFieldError(backendDetails, 'due_date_days')) && (
						<p className='mt-1 text-sm text-red-600' role='alert'>
							{inlineErrors.due_date_days ?? getFieldError(backendDetails, 'due_date_days')}
						</p>
					)}
				</div>
				<div className='flex items-center gap-2'>
					<input
						id='auto_complete_purchased_credit_transaction'
						type='checkbox'
						checked={formValue.auto_complete_purchased_credit_transaction ?? false}
						onChange={(e) =>
							setFormValue((prev) => ({
								...prev,
								auto_complete_purchased_credit_transaction: e.target.checked,
							}))
						}
						className='h-4 w-4 rounded border-gray-300'
					/>
					<label htmlFor='auto_complete_purchased_credit_transaction' className='text-sm text-zinc-700'>
						Auto-complete purchased credit transaction
					</label>
				</div>
			</div>
		</Card>
	);
}
