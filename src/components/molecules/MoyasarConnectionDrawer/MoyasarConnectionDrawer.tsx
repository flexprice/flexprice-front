import { config } from '@/config/config';
import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { CONNECTION_PROVIDER_TYPE } from '@/models';
import { Connection } from '@/models/Connection';

interface MoyasarEncryptedSecretData {
	publishable_key?: string;
	secret_key?: string;
	webhook_secret?: string;
}

interface MoyasarConnection extends Connection {
	encrypted_secret_data?: MoyasarEncryptedSecretData;
}

interface MoyasarConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: MoyasarConnection;
	onSave: (connection: Connection) => void;
}

interface MoyasarFormData {
	name: string;
	publishable_key: string;
	secret_key: string;
	webhook_secret: string;
}

const MOYASAR_PROVIDER = 'Moyasar';

const MoyasarConnectionDrawer: FC<MoyasarConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<MoyasarFormData>({
		name: '',
		publishable_key: '',
		secret_key: '',
		webhook_secret: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [webhookCopied, setWebhookCopied] = useState(false);
	const [isWebhookEventsExpanded, setIsWebhookEventsExpanded] = useState(false);

	// Generate webhook URL using environment variable
	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/moyasar/${user.tenant.id}/${activeEnvironment.id}` : '';

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const encryptedData = connection.encrypted_secret_data || {};
				setFormData({
					name: connection.name || '',
					publishable_key: encryptedData.publishable_key || '',
					secret_key: encryptedData.secret_key || '',
					webhook_secret: encryptedData.webhook_secret || '',
				});
			} else {
				setFormData({
					name: '',
					publishable_key: '',
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
			newErrors.name = t('connection.validation.nameRequired');
		}

		// Only validate secrets when creating new connection
		if (!connection) {
			if (!formData.secret_key.trim()) {
				newErrors.secret_key = t('connection.validation.secretKeyRequired');
			}
			if (!formData.publishable_key.trim()) {
				newErrors.publishable_key = t('connection.validation.publishableKeyRequired');
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
					publishable_key: formData.publishable_key || undefined,
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
			toast.success(t('connection.toast.created', { provider: MOYASAR_PROVIDER }));
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
			};

			return await ConnectionApi.Update(connection!.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: MOYASAR_PROVIDER }));
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
					? t('integrationDrawer.title.edit', { providerName: MOYASAR_PROVIDER })
					: t('integrationDrawer.title.connect', { providerName: MOYASAR_PROVIDER })
			}
			description={t('connection.moyasar.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.moyasar.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.moyasar.connectionHint')}
				/>

				{/* Secret Key */}
				{!connection && (
					<Input
						label={t('connection.labels.secretKey')}
						placeholder={t('connection.moyasar.secretKeyPlaceholder')}
						type='password'
						value={formData.secret_key}
						onChange={(value) => handleChange('secret_key', value)}
						error={errors.secret_key}
						description={t('connection.moyasar.secretKeyHint')}
					/>
				)}

				{/* Publishable Key — required for customer autopay (Moyasar.js tokenization) */}
				{!connection && (
					<Input
						label={t('connection.moyasar.publishableKey')}
						placeholder={t('connection.moyasar.publishableKeyPlaceholder')}
						type='password'
						value={formData.publishable_key}
						onChange={(value) => handleChange('publishable_key', value)}
						error={errors.publishable_key}
						description={t('connection.moyasar.publishableKeyHint')}
					/>
				)}

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-3'>{t('connection.webhook.sectionTitle')}</h3>

					{/* Webhook Secret */}
					{!connection && (
						<div className='mb-4'>
							<Input
								label={t('connection.webhook.secretLabel')}
								placeholder={t('connection.webhook.secretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.webhook.secretDescription')}
							/>
						</div>
					)}

					{/* Webhook URL Block */}
					<div className='mb-4'>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-blue-700 mb-3'>{t('connection.moyasar.webhookIntro')}</p>
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
								<p className='text-xs text-blue-700 mb-3'>{t('connection.moyasar.webhookEventsIntro')}</p>
								<div className='space-y-1'>
									{[t('connection.moyasar.webhookEventPaymentPaid'), t('connection.moyasar.webhookEventPaymentFailed')].map((event) => (
										<div key={event} className='flex items-center gap-2 text-xs text-blue-700'>
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

export default MoyasarConnectionDrawer;
