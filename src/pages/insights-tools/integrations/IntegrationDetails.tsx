import { useParams } from 'react-router-dom';
import { integrations } from './integrationsData';
import { cn } from '@/lib/utils';
import { Button, FormHeader, Page, Dialog } from '@/components/atoms';
import { useState } from 'react';
import IntegrationDrawer from '@/components/molecules/IntegrationDrawer/IntegrationDrawer';
import StripeConnectionDrawer from '@/components/molecules/StripeConnectionDrawer';
import RazorpayConnectionDrawer from '@/components/molecules/RazorpayConnectionDrawer';
import ChargebeeConnectionDrawer from '@/components/molecules/ChargebeeConnectionDrawer';
import HubSpotConnectionDrawer from '@/components/molecules/HubSpotConnectionDrawer';
import { PencilIcon, TrashIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiDocsContent } from '@/components/molecules';

import { useQuery, useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';

const IntegrationDetails = () => {
	const { id: name } = useParams() as { id: string };
	const integration = integrations.find((integration) => integration.name.toLocaleLowerCase() === name.toLocaleLowerCase());

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [editingConnection, setEditingConnection] = useState<any | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [connectionToDelete, setConnectionToDelete] = useState<{ id: string; name: string } | null>(null);

	// Fetch connections from API
	const { data: connectionsResponse, refetch: refetchConnections } = useQuery({
		queryKey: ['connections', name],
		queryFn: () => ConnectionApi.getAllConnections({ provider_type: name.toLowerCase() as CONNECTION_PROVIDER_TYPE }),
		enabled: !!name,
	});

	const connections = connectionsResponse?.connections || [];

	// Delete connection mutation
	const { mutate: deleteConnection, isPending: isDeletingConnection } = useMutation({
		mutationFn: (id: string) => ConnectionApi.deleteConnection(id),
		onSuccess: () => {
			toast.success('Connection deleted successfully');
			refetchConnections();
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to delete connection');
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
		return <div>Integration not found</div>;
	}

	return (
		<Page>
			<ApiDocsContent tags={['Integrations', 'secrets']} />
			<div className={cn('border rounded-xl p-4 flex items-center shadow-sm', !integration.premium && 'cursor-pointer')}>
				<div className='size-20 flex items-center justify-center bg-gray-100 rounded-lg'>
					<img src={integration.logo} alt={integration.name} className='size-16 object-contain' />
				</div>
				<div className='ml-4 flex-1'>
					<div className='flex items-center justify-between w-full'>
						<h3 className='font-semibold text-lg'>{integration.name}</h3>
						{integration.premium && (
							<div className='absolute top-2 right-2 bg-[#FEF08A] text-[#D97706] text-xs !font-semibold px-2 py-1 rounded-2xl !opacity-55'>
								Coming Soon
							</div>
						)}
					</div>
					<p className='text-gray-500 text-sm'>{integration.description}</p>
					<div className='mt-2 flex items-center gap-2'>
						{integration.tags.map((tag, idx) => (
							<span key={idx} className='text-xs bg-gray-200 px-2 py-1 rounded-md'>
								{tag}
							</span>
						))}
					</div>
				</div>
				<div className='flex gap-2 items-center'>
					{integration.premium ? (
						<Button disabled variant='outline' className='flex gap-2 items-center'>
							Coming Soon
						</Button>
					) : (
						<Button onClick={handleAdd} className='flex gap-2 items-center'>
							Add a connection
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
					<FormHeader variant='form-component-title' title='Connected Accounts' />
					<div className='card'>
						{connections.map((item, idx) => {
							return (
								<div key={idx} className='flex items-center justify-between text-sm p-3 border-b last:border-b-0'>
									<div>
										<p className='text-gray-900 font-medium'>{item.name}</p>
										<p className='text-xs text-gray-500 capitalize'>
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
							<p key={descIdx} className='text-gray-500 text-sm mt-1'>
								{desc}
							</p>
						))}
					</div>
				))}
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog
				title={`Are you sure you want to delete the connection "${connectionToDelete?.name}"?`}
				description='This action cannot be undone.'
				titleClassName='text-lg font-normal text-gray-800'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={cancelDeleteConnection}>
							Cancel
						</Button>
						<Button onClick={confirmDeleteConnection} isLoading={isDeletingConnection} disabled={isDeletingConnection}>
							Delete Connection
						</Button>
					</div>
				</div>
			</Dialog>
		</Page>
	);
};

export default IntegrationDetails;
