import { config } from '@/config/config';
import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import {
	StripeWebhookEvents,
	getDefaultWebhookEvents,
	getPlanWebhookEvents,
	getSubscriptionWebhookEvents,
	getInvoiceWebhookEvents,
} from '@/types';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

const STRIPE_PROVIDER = 'Stripe';

interface StripeConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any; // for editing
	onSave: (connection: any) => void;
}

interface StripeFormData {
	name: string;
	secret_key: string;
	webhook_secret: string;
	sync_config: {
		plan: boolean; // pull from Stripe
		subscription: boolean; // pull from Stripe
		invoice: boolean; // push to Stripe
	};
}

const StripeConnectionDrawer: FC<StripeConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<StripeFormData>({
		name: '',
		secret_key: '',
		webhook_secret: '',
		sync_config: {
			plan: false, // pull from Stripe
			subscription: false, // pull from Stripe
			invoice: false, // push to Stripe
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	// Generate webhook URL using environment variable
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/stripe/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Webhook events mapping based on sync config
	const getWebhookEvents = (): StripeWebhookEvents[] => {
		const events: StripeWebhookEvents[] = [];

		// Default events (always included)
		events.push(...getDefaultWebhookEvents());

		// Plan events (pull from Stripe)
		if (formData.sync_config.plan) {
			events.push(...getPlanWebhookEvents());
		}

		// Subscription events (pull from Stripe)
		if (formData.sync_config.subscription) {
			events.push(...getSubscriptionWebhookEvents());
		}

		// Invoice events (push to Stripe)
		if (formData.sync_config.invoice) {
			events.push(...getInvoiceWebhookEvents());
		}

		return events;
	};

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				// Handle legacy format with inbound/outbound structure
				const legacySyncConfig = connection.sync_config;
				const newSyncConfig = {
					plan: legacySyncConfig?.plan?.inbound || false,
					subscription: legacySyncConfig?.subscription?.inbound || false,
					invoice: legacySyncConfig?.invoice?.outbound || false,
				};

				setFormData({
					name: connection.name || '',
					secret_key: connection.secret_key || '',
					webhook_secret: connection.webhook_secret || '',
					sync_config: newSyncConfig,
				});
			} else {
				setFormData({
					name: '',
					secret_key: '',
					webhook_secret: '',
					sync_config: {
						plan: false,
						subscription: false,
						invoice: false,
					},
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof StripeFormData, value: string) => {
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

		// Only validate secrets when creating new connection
		if (!connection) {
			if (!formData.secret_key.trim()) {
				newErrors.secret_key = t('connection.validation.secretKeyRequired');
			}
			if (!formData.webhook_secret.trim()) {
				newErrors.webhook_secret = t('connection.validation.webhookSecretRequired');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.STRIPE,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.STRIPE,
					secret_key: formData.secret_key,
					webhook_secret: formData.webhook_secret,
				},
				sync_config: {
					plan: {
						inbound: formData.sync_config.plan,
						outbound: false,
					},
					subscription: {
						inbound: formData.sync_config.subscription,
						outbound: false,
					},
					invoice: {
						inbound: false,
						outbound: formData.sync_config.invoice,
					},
				},
			};

			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('integrations.stripe.toast.stripeCreated'));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				sync_config: {
					plan: {
						inbound: formData.sync_config.plan,
						outbound: false,
					},
					subscription: {
						inbound: formData.sync_config.subscription,
						outbound: false,
					},
					invoice: {
						inbound: false,
						outbound: formData.sync_config.invoice,
					},
				},
			};

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('integrations.stripe.toast.stripeUpdated'));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToUpdate'));
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
			toast.success(t('connection.toast.webhookUrlCopied'));

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
			title={
				connection
					? t('integrationDrawer.title.edit', { providerName: STRIPE_PROVIDER })
					: t('integrationDrawer.title.connect', { providerName: STRIPE_PROVIDER })
			}
			description={t('integrations.stripe.description')}
			size='lg'>
			<div className='space-y-6 mt-9'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('integrations.stripe.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('integrations.stripe.connectionNameHint')}
				/>

				{/* Secret Key */}
				{!connection && (
					<Input
						label={t('integrations.stripe.secretKeyLabel')}
						placeholder={t('integrations.stripe.secretKeyPlaceholder')}
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description={t('integrations.stripe.secretKeyHint')}
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-gray-600 mb-4'>{t('connection.sync.description', { partner: STRIPE_PROVIDER })}</p>

					<div className='space-y-4'>
						{/* Plans */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('integrations.stripe.labels.plans')}</label>
								<p className='text-xs text-gray-500'>{t('integrations.stripe.pullFromStripe')}</p>
							</div>
							<Switch checked={formData.sync_config.plan} onCheckedChange={(checked) => handleSyncConfigChange('plan', checked)} />
						</div>

						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('integrations.stripe.labels.invoices')}</label>
								<p className='text-xs text-gray-500'>{t('integrations.stripe.pushToStripe')}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>

						{/* Subscriptions */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('integrations.stripe.labels.subscriptions')}</label>
								<p className='text-xs text-gray-500'>{t('integrations.stripe.pullFromStripe')}</p>
							</div>
							<Switch
								checked={formData.sync_config.subscription}
								onCheckedChange={(checked) => handleSyncConfigChange('subscription', checked)}
							/>
						</div>
					</div>
				</div>

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>{t('connection.webhook.sectionTitle')}</h3>

					{/* Webhook Secret */}
					{!connection && (
						<div className='mb-4'>
							<Input
								label={t('connection.webhook.secretLabel')}
								placeholder={t('integrations.stripe.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('integrations.stripe.webhookSecretDescription')}
							/>
						</div>
					)}

					{/* Webhook URL Block */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-blue-700 mb-3'>{t('integrations.stripe.webhookIntro')}</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? t('connection.webhook.copied') : t('connection.webhook.copy')}
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
							{t('connection.webhook.eventsToSubscribe')}
						</button>

						{isWebhookEventsExpanded && (
							<div className='mt-2 p-3 bg-white border border-blue-200 rounded-md'>
								<p className='text-xs text-blue-700 mb-3'>{t('integrations.stripe.webhookEventsIntro')}</p>
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

				<Spacer className='!h-1' />

				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						{t('connection.buttons.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}>
						{connection ? t('connection.buttons.updateConnection') : t('connection.buttons.createConnection')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default StripeConnectionDrawer;
