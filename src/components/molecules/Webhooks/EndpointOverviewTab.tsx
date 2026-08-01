import { FC, useEffect, useState } from 'react';
import { useEndpointFunctions, useEndpointStats } from 'svix-react';
import type { EndpointOut } from 'svix';
import { Button, Card, Textarea } from '@/components/atoms';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Props {
	endpoint: EndpointOut;
	onUpdated: () => void;
}

const DeliveryStatsBar: FC<{ endpointId: string }> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const { data, loading } = useEndpointStats(endpointId);

	const success = data?.success ?? 0;
	const fail = data?.fail ?? 0;
	const pending = data?.pending ?? 0;
	const total = success + fail + pending;

	return (
		<div className='flex flex-col gap-2'>
			<h4 className='text-sm font-medium'>{t('webhooks.endpoints.detail.deliveryStats')}</h4>
			{loading ? (
				<div className='h-3 w-full rounded-full bg-surface-shell animate-pulse' />
			) : total === 0 ? (
				<p className='text-sm text-content-subtle'>{t('webhooks.endpoints.detail.noDeliveries')}</p>
			) : (
				<>
					<div className='flex h-3 w-full overflow-hidden rounded-full bg-surface-shell'>
						{success > 0 && <div className='h-full bg-success-bright' style={{ width: `${(success / total) * 100}%` }} />}
						{fail > 0 && <div className='h-full bg-danger-bright' style={{ width: `${(fail / total) * 100}%` }} />}
						{pending > 0 && <div className='h-full bg-warning-soft' style={{ width: `${(pending / total) * 100}%` }} />}
					</div>
					<div className='flex gap-4 text-xs text-content-muted'>
						{success > 0 && (
							<span className='flex items-center gap-1'>
								<span className='w-2 h-2 rounded-full bg-success-bright' />
								{t('webhooks.endpoints.attempts.status.succeeded').toUpperCase()} – {success}
							</span>
						)}
						{fail > 0 && (
							<span className='flex items-center gap-1'>
								<span className='w-2 h-2 rounded-full bg-danger-bright' />
								{t('webhooks.endpoints.attempts.status.failed').toUpperCase()} – {fail}
							</span>
						)}
						{pending > 0 && (
							<span className='flex items-center gap-1'>
								<span className='w-2 h-2 rounded-full bg-warning-soft' />
								{t('webhooks.endpoints.attempts.status.pending').toUpperCase()} – {pending}
							</span>
						)}
					</div>
				</>
			)}
		</div>
	);
};

const EndpointOverviewTab: FC<Props> = ({ endpoint, onUpdated }) => {
	const { t } = useTranslation(['developers', 'common']);
	const { updateEndpoint } = useEndpointFunctions(endpoint.id);
	const [isEditing, setIsEditing] = useState(false);
	const [description, setDescription] = useState(endpoint.description);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setDescription(endpoint.description);
	}, [endpoint.description]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateEndpoint({ url: endpoint.url, description, rateLimit: endpoint.rateLimit, filterTypes: endpoint.filterTypes });
			toast.success(t('webhooks.endpoints.detail.descriptionSaved'));
			onUpdated();
			setIsEditing(false);
		} catch {
			toast.error(t('webhooks.endpoints.detail.descriptionSaveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className='flex flex-col gap-6'>
			<Card noPadding className='p-4'>
				<div className='flex items-center justify-between mb-2'>
					<h4 className='text-sm font-medium'>{t('webhooks.endpoints.detail.description')}</h4>
					{!isEditing && (
						<button className='text-sm text-content-tertiary hover:text-content' onClick={() => setIsEditing(true)}>
							{t('common:actions.edit')}
						</button>
					)}
				</div>
				{isEditing ? (
					<div className='flex flex-col gap-2'>
						<Textarea value={description} onChange={setDescription} placeholder={t('webhooks.endpoints.form.descriptionPlaceholder')} />
						<div className='flex gap-2'>
							<Button size='sm' isLoading={isSaving} onClick={handleSave}>
								{t('common:actions.save')}
							</Button>
							<Button
								size='sm'
								variant='outline'
								disabled={isSaving}
								onClick={() => {
									setDescription(endpoint.description);
									setIsEditing(false);
								}}>
								{t('common:actions.cancel')}
							</Button>
						</div>
					</div>
				) : (
					<p className='text-sm text-content-muted'>{endpoint.description || t('webhooks.endpoints.detail.noDescription')}</p>
				)}
			</Card>

			<Card noPadding className='p-4'>
				<DeliveryStatsBar endpointId={endpoint.id} />
			</Card>
		</div>
	);
};

export default EndpointOverviewTab;
