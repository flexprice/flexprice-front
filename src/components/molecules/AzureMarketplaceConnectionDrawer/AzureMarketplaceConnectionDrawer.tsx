import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, FieldWithInfo, Input, Sheet, Spacer } from '@/components/atoms';
import ConnectionApi from '@/api/ConnectionApi';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';
import { CreateConnectionPayload } from '@/types/dto';

interface AzureMarketplaceConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: Connection; // for editing
	onSave: (connection: Connection) => void;
}

interface FormData {
	name: string;
	tenant_id: string;
	client_id: string;
	client_secret: string;
}

interface ValidationErrors {
	name?: string;
	tenant_id?: string;
	client_id?: string;
	client_secret?: string;
}

const AzureMarketplaceConnectionDrawer: FC<AzureMarketplaceConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const isEditMode = !!connection;

	const [formData, setFormData] = useState<FormData>({ name: '', tenant_id: '', client_id: '', client_secret: '' });
	const [errors, setErrors] = useState<ValidationErrors>({});

	useEffect(() => {
		if (!isOpen) return;
		if (connection) {
			setFormData({ name: connection.name || '', tenant_id: '', client_id: '', client_secret: '' });
		} else {
			setFormData({ name: '', tenant_id: '', client_id: '', client_secret: '' });
		}
		setErrors({});
	}, [connection, isOpen]);

	const handleChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = t('connection.validation.nameRequired');
		}
		if (!isEditMode) {
			if (!formData.tenant_id.trim()) {
				newErrors.tenant_id = t('connection.azureMarketplace.tenantIdRequired');
			}
			if (!formData.client_id.trim()) {
				newErrors.client_id = t('connection.azureMarketplace.clientIdRequired');
			}
			if (!formData.client_secret.trim()) {
				newErrors.client_secret = t('connection.azureMarketplace.clientSecretRequired');
			}
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: CreateConnectionPayload = {
				name: formData.name.trim(),
				provider_type: CONNECTION_PROVIDER_TYPE.AZURE_MARKETPLACE,
				encrypted_secret_data: {
					tenant_id: formData.tenant_id.trim(),
					client_id: formData.client_id.trim(),
					client_secret: formData.client_secret.trim(),
				},
			};
			// Backend requests a client_credentials token with these values and only persists on
			// success; a failure surfaces here as the specific failed step (HTTP 422).
			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: 'Azure Marketplace' }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToCreate'));
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		// Only invoked via the isEditMode branch below, which is exactly `!!connection`.
		mutationFn: async () => ConnectionApi.Update(connection!.id, { name: formData.name.trim() }),
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: 'Azure Marketplace' }));
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('connection.toast.failedToUpdate'));
		},
	});

	const handleSave = () => {
		if (!validateForm()) return;
		if (isEditMode) {
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
			title={isEditMode ? t('connection.azureMarketplace.titleEdit') : t('connection.azureMarketplace.titleConnect')}
			description={t('connection.azureMarketplace.description')}
			size='lg'>
			<div className='space-y-6 mt-9'>
				<FieldWithInfo
					label={t('connection.azureMarketplace.connectionNameLabel')}
					description={t('connection.azureMarketplace.connectionNameInfo')}
					infoAriaLabel={t('connection.azureMarketplace.infoAriaLabel')}>
					<Input
						placeholder={t('connection.azureMarketplace.connectionNamePlaceholder')}
						value={formData.name}
						onChange={(value) => handleChange('name', value)}
						error={errors.name}
						description={t('connection.azureMarketplace.connectionNameHint')}
					/>
				</FieldWithInfo>

				{!isEditMode && (
					<>
						{/* Step 1 — what the tenant sets up in their own Azure AD tenant, entirely on their side */}
						<div className='space-y-1'>
							<p className='text-sm font-medium text-foreground'>{t('connection.azureMarketplace.step1Title')}</p>
							<p className='text-xs text-content-muted'>{t('connection.azureMarketplace.step1Hint')}</p>
						</div>

						<div className='p-3 bg-warning-muted border border-warning-line rounded-lg'>
							<p className='text-xs text-warning-deep'>{t('connection.azureMarketplace.technicalConfigWarning')}</p>
						</div>

						{/* Step 2 — the three values the tenant's Entra app registration produces */}
						<div className='space-y-3'>
							<p className='text-sm font-medium text-foreground'>{t('connection.azureMarketplace.step2Title')}</p>
							<FieldWithInfo
								label={t('connection.azureMarketplace.tenantIdLabel')}
								description={t('connection.azureMarketplace.tenantIdInfo')}
								infoAriaLabel={t('connection.azureMarketplace.infoAriaLabel')}>
								<Input
									placeholder={t('connection.azureMarketplace.tenantIdPlaceholder')}
									type='password'
									value={formData.tenant_id}
									onChange={(value) => handleChange('tenant_id', value)}
									error={errors.tenant_id}
									description={t('connection.azureMarketplace.tenantIdHint')}
								/>
							</FieldWithInfo>
							<FieldWithInfo
								label={t('connection.azureMarketplace.clientIdLabel')}
								description={t('connection.azureMarketplace.clientIdInfo')}
								infoAriaLabel={t('connection.azureMarketplace.infoAriaLabel')}>
								<Input
									placeholder={t('connection.azureMarketplace.clientIdPlaceholder')}
									type='password'
									value={formData.client_id}
									onChange={(value) => handleChange('client_id', value)}
									error={errors.client_id}
									description={t('connection.azureMarketplace.clientIdHint')}
								/>
							</FieldWithInfo>
							<FieldWithInfo
								label={t('connection.azureMarketplace.clientSecretLabel')}
								description={t('connection.azureMarketplace.clientSecretInfo')}
								infoAriaLabel={t('connection.azureMarketplace.infoAriaLabel')}>
								<Input
									placeholder={t('connection.azureMarketplace.clientSecretPlaceholder')}
									type='password'
									value={formData.client_secret}
									onChange={(value) => handleChange('client_secret', value)}
									error={errors.client_secret}
									description={t('connection.azureMarketplace.clientSecretHint')}
								/>
							</FieldWithInfo>
						</div>
					</>
				)}

				<Spacer className='!h-1' />
				<div className='flex gap-1'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{tc('actions.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending}>
						{isEditMode ? tc('actions.update') : tc('actions.save')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default AzureMarketplaceConnectionDrawer;
