import { config } from '@/config/config';
import { FC, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button, Checkbox, Input, Select, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import OAuthApi from '@/api/OAuthApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useUser } from '@/hooks/UserContext';
import { CheckCircle, Copy } from 'lucide-react';

interface ZohoBooksConnection extends Connection {
	encrypted_secret_data?: {
		organization_id?: string;
		organization_name?: string;
		accounts_server?: string;
	};
	sync_config?: {
		invoice_sync_settings?: {
			payment_gateways?: {
				enabled?: boolean;
				gateways?: string[];
				paypal_payment_method?: string;
			};
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
}

interface ZohoBooksConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: ZohoBooksConnection;
	onSave: (connection: Connection) => void;
}

interface ZohoBooksFormData {
	name: string;
	client_id: string;
	client_secret: string;
	organization_id: string;
	accounts_server: string;
	webhook_secret: string;
	sync_config: {
		payment_gateways: {
			enabled: boolean;
			gateways: string[];
			paypal_payment_method: string;
		};
	};
}

// Zoho Books gateway_name values. Labels are brand names, so they are not translated.
const ZOHO_PAYMENT_GATEWAYS = [
	{ value: 'paypal', label: 'PayPal' },
	{ value: 'stripe', label: 'Stripe' },
	{ value: 'razorpay', label: 'Razorpay' },
	{ value: 'authorize_net', label: 'Authorize.Net' },
	{ value: 'payflow_pro', label: 'PayPal Payflow Pro' },
	{ value: 'braintree', label: 'Braintree' },
	{ value: '2checkout', label: '2Checkout' },
];

const ZOHO_SESSION_KEY = 'zoho_books_oauth_session_id';
const OAUTH_PROVIDER_KEY = 'oauth_provider';

const ZohoBooksConnectionDrawer: FC<ZohoBooksConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/zoho_books/${user.tenant.id}/${activeEnvironment.id}` : '';

	const [formData, setFormData] = useState<ZohoBooksFormData>({
		name: '',
		client_id: '',
		client_secret: '',
		organization_id: '',
		accounts_server: 'https://accounts.zoho.in',
		webhook_secret: '',
		sync_config: {
			payment_gateways: {
				enabled: false,
				gateways: [],
				paypal_payment_method: 'standard',
			},
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [redirectUriCopied, setRedirectUriCopied] = useState(false);
	const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);
	const redirectUri = `${window.location.origin}/tools/integrations/oauth/callback`;

	useEffect(() => {
		if (!isOpen) return;
		const secretData = connection?.encrypted_secret_data || {};
		setFormData({
			name: connection?.name || '',
			client_id: '',
			client_secret: '',
			organization_id: (secretData.organization_id as string) || '',
			accounts_server: (secretData.accounts_server as string) || 'https://accounts.zoho.in',
			webhook_secret: '',
			sync_config: {
				payment_gateways: {
					enabled: connection?.sync_config?.invoice_sync_settings?.payment_gateways?.enabled || false,
					gateways: connection?.sync_config?.invoice_sync_settings?.payment_gateways?.gateways || [],
					paypal_payment_method: connection?.sync_config?.invoice_sync_settings?.payment_gateways?.paypal_payment_method || 'standard',
				},
			},
		});
		setErrors({});
		setWebhookUrlCopied(false);
	}, [isOpen, connection]);

	const handleChange = (field: keyof ZohoBooksFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const handlePaymentGatewaysEnabledChange = (value: boolean) => {
		setFormData((prev) => ({
			...prev,
			sync_config: {
				payment_gateways: {
					...prev.sync_config.payment_gateways,
					enabled: value,
				},
			},
		}));
		setErrors((prev) => ({ ...prev, payment_gateways: '' }));
	};

	const handlePaymentGatewayChange = (gateway: string, selected: boolean) => {
		setFormData((prev) => ({
			...prev,
			sync_config: {
				payment_gateways: {
					...prev.sync_config.payment_gateways,
					gateways: selected
						? [...prev.sync_config.payment_gateways.gateways, gateway]
						: prev.sync_config.payment_gateways.gateways.filter((g) => g !== gateway),
				},
			},
		}));
		setErrors((prev) => ({ ...prev, payment_gateways: '' }));
	};

	const handlePayPalPaymentMethodChange = (value: string) => {
		setFormData((prev) => ({
			...prev,
			sync_config: {
				payment_gateways: {
					...prev.sync_config.payment_gateways,
					paypal_payment_method: value,
				},
			},
		}));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.name.trim()) newErrors.name = t('connection.validation.nameRequired');
		if (!connection && !formData.client_id.trim()) newErrors.client_id = t('connection.validation.clientIdRequired');
		if (!connection && !formData.client_secret.trim()) newErrors.client_secret = t('connection.validation.clientSecretRequired');
		if (!formData.organization_id.trim()) newErrors.organization_id = t('connection.validation.organizationIdRequired');
		if (!formData.accounts_server.trim()) newErrors.accounts_server = t('connection.validation.accountsServerRequired');
		if (!connection && !formData.webhook_secret.trim()) {
			newErrors.webhook_secret = t('connection.validation.webhookSecretRequired');
		}
		if (formData.sync_config.payment_gateways.enabled && formData.sync_config.payment_gateways.gateways.length === 0) {
			newErrors.payment_gateways = t('connection.validation.paymentGatewayRequired');
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const isPayPalSelected = formData.sync_config.payment_gateways.gateways.includes('paypal');
	// The PayPal payment method applies only when PayPal is selected.
	const paymentGatewaysPayload = {
		enabled: formData.sync_config.payment_gateways.enabled,
		gateways: formData.sync_config.payment_gateways.gateways,
		...(isPayPalSelected && { paypal_payment_method: formData.sync_config.payment_gateways.paypal_payment_method }),
	};

	const { mutate: initiateOAuth, isPending: isInitiatingOAuth } = useMutation({
		mutationFn: async () => {
			return await OAuthApi.InitiateOAuth({
				provider: 'zoho_books',
				name: formData.name,
				credentials: {
					client_id: formData.client_id,
					client_secret: formData.client_secret,
					webhook_secret: formData.webhook_secret || '',
				},
				metadata: {
					accounts_server: formData.accounts_server,
					organization_id: formData.organization_id,
					organization_name: '',
				},
				sync_config: {
					invoice: {
						inbound: false,
						outbound: true,
					},
					customer: {
						inbound: true,
						outbound: false,
					},
					invoice_sync_settings: {
						payment_gateways: paymentGatewaysPayload,
					},
				},
			});
		},
		onSuccess: (response) => {
			sessionStorage.setItem(ZOHO_SESSION_KEY, response.session_id);
			sessionStorage.setItem(OAUTH_PROVIDER_KEY, 'zoho_books');
			// codeql[js/clear-text-storage-of-sensitive-data] organization_id is a non-secret account
			// identifier (not the client_secret/webhook_secret credentials, which are never persisted
			// client-side) - it must survive the full-page redirect to Zoho and back for the OAuth
			// callback to resume the connection.
			sessionStorage.setItem('zoho_books_organization_id', formData.organization_id.trim());
			onOpenChange(false);
			window.location.href = response.oauth_url;
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedZohoOAuth'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			if (!connection) return;
			const existingConnection = await ConnectionApi.Get(connection.id);
			const existingSecretData = (existingConnection as ZohoBooksConnection).encrypted_secret_data || {};
			// The backend replaces sync_config wholesale, so carry every existing setting forward.
			const existingSyncConfig = (existingConnection as ZohoBooksConnection).sync_config || {};
			const payload: Record<string, unknown> = {
				name: formData.name,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.ZOHO_BOOKS,
					...existingSecretData,
				},
				sync_config: {
					...existingSyncConfig,
					invoice_sync_settings: {
						...existingSyncConfig.invoice_sync_settings,
						payment_gateways: paymentGatewaysPayload,
					},
				},
			};
			if (formData.webhook_secret.trim()) {
				(payload.encrypted_secret_data as Record<string, string>).webhook_secret = formData.webhook_secret.trim();
			}
			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.zohoBooks.toastUpdated'));
			if (response) onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToUpdate'));
		},
	});

	const handleSave = () => {
		if (!validateForm()) return;
		if (connection) {
			updateConnection();
			return;
		}
		initiateOAuth();
	};

	const handleCopyRedirectUri = () => {
		navigator.clipboard.writeText(redirectUri);
		setRedirectUriCopied(true);
		toast.success(t('connection.toast.redirectUriCopied'));
		setTimeout(() => setRedirectUriCopied(false), 2000);
	};

	const handleCopyWebhookUrl = () => {
		if (!webhookUrl) return;
		navigator.clipboard.writeText(webhookUrl);
		setWebhookUrlCopied(true);
		toast.success(t('connection.toast.webhookUrlCopied'));
		setTimeout(() => setWebhookUrlCopied(false), 2000);
	};

	const isPending = isUpdating || isInitiatingOAuth;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				connection
					? t('integrationDrawer.title.edit', { providerName: 'Zoho Books' })
					: t('integrationDrawer.title.connect', { providerName: 'Zoho Books' })
			}
			description={t('connection.zohoBooks.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.zohoBooks.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
				/>

				{!connection && (
					<>
						<Input
							label={t('connection.quickBooks.clientId')}
							type='password'
							placeholder={t('connection.zohoBooks.clientIdPlaceholder')}
							value={formData.client_id}
							onChange={(value) => handleChange('client_id', value)}
							error={errors.client_id}
						/>
						<Input
							label={t('connection.quickBooks.qbClientSecret')}
							type='password'
							placeholder={t('connection.zohoBooks.clientSecretPlaceholder')}
							value={formData.client_secret}
							onChange={(value) => handleChange('client_secret', value)}
							error={errors.client_secret}
						/>
					</>
				)}

				<Input
					label={t('connection.zohoBooks.organizationId')}
					placeholder={t('connection.zohoBooks.organizationIdPlaceholder')}
					value={formData.organization_id}
					onChange={(value) => handleChange('organization_id', value)}
					error={errors.organization_id}
					description={t('connection.zohoBooks.organizationIdHint')}
					disabled={!!connection}
				/>

				<Input
					label={t('connection.zohoBooks.accountsServer')}
					placeholder={t('connection.zohoBooks.accountsServerPlaceholder')}
					value={formData.accounts_server}
					onChange={(value) => handleChange('accounts_server', value)}
					error={errors.accounts_server}
					description={t('connection.zohoBooks.accountsServerHint')}
					disabled={!!connection}
				/>

				<div className='p-4 bg-info-muted border border-info-line rounded-lg'>
					<h3 className='text-sm font-medium text-info-deep mb-3'>{t('connection.zohoBooks.webhookSection')}</h3>
					<p className='text-xs text-info-strong mb-4'>
						<Trans
							ns='settings'
							i18nKey='connection.zohoBooks.webhookBodyHtml'
							components={{ header: <code className='text-xs bg-surface/80 px-1 rounded' /> }}
						/>
					</p>
					<div className='mb-4'>
						<label className='block text-sm font-medium text-info-deep mb-2'>{t('connection.webhook.url')}</label>
						<div className='flex items-center gap-2 p-2 bg-surface border border-info-line rounded-md'>
							<code className='flex-1 text-xs text-content-heading font-mono break-all'>
								{webhookUrl || t('connection.zohoBooks.selectTenantForUrl')}
							</code>
							<Button
								size='xs'
								variant='outline'
								onClick={handleCopyWebhookUrl}
								className='flex items-center gap-1 shrink-0'
								disabled={!webhookUrl}>
								{webhookUrlCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookUrlCopied ? tc('actions.copied') : tc('actions.copy')}
							</Button>
						</div>
					</div>
					<Input
						label={t('connection.zohoBooks.webhookSecret')}
						type='password'
						placeholder={
							connection ? t('connection.zohoBooks.webhookSecretPlaceholderEdit') : t('connection.zohoBooks.webhookSecretPlaceholderCreate')
						}
						value={formData.webhook_secret}
						onChange={(value) => handleChange('webhook_secret', value)}
						error={errors.webhook_secret}
						description={connection ? t('connection.zohoBooks.webhookSecretDescEdit') : t('connection.zohoBooks.webhookSecretDescCreate')}
					/>
				</div>

				<div className='p-4 bg-info-muted border border-info-line rounded-lg'>
					<h3 className='text-sm font-medium text-info-deep mb-2'>{t('connection.zohoBooks.oauthRedirectTitle')}</h3>
					<p className='text-xs text-info-strong mb-2'>{t('connection.zohoBooks.oauthRedirectBody')}</p>
					<div className='flex items-center gap-2 p-2 bg-surface border border-info-line rounded-md mt-2'>
						<code className='flex-1 text-xs text-content-heading font-mono break-all'>{redirectUri}</code>
						<Button size='xs' variant='outline' onClick={handleCopyRedirectUri} className='flex items-center gap-1'>
							{redirectUriCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
							{redirectUriCopied ? tc('actions.copied') : tc('actions.copy')}
						</Button>
					</div>
				</div>

				{/* Sync Configuration Section */}
				<div className='p-4 bg-surface-subtle border border-line rounded-lg'>
					<h3 className='text-sm font-medium text-content-heading mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-content-tertiary mb-4'>{t('connection.sync.description', { partner: 'Zoho Books' })}</p>

					<div className='space-y-4'>
						{/* Payment gateways */}
						<div className='p-3 bg-surface border border-line rounded-lg'>
							<div className='flex items-center justify-between'>
								<div>
									<label className='text-sm font-medium text-content-secondary'>{t('connection.zohoBooks.attachPaymentGateways')}</label>
									<p className='text-xs text-content-muted'>{t('connection.zohoBooks.attachPaymentGatewaysDesc')}</p>
								</div>
								<Switch checked={formData.sync_config.payment_gateways.enabled} onCheckedChange={handlePaymentGatewaysEnabledChange} />
							</div>

							{formData.sync_config.payment_gateways.enabled && (
								<div className='mt-4 pt-4 border-t border-line'>
									<p className='text-sm font-medium text-content-secondary'>{t('connection.zohoBooks.paymentGateways')}</p>
									<p className='text-xs text-content-muted mb-3'>{t('connection.zohoBooks.paymentGatewaysDesc')}</p>
									<div className='grid grid-cols-2 gap-3'>
										{ZOHO_PAYMENT_GATEWAYS.map((gateway) => (
											<Checkbox
												key={gateway.value}
												id={`zoho-payment-gateway-${gateway.value}`}
												label={gateway.label}
												checked={formData.sync_config.payment_gateways.gateways.includes(gateway.value)}
												onCheckedChange={(checked) => handlePaymentGatewayChange(gateway.value, checked)}
											/>
										))}
									</div>
									{isPayPalSelected && (
										<div className='mt-4'>
											<Select
												label={t('connection.zohoBooks.paypalPaymentMethod')}
												description={t('connection.zohoBooks.paypalPaymentMethodDesc')}
												options={[
													{ value: 'standard', label: t('connection.zohoBooks.paypalPaymentMethodStandard') },
													{ value: 'adaptive', label: t('connection.zohoBooks.paypalPaymentMethodAdaptive') },
												]}
												value={formData.sync_config.payment_gateways.paypal_payment_method}
												onChange={handlePayPalPaymentMethodChange}
											/>
										</div>
									)}
									{errors.payment_gateways && <p className='text-sm text-destructive mt-2'>{errors.payment_gateways}</p>}
								</div>
							)}
						</div>
					</div>
				</div>

				{connection && (
					<div className='p-4 bg-surface-subtle border border-line rounded-lg'>
						<p className='text-xs text-content-muted'>{t('connection.zohoBooks.credentialsHidden')}</p>
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

export default ZohoBooksConnectionDrawer;
