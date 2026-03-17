import { Card, CardHeader, Button, Input, Loader, Textarea } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { DEFAULT_INVOICE_PDF_CONFIG, type InvoicePdfConfig } from '@/types/dto/OrgSettings';
import { Plus, Trash2 } from 'lucide-react';

const SETTING_KEY = 'invoice_pdf_config';

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function InvoicePdfConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<InvoicePdfConfig>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_INVOICE_PDF_CONFIG,
		});

	const jsonEditor = useJsonEditor({
		initialValue: formValue,
		onSave: (changedValues) => {
			saveMutation.mutate(changedValues as InvoicePdfConfig);
			setFormValue((prev) => ({ ...prev, ...changedValues }));
		},
	});

	const handleSave = () => {
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
	};

	const addGroupBy = () => {
		setFormValue((prev) => ({ ...prev, group_by: [...(prev.group_by ?? []), ''] }));
	};

	const setGroupByItem = (index: number, value: string) => {
		setFormValue((prev) => {
			const next = [...(prev.group_by ?? [])];
			next[index] = value;
			return { ...prev, group_by: next };
		});
	};

	const removeGroupBy = (index: number) => {
		setFormValue((prev) => ({
			...prev,
			group_by: (prev.group_by ?? []).filter((_, i) => i !== index),
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

	const templateError = getFieldError(backendDetails, 'template_name');

	return (
		<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
			<CardHeader
				title='Invoice PDF settings'
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
							<label htmlFor='template_name' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
								Template name
							</label>
							<Input
								id='template_name'
								value={formValue.template_name}
								onChange={(value) => setFormValue((prev) => ({ ...prev, template_name: value }))}
								placeholder='invoice.typ'
								className={templateError ? 'border-red-500' : ''}
							/>
							{templateError && (
								<p className='mt-1 text-sm text-red-600' role='alert'>
									{templateError}
								</p>
							)}
							<p className='mt-1 text-xs text-zinc-500'>Only &quot;invoice.typ&quot; is supported.</p>
						</div>
						<div>
							<div className='flex items-center justify-between mb-1'>
								<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide'>Group by</label>
								<Button type='button' variant='outline' size='sm' onClick={addGroupBy}>
									<Plus className='h-3.5 w-3.5 mr-1' />
									Add
								</Button>
							</div>
							<div className='space-y-2'>
								{(formValue.group_by ?? []).length === 0 ? (
									<p className='text-sm text-zinc-500'>No groups. Add a field name to group invoice lines.</p>
								) : (
									(formValue.group_by ?? []).map((item, index) => (
										<div key={index} className='flex items-center gap-2'>
											<Input value={item} onChange={(v) => setGroupByItem(index, v)} placeholder='Field name' className='flex-1' />
											<Button type='button' variant='outline' size='sm' onClick={() => removeGroupBy(index)} aria-label='Remove'>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									))
								)}
							</div>
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
								description='Edit the invoice PDF configuration directly in JSON format. Only changed values will be saved.'
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
