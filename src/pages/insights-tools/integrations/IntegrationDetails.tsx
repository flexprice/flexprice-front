import { useParams } from 'react-router';
import { useIntegrationsCatalog } from './useIntegrationsCatalog';
import { cn } from '@/lib/utils';
import { Button, FormHeader, Page, Dialog } from '@/components/atoms';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import IntegrationDrawer from '@/components/molecules/IntegrationDrawer/IntegrationDrawer';
import StripeConnectionDrawer from '@/components/molecules/StripeConnectionDrawer';
import RazorpayConnectionDrawer from '@/components/molecules/RazorpayConnectionDrawer';
import ChargebeeConnectionDrawer from '@/components/molecules/ChargebeeConnectionDrawer';
import HubSpotConnectionDrawer from '@/components/molecules/HubSpotConnectionDrawer';
import QuickBooksConnectionDrawer from '@/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer';
import ZohoBooksConnectionDrawer from '@/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer';
import NomodConnectionDrawer from '@/components/molecules/NomodConnectionDrawer';
import MoyasarConnectionDrawer from '@/components/molecules/MoyasarConnectionDrawer';
import PaddleConnectionDrawer from '@/components/molecules/PaddleConnectionDrawer';
import WhopConnectionDrawer from '@/components/molecules/WhopConnectionDrawer';
import TabsConnectionDrawer from '@/components/molecules/TabsConnectionDrawer';
import { PencilIcon, TrashIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';

import { useQuery, useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';

const IntegrationDetails = () => {
	const { t } = useTranslation('settings');
	const { i18n } = useTranslation();
	const integrations = useIntegrationsCatalog();
	const { id: name } = useParams() as { id: string };
	const integration = integrations.find((i) => i.id === name.toLowerCase());
	const providerType =
		name.toLowerCase() === 'zoho' ? CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS : (name.toLowerCase() as CONNECTION_PROVIDER_TYPE);

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [editingConnection, setEditingConnection] = useState<any | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [connectionToDelete, setConnectionToDelete] = useState<{ id: string; name: string } | null>(null);

	// Fetch connections from API
	const { data: connectionsResponse, refetch: refetchConnections } = useQuery({
		queryKey: ['connections', name],
		queryFn: () => ConnectionApi.List({ provider_type: providerType }),
		enabled: !!name,
	});

	const connections = connectionsResponse?.connections || [];
	// Disable "Add a connection" when at least one connection exists (any status: published, draft, etc.)
	const hasActiveConnection = connections.length > 0;

	// Delete connection mutation
	const { mutate: deleteConnection, isPending: isDeletingConnection } = useMutation({
		mutationFn: (id: string) => ConnectionApi.Delete(id),
		onSuccess: () => {
			toast.success(t('insightsTools.integrations.toastConnectionDeleted'));
			refetchConnections();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('insightsTools.integrations.toastConnectionDeleteFailed'));
		},
	});

	// Handle save connection (called by the drawer after API success)
	const handleSaveConnection = () => {
		refetchConnections();
		setIsDrawerOpen(false);
		setEditingConnection(null);
	};

	// Delete connection with confirmation
	const handleDeleteConnection = (id: string, connectionName: string) => {
		setConnectionToDelete({ id, name: connectionName });
		setIsDeleteDialogOpen(true);
	};

	// Confirm delete action
	const confirmDeleteConnection = () => {
		if (connectionToDelete) {
			deleteConnection(connectionToDelete.id);
			setIsDeleteDialogOpen(false);
			setConnectionToDelete(null);
		}
	};

	// Cancel delete action
	const cancelDeleteConnection = () => {
		setIsDeleteDialogOpen(false);
		setConnectionToDelete(null);
	};

	// Open drawer for add/edit
	const handleAdd = () => {
		setEditingConnection(null);
		setIsDrawerOpen(true);
	};
	const handleEdit = (connection: any) => {
		setEditingConnection(connection);
		setIsDrawerOpen(true);
	};

	if (!integration) {
		return <div>{t('insightsTools.integrations.notFound')}</div>;
	}

	return (
		<Page>
			<ApiDocsContent tags={API_DOCS_TAGS.Integrations} />
			<div className={cn('border rounded-[6px] p-4 flex items-center shadow-sm', !integration.premium && 'cursor-pointer')}>
				<div className='size-20 flex items-center justify-center bg-surface-shell rounded-[6px]'>
					<img src={integration.logo} alt={integration.name} className='size-10 object-contain' />
				</div>
				<div className='ml-4 flex-1'>
					<div className='flex items-center justify-between w-full'>
						<h3 className='font-semibold text-lg'>{integration.name}</h3>
						{integration.premium && (
							<div className='absolute top-2 right-2 bg-accent-yellow-muted text-warning text-xs !font-semibold px-2 py-1 rounded-[6px] !opacity-55'>
								{t('insightsTools.integrations.comingSoon')}
							</div>
						)}
					</div>
					<p className='text-content-muted text-sm'>{integration.description}</p>
					<div className='mt-2 flex items-center gap-2'>
						{integration.tags.map((tag, idx) => (
							<span key={idx} className='text-xs bg-surface-strong px-2 py-1 rounded-[6px]'>
								{tag}
							</span>
						))}
					</div>
				</div>
				<div className='flex gap-2 items-center'>
					{integration.premium ? (
						<Button disabled variant='outline' className='flex gap-2 items-center'>
							{t('insightsTools.integrations.comingSoon')}
						</Button>
					) : hasActiveConnection ? null : (
						<Button onClick={handleAdd} className='flex gap-2 items-center'>
							{t('insightsTools.integrations.addConnection')}
						</Button>
					)}
				</div>
			</div>

			{/* Integration Drawer for Add/Edit */}
			{name.toLowerCase() === CONNECTION_PROVIDER_TYPE.STRIPE ? (
				<StripeConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.RAZORPAY ? (
				<RazorpayConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.CHARGEBEE ? (
				<ChargebeeConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.HUBSPOT ? (
				<HubSpotConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.QUICKBOOKS ? (
				<QuickBooksConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : providerType === CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS ? (
				<ZohoBooksConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.NOMOD ? (
				<NomodConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.MOYASAR ? (
				<MoyasarConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.PADDLE ? (
				<PaddleConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.WHOP ? (
				<WhopConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : name.toLowerCase() === CONNECTION_PROVIDER_TYPE.TABS ? (
				<TabsConnectionDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			) : (
				<IntegrationDrawer
					isOpen={isDrawerOpen}
					onOpenChange={(open) => {
						setIsDrawerOpen(open);
						if (!open) setEditingConnection(null);
					}}
					provider={name}
					providerName={integration.name}
					connection={editingConnection}
					onSave={handleSaveConnection}
				/>
			)}

			{/* List all connections for this provider */}
			{connections.length > 0 && (
				<div className='mt-6'>
					<FormHeader variant='form-component-title' title={t('insightsTools.integrations.connectedAccountsTitle')} />
					<div className='card'>
						{connections.map((item, idx) => {
							return (
								<div key={idx} className='flex items-center justify-between text-sm p-3 border-b last:border-b-0'>
									<div>
										<p className='text-content font-medium'>{item.name}</p>
										<p className='text-xs text-content-muted capitalize'>
											{item.connection_status} • {item.provider_type}
										</p>
									</div>
									<div className='flex items-center gap-2'>
										<Button variant='outline' size='icon' onClick={() => handleEdit(item)}>
											<PencilIcon className='size-4' />
										</Button>
										<Button
											variant='outline'
											size='icon'
											onClick={() => handleDeleteConnection(item.id, item.name)}
											disabled={isDeletingConnection}
											isLoading={isDeletingConnection}>
											<TrashIcon className='size-4' />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Details section */}
			<div className='card space-y-6 mt-6'>
				{integration.info?.map((infoItem, idx) => (
					<div key={idx} className='mt-4'>
						<FormHeader variant='form-component-title' title={infoItem.title}></FormHeader>
						{infoItem.description.map((desc, descIdx) => (
							<p key={descIdx} className='text-content-muted text-sm mt-1'>
								{desc}
							</p>
						))}
					</div>
				))}
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog
				title={t('insightsTools.integrations.deleteConnectionConfirmTitle', { name: connectionToDelete?.name ?? '' })}
				description={t('insightsTools.integrations.deleteConnectionIrreversible')}
				titleClassName='text-lg font-normal text-content-heading'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={cancelDeleteConnection}>
							{i18n.t('actions.cancel', { ns: 'common' })}
						</Button>
						<Button onClick={confirmDeleteConnection} isLoading={isDeletingConnection} disabled={isDeletingConnection}>
							{t('insightsTools.integrations.deleteConnection')}
						</Button>
					</div>
				</div>
			</Dialog>
		</Page>
	);
};

export default IntegrationDetails;
