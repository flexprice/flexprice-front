import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import OAuthApi from '@/api/OAuthApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useUser } from '@/hooks/UserContext';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { QuickBooksWebhookEvents, getDefaultQuickBooksWebhookEvents } from '@/types';

interface QuickBooksConnection extends Connection {
	encrypted_secret_data?: {
		realm_id?: string;
		environment?: 'sandbox' | 'production';
		income_account_id?: string;
	};
	sync_config?: {
		invoice?: { inbound: boolean; outbound: boolean };
		payment?: { inbound: boolean; outbound: boolean };
	};
}

interface QuickBooksConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: QuickBooksConnection;
	onSave: (connection: Connection) => void;
}

interface QuickBooksFormData {
	name: string;
	client_id: string;
	client_secret: string;
	environment: 'sandbox' | 'production';
	income_account_id: string;
	webhook_verifier_token: string;
	sync_config: {
		invoice: boolean;
		payment: boolean;
	};
}

const QuickBooksConnectionDrawer: FC<QuickBooksConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { isProduction, activeEnvironment } = useEnvironment();
	const { user } = useUser();

	// Determine QuickBooks environment based on Flexprice environment
	const qbEnvironment: 'sandbox' | 'production' = isProduction ? 'production' : 'sandbox';

	const [formData, setFormData] = useState<QuickBooksFormData>({
		name: '',
		client_id: '',
		client_secret: '',
		environment: qbEnvironment,
		income_account_id: '',
		webhook_verifier_token: '',
		sync_config: {
			invoice: false,
			payment: false,
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	const [redirectUriCopied, setRedirectUriCopied] = useState(false);

	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
	// Generate webhook URL
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${apiUrl}/webhooks/quickbooks/${user.tenant.id}/${activeEnvironment.id}` : '';
	// Generate redirect URI
	const redirectUri = `${window.location.origin}/tools/integrations/oauth/callback`;

	// Webhook events
	const getWebhookEvents = (): QuickBooksWebhookEvents[] => {
		return getDefaultQuickBooksWebhookEvents();
	};

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const secretData = connection.encrypted_secret_data || {};
				const syncConfig = connection.sync_config || {};
				setFormData({
					name: connection.name || '',
					client_id: '',
					client_secret: '',
					environment: (secretData.environment as 'sandbox' | 'production') || qbEnvironment,
					income_account_id: secretData.income_account_id || '',
					webhook_verifier_token: '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
						payment: syncConfig.payment?.inbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					client_id: '',
					client_secret: '',
					environment: qbEnvironment,
					income_account_id: '',
					webhook_verifier_token: '',
					sync_config: {
						invoice: false,
						payment: false,
					},
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection, qbEnvironment]);

	const handleChange = (field: keyof QuickBooksFormData, value: string | 'sandbox' | 'production') => {
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

		// Only validate OAuth credentials when creating new connection
		if (!connection) {
			if (!formData.client_id.trim()) {
				newErrors.client_id = 'Client ID is required';
			}
			if (!formData.client_secret.trim()) {
				newErrors.client_secret = 'Client secret is required';
			}
		}

		// income_account_id is optional
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			if (!connection) return;

			// Get existing connection to preserve encrypted data
			const existingConnection = await ConnectionApi.Get(connection.id);
			const existingSecretData = (existingConnection as any).encrypted_secret_data || {};

			const payload: any = {
				name: formData.name,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.QUICKBOOKS,
					...existingSecretData,
					income_account_id: formData.income_account_id || undefined,
				},
				sync_config: {} as Record<string, { inbound: boolean; outbound: boolean }>,
			};

			// Add webhook verifier token if provided
			if (formData.webhook_verifier_token.trim()) {
				payload.encrypted_secret_data.webhook_verifier_token = formData.webhook_verifier_token;
			}

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = {
					inbound: false,
					outbound: true,
				};
			}

			// Payment sync is inbound-only (webhook-based)
			if (formData.sync_config.payment) {
				payload.sync_config.payment = {
					inbound: true,
					outbound: false,
				};
			}

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('QuickBooks connection updated successfully');
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

	const { mutate: initiateOAuth, isPending: isInitiatingOAuth } = useMutation({
		mutationFn: async () => {
			// Call new backend OAuth API
			// Backend will securely store credentials and return OAuth URL
			const payload: any = {
				provider: 'quickbooks',
				name: formData.name,
				credentials: {
					client_id: formData.client_id,
					client_secret: formData.client_secret,
					webhook_verifier_token: formData.webhook_verifier_token || '',
				},
				metadata: {
					environment: formData.environment,
					income_account_id: formData.income_account_id || '',
				},
			};

			// Build sync_config
			const syncConfig: Record<string, { inbound: boolean; outbound: boolean }> = {};

			if (formData.sync_config.invoice) {
				syncConfig.invoice = {
					inbound: false,
					outbound: true,
				};
			}

			// Payment sync is inbound-only (webhook-based)
			if (formData.sync_config.payment) {
				syncConfig.payment = {
					inbound: true,
					outbound: false,
				};
			}

			// Only add sync_config if at least one is enabled
			if (Object.keys(syncConfig).length > 0) {
				payload.sync_config = syncConfig;
			}

			return await OAuthApi.InitiateOAuth(payload);
		},
		onSuccess: (response) => {
			// Store ONLY non-sensitive session_id in sessionStorage
			// NO client_secret, NO access_token - SECURE!
			sessionStorage.setItem('qb_oauth_session_id', response.session_id);
			sessionStorage.setItem('oauth_provider', 'quickbooks');

			// Debug logging (safe - no sensitive data)
			console.log('🚀 QuickBooks OAuth initiated:', {
				session_id: response.session_id.substring(0, 16) + '...',
				has_oauth_url: !!response.oauth_url,
			});

			// Close drawer
			onOpenChange(false);

			// Redirect to QuickBooks OAuth page
			window.location.href = response.oauth_url;
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to initiate OAuth';
			toast.error(errorMessage);
		},
	});

	const handleSave = () => {
		if (validateForm()) {
			if (connection) {
				updateConnection();
			} else {
				// For new connections, initiate OAuth flow via backend
				initiateOAuth();
			}
		}
	};

	const isPending = isUpdating || isInitiatingOAuth;

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

	const handleCopyRedirectUri = () => {
		if (redirectUri) {
			navigator.clipboard.writeText(redirectUri);
			setRedirectUriCopied(true);
			toast.success('Redirect URI copied to clipboard!');

			setTimeout(() => {
				setRedirectUriCopied(false);
			}, 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit QuickBooks Connection' : 'Connect to QuickBooks'}
			description={
				connection
					? 'Update your QuickBooks connection settings.'
					: 'Configure your QuickBooks integration. You will be redirected to QuickBooks to authorize the connection.'
			}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label='Connection Name'
					placeholder='e.g., QuickBooks Production, QuickBooks Sandbox'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this QuickBooks connection'
				/>

				{/* Client ID */}
				{!connection && (
					<Input
						label='Client ID'
						placeholder='Enter your QuickBooks OAuth Client ID'
						type='password'
						value={formData.client_id}
						onChange={(value) => handleChange('client_id', value)}
						error={errors.client_id}
						description='Your QuickBooks OAuth Client ID from the Developer Dashboard (Keys & Credentials tab)'
					/>
				)}

				{/* Client Secret */}
				{!connection && (
					<Input
						label='Client Secret'
						placeholder='Enter your QuickBooks OAuth Client Secret'
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description='Your QuickBooks OAuth Client Secret from the Developer Dashboard (Keys & Credentials tab)'
					/>
				)}

				{/* Environment Display (Read-only, auto-selected based on Flexprice environment) */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Environment</label>
					<div className='flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
						<div className={`w-3 h-3 rounded-full ${formData.environment === 'production' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
						<span className='text-sm font-medium text-gray-900 capitalize'>{formData.environment}</span>
					</div>
				</div>

				{/* Income Account ID */}
				<Input
					label='Income Account ID (Optional)'
					placeholder='79'
					value={formData.income_account_id}
					onChange={(value) => handleChange('income_account_id', value)}
					error={errors.income_account_id}
					description="QuickBooks Income Account ID for Items. If left blank, it defaults to QuickBooks' standard income account (ID: 79)."
				/>

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>Sync Configuration</h3>
					<p className='text-xs text-gray-600 mb-4'>Configure what data to sync between QuickBooks and Flexprice</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Invoices</label>
								<p className='text-xs text-gray-500'>Push to QuickBooks</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>

						{/* Payments */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Payments</label>
								<p className='text-xs text-gray-500'>Inbound sync (webhook configuration required)</p>
							</div>
							<Switch checked={formData.sync_config.payment} onCheckedChange={(checked) => handleSyncConfigChange('payment', checked)} />
						</div>
					</div>
				</div>

				{/* Webhook Configuration (always shown, but token field only on create) */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>Webhook Configuration</h3>
					<p className='text-xs text-blue-700 mb-4'>
						{formData.sync_config.payment
							? 'Configure webhooks in your QuickBooks app to enable payment reconciliation from QuickBooks to Flexprice.'
							: 'Enable payment sync to configure webhook integration for payment reconciliation.'}
					</p>

					{/* Webhook Verifier Token - Only show when creating AND payment sync enabled */}
					{!connection && formData.sync_config.payment && (
						<div className='mb-4'>
							<Input
								label='Webhook Verifier Token (Optional)'
								placeholder='Enter webhook verifier token from QuickBooks'
								type='password'
								value={formData.webhook_verifier_token}
								onChange={(value) => handleChange('webhook_verifier_token', value)}
								description='The webhook verifier token from Intuit Developer Portal for signature verification (recommended for production)'
							/>
						</div>
					)}

					{/* Webhook URL - Always visible */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>Webhook URL</label>
						<p className='text-xs text-blue-700 mb-3'>
							Set up this webhook URL in your QuickBooks app (Intuit Developer Portal) to receive payment notifications:
						</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? 'Copied!' : 'Copy'}
							</Button>
						</div>
					</div>

					{/* Webhook Instructions - Only show when payment sync enabled */}
					{formData.sync_config.payment && (
						<div className='p-3 bg-white border border-blue-200 rounded-md'>
							<p className='text-xs text-blue-700 font-medium mb-2'>Setup Instructions:</p>
							<ol className='text-xs text-blue-700 space-y-1 list-decimal list-inside'>
								<li>Go to your QuickBooks app in Intuit Developer Portal</li>
								<li>Navigate to Webhooks section</li>
								<li>Add the webhook URL above</li>
								<li>Subscribe to Payment entity events (Create/Update)</li>
								{!connection && <li>Copy the webhook verifier token and paste it above (optional but recommended)</li>}
							</ol>
						</div>
					)}
					<br />
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
								<p className='text-xs text-blue-700 mb-3'>Subscribe to this event in your QuickBooks app (Intuit Developer Portal):</p>
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

				{/* OAuth Info Box */}
				{!connection && (
					<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
						<h3 className='text-sm font-medium text-blue-800 mb-2'>🔒 OAuth Authorization Required</h3>
						<p className='text-xs text-blue-700 mb-2'>
							After clicking `Create Connection`, you will be redirected to QuickBooks to authorize this connection.
							<br />
							Make sure you have the `Client ID` and `Client Secret` ready from your QuickBooks Dashboard.
							<br />
							<br />
							<span className='text-yellow-500 font-bold'>IMPORTANT:</span> You must configure this redirect URI in your QuickBooks' app
							settings.
							<br />
							<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md mt-2'>
								<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{redirectUri}</code>
								<Button size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'>
									{redirectUriCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
									{redirectUriCopied ? 'Copied!' : 'Copy'}
								</Button>
							</div>
						</p>
					</div>
				)}

				{/* Connection Info (when editing) */}
				{connection && (
					<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
						<p className='text-xs text-gray-500'>
							Note: OAuth credentials are encrypted and not displayed for security. To update credentials, delete this connection and create
							a new one.
						</p>
					</div>
				)}

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

export default QuickBooksConnectionDrawer;
