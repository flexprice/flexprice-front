import { useParams } from 'react-router-dom';
import { integrations } from './integrationsData';
import { cn } from '@/lib/utils';
import { Button, FormHeader, Loader, Page } from '@/components/atoms';
import { useState } from 'react';
import IntegrationDrawer from '@/components/molecules/IntegrationDrawer/IntegrationDrawer';
import { useQuery, useMutation } from '@tanstack/react-query';
import IntegrationsApi from '@/api/IntegrationsApi';
import { TrashIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiDocsContent } from '@/components/molecules';

const IntegrationDetails = () => {
	const { id: name } = useParams() as { id: string };
	const integration = integrations.find((integration) => integration.name.toLocaleLowerCase() === name.toLocaleLowerCase())!;

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Query to check if integration exists
	const {
		data: existingIntegration,
		isLoading: isCheckingIntegration,
		refetch: refetchIntegration,
	} = useQuery({
		queryKey: ['integration', name],
		queryFn: async () => {
			return await IntegrationsApi.getIntegration(name);
		},
	});

	// Mutation for uninstalling integration
	const { mutate: uninstallIntegration, isPending: isUninstallingIntegration } = useMutation({
		mutationFn: async (id: string) => {
			return await IntegrationsApi.uninstallIntegration(id);
		},
		onSuccess: () => {
			toast.success(`${integration.name} integration uninstalled successfully`);
			refetchIntegration();
		},
		onError: (error: ServerError) => {
			console.error(error);
			toast.error(error.error.message || `Failed to uninstall ${integration.name} integration. Please try again.`);
		},
	});

	const handleUninstall = () => {
		uninstallIntegration(existingIntegration?.items[0].id || '');
	};

	const handleInstall = () => {
		setIsDrawerOpen(true);
	};

	// Determine if integration is installed
	const isInstalled = existingIntegration?.items && existingIntegration.items.length > 0;

	// Handle loading state
	if (isCheckingIntegration) {
		return <Loader />;
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
					{/* Installation/Uninstallation buttons */}
					{integration.premium ? (
						<Button disabled variant='outline' className='flex gap-2 items-center'>
							Coming Soon
						</Button>
					) : isInstalled ? (
						<Button variant='outline' onClick={handleUninstall} disabled={isUninstallingIntegration} className='flex gap-2 items-center'>
							{isUninstallingIntegration ? (
								'Uninstalling...'
							) : (
								<>
									<TrashIcon className='size-4' />
									Uninstall
								</>
							)}
						</Button>
					) : (
						<Button onClick={handleInstall} className='flex gap-2 items-center'>
							Install
						</Button>
					)}
				</div>
			</div>

			{/* Integration Drawer */}
			<IntegrationDrawer
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				provider={name}
				providerName={integration.name}
				onSuccess={() => refetchIntegration()}
			/>

			{/* Display account details when installed */}
			{/* {isInstalled && (
				<div className=' mt-6'>
					<FormHeader variant='form-component-title' title='Installed Accounts' />
					<div className='card'>
						{existingIntegration?.items.map((item, idx) => (
							<div key={idx} className='flex items-center justify-between text-sm p-3 border-b last:border-b-0'>
								<p className='text-gray-900'>{item.display_id || item.name}</p>
								<div className='flex items-center gap-2'>
									<span className={cn(
										'text-xs px-2 py-1 rounded-md',
										item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
									)}>
										{item.status}
									</span>
									<Button
										variant='outline'
										size='icon'
										className='ml-auto'
										onClick={handleUninstall}
										disabled={isUninstallingIntegration}
									>
										<TrashIcon className='size-4' />
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			)} */}

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
		</Page>
	);
};

export default IntegrationDetails;
