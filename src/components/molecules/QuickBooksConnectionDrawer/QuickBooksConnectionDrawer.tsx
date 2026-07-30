import { config } from '@/config/config';
import { FC, useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
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

	// Generate webhook URL
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/quickbooks/${user.tenant.id}/${activeEnvironment.id}` : '';
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
			newErrors.name = t('connection.validation.nameRequired');
		}

		// Only validate OAuth credentials when creating new connection
		if (!connection) {
			if (!formData.client_id.trim()) {
				newErrors.client_id = t('connection.validation.clientIdRequired');
			}
			if (!formData.client_secret.trim()) {
				newErrors.client_secret = t('connection.validation.clientSecretRequired');
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
			toast.success(t('connection.toast.updated', { provider: 'QuickBooks' }));
			if (response) {
				onSave(response);
			}
			onOpenChange(false);
		},
		onError: (error: Error) => {
			const errorMessage = error.message || t('connection.toast.failedToUpdate');
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
		onError: (error: Error) => {
			const errorMessage = error.message || t('connection.toast.failedOAuth');
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
			toast.success(t('connection.toast.webhookUrlCopied'));

			setTimeout(() => {
				setWebhookCopied(false);
			}, 2000);
		}
	};

	const handleCopyRedirectUri = () => {
		if (redirectUri) {
			navigator.clipboard.writeText(redirectUri);
			setRedirectUriCopied(true);
			toast.success(t('connection.toast.redirectUriCopied'));

			setTimeout(() => {
				setRedirectUriCopied(false);
			}, 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				connection
					? t('integrationDrawer.title.edit', { providerName: 'QuickBooks' })
					: t('integrationDrawer.title.connect', { providerName: 'QuickBooks' })
			}
			description={connection ? t('connection.quickBooks.descriptionEdit') : t('connection.quickBooks.descriptionCreate')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.quickBooks.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.quickBooks.connectionNameHint')}
				/>

				{/* Client ID */}
				{!connection && (
					<Input
						label={t('connection.quickBooks.clientId')}
						placeholder={t('connection.quickBooks.clientIdPlaceholder')}
						type='password'
						value={formData.client_id}
						onChange={(value) => handleChange('client_id', value)}
						error={errors.client_id}
						description={t('connection.quickBooks.clientIdHint')}
					/>
				)}

				{/* Client Secret */}
				{!connection && (
					<Input
						label={t('connection.quickBooks.qbClientSecret')}
						placeholder={t('connection.quickBooks.qbClientSecretPlaceholder')}
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description={t('connection.quickBooks.qbClientSecretHint')}
					/>
				)}

				{/* Environment Display (Read-only, auto-selected based on Flexprice environment) */}
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-2'>{t('connection.labels.environment')}</label>
					<div className='flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
						<div className={`w-3 h-3 rounded-full ${formData.environment === 'production' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
						<span className='text-sm font-medium text-gray-900 capitalize'>{formData.environment}</span>
					</div>
				</div>

				{/* Income Account ID */}
				<Input
					label={t('connection.quickBooks.incomeAccountOptional')}
					placeholder={t('connection.quickBooks.incomeAccountPlaceholder')}
					value={formData.income_account_id}
					onChange={(value) => handleChange('income_account_id', value)}
					error={errors.income_account_id}
					description={t('connection.quickBooks.incomeAccountHint')}
				/>

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-gray-600 mb-4'>{t('connection.sync.description', { partner: 'QuickBooks' })}</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('connection.labels.invoices')}</label>
								<p className='text-xs text-gray-500'>{t('connection.quickBooks.pushToQb')}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>

						{/* Payments */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('connection.labels.payments')}</label>
								<p className='text-xs text-gray-500'>{t('connection.sync.inboundWebhook')}</p>
							</div>
							<Switch checked={formData.sync_config.payment} onCheckedChange={(checked) => handleSyncConfigChange('payment', checked)} />
						</div>
					</div>
				</div>

				{/* Webhook Configuration (always shown, but token field only on create) */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>{t('connection.webhook.sectionTitle')}</h3>
					<p className='text-xs text-blue-700 mb-4'>
						{formData.sync_config.payment
							? t('connection.quickBooks.webhookPaymentEnabled')
							: t('connection.quickBooks.webhookPaymentDisabled')}
					</p>

					{/* Webhook Verifier Token - Only show when creating AND payment sync enabled */}
					{!connection && formData.sync_config.payment && (
						<div className='mb-4'>
							<Input
								label={t('connection.quickBooks.webhookVerifierOptional')}
								placeholder={t('connection.quickBooks.webhookVerifierPlaceholder')}
								type='password'
								value={formData.webhook_verifier_token}
								onChange={(value) => handleChange('webhook_verifier_token', value)}
								description={t('connection.quickBooks.webhookVerifierHint')}
							/>
						</div>
					)}

					{/* Webhook URL - Always visible */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-blue-700 mb-3'>{t('connection.quickBooks.qbWebhookIntro')}</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? tc('actions.copied') : tc('actions.copy')}
							</Button>
						</div>
					</div>

					{/* Webhook Instructions - Only show when payment sync enabled */}
					{formData.sync_config.payment && (
						<div className='p-3 bg-white border border-blue-200 rounded-md'>
							<p className='text-xs text-blue-700 font-medium mb-2'>{t('connection.webhook.setupInstructions')}</p>
							<ol className='text-xs text-blue-700 space-y-1 list-decimal list-inside'>
								<li>{t('connection.quickBooks.qbSetupStep1')}</li>
								<li>{t('connection.quickBooks.qbSetupStep2')}</li>
								<li>{t('connection.quickBooks.qbSetupStep3')}</li>
								<li>{t('connection.quickBooks.qbSetupStep4')}</li>
								{!connection && <li>{t('connection.quickBooks.qbSetupStep5Optional')}</li>}
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
							{t('connection.webhook.eventsToSubscribe')}
						</button>

						{isWebhookEventsExpanded && (
							<div className='mt-2 p-3 bg-white border border-blue-200 rounded-md'>
								<p className='text-xs text-blue-700 mb-3'>{t('connection.quickBooks.qbWebhookEventsIntro')}</p>
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
						<h3 className='text-sm font-medium text-blue-800 mb-2'>{t('connection.quickBooks.oauthTitle')}</h3>
						<p className='text-xs text-blue-700 mb-2'>{t('connection.quickBooks.oauthBody')}</p>
						<p className='text-xs text-blue-700 mb-2'>{t('connection.quickBooks.oauthClientReady')}</p>
						<p className='text-xs text-blue-700 mb-2'>
							<Trans
								ns='settings'
								i18nKey='connection.quickBooks.oauthImportantRich'
								components={{ important: <span className='text-yellow-500 font-bold' /> }}
							/>
						</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md mt-2'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{redirectUri}</code>
							<Button size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'>
								{redirectUriCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{redirectUriCopied ? tc('actions.copied') : tc('actions.copy')}
							</Button>
						</div>
					</div>
				)}

				{/* Connection Info (when editing) */}
				{connection && (
					<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
						<p className='text-xs text-gray-500'>{t('connection.quickBooks.noteEditing')}</p>
					</div>
				)}

				<Spacer className='!h-4' />

				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						{tc('actions.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}>
						{connection ? t('connection.buttons.updateConnection') : t('connection.buttons.createConnection')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default QuickBooksConnectionDrawer;
