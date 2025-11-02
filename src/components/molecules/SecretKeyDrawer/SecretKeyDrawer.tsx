import { FC, useEffect, useState, useMemo } from 'react';
import { Input, Sheet, Spacer, Select, Button, Modal, SelectOption } from '@/components/atoms';
import { useMutation, useQuery } from '@tanstack/react-query';
import SecretKeysApi from '@/api/SecretKeysApi';
import { UserApi } from '@/api/UserApi';
import { User } from '@/models';
import { toast } from 'react-hot-toast';
import { Copy, AlertTriangle, Eye, EyeOff, Info } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

type AccountType = 'user' | 'service_account';

const SecretKeyDrawer: FC<Props> = ({ isOpen, onOpenChange }) => {
	// Combined state for form fields
	const [formData, setFormData] = useState({
		name: '',
		accountType: 'user' as AccountType,
		serviceAccountId: '',
		expirationType: 'never',
	});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);

	// Fetch service accounts when drawer is open
	const {
		data: serviceAccounts,
		isLoading: isLoadingServiceAccounts,
		isError: isServiceAccountsError,
	} = useQuery<User[]>({
		queryKey: ['service-accounts'],
		queryFn: () => UserApi.getServiceAccounts(),
		enabled: isOpen && formData.accountType === 'service_account',
		retry: false, // Don't retry on failure
	});

	// Convert service accounts to select options
	const serviceAccountOptions: SelectOption[] = useMemo(() => {
		if (!serviceAccounts || !Array.isArray(serviceAccounts)) {
			logger.warn('Service accounts not loaded or not an array:', serviceAccounts);
			return [];
		}
		logger.info('Service accounts loaded:', serviceAccounts);
		return serviceAccounts.map((account, index) => {
			// Create a meaningful label - fallback chain
			const label =
				account.name ||
				account.email ||
				(account.roles && account.roles.length > 0 ? `Service Account (${account.roles.join(', ')})` : null) ||
				`Service Account ${index + 1}`;

			return {
				label: label,
				value: account.id,
				key_input: [account.email || account.id],
			};
		});
	}, [serviceAccounts]);

	const accountTypeOptions: SelectOption[] = useMemo(
		() => [
			{ label: 'User Account', value: 'user' },
			{ label: 'Service Account', value: 'service_account' },
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
				accountType: 'user',
				serviceAccountId: '',
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
			const expirationFn = getExpirationDate[formData.expirationType as keyof typeof getExpirationDate];
			const expires_at = typeof expirationFn === 'function' ? expirationFn() : expirationFn;

			return SecretKeysApi.createSecretKey({
				name: formData.name,
				expires_at,
				type: 'private_key',
				user_id: formData.accountType === 'service_account' ? formData.serviceAccountId : undefined,
			});
		},
		onSuccess: () => {
			refetchQueries(['secret-keys']);
			setIsModalOpen(true);
			onOpenChange(false);
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error.message || 'Failed to create API key. Please try again.');
		},
	});

	// Check if form is valid
	const isFormValid = useMemo(() => {
		if (!formData.name || !formData.accountType || !formData.expirationType) {
			return false;
		}
		// If service account is selected but there's an error or no accounts, disable form
		if (formData.accountType === 'service_account') {
			if (isServiceAccountsError || serviceAccountOptions.length === 0) {
				return false;
			}
			if (!formData.serviceAccountId) {
				return false;
			}
		}
		return true;
	}, [formData, isServiceAccountsError, serviceAccountOptions.length]);

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

	// Get the selected service account for displaying roles
	const selectedServiceAccount = useMemo(() => {
		if (!serviceAccounts || !formData.serviceAccountId) return null;
		return serviceAccounts.find((account: User) => account.id === formData.serviceAccountId);
	}, [serviceAccounts, formData.serviceAccountId]);

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
						label='Account Type'
						options={accountTypeOptions}
						onChange={(value) => handleChange('accountType', value as AccountType)}
						value={formData.accountType}
					/>

					{formData.accountType === 'service_account' && (
						<>
							{isServiceAccountsError ? (
								<div className='bg-amber-50 border border-amber-200 rounded-md p-3'>
									<div className='flex items-start gap-2'>
										<AlertTriangle className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' />
										<div className='text-sm text-amber-800'>
											<p className='font-medium mb-1'>Service Accounts Not Available</p>
											<p>
												The backend endpoint for service accounts is not yet implemented. Please create a user account API key instead, or
												contact your administrator.
											</p>
										</div>
									</div>
								</div>
							) : serviceAccountOptions.length === 0 && !isLoadingServiceAccounts ? (
								<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
									<div className='flex items-start gap-2'>
										<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
										<div className='text-sm text-blue-800'>
											<p className='font-medium mb-1'>No Service Accounts Found</p>
											<p>Create a service account first to generate API keys for automated services.</p>
										</div>
									</div>
								</div>
							) : (
								<>
									<Select
										label='Mapped to Identity'
										options={serviceAccountOptions}
										onChange={(value) => handleChange('serviceAccountId', value)}
										value={formData.serviceAccountId}
										placeholder='Select a service account'
										disabled={isLoadingServiceAccounts}
									/>

									{selectedServiceAccount && selectedServiceAccount.roles && selectedServiceAccount.roles.length > 0 && (
										<div className='space-y-2'>
											<label className='block text-sm font-medium text-gray-700'>Account Roles and Permissions</label>
											<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
												<div className='flex items-start gap-2'>
													<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
													<div className='text-sm text-blue-800'>
														<p className='font-medium mb-1'>Inherited from service account:</p>
														<div className='flex flex-wrap gap-1'>
															{selectedServiceAccount.roles.map((role: string) => (
																<span
																	key={role}
																	className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
																	{role}
																</span>
															))}
														</div>
													</div>
												</div>
											</div>
										</div>
									)}
								</>
							)}
						</>
					)}

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
