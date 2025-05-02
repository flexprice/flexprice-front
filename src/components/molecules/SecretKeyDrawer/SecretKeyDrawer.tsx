import { FC, useEffect, useState, useMemo } from 'react';
import { Input, Sheet, Spacer, Select, Button, Modal, SelectOption } from '@/components/atoms';
import { useMutation } from '@tanstack/react-query';
import SecretKeysApi from '@/api/SecretKeysApi';
import { toast } from 'react-hot-toast';
import { Copy, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

enum PermissionType {
	READ = 'read',
	WRITE = 'write',
	READ_WRITE = 'read_write',
}

const SecretKeyDrawer: FC<Props> = ({ isOpen, onOpenChange }) => {
	// Combined state for form fields
	const [formData, setFormData] = useState({
		name: '',
		permissionType: PermissionType.READ_WRITE,
		expirationType: 'never',
	});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);

	const permissionOptions: SelectOption[] = useMemo(
		() => [
			{ label: 'Read', value: PermissionType.READ, key_input: ['read'], disabled: true },
			{ label: 'Write', value: PermissionType.WRITE, key_input: ['read', 'write'], disabled: true },
			{ label: 'Read & Write', value: PermissionType.READ_WRITE, key_input: ['read', 'write'], disabled: false },
		],
		[],
	);

	const expirationOptions = useMemo(
		() => [
			{ label: 'Never', value: 'never' },
			{ label: '1 Hour', value: '1_hour' },
			{ label: '1 Day', value: '1_day' },
			{ label: '1 Week', value: '1_week' },
			{ label: '1 Month', value: '1_month' },
		],
		[],
	);

	// Use memoized mapper functions to derive values from formData
	const getPermissions = useMemo(
		() => ({
			[PermissionType.READ]: ['read'],
			[PermissionType.WRITE]: ['write'],
			[PermissionType.READ_WRITE]: ['read', 'write'],
		}),
		[],
	);

	const getExpirationDate = useMemo(
		() => ({
			never: undefined,
			'1_hour': () => new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
			'1_day': () => new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
			'1_week': () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			'1_month': () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
		}),
		[],
	);

	// Handle form field changes
	const handleChange = (field: keyof typeof formData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Reset form on open
	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: '',
				permissionType: PermissionType.READ_WRITE,
				expirationType: 'never',
			});
		}
	}, [isOpen]);

	// Mutation for creating API key
	const {
		mutate: createApiKey,
		isPending,
		data,
	} = useMutation({
		mutationFn: async () => {
			const permissions = getPermissions[formData.permissionType as keyof typeof getPermissions];
			const expirationFn = getExpirationDate[formData.expirationType as keyof typeof getExpirationDate];
			const expires_at = typeof expirationFn === 'function' ? expirationFn() : expirationFn;

			return SecretKeysApi.createSecretKey({
				name: formData.name,
				permissions,
				expires_at,
				type: 'private_key',
			});
		},
		onSuccess: () => {
			refetchQueries(['secret-keys']);
			setIsModalOpen(true);
			onOpenChange(false);
		},
		onError: (error: ServerError) => {
			console.error(error);
			toast.error(error.error.message || 'Failed to create API key. Please try again.');
		},
	});

	// Check if form is valid
	const isFormValid = formData.name && formData.permissionType && formData.expirationType;

	// Copy API key to clipboard
	const copyApiKey = () => {
		navigator.clipboard.writeText(data?.api_key || '');
		toast.success('API key copied to clipboard');
	};

	const toggleApiKeyVisibility = () => {
		setShowApiKey(!showApiKey);
	};

	// Function to mask API key with dots
	const maskApiKey = (key: string) => {
		return '•'.repeat(key.length);
	};

	return (
		<div>
			<Sheet
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title='Create API Key'
				description='Create a new API key to access the Flexprice API'>
				<div className='space-y-4'>
					<Spacer className='!h-4' />
					<Input placeholder='Secret Key' value={formData.name} label='Name' onChange={(value) => handleChange('name', value)} />
					<Select
						label='Permissions'
						options={permissionOptions}
						onChange={(value) => handleChange('permissionType', value)}
						value={formData.permissionType}
					/>
					<Select
						label='Expiration'
						options={expirationOptions}
						onChange={(value) => handleChange('expirationType', value)}
						value={formData.expirationType}
					/>

					<Spacer className='!h-0' />
					<Button isLoading={isPending} disabled={!isFormValid} onClick={() => createApiKey()}>
						Create
					</Button>
				</div>
			</Sheet>

			<Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
				<div className='space-y-4 bg-white card p-5 max-w-md mx-auto'>
					<h1 className='text-xl font-semibold mb-4'>View API Key</h1>

					<div className='bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2'>
						<AlertTriangle className='w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5' />
						<p className='text-sm text-amber-800'>You can only see this key once. Store it safely.</p>
					</div>

					<div className='mt-4'>
						<label className='block text-sm font-medium mb-1'>API Key</label>
						<div className='relative bg-gray-100 rounded-md'>
							<Input
								value={showApiKey ? data?.api_key || '' : maskApiKey(data?.api_key || '')}
								readOnly
								className='pr-16 border-none text-gray-600'
							/>
							<div className='bg-gray-100 absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
								<button onClick={toggleApiKeyVisibility} className='p-1 text-gray-700 hover:text-gray-700' type='button'>
									{showApiKey ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
								</button>
								<button onClick={copyApiKey} className='p-1 text-gray-500 hover:text-gray-700' type='button'>
									<Copy className='w-4 h-4' />
								</button>
							</div>
						</div>
					</div>

					<div className='mt-6 flex justify-start'>
						<Button onClick={() => setIsModalOpen(false)}>Done</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default SecretKeyDrawer;
