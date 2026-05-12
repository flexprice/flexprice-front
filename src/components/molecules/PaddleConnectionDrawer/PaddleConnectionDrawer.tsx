import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface PaddleConnection {
	id: string;
	name: string;
	encrypted_secret_data?: {
		api_key?: string;
		webhook_secret?: string;
		client_side_token?: string;
	};
	metadata?: {
		redirect_url?: string;
	};
}

interface PaddleConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: PaddleConnection;
	onSave: (connection: PaddleConnection) => void;
}

interface PaddleFormData {
	name: string;
	api_key: string;
	webhook_secret: string;
	client_side_token: string;
	redirect_url: string;
}

const PaddleConnectionDrawer: FC<PaddleConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<PaddleFormData>({
		name: '',
		api_key: '',
		webhook_secret: '',
		client_side_token: '',
		redirect_url: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	const webhookUrl = user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/paddle/${user.tenant.id}/${activeEnvironment.id}` : '';

	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const encryptedData = connection.encrypted_secret_data || {};
				const metadata = connection.metadata || {};
				setFormData({
					name: connection.name || '',
					api_key: encryptedData.api_key || '',
					webhook_secret: encryptedData.webhook_secret || '',
					client_side_token: encryptedData.client_side_token || '',
					redirect_url: metadata.redirect_url || '',
				});
			} else {
				setFormData({
					name: '',
					api_key: '',
					webhook_secret: '',
					client_side_token: '',
					redirect_url: '',
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof PaddleFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		if (!connection) {
			if (!formData.api_key.trim()) {
				newErrors.api_key = 'API key is required';
			}
			if (!formData.webhook_secret.trim()) {
				newErrors.webhook_secret = 'Webhook secret is required';
			}
			if (!formData.client_side_token.trim()) {
				newErrors.client_side_token = 'Client-side token is required';
			}
		}

		if (formData.redirect_url.trim() && !/^https?:\/\/.+/.test(formData.redirect_url.trim())) {
			newErrors.redirect_url = 'Must be a valid URL starting with http:// or https://';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.PADDLE,
				encrypted_secret_data: {
					api_key: formData.api_key,
					webhook_secret: formData.webhook_secret,
					client_side_token: formData.client_side_token,
				},
				...(formData.redirect_url.trim() && {
					metadata: { redirect_url: formData.redirect_url.trim() },
				}),
				sync_config: {
					invoice: { inbound: false, outbound: true },
				},
			};
			return await ConnectionApi.Create(payload as Parameters<typeof ConnectionApi.Create>[0]);
		},
		onSuccess: (response) => {
			toast.success('Paddle connection created successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const message = error instanceof Error ? error.message : undefined;
			toast.error(message || 'Failed to create connection');
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const trimmedRedirectUrl = formData.redirect_url.trim();
			const payload = {
				name: formData.name,
				metadata: trimmedRedirectUrl ? { redirect_url: trimmedRedirectUrl } : ({} as Record<string, string>),
			};
			return await ConnectionApi.Update(connection!.id, payload);
		},
		onSuccess: (response) => {
			toast.success('Paddle connection updated successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const message = error instanceof Error ? error.message : undefined;
			toast.error(message || 'Failed to update connection');
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
			setTimeout(() => setWebhookCopied(false), 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit Paddle Connection' : 'Connect to Paddle'}
			description='Configure your Paddle integration with the required credentials.'
			size='lg'>
			<div className='space-y-6 mt-4'>
				<Input
					label='Connection Name'
					placeholder='e.g., Paddle Production, Paddle Sandbox'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this Paddle connection'
				/>

				{!connection && (
					<>
						<Input
							label='API Key'
							placeholder='Enter your Paddle API key'
							type='password'
							value={formData.api_key}
							onChange={(value) => handleChange('api_key', value)}
							error={errors.api_key}
							description='Your Paddle API key from Developer Tools > Authentication'
						/>

						<Input
							label='Client-Side Token'
							placeholder='live_... or test_...'
							type='password'
							value={formData.client_side_token}
							onChange={(value) => handleChange('client_side_token', value)}
							error={errors.client_side_token}
							description='Paddle client-side token from Developer Tools > Authentication. Used to initialize Paddle.js on the checkout page.'
						/>
					</>
				)}

				<Input
					label='Redirect URL'
					placeholder='https://your-app.com/payment-success'
					value={formData.redirect_url}
					onChange={(value) => handleChange('redirect_url', value)}
					error={errors.redirect_url}
					description='URL customers are redirected to after a successful payment (optional)'
				/>

				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>Webhook Configuration</h3>

					{!connection && (
						<div className='mb-4'>
							<Input
								label='Webhook Secret'
								placeholder='pdl_ntfset_...'
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description='The webhook secret for verifying webhook authenticity'
							/>
						</div>
					)}

					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>Webhook URL</label>
						<p className='text-xs text-blue-700 mb-3'>Set up this webhook URL in your Paddle dashboard to receive event notifications:</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button type='button' size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
					</div>

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
								<p className='text-xs text-blue-700 mb-3'>Subscribe to these events in your Paddle dashboard:</p>
								<div className='space-y-1'>
									<div className='flex items-center gap-2 text-xs text-blue-700'>
										<div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
										<code className='font-mono'>transactions.completed</code>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<Spacer className='!h-4' />

				<div className='flex gap-2'>
					<Button type='button' variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						Cancel
					</Button>
					<Button
						type='button'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							handleSave();
						}}
						className='flex-1'
						isLoading={isPending}
						disabled={isPending}>
						{connection ? 'Update Connection' : 'Create Connection'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default PaddleConnectionDrawer;
