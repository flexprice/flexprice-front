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
import { PaddleWebhookEvents, getDefaultPaddleWebhookEvents } from '@/types';
import { mergeConnectionMetadata } from '@/utils/common/connection_metadata_helpers';

interface PaddleConnection {
	id: string;
	name: string;
	encrypted_secret_data?: {
		api_key?: string;
		webhook_secret?: string;
		client_side_token?: string;
	};
	metadata?: Record<string, string>;
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

const PADDLE_PROVIDER = 'Paddle';

const PaddleConnectionDrawer: FC<PaddleConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
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

	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/paddle/${user.tenant.id}/${activeEnvironment.id}` : '';

	const getWebhookEvents = (): PaddleWebhookEvents[] => {
		return getDefaultPaddleWebhookEvents();
	};

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
			newErrors.name = t('connection.validation.nameRequired');
		}

		if (!connection) {
			if (!formData.api_key.trim()) {
				newErrors.api_key = t('connection.validation.apiKeyRequired');
			}
			if (!formData.webhook_secret.trim()) {
				newErrors.webhook_secret = t('connection.validation.webhookSecretRequired');
			}
			if (!formData.client_side_token.trim()) {
				newErrors.client_side_token = t('connection.validation.clientSideTokenRequired');
			}
		}

		if (formData.redirect_url.trim() && !/^https?:\/\/.+/.test(formData.redirect_url.trim())) {
			newErrors.redirect_url = t('connection.validation.redirectUrlInvalid');
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const metadata = mergeConnectionMetadata(undefined, { redirect_url: formData.redirect_url });
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.PADDLE,
				encrypted_secret_data: {
					api_key: formData.api_key,
					webhook_secret: formData.webhook_secret,
					client_side_token: formData.client_side_token,
				},
				...(Object.keys(metadata).length > 0 && { metadata }),
				sync_config: {
					invoice: { inbound: false, outbound: true },
				},
			};
			return await ConnectionApi.Create(payload as Parameters<typeof ConnectionApi.Create>[0]);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: PADDLE_PROVIDER }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			const message = error.message;
			toast.error(message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			// The API replaces metadata wholesale, so re-read it and send the full merged map.
			// Reading here rather than trusting the prop keeps the window for a lost concurrent
			// write down to this request instead of however long the drawer has been open.
			const existingConnection = await ConnectionApi.Get(connection!.id);
			const payload = {
				name: formData.name,
				metadata: mergeConnectionMetadata(existingConnection.metadata, { redirect_url: formData.redirect_url }),
			};
			return await ConnectionApi.Update(connection!.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: PADDLE_PROVIDER }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			const message = error.message;
			toast.error(message || t('connection.toast.failedToUpdate'));
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
			setTimeout(() => setWebhookCopied(false), 2000);
		}
	};

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				connection
					? t('integrationDrawer.title.edit', { providerName: PADDLE_PROVIDER })
					: t('integrationDrawer.title.connect', { providerName: PADDLE_PROVIDER })
			}
			description={t('connection.paddle.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.paddle.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.paddle.connectionHint')}
				/>

				{!connection && (
					<>
						<Input
							label={t('connection.labels.apiKey')}
							placeholder={t('connection.paddle.apiKeyPlaceholder')}
							type='password'
							value={formData.api_key}
							onChange={(value) => handleChange('api_key', value)}
							error={errors.api_key}
							description={t('connection.paddle.apiKeyHint')}
						/>

						<Input
							label={t('connection.paddle.clientSideToken')}
							placeholder={t('connection.paddle.clientSidePlaceholder')}
							type='password'
							value={formData.client_side_token}
							onChange={(value) => handleChange('client_side_token', value)}
							error={errors.client_side_token}
							description={t('connection.paddle.clientSideHint')}
						/>
					</>
				)}

				<Input
					label={t('connection.paddle.redirectUrl')}
					placeholder={t('connection.paddle.redirectUrlPlaceholder')}
					value={formData.redirect_url}
					onChange={(value) => handleChange('redirect_url', value)}
					error={errors.redirect_url}
					description={t('connection.paddle.redirectUrlHint')}
				/>

				<div className='p-4 bg-info-muted border border-info-line rounded-lg'>
					<h3 className='text-sm font-medium text-info-deep mb-3'>{t('connection.webhook.sectionTitle')}</h3>

					{!connection && (
						<div className='mb-4'>
							<Input
								label={t('connection.webhook.secretLabel')}
								placeholder={t('connection.paddle.webhookSecretPlaceholder')}
								type='password'
								value={formData.webhook_secret}
								onChange={(value) => handleChange('webhook_secret', value)}
								error={errors.webhook_secret}
								description={t('connection.webhook.secretDescription')}
							/>
						</div>
					)}

					<div className='mb-4'>
						<label className='text-sm font-medium text-info-deep mb-2 block'>{t('connection.webhook.url')}</label>
						<p className='text-xs text-info-strong mb-3'>{t('connection.paddle.webhookIntro')}</p>
						<div className='flex items-center gap-2 p-2 bg-surface border border-info-line rounded-md'>
							<code className='flex-1 text-xs text-content-heading font-mono break-all'>{webhookUrl}</code>
							<Button type='button' size='xs' variant='outline' onClick={handleCopyWebhookUrl} className='flex items-center gap-1'>
								{webhookCopied ? <CheckCircle className='w-3 h-3' /> : <Copy className='w-3 h-3' />}
								{webhookCopied ? t('connection.webhook.copied') : t('connection.webhook.copy')}
							</Button>
						</div>
					</div>

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
								<p className='text-xs text-info-strong mb-3'>{t('connection.paddle.webhookEventsIntro')}</p>
								<div className='space-y-1'>
									{getWebhookEvents().map((event, index) => (
										<div key={index} className='flex items-center gap-2 text-xs text-info-strong'>
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
					<Button type='button' variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						{t('connection.buttons.cancel')}
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
						{connection ? t('connection.buttons.updateConnection') : t('connection.buttons.createConnection')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default PaddleConnectionDrawer;
