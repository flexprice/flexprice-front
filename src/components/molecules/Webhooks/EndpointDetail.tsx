import { FC, useState } from 'react';
import { useEndpoint, useEndpointFunctions, useEndpointSecret } from 'svix-react';
import { ChevronRight, MoreVertical, Eye, EyeOff, Copy } from 'lucide-react';
import { Button, Loader } from '@/components/atoms';
import DropdownMenu from '@/components/molecules/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import formatDate from '@/utils/common/format_date';
import { copyToClipboard } from '@/utils/common/helper_functions';
import EventTypePicker from './EventTypePicker';
import EndpointOverviewTab from './EndpointOverviewTab';
import EndpointTestingTab from './EndpointTestingTab';
import EndpointAdvancedTab from './EndpointAdvancedTab';
import MessageAttemptsSection from './MessageAttemptsSection';
import MessageDetail from './MessageDetail';

interface Props {
	endpointId: string;
	onBack: () => void;
	onDeleted: () => void;
}

const SubscribedEventsEditor: FC<{ endpointId: string; filterTypes: string[] | null | undefined; url: string; onUpdated: () => void }> = ({
	endpointId,
	filterTypes,
	url,
	onUpdated,
}) => {
	const { t } = useTranslation(['developers', 'common']);
	const { updateEndpoint } = useEndpointFunctions(endpointId);
	const [isEditing, setIsEditing] = useState(false);
	const [selected, setSelected] = useState<string[]>(filterTypes ?? []);
	const [isSaving, setIsSaving] = useState(false);

	const handleCancel = () => {
		setSelected(filterTypes ?? []);
		setIsEditing(false);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateEndpoint({ url, filterTypes: selected.length ? selected : null });
			toast.success(t('webhooks.endpoints.detail.eventsSaved'));
			onUpdated();
			setIsEditing(false);
		} catch {
			toast.error(t('webhooks.endpoints.detail.eventsSaveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	if (isEditing) {
		return (
			<div className='flex flex-col gap-2'>
				<EventTypePicker selected={selected} onChange={setSelected} />
				<div className='flex gap-2'>
					<Button size='sm' isLoading={isSaving} onClick={handleSave}>
						{t('common:actions.save')}
					</Button>
					<Button size='sm' variant='outline' disabled={isSaving} onClick={handleCancel}>
						{t('common:actions.cancel')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className='flex items-center justify-between'>
				<h4 className='text-sm font-medium text-content-muted'>{t('webhooks.endpoints.detail.subscribedEvents')}</h4>
				<button className='text-sm text-content-tertiary hover:text-content' onClick={() => setIsEditing(true)}>
					{t('common:actions.edit')}
				</button>
			</div>
			<div className='flex flex-col gap-1 mt-1.5 max-h-56 overflow-y-auto'>
				{filterTypes?.length ? (
					filterTypes.map((name) => (
						<span key={name} className='text-sm font-mono text-xs text-content-secondary'>
							{name}
						</span>
					))
				) : (
					<span className='text-sm text-content-subtle'>{t('webhooks.endpoints.detail.allEvents')}</span>
				)}
			</div>
		</div>
	);
};

const SigningSecret: FC<{ endpointId: string }> = ({ endpointId }) => {
	const { t } = useTranslation('developers');
	const secret = useEndpointSecret(endpointId);
	const [revealed, setRevealed] = useState(false);

	const maskedValue = t('webhooks.endpoints.secret.masked');
	const revealedValue = secret.loading ? t('webhooks.endpoints.secret.loading') : (secret.data?.key ?? t('labels.missingValue'));
	const displayValue = revealed ? revealedValue : maskedValue;

	return (
		<div>
			<h4 className='text-sm font-medium text-content-muted'>{t('webhooks.endpoints.detail.signingSecret')}</h4>
			<div className='flex items-center gap-1.5 mt-1.5'>
				<span
					className='min-w-0 flex-1 truncate font-mono text-xs bg-surface-subtle border border-border rounded px-2 py-1.5'
					title={displayValue}>
					{displayValue}
				</span>
				<Button
					variant='outline'
					size='icon'
					className='h-7 w-7 shrink-0'
					aria-label={revealed ? t('webhooks.endpoints.secret.hide') : t('webhooks.endpoints.secret.reveal')}
					onClick={() => {
						setRevealed((r) => !r);
						if (!secret.data) secret.reload();
					}}>
					{revealed ? <EyeOff className='w-3.5 h-3.5' /> : <Eye className='w-3.5 h-3.5' />}
				</Button>
				{revealed && secret.data?.key && (
					<Button
						variant='outline'
						size='icon'
						className='h-7 w-7 shrink-0'
						aria-label={t('webhooks.endpoints.secret.copy')}
						onClick={() => copyToClipboard(secret.data!.key, t('webhooks.endpoints.secret.copied'))}>
						<Copy className='w-3.5 h-3.5' />
					</Button>
				)}
			</div>
		</div>
	);
};

const EndpointDetail: FC<Props> = ({ endpointId, onBack, onDeleted }) => {
	const { t } = useTranslation(['developers', 'common']);
	const endpoint = useEndpoint(endpointId);
	const { updateEndpoint, deleteEndpoint } = useEndpointFunctions(endpointId);
	const [subTab, setSubTab] = useState('overview');
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	if (selectedMessageId) {
		return (
			<MessageDetail
				messageId={selectedMessageId}
				backLabel={endpoint.data?.url ?? t('webhooks.endpoints.detail.backToEndpoint')}
				onBack={() => setSelectedMessageId(null)}
			/>
		);
	}

	if (endpoint.loading && !endpoint.data) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (endpoint.error || !endpoint.data) {
		return <div className='p-4 text-sm text-danger'>{t('webhooks.endpoints.loadFailed')}</div>;
	}

	const data = endpoint.data;

	const handleToggleDisabled = async () => {
		try {
			await updateEndpoint({
				url: data.url,
				description: data.description,
				filterTypes: data.filterTypes,
				rateLimit: data.rateLimit,
				disabled: !data.disabled,
			});
			toast.success(data.disabled ? t('webhooks.endpoints.detail.enableSuccess') : t('webhooks.endpoints.detail.disableSuccess'));
			endpoint.reload();
		} catch {
			toast.error(t('webhooks.endpoints.detail.toggleFailed'));
		}
	};

	const handleDelete = async () => {
		if (!window.confirm(t('webhooks.endpoints.deleteConfirm', { url: data.url }))) return;
		setIsDeleting(true);
		try {
			await deleteEndpoint();
			toast.success(t('webhooks.endpoints.deleteSuccess'));
			onDeleted();
		} catch {
			toast.error(t('webhooks.endpoints.deleteFailed'));
		} finally {
			setIsDeleting(false);
		}
	};

	const subTabs = [
		{ value: 'overview', label: t('webhooks.endpoints.detail.tabs.overview') },
		{ value: 'testing', label: t('webhooks.endpoints.detail.tabs.testing') },
		{ value: 'advanced', label: t('webhooks.endpoints.detail.tabs.advanced') },
	];

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex items-center gap-1.5 text-sm text-content-muted'>
				<button className='hover:text-content' onClick={onBack}>
					{t('webhooks.endpoints.heading')}
				</button>
				<ChevronRight className='w-3.5 h-3.5' />
				<span className='text-content font-medium truncate'>{data.id}</span>
			</div>

			<div className='flex items-center justify-between gap-4 pb-5 border-b border-border'>
				<div className='min-w-0'>
					<span className='truncate font-medium text-base'>{data.url}</span>
					{data.disabled && (
						<span className='ms-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-warning-muted text-warning-strong border border-warning-line'>
							{t('webhooks.endpoints.detail.disabledBadge')}
						</span>
					)}
				</div>
				<DropdownMenu
					trigger={
						<Button variant='outline' size='icon'>
							<MoreVertical className='w-4 h-4' />
						</Button>
					}
					options={[
						{
							label: data.disabled ? t('webhooks.endpoints.detail.enableEndpoint') : t('webhooks.endpoints.detail.disableEndpoint'),
							onSelect: handleToggleDisabled,
						},
						{ label: t('common:actions.delete'), onSelect: handleDelete, disabled: isDeleting, className: 'text-danger' },
					]}
				/>
			</div>

			<Tabs value={subTab} onValueChange={setSubTab}>
				<TabsList className='bg-transparent border-b border-border w-full justify-start rounded-none space-x-1'>
					{subTabs.map((tab) => (
						<TabsTrigger
							key={tab.value}
							value={tab.value}
							className='text-sm font-medium text-content-muted px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:text-content data-[state=active]:border-content bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>

				<div className='grid grid-cols-[1fr_260px] gap-8 mt-5'>
					<div className='min-w-0'>
						<TabsContent value='overview' className='mt-0'>
							<EndpointOverviewTab endpoint={data} onUpdated={endpoint.reload} />
						</TabsContent>
						<TabsContent value='testing' className='mt-0'>
							<EndpointTestingTab endpointId={data.id} />
						</TabsContent>
						<TabsContent value='advanced' className='mt-0'>
							<EndpointAdvancedTab endpoint={data} onUpdated={endpoint.reload} />
						</TabsContent>
					</div>

					<div className='flex flex-col gap-5'>
						<div>
							<h4 className='text-sm font-medium text-content-muted'>{t('webhooks.endpoints.detail.createdAt')}</h4>
							<p className='text-sm mt-1'>{formatDate(data.createdAt)}</p>
						</div>
						<div>
							<h4 className='text-sm font-medium text-content-muted'>{t('webhooks.endpoints.detail.updatedAt')}</h4>
							<p className='text-sm mt-1'>{formatDate(data.updatedAt)}</p>
						</div>
						<div className='border-t border-border pt-5 flex flex-col gap-5'>
							<SubscribedEventsEditor endpointId={data.id} filterTypes={data.filterTypes} url={data.url} onUpdated={endpoint.reload} />
							<SigningSecret endpointId={data.id} />
						</div>
					</div>
				</div>
			</Tabs>

			<div className='border-t border-border pt-6'>
				<MessageAttemptsSection endpointId={data.id} onSelectMessage={setSelectedMessageId} />
			</div>
		</div>
	);
};

export default EndpointDetail;
