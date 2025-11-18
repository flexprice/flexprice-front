import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
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
	const [formData, setFormData] = useState<S3FormData>({
		name: '',
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
				aws_access_key_id: '',
				aws_secret_access_key: '',
				aws_session_token: '',
			});
		} else {
			setFormData({
				name: '',
				aws_access_key_id: '',
				aws_secret_access_key: '',
				aws_session_token: '',
			});
		}
		setErrors({});
	}, [connection, isOpen]);

	const handleChange = (field: keyof S3FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};
		const isEditMode = !!connection;

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		// Only require AWS credentials when creating a new connection
		if (!isEditMode) {
			if (!formData.aws_access_key_id.trim()) {
				newErrors.aws_access_key_id = 'AWS Access Key ID is required';
			}

			if (!formData.aws_secret_access_key.trim()) {
				newErrors.aws_secret_access_key = 'AWS Secret Access Key is required';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: createConnection, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
				provider_type: CONNECTION_PROVIDER_TYPE.S3,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.S3,
					aws_access_key_id: formData.aws_access_key_id,
					aws_secret_access_key: formData.aws_secret_access_key,
					aws_session_token: formData.aws_session_token || undefined,
				},
			};

			return await ConnectionApi.createConnection(payload);
		},
		onSuccess: (response) => {
			toast.success('S3 connection created successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to create connection');
		},
	});

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name,
			};

			return await ConnectionApi.updateConnection(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('S3 connection updated successfully');
			onSave(response);
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.message || 'Failed to update connection');
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
			title={connection ? 'Edit S3 Connection' : 'Connect to Amazon S3'}
			description="Enter your AWS credentials to connect to S3. Click save when you're done."
			size='lg'>
			<div className='space-y-4 mt-4'>
				<Input
					label='Connection Name'
					placeholder='Enter connection name'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A descriptive name for this S3 connection'
				/>

				{!connection && (
					<>
						<Input
							label='AWS Access Key ID'
							placeholder='Enter AWS Access Key ID'
							value={formData.aws_access_key_id}
							onChange={(value) => handleChange('aws_access_key_id', value)}
							error={errors.aws_access_key_id}
							description='Your AWS Access Key ID'
						/>

						<Input
							label='AWS Secret Access Key'
							placeholder='Enter AWS Secret Access Key'
							type='password'
							value={formData.aws_secret_access_key}
							onChange={(value) => handleChange('aws_secret_access_key', value)}
							error={errors.aws_secret_access_key}
							description='Your AWS Secret Access Key'
						/>

						<Input
							label='AWS Session Token (Optional)'
							placeholder='Enter AWS Session Token'
							type='password'
							value={formData.aws_session_token}
							onChange={(value) => handleChange('aws_session_token', value)}
							description='Required only for temporary credentials'
						/>
					</>
				)}

				<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
					<h4 className='font-medium text-blue-900 mb-2'>Security Note</h4>
					<p className='text-sm text-blue-800'>
						Your AWS credentials are encrypted and stored securely. We recommend using IAM roles with minimal required permissions for S3
						access.
					</p>
				</div>

				<Spacer className='!h-4' />
				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1'>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending}>
						{connection ? 'Update' : 'Save'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default S3ConnectionDrawer;
