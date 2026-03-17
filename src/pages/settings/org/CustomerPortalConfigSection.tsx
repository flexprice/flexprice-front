import { Card, CardHeader, Button, Input, Loader, Select, Textarea, type SelectOption } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import {
	DEFAULT_CUSTOMER_PORTAL_CONFIG_ORG,
	type CustomerPortalConfigOrg,
	type CustomerPortalSectionConfigOrg,
	type CustomerPortalTabConfigOrg,
	type CustomerPortalTabType,
} from '@/types/dto/OrgSettings';
import { Plus, Trash2 } from 'lucide-react';

const SETTING_KEY = 'customer_portal_config';

const TAB_TYPE_OPTIONS: SelectOption[] = [
	{ value: 'metric_cards', label: 'Metric cards' },
	{ value: 'usage_graph', label: 'Usage graph' },
	{ value: 'current_usage', label: 'Current usage' },
	{ value: 'usage_breakdown', label: 'Usage breakdown' },
	{ value: 'wallet_balance', label: 'Wallet balance' },
	{ value: 'wallet_transactions', label: 'Wallet transactions' },
	{ value: 'invoices', label: 'Invoices' },
	{ value: 'subscriptions', label: 'Subscriptions' },
];

function getFieldError(details: Record<string, string>, field: string): string | undefined {
	return details[`value.${field}`] ?? details[field];
}

