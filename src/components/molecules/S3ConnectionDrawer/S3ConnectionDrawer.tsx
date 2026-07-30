import { FC, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE } from '@/models';

interface S3ConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: any; // for editing
	onSave: (connection: any) => void;
}

interface S3FormData {
	name: string;
	is_flexprice_managed: boolean;
	aws_access_key_id: string;
	aws_secret_access_key: string;
	aws_session_token?: string;
}

interface ValidationErrors {
	name?: string;
	aws_access_key_id?: string;
	aws_session_token?: string;
	aws_secret_access_key?: string;
}

const S3ConnectionDrawer: FC<S3ConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const { t } = useTranslation('settings');
	const { t: tc } = useTranslation('common');
	const [formData, setFormData] = useState<S3FormData>({
		name: '',
		is_flexprice_managed: false,
		aws_access_key_id: '',
		aws_secret_access_key: '',
		aws_session_token: '',
	});

	const [errors, setErrors] = useState<ValidationErrors>({});

	// Initialize form data when editing
	useEffect(() => {
		if (connection) {
			setFormData({
				name: connection.name || '',
				is_flexprice_managed: connection.sync_config?.s3?.is_flexprice_managed || false,
				aws_access_key_id: '',
				aws_secret_access_key: '',
				aws_session_token: '',
			});
		} else {
			setFormData({
				name: '',
				is_flexprice_managed: false,
				aws_access_key_id: '',
				aws_secret_access_key: '',
				aws_session_token: '',
			});
		}
		setErrors({});
	}, [connection, isOpen]);

	const handleChange = (field: keyof S3FormData, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (field !== 'is_flexprice_managed' && errors[field as keyof ValidationErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};
		const isEditMode = !!connection;

		if (!formData.name.trim()) {
			newErrors.name = t('connection.validation.nameRequired');
		}

		// Only require AWS credentials when creating a new connection AND not using Flexprice Managed
		if (!isEditMode && !formData.is_flexprice_managed) {
			if (!formData.aws_access_key_id.trim()) {
				newErrors.aws_access_key_id = t('connection.validation.awsAccessKeyRequired');
			}

			if (!formData.aws_secret_access_key.trim()) {
				newErrors.aws_secret_access_key = t('connection.validation.awsSecretRequired');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload: any = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.S3,
			};

			// If Flexprice Managed, only send the flag
			if (formData.is_flexprice_managed) {
				payload.sync_config = {
					s3: {
						is_flexprice_managed: true,
					},
				};
			} else {
				// Customer-owned S3, send credentials
				payload.encrypted_secret_data = {
					provider_type: CONNECTION_PROVIDER_TYPE.S3,
					aws_access_key_id: formData.aws_access_key_id,
					aws_secret_access_key: formData.aws_secret_access_key,
					aws_session_token: formData.aws_session_token || undefined,
				};
			}

			return await ConnectionApi.Create(payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.created', { provider: 'S3' }));
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

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success(t('connection.toast.updated', { provider: 'S3' }));
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

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? t('connection.s3.titleEdit') : t('connection.s3.titleConnect')}
			description={t('connection.s3.description')}
			size='lg'>
			<div className='space-y-6 mt-9'>
				<Input
					label={t('integrationDrawer.connectionName')}
					placeholder={t('connection.s3.connectionNamePlaceholder')}
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description={t('connection.s3.connectionNameHint')}
				/>

				{!connection && (
					<>
						{/* Flexprice Managed Switch */}
						<div className='flex items-center justify-between p-4 border rounded-lg bg-gray-50'>
							<div className='flex-1'>
								<label htmlFor='flexprice-managed' className='text-sm font-medium text-gray-900 cursor-pointer'>
									{t('connection.s3.flexpriceManaged')}
								</label>
								<p className='text-xs text-gray-500 mt-1'>{t('connection.s3.flexpriceManagedHint')}</p>
							</div>
							<Switch
								id='flexprice-managed'
								checked={formData.is_flexprice_managed}
								onCheckedChange={(checked) => handleChange('is_flexprice_managed', checked)}
							/>
						</div>

						{/* AWS Credentials - Only show when NOT using Flexprice Managed */}
						{!formData.is_flexprice_managed && (
							<>
								<Input
									label={t('connection.s3.awsAccessKey')}
									placeholder={t('connection.s3.awsAccessKeyPlaceholder')}
									value={formData.aws_access_key_id}
									onChange={(value) => handleChange('aws_access_key_id', value)}
									error={errors.aws_access_key_id}
									description={t('connection.s3.awsAccessKeyHint')}
								/>

								<Input
									label={t('connection.s3.awsSecretKey')}
									placeholder={t('connection.s3.awsSecretKeyPlaceholder')}
									type='password'
									value={formData.aws_secret_access_key}
									onChange={(value) => handleChange('aws_secret_access_key', value)}
									error={errors.aws_secret_access_key}
									description={t('connection.s3.awsSecretKeyHint')}
								/>

								<Input
									label={t('connection.s3.sessionToken')}
									placeholder={t('connection.s3.sessionTokenPlaceholder')}
									type='password'
									value={formData.aws_session_token}
									onChange={(value) => handleChange('aws_session_token', value)}
									description={t('connection.s3.sessionTokenHint')}
								/>
							</>
						)}
					</>
				)}

				{/* Security Note */}
				<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
					<h4 className='font-medium text-blue-900 mb-2'>{t('connection.s3.securityNote')}</h4>
					<p className='text-sm text-blue-800'>
						{formData.is_flexprice_managed ? t('connection.s3.securityFlexprice') : t('connection.s3.securityAws')}
					</p>
				</div>

				<Spacer className='!h-1' />
				<div className='flex gap-1'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						{tc('actions.cancel')}
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending}>
						{connection ? tc('actions.update') : tc('actions.save')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default S3ConnectionDrawer;
