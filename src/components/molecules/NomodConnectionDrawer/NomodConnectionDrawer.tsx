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
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
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
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/nomod/${user.tenant.id}/${activeEnvironment.id}` : '';

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
			newErrors.name = t('connection.validation.nameRequired');
		}

		// Only validate secrets when creating new connection
		if (!connection) {
			if (!formData.api_key.trim()) {
				newErrors.api_key = t('connection.validation.apiKeyRequiredUpper');
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
			toast.success(t('connection.toast.created', { provider: 'Nomod' }));
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
			toast.success(t('connection.toast.updated', { provider: 'Nomod' }));
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
					? t('integrationDrawer.title.edit', { providerName: 'Nomod' })
					: t('integrationDrawer.title.connect', { providerName: 'Nomod' })
			}
			description={t('connection.nomod.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.nomod.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.nomod.connectionHint')}
				/>

				{/* API Key */}
				{!connection && (
					<Input
						label={t('connection.nomod.apiKey')}
						placeholder={t('connection.nomod.apiKeyPlaceholder')}
						type='password'
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						description={t('connection.nomod.apiKeyHint')}
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-gray-600 mb-4'>{t('connection.sync.description', { partner: 'Nomod' })}</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('connection.labels.invoices')}</label>
								<p className='text-xs text-gray-500'>{t('connection.nomod.pushToNomod')}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
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
								label={t('connection.nomod.webhookSecret')}
								placeholder={t('connection.nomod.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.nomod.webhookSecretHint')}
							/>
						</div>
					)}

					{/* Webhook URL Block */}
					<div>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-blue-700 mb-3'>{t('connection.nomod.webhookIntro')}</p>
						<div className='flex items-center gap-2 p-2 bg-white border border-blue-200 rounded-md'>
							<code className='flex-1 text-xs text-gray-800 font-mono break-all'>{webhookUrl}</code>
							<Button size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? tc('actions.copied') : tc('actions.copy')}
							</Button>
						</div>
					</div>
				</div>

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

export default NomodConnectionDrawer;
