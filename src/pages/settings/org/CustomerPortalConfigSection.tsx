import { Card, CardHeader, Button, Loader, Textarea } from '@/components/atoms';
import { useSettingSection } from '@/hooks/useSettingSection';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { useEffect } from 'react';
import { DEFAULT_CUSTOMER_PORTAL_CONFIG_ORG, type CustomerPortalConfigOrg } from '@/types/dto/OrgSettings';

const SETTING_KEY = 'customer_portal_config';

export function CustomerPortalConfigSection() {
	const { isLoading, isError, formValue, setFormValue, saveMutation, resetMutation, refetch } = useSettingSection<CustomerPortalConfigOrg>({
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

	// Initialize JSON editor content since we're always showing it
	useEffect(() => {
		jsonEditor.setJsonValue(JSON.stringify(formValue, null, 2));
	}, [formValue, jsonEditor]);

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
				title='Customer portal'
				titleClassName='text-lg font-medium text-zinc-800'
				cta={
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' onClick={handleReset} disabled={resetMutation.isPending}>
							Reset to default
						</Button>
						<Button size='sm' onClick={jsonEditor.handleJsonSave} disabled={saveMutation.isPending} isLoading={saveMutation.isPending}>
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
		</Card>
	);
}
