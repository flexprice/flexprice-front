import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { UpdateConnectionPayload } from '@/types/dto';

interface TabsConnection extends Connection {
	sync_config?: {
		invoice?: {
			inbound: boolean;
			outbound: boolean;
		};
	};
}

interface TabsConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: TabsConnection;
	onSave: (connection: Connection) => void;
}

interface TabsFormData {
	name: string;
	api_key: string;
	sync_config: {
		invoice: boolean; // push to Tabs
	};
}

const TABS_PROVIDER = 'Tabs';

const TabsConnectionDrawer: FC<TabsConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');

	const [formData, setFormData] = useState<TabsFormData>({
		name: '',
		api_key: '',
		sync_config: {
			invoice: false,
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const syncConfig = connection.sync_config || {};
				setFormData({
					name: connection.name || '',
					api_key: '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					api_key: '',
					sync_config: {
						invoice: false,
					},
				});
			}
			setErrors({});
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof Pick<TabsFormData, 'name' | 'api_key'>, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const handleSyncConfigChange = (value: boolean) => {
		setFormData((prev) => ({ ...prev, sync_config: { ...prev.sync_config, invoice: value } }));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = t('connection.validation.nameRequired');
		}

		// Only validate the API key when creating a new connection
		if (!connection) {
			if (!formData.api_key.trim()) {
				newErrors.api_key = t('connection.validation.apiKeyRequiredUpper');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.TABS,
				encrypted_secret_data: {
					api_key: formData.api_key,
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
			toast.success(t('connection.toast.created', { provider: TABS_PROVIDER }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const payload: Partial<UpdateConnectionPayload> = {
				name: formData.name,
				sync_config: {},
			};

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config = {
					invoice: {
						inbound: false,
						outbound: true,
					},
				};
			}

			return await ConnectionApi.Update(connection!.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: TABS_PROVIDER }));
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

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={
				connection
					? t('integrationDrawer.title.edit', { providerName: TABS_PROVIDER })
					: t('integrationDrawer.title.connect', { providerName: TABS_PROVIDER })
			}
			description={t('connection.tabs.description')}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.tabs.connectionPlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.tabs.connectionHint')}
				/>

				{/* API Key */}
				{!connection && (
					<Input
						label={t('connection.labels.apiKey')}
						placeholder={t('connection.tabs.apiKeyPlaceholder')}
						type='password'
						value={formData.api_key}
						onChange={(value) => handleChange('api_key', value)}
						error={errors.api_key}
						description={t('connection.tabs.apiKeyHint')}
					/>
				)}

				{/* Sync Configuration Section */}
				<div className='p-4 bg-surface-subtle border border-line rounded-lg'>
					<h3 className='text-sm font-medium text-content-heading mb-3'>{t('connection.sync.title')}</h3>
					<p className='text-xs text-content-tertiary mb-4'>{t('connection.sync.description', { partner: TABS_PROVIDER })}</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-surface border border-line rounded-lg'>
							<div>
								<label className='text-sm font-medium text-content-secondary'>{t('connection.labels.invoices')}</label>
								<p className='text-xs text-content-muted'>{t('connection.sync.pushTo', { partner: TABS_PROVIDER })}</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={handleSyncConfigChange} />
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

export default TabsConnectionDrawer;
