import { FC, useEffect, useState } from 'react';
import { useEndpointFunctions, useEndpointHeaders } from 'svix-react';
import type { EndpointOut } from 'svix';
import { Button, Card, Input } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

interface Props {
	endpoint: EndpointOut;
	onUpdated: () => void;
}

const EndpointThrottling: FC<Props> = ({ endpoint, onUpdated }) => {
	const { t } = useTranslation(['developers', 'common']);
	const { updateEndpoint } = useEndpointFunctions(endpoint.id);
	const [isEditing, setIsEditing] = useState(false);
	const [rateLimit, setRateLimit] = useState(endpoint.rateLimit ? String(endpoint.rateLimit) : '');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setRateLimit(endpoint.rateLimit ? String(endpoint.rateLimit) : '');
	}, [endpoint.rateLimit]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const parsed = rateLimit ? Number(rateLimit) : null;
			await updateEndpoint({
				url: endpoint.url,
				description: endpoint.description,
				filterTypes: endpoint.filterTypes,
				rateLimit: parsed,
				disabled: endpoint.disabled,
			});
			toast.success(t('webhooks.endpoints.detail.throttleSaved'));
			onUpdated();
			setIsEditing(false);
		} catch {
			toast.error(t('webhooks.endpoints.detail.throttleSaveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card noPadding className='p-4'>
			<div className='flex items-center justify-between mb-2'>
				<h4 className='text-sm font-medium'>{t('webhooks.endpoints.detail.throttling')}</h4>
				{!isEditing && (
					<button className='text-sm text-content-tertiary hover:text-content' onClick={() => setIsEditing(true)}>
						{t('common:actions.edit')}
					</button>
				)}
			</div>
			{isEditing ? (
				<div className='flex flex-col gap-2 max-w-xs'>
					<Input type='number' placeholder={t('webhooks.endpoints.detail.throttlePlaceholder')} value={rateLimit} onChange={setRateLimit} />
					<div className='flex gap-2'>
						<Button size='sm' isLoading={isSaving} onClick={handleSave}>
							{t('common:actions.save')}
						</Button>
						<Button
							size='sm'
							variant='outline'
							disabled={isSaving}
							onClick={() => {
								setRateLimit(endpoint.rateLimit ? String(endpoint.rateLimit) : '');
								setIsEditing(false);
							}}>
							{t('common:actions.cancel')}
						</Button>
					</div>
				</div>
			) : (
				<p className='text-sm text-content-muted'>
					{endpoint.rateLimit
						? t('webhooks.endpoints.detail.throttleValue', { rate: endpoint.rateLimit })
						: t('webhooks.endpoints.detail.noThrottle')}
				</p>
			)}
		</Card>
	);
};

const CustomHeaders: FC<{ endpointId: string }> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const { data, reload, updateEndpointHeaders } = useEndpointHeaders(endpointId);
	const [rows, setRows] = useState<{ key: string; value: string }[]>([]);
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (data?.headers) {
			setRows(Object.entries(data.headers).map(([key, value]) => ({ key, value })));
		}
	}, [data?.headers]);

	const persist = async (nextRows: { key: string; value: string }[]) => {
		setIsSaving(true);
		try {
			const headers = Object.fromEntries(nextRows.filter((r) => r.key).map((r) => [r.key, r.value]));
			await updateEndpointHeaders({ headers });
			setRows(nextRows);
			reload();
		} catch {
			toast.error(t('webhooks.endpoints.detail.headersSaveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleAdd = () => {
		if (!newKey) return;
		const existing = rows.find((row) => row.key === newKey);
		const nextRows = existing
			? rows.map((row) => (row.key === newKey ? { key: newKey, value: newValue } : row))
			: [...rows, { key: newKey, value: newValue }];
		setNewKey('');
		setNewValue('');
		persist(nextRows);
	};

	const handleRemove = (key: string) => {
		persist(rows.filter((r) => r.key !== key));
	};

	return (
		<Card noPadding className='p-4'>
			<h4 className='text-sm font-medium mb-3'>{t('webhooks.endpoints.detail.customHeaders')}</h4>
			<div className='flex flex-col gap-2'>
				{rows.map((row) => (
					<div key={row.key} className='flex items-center gap-2 text-sm'>
						<span className='flex-1 font-mono text-xs bg-surface-subtle border border-border rounded px-2 py-1.5 truncate'>{row.key}</span>
						<span className='flex-1 font-mono text-xs bg-surface-subtle border border-border rounded px-2 py-1.5 truncate'>
							{row.value}
						</span>
						<Button variant='outline' size='sm' disabled={isSaving} onClick={() => handleRemove(row.key)}>
							<X className='w-3.5 h-3.5' />
						</Button>
					</div>
				))}
				<div className='flex items-center gap-2'>
					<Input placeholder={t('webhooks.endpoints.detail.headerKeyPlaceholder')} value={newKey} onChange={setNewKey} />
					<Input placeholder={t('webhooks.endpoints.detail.headerValuePlaceholder')} value={newValue} onChange={setNewValue} />
					<Button variant='outline' size='sm' disabled={!newKey || isSaving} isLoading={isSaving} onClick={handleAdd}>
						<Plus className='w-3.5 h-3.5' />
					</Button>
				</div>
			</div>
		</Card>
	);
};

const EndpointAdvancedTab: FC<Props> = ({ endpoint, onUpdated }) => {
	return (
		<div className='flex flex-col gap-6'>
			<EndpointThrottling endpoint={endpoint} onUpdated={onUpdated} />
			<CustomHeaders endpointId={endpoint.id} />
		</div>
	);
};

export default EndpointAdvancedTab;
