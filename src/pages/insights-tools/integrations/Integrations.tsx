import { Loader, Page, Dialog, Card, Button, Divider } from '@/components/atoms';
import { Integration, INTEGRATION_TAG_DATA_PIPELINES } from './integrationsData';
import { useIntegrationsCatalog } from './useIntegrationsCatalog';
import { cn } from '@/lib/utils';
import { PremiumFeature, ApiDocsContent, PaddleConnectionDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { ExternalLinkIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';
import StripeConnectionDrawer from '@/components/molecules/StripeConnectionDrawer';
import RazorpayConnectionDrawer from '@/components/molecules/RazorpayConnectionDrawer';
import ChargebeeConnectionDrawer from '@/components/molecules/ChargebeeConnectionDrawer';
import HubSpotConnectionDrawer from '@/components/molecules/HubSpotConnectionDrawer';
import QuickBooksConnectionDrawer from '@/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer';
import ZohoBooksConnectionDrawer from '@/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer';
import NomodConnectionDrawer from '@/components/molecules/NomodConnectionDrawer';
import MoyasarConnectionDrawer from '@/components/molecules/MoyasarConnectionDrawer';
import WhopConnectionDrawer from '@/components/molecules/WhopConnectionDrawer';
import TabsConnectionDrawer from '@/components/molecules/TabsConnectionDrawer';
import AwsMarketplaceConnectionDrawer from '@/components/molecules/AwsMarketplaceConnectionDrawer';
import GcpMarketplaceConnectionDrawer from '@/components/molecules/GcpMarketplaceConnectionDrawer';
import AzureMarketplaceConnectionDrawer from '@/components/molecules/AzureMarketplaceConnectionDrawer';
import IntegrationDrawer from '@/components/molecules/IntegrationDrawer/IntegrationDrawer';

/** UI preview only: shows one card in connected state without real API data. Set to `null` to turn off. */
const PREVIEW_CONNECTED_PROVIDER: string | null = null;
const PREVIEW_MOCK_CONNECTION_ID = '__preview__';

/** API provider_type for List(); route id `zoho` maps to zoho_books */
const getProviderTypeForIntegration = (integrationId: string): CONNECTION_PROVIDER_TYPE =>
	integrationId === 'zoho' ? CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS : (integrationId as CONNECTION_PROVIDER_TYPE);

const Integrations = () => {
	const { t } = useTranslation('settings');
	const integrations = useIntegrationsCatalog();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
	const [editingConnection, setEditingConnection] = useState<any | null>(null);

	const availableIntegrations = integrations.filter((i) => !i.premium && i.type === 'available');

	const connectionQueries = useQueries({
		queries: availableIntegrations.map((integration) => {
			const listKey = integration.id;
			const providerType = getProviderTypeForIntegration(integration.id);
			return {
				queryKey: ['connections', listKey],
				queryFn: () => ConnectionApi.List({ provider_type: providerType }),
			};
		}),
	});

	const connectionByProvider = new Map<string, any[]>();
	for (let idx = 0; idx < availableIntegrations.length; idx++) {
		const integration = availableIntegrations[idx];
		const listKey = integration.id;
		const q = connectionQueries[idx];
		connectionByProvider.set(listKey, q?.data?.connections ?? []);
	}

	const isLoading = connectionQueries.some((q) => q.isLoading);

	const hasConnection = (integration: Integration) => {
		if (integration.premium) return false;
		const provider = integration.id;
		return (connectionByProvider.get(provider) ?? []).length > 0;
	};

	const availableNonPremium = integrations.filter(
		(integration) =>
			integration.type === 'available' && !integration.premium && !integration.tagKeys.includes(INTEGRATION_TAG_DATA_PIPELINES),
	);

	const availablePremium = integrations.filter(
		(integration) =>
			integration.type === 'available' && integration.premium && !integration.tagKeys.includes(INTEGRATION_TAG_DATA_PIPELINES),
	);
	const previewProvider = PREVIEW_CONNECTED_PROVIDER ?? '';

	if (isLoading) {
		return <Loader />;
	}

	return (
		<Page heading={t('insightsTools.integrations.pageHeading')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Integrations} />
			<div className='mt-6'>
				<h2 className='mb-4 font-medium text-xl'>{t('insightsTools.integrations.availableSection')}</h2>
				<div className='grid grid-cols-2 gap-4'>
					{availableNonPremium.map((integration, index) => {
						const previewConnected = !!PREVIEW_CONNECTED_PROVIDER && integration.id === previewProvider.toLowerCase();
						const connected = hasConnection(integration) || previewConnected;
						const connection =
							connectionByProvider.get(integration.id)?.[0] ??
							(previewConnected ? { id: PREVIEW_MOCK_CONNECTION_ID, name: t('insightsTools.integrations.previewConnectionName') } : null);
						return (
							<div key={`${integration.id}-${index}`} className='min-w-0 h-full'>
								<IntegrationCard
									integration={integration}
									connected={connected}
									connection={connection}
									isPreviewConnection={connection?.id === PREVIEW_MOCK_CONNECTION_ID}
									onOpenDrawer={(mode) => {
										setActiveIntegration(integration);
										setEditingConnection(mode === 'edit' ? (connectionByProvider.get(integration.id)?.[0] ?? null) : null);
										setIsDrawerOpen(true);
									}}
									onDeleted={() => {
										connectionQueries.forEach((q) => q.refetch?.());
									}}
								/>
							</div>
						);
					})}
				</div>
			</div>
			<div className='mt-16'>
				<p className='mb-4 font-medium text-xl'>{t('insightsTools.integrations.premiumAddonsSection')}</p>
				<div className='grid grid-cols-2 gap-4'>
					{availablePremium.map((integration, index) => (
						<div key={`${integration.id}-${index}`} className='min-w-0 h-full'>
							<IntegrationCard integration={integration} connected={false} connection={null} />
						</div>
					))}
				</div>
			</div>

			{/* Provider drawer rendered on this page */}
			{activeIntegration && (
				<>
					{activeIntegration.id === CONNECTION_PROVIDER_TYPE.STRIPE ? (
						<StripeConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.RAZORPAY ? (
						<RazorpayConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.CHARGEBEE ? (
						<ChargebeeConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.HUBSPOT ? (
						<HubSpotConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.QUICKBOOKS ? (
						<QuickBooksConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : getProviderTypeForIntegration(activeIntegration.id) === CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS ? (
						<ZohoBooksConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.NOMOD ? (
						<NomodConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.MOYASAR ? (
						<MoyasarConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.PADDLE ? (
						<PaddleConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open: boolean) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.WHOP ? (
						<WhopConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.TABS ? (
						<TabsConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.AWS_MARKETPLACE ? (
						<AwsMarketplaceConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.GCP_MARKETPLACE ? (
						<GcpMarketplaceConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : activeIntegration.id === CONNECTION_PROVIDER_TYPE.AZURE_MARKETPLACE ? (
						<AzureMarketplaceConnectionDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					) : (
						<IntegrationDrawer
							isOpen={isDrawerOpen}
							onOpenChange={(open: boolean) => {
								setIsDrawerOpen(open);
								if (!open) {
									setEditingConnection(null);
									setActiveIntegration(null);
								}
							}}
							provider={activeIntegration.id}
							providerName={activeIntegration.name}
							connection={editingConnection}
							onSave={() => {
								connectionQueries.forEach((q) => q.refetch?.());
								setIsDrawerOpen(false);
								setEditingConnection(null);
								setActiveIntegration(null);
							}}
						/>
					)}
				</>
			)}
		</Page>
	);
};

type IntegrationCardProps = {
	integration: Integration;
	connected: boolean;
	connection: any | null;
	/** Mock connection used only for UI preview */
	isPreviewConnection?: boolean;
	onOpenDrawer?: (mode?: 'edit' | 'create') => void;
	onDeleted?: () => void;
};

const IntegrationCard = ({ integration, connected, connection, isPreviewConnection, onOpenDrawer, onDeleted }: IntegrationCardProps) => {
	const queryClient = useQueryClient();
	const { t } = useTranslation('settings');
	const { i18n } = useTranslation();
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

	const providerKey = integration.id;

	const { mutate: deleteConnection, isPending: isDeletingConnection } = useMutation({
		mutationFn: (id: string) => ConnectionApi.Delete(id),
		onSuccess: () => {
			toast.success(t('insightsTools.integrations.toastDisconnected', { name: integration.name }));
			queryClient.invalidateQueries({ queryKey: ['connections', providerKey] });
			setDisconnectDialogOpen(false);
			onDeleted?.();
		},
		onError: (err: Error) => {
			toast.error(err?.message ?? t('insightsTools.integrations.toastDisconnectFailed'));
		},
	});

	const handleToggle = (checked: boolean) => {
		if (integration.premium) return;
		if (checked) {
			// Open create drawer
			onOpenDrawer?.('create');
		} else {
			setDisconnectDialogOpen(true);
		}
	};

	const handleConfirmDisconnect = () => {
		if (!connection?.id) return;
		if (connection.id === PREVIEW_MOCK_CONNECTION_ID) {
			toast.success(t('insightsTools.integrations.toastPreviewDisconnectMock'));
			setDisconnectDialogOpen(false);
			return;
		}
		deleteConnection(connection.id);
	};

	return (
		<PremiumFeature isPremiumFeature={integration.premium}>
			<Card className={cn('min-w-0 overflow-hidden border-border shadow-sm rounded-xl h-full flex flex-col')} noPadding>
				<div className='min-w-0 overflow-hidden p-6 flex-1'>
					<div className='flex gap-5'>
						<div className='flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted'>
							<img src={integration.logo} alt={integration.name} className='size-8 object-contain' />
						</div>
						<div className='min-w-0 flex-1 space-y-2'>
							<div className='flex items-center gap-2'>
								<h3 className='font-semibold text-lg text-foreground'>{integration.name}</h3>
								{connected && (
									<span className='inline-flex h-5 items-center rounded-sm bg-emerald-100 px-2 text-xs font-medium text-emerald-700'>
										{t('insightsTools.integrations.badgeConnected')}
									</span>
								)}
								{integration.premium && (
									<span className='inline-flex h-5 items-center rounded-sm bg-warning-muted px-2 text-xs font-medium text-warning-muted-foreground'>
										{t('insightsTools.integrations.badgePremium')}
									</span>
								)}
								<div className='ml-auto'>
									{integration.docsUrl ? (
										<a
											href={integration.docsUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex h-5 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
											title={t('insightsTools.integrations.openDocsTitle', { name: integration.name })}>
											{t('insightsTools.integrations.docsLink')}
											<ExternalLinkIcon className='size-3.5' />
										</a>
									) : null}
								</div>
							</div>
							<div className='min-w-0 overflow-hidden'>
								<p className='text-sm text-muted-foreground line-clamp-2 break-words'>{integration.description}</p>
							</div>
							{integration.tags.length > 0 && (
								<div className='flex flex-wrap gap-1.5 pt-1'>
									{integration.tags.slice(0, 3).map((tag, idx) => (
										<span key={idx} className='text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-sm'>
											{tag}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
				<Divider color='#f1f5f9' className='w-full' />
				<div className='flex flex-row items-center justify-between px-6 py-4'>
					<div className='flex items-center gap-2'>
						{connected ? (
							<>
								<Button
									type='button'
									variant='outline'
									size='icon'
									className='h-8 w-8'
									onClick={() => onOpenDrawer?.('edit')}
									disabled={integration.premium || isPreviewConnection}>
									<PencilIcon className='size-4' />
								</Button>
								<Button
									type='button'
									variant='outline'
									size='icon'
									className='h-8 w-8'
									onClick={() => setDisconnectDialogOpen(true)}
									disabled={integration.premium}>
									<TrashIcon className='size-4' />
								</Button>
							</>
						) : null}
					</div>
					<Switch
						checked={connected}
						onCheckedChange={handleToggle}
						disabled={integration.premium}
						className={cn(
							'data-[state=unchecked]:bg-slate-800',
							'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500',
						)}
					/>
				</div>
			</Card>

			<Dialog
				isOpen={disconnectDialogOpen}
				onOpenChange={setDisconnectDialogOpen}
				title={t('insightsTools.integrations.disconnectTitle', { name: integration.name })}
				description={t('insightsTools.integrations.disconnectDescription')}
				descriptionClassName='mt-2'>
				<div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2'>
					<Button variant='outline' onClick={() => setDisconnectDialogOpen(false)} disabled={isDeletingConnection}>
						{i18n.t('actions.cancel', { ns: 'common' })}
					</Button>
					<Button variant='destructive' onClick={handleConfirmDisconnect} disabled={isDeletingConnection || !connection?.id}>
						{isDeletingConnection ? i18n.t('status.disconnecting', { ns: 'common' }) : t('insightsTools.integrations.disconnect')}
					</Button>
				</div>
			</Dialog>
		</PremiumFeature>
	);
};

export default Integrations;
