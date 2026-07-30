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
import { ChargebeeWebhookEvents, getDefaultChargebeeWebhookEvents, CreateConnectionPayload } from '@/types';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface ChargebeeConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any; // for editing
	onSave: (connection: any) => void;
}

interface ChargebeeFormData {
	name: string;
	api_key: string;
	site: string;
	webhook_username: string;
	webhook_password: string;
	sync_config: {
		invoice: boolean; // push to Chargebee
	};
}

const CHARGEBEE_PROVIDER = 'Chargebee';

const ChargebeeConnectionDrawer: FC<ChargebeeConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<ChargebeeFormData>({
		name: '',
		api_key: '',
		site: '',
		webhook_username: '',
		webhook_password: '',
		sync_config: {
			invoice: false, // push to Chargebee
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	// Generate webhook URL using environment variable
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/chargebee/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Webhook events
	const getWebhookEvents = (): ChargebeeWebhookEvents[] => {
		return getDefaultChargebeeWebhookEvents();
	};

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
					site: encryptedData.site || '',
					webhook_username: encryptedData.webhook_username || '',
					webhook_password: encryptedData.webhook_password || '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					api_key: '',
					site: '',
					webhook_username: '',
					webhook_password: '',
					sync_config: {
						invoice: false,
					},
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof ChargebeeFormData, value: string) => {
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
			if (!formData.api_key.trim()) {
				newErrors.api_key = t('connection.validation.apiKeyRequired');
			}
			if (!formData.site.trim()) {
				newErrors.site = t('connection.validation.siteRequired');
			}
			if (!formData.webhook_username.trim()) {
				newErrors.webhook_username = t('connection.validation.webhookUsernameRequired');
			}
			if (!formData.webhook_password.trim()) {
				newErrors.webhook_password = t('connection.validation.webhookPasswordRequired');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: CreateConnectionPayload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.CHARGEBEE,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.CHARGEBEE,
					api_key: formData.api_key,
					site: formData.site,
					webhook_username: formData.webhook_username,
					webhook_password: formData.webhook_password,
				},
				sync_config: {},
			};

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config = {
					...payload.sync_config,
					invoice: {
						inbound: false,
						outbound: true,
					},
				};
			}

			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: CHARGEBEE_PROVIDER }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
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
			toast.success(t('connection.toast.updated', { provider: CHARGEBEE_PROVIDER }));
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
					? t('integrationDrawer.title.edit', { providerName: CHARGEBEE_PROVIDER })
					: t('integrationDrawer.title.connect', { providerName: CHARGEBEE_PROVIDER })
			}
			description={t('connection.chargebee.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.chargebee.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.chargebee.connectionNameHint')}
				/>

				{/* API Key */}
				{!connection && (
					<Input
						label={t('connection.labels.apiKey')}
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						type='password'
						description={t('connection.chargebee.apiKeyHint')}
					/>
				)}

				{/* Site */}
				{!connection && (
					<Input
						label={t('connection.chargebee.site')}
						placeholder={t('connection.chargebee.sitePlaceholder')}
						value={formData.site}
						onChange={(value) => handleChange('site', value)}
						error={errors.site}
						description={t('connection.chargebee.siteHint')}
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-gray-600 mb-4'>{t('connection.sync.description', { partner: CHARGEBEE_PROVIDER })}</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('connection.labels.invoices')}</label>
								<p className='text-xs text-gray-500'>{t('connection.chargebee.pushToChargebee')}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>
					</div>
				</div>

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>{t('connection.webhook.sectionTitle')}</h3>

					{/* Webhook Username */}
					{!connection && (
						<div className='mb-4'>
							<Input
								label={t('connection.chargebee.webhookUsername')}
								placeholder={t('connection.chargebee.webhookUsernamePlaceholder')}
								value={formData.webhook_username}
								onChange={(value) => handleChange('webhook_username', value)}
								error={errors.webhook_username}
								description={t('connection.chargebee.webhookUsernameHint')}
							/>
						</div>
					)}

					{/* Webhook Password */}
					{!connection && (
						<div className='mb-4'>
							<Input
								label={t('connection.chargebee.webhookPassword')}
								placeholder={t('connection.chargebee.webhookPasswordPlaceholder')}
								type='password'
								value={formData.webhook_password}
								onChange={(value) => handleChange('webhook_password', value)}
								error={errors.webhook_password}
								description={t('connection.chargebee.webhookPasswordHint')}
							/>
						</div>
					)}

					{/* Webhook URL Block */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-blue-700 mb-3'>{t('connection.chargebee.webhookIntro')}</p>
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
								<p className='text-xs text-blue-700 mb-3'>{t('connection.chargebee.webhookEventsIntro')}</p>
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

export default ChargebeeConnectionDrawer;
