import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';

interface HubSpotConnection extends Connection {
	sync_config?: {
		invoice?: { inbound: boolean; outbound: boolean };
		deal?: { inbound: boolean; outbound: boolean };
	};
	access_token?: string;
	client_secret?: string;
}

interface HubSpotConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: HubSpotConnection;
	onSave: (connection: Connection) => void;
}

interface HubSpotFormData {
	name: string;
	access_token: string;
	client_secret: string;
	sync_config: {
		invoice: boolean;
		deal: boolean;
	};
}

const HubSpotConnectionDrawer: FC<HubSpotConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<HubSpotFormData>({
		name: '',
		access_token: '',
		client_secret: '',
		sync_config: {
			invoice: false,
			deal: false,
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isScopesExpanded, setIsScopesExpanded] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	// Generate webhook URL
	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/hubspot/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Get required scopes based on sync configuration
	const getRequiredScopes = (): string[] => {
		const scopes: string[] = ['crm.objects.contacts.read', 'crm.objects.contacts.write'];

		if (formData.sync_config.invoice) {
			scopes.push(
				'crm.objects.line_items.read',
				'crm.objects.line_items.write',
				'crm.schemas.invoices.read',
				'crm.schemas.invoices.write',
				'crm.objects.invoices.read',
				'crm.objects.invoices.write',
			);
		}

		if (formData.sync_config.deal) {
			scopes.push(
				'crm.objects.line_items.read',
				'crm.objects.line_items.write',
				'crm.schemas.deals.read',
				'crm.schemas.deals.write',
				'crm.objects.deals.read',
				'crm.objects.deals.write',
			);
		}

		// Remove duplicates
		return Array.from(new Set(scopes));
	};

	// Get webhook events
	const getWebhookEvents = (): string[] => {
		return ['dealstage deal.propertyChange'];
	};

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				// Extract sync config from connection with proper type handling
				const syncConfig = connection.sync_config || {};

				setFormData({
					name: connection.name || '',
					access_token: connection.access_token || '',
					client_secret: connection.client_secret || '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
						deal: syncConfig.deal?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					access_token: '',
					client_secret: '',
					sync_config: {
						invoice: false,
						deal: false,
					},
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof HubSpotFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const handleSyncConfigChange = (category: keyof typeof formData.sync_config, value: boolean) => {
		setFormData((prev) => ({
			...prev,
			sync_config: {
				...prev.sync_config,
				[category]: value,
			},
		}));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		// Only validate secrets when creating new connection
		if (!connection) {
			if (!formData.access_token.trim()) {
				newErrors.access_token = 'Access token is required';
			}
			if (!formData.client_secret.trim()) {
				newErrors.client_secret = 'Client secret is required';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.HUBSPOT,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.HUBSPOT,
					access_token: formData.access_token,
					client_secret: formData.client_secret,
				},
				sync_config: {} as Record<string, { inbound: boolean; outbound: boolean }>,
			};

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = {
					inbound: false,
					outbound: true,
				};
			}

			// Only add deal config if toggle is true
			if (formData.sync_config.deal) {
				payload.sync_config.deal = {
					inbound: false,
					outbound: true,
				};
			}

			return await ConnectionApi.createConnection(payload);
		},
		onSuccess: (response) => {
			toast.success('HubSpot connection created successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create connection';
			toast.error(errorMessage);
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			if (!connection) return;

			const payload = {
				name: formData.name,
				sync_config: {} as Record<string, { inbound: boolean; outbound: boolean }>,
			};

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = {
					inbound: false,
					outbound: true,
				};
			}

			// Only add deal config if toggle is true
			if (formData.sync_config.deal) {
				payload.sync_config.deal = {
					inbound: false,
					outbound: true,
				};
			}

			return await ConnectionApi.updateConnection(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('HubSpot connection updated successfully');
			if (response) {
				onSave(response);
			}
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update connection';
			toast.error(errorMessage);
		},
	});

	const handleSave = () => {
		if (validateForm()) {
			if (connection) {
				updateConnection();
			} else {
				createConnection();
			}
		}
	};

	const isPending = isCreating || isUpdating;

	const handleCopyWebhookUrl = () => {
		if (webhookUrl) {
			navigator.clipboard.writeText(webhookUrl);
			setWebhookCopied(true);
			toast.success('Webhook URL copied to clipboard!');

			setTimeout(() => {
				setWebhookCopied(false);
			}, 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit HubSpot Connection' : 'Connect to HubSpot'}
			description='Configure your HubSpot integration with the required credentials.'
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label='Connection Name'
					placeholder='e.g., Production HubSpot, Test HubSpot'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this HubSpot connection'
				/>

				{/* Access Token */}
				{!connection && (
					<Input
						label='Access Token'
						placeholder='pat-...'
						type='password'
						value={formData.access_token}
						onChange={(value) => handleChange('access_token', value)}
						error={errors.access_token}
						description='Your HubSpot private app access token'
					/>
				)}

				{/* Client Secret */}
				{!connection && (
					<Input
						label='Client Secret'
						placeholder='Enter your client secret'
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description='Your HubSpot app client secret'
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>Sync Configuration</h3>
					<p className='text-xs text-gray-600 mb-4'>Configure what data to sync between HubSpot and Flexprice</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Invoices</label>
								<p className='text-xs text-gray-500'>Push to HubSpot</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>

						{/* Deals */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Deals</label>
								<p className='text-xs text-gray-500'>Push to HubSpot</p>
							</div>
							<Switch checked={formData.sync_config.deal} onCheckedChange={(checked) => handleSyncConfigChange('deal', checked)} />
						</div>
					</div>
				</div>

				{/* Scopes Section */}
				<div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
					<button
						type='button'
						onClick={() => setIsScopesExpanded(!isScopesExpanded)}
						className='flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 mb-2'>
						{isScopesExpanded ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
						Required Scopes
					</button>

					{isScopesExpanded && (
						<div className='mt-2 p-3 bg-white border border-amber-200 rounded-md'>
							<p className='text-xs text-amber-700 mb-3'>
								Based on your sync configuration, ensure these scopes are enabled in your HubSpot app:
							</p>
							<div className='space-y-1'>
								{getRequiredScopes().map((scope, index) => (
									<div key={index} className='flex items-center gap-2 text-xs text-amber-700'>
										<div className='w-1.5 h-1.5 bg-amber-500 rounded-full'></div>
										<code className='font-mono'>{scope}</code>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>Webhook Configuration</h3>

					{/* Webhook URL Block */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>Webhook URL</label>
						<p className='text-xs text-blue-700 mb-3'>
							Set up this webhook URL in your HubSpot legacy app dashboard to receive event notifications:
						</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
					</div>

					{/* Webhook Events to Subscribe - Collapsible */}
					<div>
						<button
							type='button'
							onClick={() => setIsWebhookEventsExpanded(!isWebhookEventsExpanded)}
							className='flex items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-900 mb-2'>
							{isWebhookEventsExpanded ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
							Webhook Events to Subscribe
						</button>

						{isWebhookEventsExpanded && (
							<div className='mt-2 p-3 bg-white border border-blue-200 rounded-md'>
								<p className='text-xs text-blue-700 mb-3'>Subscribe to these events in your HubSpot webhook configuration:</p>
								<div className='space-y-1'>
									{getWebhookEvents().map((event, index) => (
										<div key={index} className='flex items-center gap-2 text-xs text-blue-700'>
											<div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
											<code className='font-mono'>{event}</code>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>

				<Spacer className='!h-4' />

				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}>
						{connection ? 'Update Connection' : 'Create Connection'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default HubSpotConnectionDrawer;
