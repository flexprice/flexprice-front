import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle } from 'lucide-react';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface NomodConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any; // for editing
	onSave: (connection: any) => void;
}

interface NomodFormData {
	name: string;
	api_key: string;
	webhook_secret: string;
	sync_config: {
		invoice: boolean; // push to Nomod
	};
}

const NomodConnectionDrawer: FC<NomodConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<NomodFormData>({
		name: '',
		api_key: '',
		webhook_secret: '',
		sync_config: {
			invoice: false, // push to Nomod
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);

	// Generate webhook URL using environment variable
	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	const webhookUrl = user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/nomod/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				// Handle sync config from connection
				const syncConfig = connection.sync_config || {};
				const encryptedData = connection.encrypted_secret_data || {};
				setFormData({
					name: connection.name || '',
					api_key: encryptedData.api_key || '',
					webhook_secret: encryptedData.webhook_secret || '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					api_key: '',
					webhook_secret: '',
					sync_config: {
						invoice: false,
					},
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof NomodFormData, value: string) => {
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
			if (!formData.api_key.trim()) {
				newErrors.api_key = 'API Key is required';
			}
			if (!formData.webhook_secret.trim()) {
				newErrors.webhook_secret = 'Webhook secret is required';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.NOMOD,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.NOMOD,
					api_key: formData.api_key,
					webhook_secret: formData.webhook_secret,
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

			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success('Nomod connection created successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to create connection');
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const payload: any = {
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

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('Nomod connection updated successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to update connection');
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

			// Reset copy status after 2 seconds
			setTimeout(() => {
				setWebhookCopied(false);
			}, 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit Nomod Connection' : 'Connect to Nomod'}
			description='Configure your Nomod integration for payment links and invoice sync.'
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label='Connection Name'
					placeholder='e.g., Nomod Production, Nomod Test'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this Nomod connection'
				/>

				{/* API Key */}
				{!connection && (
					<Input
						label='API Key'
						placeholder='Enter your API key'
						type='password'
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						description='Your Nomod API key (e.g., sk_live_...)'
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>Sync Configuration</h3>
					<p className='text-xs text-gray-600 mb-4'>Configure what data to sync between Nomod and Flexprice</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Invoices</label>
								<p className='text-xs text-gray-500'>Push to Nomod</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>
					</div>
				</div>

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>Webhook Configuration</h3>

					{/* Webhook Secret */}
					{!connection && (
						<div className='mb-4'>
							<Input
								label='Webhook Secret'
								placeholder='Enter webhook secret'
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description='The webhook secret for verifying webhook authenticity'
							/>
						</div>
					)}

					{/* Webhook URL Block */}
					<div>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>Webhook URL</label>
						<p className='text-xs text-blue-700 mb-3'>Use this webhook URL in your Zapier webhook if needed:</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
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

export default NomodConnectionDrawer;