export function CustomerPortalConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, backendDetails, refetch } =
		useSettingSection<CustomerPortalConfigOrg>({
			key: SETTING_KEY,
			defaultValue: DEFAULT_CUSTOMER_PORTAL_CONFIG_ORG,
		});

	const jsonEditor = useJsonEditor({
		initialValue: formValue,
		sendCompleteConfig: true,
		onSave: (data) => {
			saveMutation.mutate(data as CustomerPortalConfigOrg);
			setFormValue((prev) => ({ ...prev, ...(data as CustomerPortalConfigOrg) }));
		},
	});

	const handleSave = () => {
		saveMutation.mutate(formValue);
	};

	const handleReset = () => {
		resetMutation.mutate(undefined);
	};

	const setTheme = (patch: Partial<NonNullable<CustomerPortalConfigOrg['theme']>>) => {
		setFormValue((prev) => ({
			...prev,
			theme: { ...(prev.theme ?? {}), ...patch },
		}));
	};

	const addSection = () => {
		setFormValue((prev) => ({
			...prev,
			sections: [
				...prev.sections,
				{
					id: `section-${Date.now()}`,
					label: 'New section',
					enabled: true,
					order: prev.sections.length + 1,
					tabs: [],
				},
			],
		}));
	};

	const updateSection = (index: number, patch: Partial<CustomerPortalSectionConfigOrg>) => {
		setFormValue((prev) => {
			const sections = [...prev.sections];
			sections[index] = { ...sections[index], ...patch };
			return { ...prev, sections };
		});
	};

	const removeSection = (index: number) => {
		setFormValue((prev) => ({
			...prev,
			sections: prev.sections.filter((_, i) => i !== index),
		}));
	};

	const addTab = (sectionIndex: number) => {
		setFormValue((prev) => {
			const sections = [...prev.sections];
			const sec = sections[sectionIndex];
			const newTab: CustomerPortalTabConfigOrg = {
				id: `tab-${Date.now()}`,
				type: 'metric_cards',
				enabled: true,
				order: sec.tabs.length + 1,
			};
			const tabs = [...sec.tabs, newTab];
			sections[sectionIndex] = { ...sec, tabs };
			return { ...prev, sections };
		});
	};

	const updateTab = (sectionIndex: number, tabIndex: number, patch: Partial<CustomerPortalTabConfigOrg>) => {
		setFormValue((prev) => {
			const sections = [...prev.sections];
			const tabs = [...sections[sectionIndex].tabs];
			tabs[tabIndex] = { ...tabs[tabIndex], ...patch };
			sections[sectionIndex] = { ...sections[sectionIndex], tabs };
			return { ...prev, sections };
		});
	};

	const removeTab = (sectionIndex: number, tabIndex: number) => {
		setFormValue((prev) => {
			const sections = [...prev.sections];
			sections[sectionIndex] = {
				...sections[sectionIndex],
				tabs: sections[sectionIndex].tabs.filter((_, i) => i !== tabIndex),
			};
			return { ...prev, sections };
		});
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
				title='Customer portal'
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
					<div className='space-y-6'>
						{isError && (
							<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
								Failed to load settings.{' '}
								<button type='button' onClick={() => refetch()} className='underline font-medium'>
									Retry
								</button>
							</div>
						)}
						<div>
							<label htmlFor='version' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
								Version
							</label>
							<Input id='version' value={formValue.version} onChange={(v) => setFormValue((prev) => ({ ...prev, version: v }))} />
						</div>
						<div>
							<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2'>Theme</label>
							<div className='grid grid-cols-3 gap-3'>
								<div>
									<label className='block text-xs text-zinc-500 mb-1'>Primary color</label>
									<Input
										value={formValue.theme?.primary_color ?? ''}
										onChange={(v) => setTheme({ primary_color: v || undefined })}
										placeholder='#hex'
									/>
								</div>
								<div>
									<label className='block text-xs text-zinc-500 mb-1'>Secondary color</label>
									<Input
										value={formValue.theme?.secondary_color ?? ''}
										onChange={(v) => setTheme({ secondary_color: v || undefined })}
										placeholder='#hex'
									/>
								</div>
								<div>
									<label className='block text-xs text-zinc-500 mb-1'>Tertiary color</label>
									<Input
										value={formValue.theme?.tertiary_color ?? ''}
										onChange={(v) => setTheme({ tertiary_color: v || undefined })}
										placeholder='#hex'
									/>
								</div>
							</div>
						</div>
						<div>
							<div className='flex items-center justify-between mb-2'>
								<label className='block text-xs font-medium text-zinc-500 uppercase tracking-wide'>Sections</label>
								<Button type='button' variant='outline' size='sm' onClick={addSection}>
									<Plus className='h-3.5 w-3.5 mr-1' />
									Add section
								</Button>
							</div>
							<div className='space-y-4'>
								{formValue.sections.map((section, sIdx) => (
									<div key={section.id} className='p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3'>
										<div className='flex flex-wrap items-center gap-2'>
											<Input
												placeholder='Section ID'
												value={section.id}
												onChange={(v) => updateSection(sIdx, { id: v })}
												className='w-32'
											/>
											<Input
												placeholder='Label'
												value={section.label}
												onChange={(v) => updateSection(sIdx, { label: v })}
												className='w-40'
											/>
											<Input
												type='number'
												placeholder='Order'
												value={String(section.order)}
												onChange={(v) => updateSection(sIdx, { order: v ? parseInt(v, 10) : 0 })}
												className='w-20'
											/>
											<label className='flex items-center gap-1.5 text-sm'>
												<input
													type='checkbox'
													checked={section.enabled}
													onChange={(e) => updateSection(sIdx, { enabled: e.target.checked })}
													className='h-4 w-4 rounded border-gray-300'
												/>
												Enabled
											</label>
											<Button type='button' variant='outline' size='sm' onClick={() => removeSection(sIdx)} aria-label='Remove section'>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
										<div className='pl-2 border-l-2 border-gray-200'>
											<div className='flex items-center justify-between mb-2'>
												<span className='text-xs font-medium text-zinc-500'>Tabs</span>
												<Button type='button' variant='ghost' size='sm' onClick={() => addTab(sIdx)}>
													<Plus className='h-3 w-3 mr-1' />
													Add tab
												</Button>
											</div>
											{section.tabs.map((tab, tIdx) => (
												<div key={tab.id} className='flex flex-wrap items-center gap-2 py-1'>
													<Input placeholder='Tab ID' value={tab.id} onChange={(v) => updateTab(sIdx, tIdx, { id: v })} className='w-24' />
													<Select
														options={TAB_TYPE_OPTIONS}
														value={tab.type}
														onChange={(v) => updateTab(sIdx, tIdx, { type: v as CustomerPortalTabType })}
														className='w-40'
													/>
													<Input
														type='number'
														placeholder='Order'
														value={String(tab.order)}
														onChange={(v) => updateTab(sIdx, tIdx, { order: v ? parseInt(v, 10) : 0 })}
														className='w-16'
													/>
													<label className='flex items-center gap-1 text-sm'>
														<input
															type='checkbox'
															checked={tab.enabled}
															onChange={(e) => updateTab(sIdx, tIdx, { enabled: e.target.checked })}
															className='h-3.5 w-3.5 rounded border-gray-300'
														/>
														On
													</label>
													<Button type='button' variant='ghost' size='sm' onClick={() => removeTab(sIdx, tIdx)} aria-label='Remove tab'>
														<Trash2 className='h-3.5 w-3.5' />
													</Button>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
							{formValue.sections.length === 0 && (
								<p className='text-sm text-zinc-500'>No sections. Add sections to configure portal layout.</p>
							)}
						</div>
						{getFieldError(backendDetails, 'sections') && (
							<p className='text-sm text-red-600' role='alert'>
								{getFieldError(backendDetails, 'sections')}
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
								description='Edit the customer portal configuration directly in JSON format. Only changed values will be saved.'
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
