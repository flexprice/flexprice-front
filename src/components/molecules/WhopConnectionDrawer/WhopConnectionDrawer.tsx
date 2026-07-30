import { config } from '@/config/config';
import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle } from 'lucide-react';
import { useUser } from '@/hooks/UserContext';
import { useEnvironment } from '@/hooks/useEnvironment';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface WhopConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any;
	onSave: (connection: any) => void;
}

interface WhopFormData {
	name: string;
	api_key: string;
	company_id: string;
	product_id: string;
	sync_config: {
		invoice: boolean;
	};
}

const WhopConnectionDrawer: FC<WhopConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const { user } = useUser();
	const { activeEnvironment } = useEnvironment();
	const [webhookCopied, setWebhookCopied] = useState(false);

	const webhookUrl =
		user?.tenant?.id && activeEnvironment?.id ? `${config.api.baseUrl}/webhooks/whop/${user.tenant.id}/${activeEnvironment.id}` : '';

	const [formData, setFormData] = useState<WhopFormData>({
		name: '',
		api_key: '',
		company_id: '',
		product_id: '',
		sync_config: {
			invoice: false,
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const syncConfig = connection.sync_config || {};
				const encryptedData = connection.encrypted_secret_data || {};
				setFormData({
					name: connection.name || '',
					api_key: '',
					company_id: encryptedData.company_id || '',
					product_id: encryptedData.product_id || '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					api_key: '',
					company_id: '',
					product_id: '',
					sync_config: { invoice: false },
				});
			}
			setErrors({});
			setWebhookCopied(false);
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof WhopFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const handleSyncConfigChange = (value: boolean) => {
		setFormData((prev) => ({ ...prev, sync_config: { ...prev.sync_config, invoice: value } }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.name.trim()) newErrors.name = t('connection.validation.nameRequired');
		if (!connection) {
			if (!formData.api_key.trim()) newErrors.api_key = t('connection.validation.apiKeyRequiredUpper');
			if (!formData.company_id.trim()) newErrors.company_id = t('connection.whop.companyIdRequired');
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: any = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.WHOP,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.WHOP,
					api_key: formData.api_key,
					company_id: formData.company_id,
					...(formData.product_id.trim() ? { product_id: formData.product_id.trim() } : {}),
				},
				sync_config: {} as Record<string, { inbound: boolean; outbound: boolean }>,
			};
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = { inbound: false, outbound: true };
			}
			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: 'Whop' }));
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
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = { inbound: false, outbound: true };
			}
			if (formData.product_id.trim()) {
				payload.encrypted_secret_data = { product_id: formData.product_id.trim() };
			}
			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: 'Whop' }));
			onSave(response);
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
		} else {
			createConnection();
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
					? t('integrationDrawer.title.edit', { providerName: 'Whop' })
					: t('integrationDrawer.title.connect', { providerName: 'Whop' })
			}
			description={t('connection.whop.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.whop.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.whop.connectionHint')}
				/>

				{/* Credentials — only shown when creating */}
				{!connection && (
					<>
						<Input
							label={t('connection.labels.apiKey')}
							placeholder={t('connection.whop.apiKeyPlaceholder')}
							type='password'
							value={formData.api_key}
							onChange={(value) => handleChange('api_key', value)}
							error={errors.api_key}
							description={t('connection.whop.apiKeyHint')}
						/>
						<Input
							label={t('connection.whop.companyId')}
							placeholder={t('connection.whop.companyIdPlaceholder')}
							value={formData.company_id}
							onChange={(value) => handleChange('company_id', value)}
							error={errors.company_id}
							description={t('connection.whop.companyIdHint')}
						/>
					</>
				)}

				{/* Product ID — shown on create and edit (not a secret) */}
				<Input
					label={t('connection.whop.productIdOptional')}
					placeholder={t('connection.whop.productIdPlaceholder')}
					value={formData.product_id}
					onChange={(value) => handleChange('product_id', value)}
					description={t('connection.whop.productIdHint')}
				/>

				{/* Sync configuration */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-gray-600 mb-4'>{t('connection.sync.description', { partner: 'Whop' })}</p>
					<div className='space-y-4'>
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>{t('connection.labels.invoices')}</label>
								<p className='text-xs text-gray-500'>{t('connection.whop.invoiceSyncHint')}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={handleSyncConfigChange} />
						</div>
					</div>
				</div>

				{/* Webhook Section */}
				<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
					<h3 className='text-sm font-medium text-blue-800 mb-2'>{t('connection.webhook.sectionTitle')}</h3>
					<p className='text-xs text-blue-700 mb-3'>
						{t('connection.whop.webhookIntroPrefix')} <code className='font-mono'>{t('connection.whop.webhookEventName')}</code>{' '}
						{t('connection.whop.webhookIntroSuffix')}
					</p>
					<div>
						<label className='text-sm font-medium text-blue-800 mb-2 block'>{t('connection.webhook.url')}</label>
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

export default WhopConnectionDrawer;
