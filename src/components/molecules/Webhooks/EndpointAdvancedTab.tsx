import { FC, useEffect, useState } from 'react';
import { useEndpointFunctions, useEndpointHeaders } from 'svix-react';
import type { EndpointOut } from 'svix';
import { Button, Card, Input } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

/** A header row, plus whether Svix withheld its value for being sensitive. */
interface HeaderRow {
	key: string;
	value: string;
	sensitive: boolean;
}

const CustomHeaders: FC<{ endpointId: string }> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const { data, reload, patchEndpointHeaders } = useEndpointHeaders(endpointId);
	const [rows, setRows] = useState<HeaderRow[]>([]);
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!data) return;
		// Svix splits the response in two: `headers` carries name and value, while `sensitive`
		// carries only the *names* of headers whose values it refuses to hand back — Authorization
		// among them. Reading `headers` alone left every sensitive header invisible here: the
		// endpoint had one configured, the response said so, and the list rendered empty.
		const visible: HeaderRow[] = Object.entries(data.headers ?? {}).map(([key, value]) => ({ key, value, sensitive: false }));
		const withheld: HeaderRow[] = (data.sensitive ?? []).map((key) => ({ key, value: '', sensitive: true }));
		setRows([...visible, ...withheld].sort((a, b) => a.key.localeCompare(b.key)));
	}, [data]);

	/**
	 * Applies one targeted change, rather than rewriting the whole header set.
	 *
	 * `updateEndpointHeaders` is a PUT that replaces every header with whatever it is handed.
	 * A sensitive header's value never reaches the client, so it could never be included in that
	 * payload — which meant adding or removing any header silently deleted the sensitive ones.
	 * PATCH addresses a single header and leaves the rest alone, including the ones whose values
	 * we are not allowed to see.
	 */
	const applyPatch = async (patch: { headers: Record<string, string>; deleteHeaders?: string[] }, nextRows: HeaderRow[]) => {
		setIsSaving(true);
		try {
			await patchEndpointHeaders(patch);
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
		const existing = rows.some((row) => row.key === newKey);
		// Re-entering a sensitive header's key is how its value gets replaced — the row stops
		// being withheld only once the server says so, so leave `sensitive` to the reload.
		const nextRows = existing
			? rows.map((row) => (row.key === newKey ? { ...row, value: newValue } : row))
			: [...rows, { key: newKey, value: newValue, sensitive: false }];
		setNewKey('');
		setNewValue('');
		applyPatch({ headers: { [newKey]: newValue } }, nextRows);
	};

	const handleRemove = (key: string) => {
		applyPatch(
			{ headers: {}, deleteHeaders: [key] },
			rows.filter((row) => row.key !== key),
		);
	};

	return (
		<Card noPadding className='p-4'>
			<h4 className='text-sm font-medium mb-3'>{t('webhooks.endpoints.detail.customHeaders')}</h4>
			<div className='flex flex-col gap-2'>
				{rows.map((row) => (
					<div key={row.key} className='flex items-center gap-2 text-sm'>
						{/* min-w-0 lets a cell shrink past its content so `truncate` engages; without it a long
						    header name widens the row instead of ellipsing inside the card. */}
						<span className='min-w-0 flex-1 font-mono text-xs bg-surface-subtle border border-border rounded px-2 py-1.5 truncate'>
							{row.key}
						</span>
						<span
							title={row.sensitive ? t('webhooks.endpoints.detail.headerValueHiddenHint') : undefined}
							className={cn(
								'min-w-0 flex-1 font-mono text-xs bg-surface-subtle border border-border rounded px-2 py-1.5 truncate',
								row.sensitive && 'italic text-content-muted',
							)}>
							{row.sensitive ? t('webhooks.endpoints.detail.headerValueHidden') : row.value}
						</span>
						<Button
							variant='outline'
							size='sm'
							className='shrink-0'
							disabled={isSaving}
							aria-label={t('webhooks.endpoints.detail.removeHeader', { key: row.key })}
							onClick={() => handleRemove(row.key)}>
							<X className='w-3.5 h-3.5' />
						</Button>
					</div>
				))}
				<div className='flex items-center gap-2'>
					{/* `Input` renders a `w-full` wrapper, so two side by side each ask for the whole row and
					    spill past the card once the gaps and button are added. A shrinkable cell around each
					    makes them share the width at any screen size. */}
					<div className='min-w-0 flex-1'>
						<Input placeholder={t('webhooks.endpoints.detail.headerKeyPlaceholder')} value={newKey} onChange={setNewKey} />
					</div>
					<div className='min-w-0 flex-1'>
						<Input placeholder={t('webhooks.endpoints.detail.headerValuePlaceholder')} value={newValue} onChange={setNewValue} />
					</div>
					<Button
						variant='outline'
						size='sm'
						className='shrink-0'
						disabled={!newKey || isSaving}
						isLoading={isSaving}
						aria-label={t('webhooks.endpoints.detail.addHeader')}
						onClick={handleAdd}>
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
