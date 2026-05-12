import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface MoyasarConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any; // for editing
	onSave: (connection: any) => void;
}

interface MoyasarFormData {
	name: string;
	secret_key: string;
	webhook_secret: string;
}

const MoyasarConnectionDrawer: FC<MoyasarConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<MoyasarFormData>({
		name: '',
		secret_key: '',
		webhook_secret: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	// Generate webhook URL using environment variable
	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/moyasar/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const encryptedData = connection.encrypted_secret_data || {};
				setFormData({
					name: connection.name || '',
					secret_key: encryptedData.secret_key || '',
					webhook_secret: encryptedData.webhook_secret || '',
				});
			} else {
				setFormData({
					name: '',
					secret_key: '',
					webhook_secret: '',
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof MoyasarFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		// Only validate secrets when creating new connection
		if (!connection) {
			if (!formData.secret_key.trim()) {
				newErrors.secret_key = 'Secret key is required';
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
				provider_type: CONNECTION_PROVIDER_TYPE.MOYASAR,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.MOYASAR,
					publishable_key: undefined, // Included in payload by default, not shown in UI
					secret_key: formData.secret_key,
					webhook_secret: formData.webhook_secret,
				},
				sync_config: {
					invoice: {
						inbound: false,
						outbound: true,
					},
				},
			};

			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success('Moyasar connection created successfully');
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
			};

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('Moyasar connection updated successfully');
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
			title={connection ? 'Edit Moyasar Connection' : 'Connect to Moyasar'}
			description='Configure your Moyasar integration with the required credentials.'
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label='Connection Name'
					placeholder='e.g., Moyasar Production, Moyasar Test'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this Moyasar connection'
				/>

				{/* Secret Key */}
				{!connection && (
					<Input
						label='Secret Key'
						placeholder='sk_...'
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description='Your Moyasar secret key from the API keys section'
					/>
				)}

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
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>Webhook URL</label>
						<p className='text-xs text-blue-700 mb-3'>Set up this webhook URL in your Moyasar dashboard to receive event notifications:</p>
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
								<p className='text-xs text-blue-700 mb-3'>Subscribe to these events in your Moyasar dashboard:</p>
								<div className='space-y-1'>
									<div className='flex items-center gap-2 text-xs text-blue-700'>
										<div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
										<code className='font-mono'>payment_paid</code>
									</div>
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

export default MoyasarConnectionDrawer;
