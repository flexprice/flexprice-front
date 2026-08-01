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
import { UpdateConnectionPayload } from '@/types/dto';
import { mergeConnectionMetadata } from '@/utils/common/connection_metadata_helpers';

interface MoyasarConnection {
	id: string;
	name: string;
	encrypted_secret_data?: {
		publishable_key?: string;
		secret_key?: string;
		webhook_secret?: string;
	};
	metadata?: Record<string, string>;
}

interface MoyasarConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: MoyasarConnection;
	onSave: (connection: MoyasarConnection) => void;
}

interface MoyasarFormData {
	name: string;
	publishable_key: string;
	secret_key: string;
	webhook_secret: string;
	success_url: string;
	cancel_url: string;
}

const MOYASAR_PROVIDER = 'Moyasar';
const URL_PATTERN = /^https?:\/\/.+/;

const MoyasarConnectionDrawer: FC<MoyasarConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();

	const [formData, setFormData] = useState<MoyasarFormData>({
		name: '',
		publishable_key: '',
		secret_key: '',
		webhook_secret: '',
		success_url: '',
		cancel_url: '',
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
				const metadata = connection.metadata || {};
				setFormData({
					name: connection.name || '',
					publishable_key: encryptedData.publishable_key || '',
					secret_key: encryptedData.secret_key || '',
					webhook_secret: encryptedData.webhook_secret || '',
					success_url: metadata.success_url || '',
					cancel_url: metadata.cancel_url || '',
				});
			} else {
				setFormData({
					name: '',
					publishable_key: '',
					secret_key: '',
					webhook_secret: '',
					success_url: '',
					cancel_url: '',
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
				newErrors.publishable_key = t('connection.validation.publishableKeyRequired', 'Publishable key is required');
			}
		}

		// Redirect URLs are optional; Moyasar simply skips the redirect when unset.
		if (formData.success_url.trim() && !URL_PATTERN.test(formData.success_url.trim())) {
			newErrors.success_url = t('connection.validation.redirectUrlInvalid');
		}
		if (formData.cancel_url.trim() && !URL_PATTERN.test(formData.cancel_url.trim())) {
			newErrors.cancel_url = t('connection.validation.redirectUrlInvalid');
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const metadata = mergeConnectionMetadata(undefined, {
				success_url: formData.success_url,
				cancel_url: formData.cancel_url,
			});
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.MOYASAR,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.MOYASAR,
					publishable_key: formData.publishable_key || undefined,
					secret_key: formData.secret_key,
					webhook_secret: formData.webhook_secret,
				},
				...(Object.keys(metadata).length > 0 && { metadata }),
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
			// The API replaces metadata wholesale, so re-read it and send the full merged map.
			// Reading here rather than trusting the prop keeps the window for a lost concurrent
			// write down to this request instead of however long the drawer has been open.
			const existingConnection = await ConnectionApi.Get(connection!.id);
			const payload: Pick<UpdateConnectionPayload, 'name' | 'metadata'> = {
				name: formData.name,
				metadata: mergeConnectionMetadata(existingConnection.metadata, {
					success_url: formData.success_url,
					cancel_url: formData.cancel_url,
				}),
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

				{/* Redirect URLs — optional; Moyasar skips the redirect when unset */}
				<Input
					id='moyasar-success-url'
					label={t('connection.moyasar.successUrl')}
					placeholder={t('connection.moyasar.successUrlPlaceholder')}
					value={formData.success_url}
					onChange={(value) => handleChange('success_url', value)}
					error={errors.success_url}
					description={t('connection.moyasar.successUrlHint')}
				/>

				<Input
					id='moyasar-cancel-url'
					label={t('connection.moyasar.cancelUrl')}
					placeholder={t('connection.moyasar.cancelUrlPlaceholder')}
					value={formData.cancel_url}
					onChange={(value) => handleChange('cancel_url', value)}
					error={errors.cancel_url}
					description={t('connection.moyasar.cancelUrlHint')}
				/>

				{/* Webhook Section */}
				<div className='p-4 bg-info-muted border border-info-line rounded-lg'>
					<h3 className='text-sm font-medium text-info-deep mb-3'>{t('connection.webhook.sectionTitle')}</h3>

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
						<label className='text-sm font-medium text-info-deep mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-info-strong mb-3'>{t('connection.moyasar.webhookIntro')}</p>
						<div className='flex items-center gap-2 p-2 bg-surface border border-info-line rounded-md'>
							<code className='flex-1 text-xs text-content-heading font-mono break-all'>{webhookUrl}</code>
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
							className='flex items-center gap-2 text-sm font-medium text-info-deep hover:text-info-deepest mb-2'>
							{isWebhookEventsExpanded ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
							{t('connection.webhook.eventsToSubscribe')}
						</button>

						{isWebhookEventsExpanded && (
							<div className='mt-2 p-3 bg-surface border border-info-line rounded-md'>
								<p className='text-xs text-info-strong mb-3'>{t('connection.moyasar.webhookEventsIntro')}</p>
								<div className='space-y-1'>
									{[t('connection.moyasar.webhookEventPaymentPaid'), t('connection.moyasar.webhookEventPaymentFailed')].map((event) => (
										<div key={event} className='flex items-center gap-2 text-xs text-info-strong'>
											<div className='w-1.5 h-1.5 bg-info-bright rounded-full'></div>
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
