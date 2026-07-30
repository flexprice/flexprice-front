import { FC, useEffect, useState, useMemo } from 'react';
import { Input, Sheet, Spacer, Select, Button, Modal, SelectOption } from '@/components/atoms';
import { useMutation, useQuery } from '@tanstack/react-query';
import SecretKeysApi from '@/api/SecretKeysApi';
import { UserApi } from '@/api/UserApi';
import { User } from '@/models';
import { toast } from 'react-hot-toast';
import { Copy, AlertTriangle, Eye, EyeOff, Info } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { GetServiceAccountsResponse } from '@/types/dto/UserApi';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

type AccountType = 'user' | 'service_account';

const SecretKeyDrawer: FC<Props> = ({ isOpen, onOpenChange }) => {
	const { t } = useTranslation(['developers', 'common']);
	const [formData, setFormData] = useState({
		name: '',
		accountType: 'user' as AccountType,
		serviceAccountId: '',
		selectedRoles: [] as string[],
		expirationType: 'never',
	});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);

	const {
		data: serviceAccounts,
		isLoading: isLoadingServiceAccounts,
		isError: isServiceAccountsError,
	} = useQuery<GetServiceAccountsResponse>({
		queryKey: ['service-accounts'],
		queryFn: async () => await UserApi.getServiceAccounts({ limit: 100, offset: 0 }),
		enabled: isOpen && formData.accountType === 'service_account',
	});

	const serviceAccountOptions: SelectOption[] = useMemo(() => {
		if (!serviceAccounts?.items || !Array.isArray(serviceAccounts.items)) {
			return [];
		}

		const sortedAccounts = [...serviceAccounts.items].sort((a, b) => {
			if (a.tenant?.created_at && b.tenant?.created_at) {
				return new Date(b.tenant.created_at).getTime() - new Date(a.tenant.created_at).getTime();
			}
			return 0;
		});

		return sortedAccounts.map((account: User, index: number) => {
			let label: string;

			if (account.name && account.name.trim() && !account.name.startsWith('_dup_user_')) {
				label = account.name;
			} else if (account.roles && account.roles.length > 0) {
				label = account.roles.join(', ');
			} else if (account.email && account.email.trim() && !account.email.startsWith('_dup_user_') && account.email.includes('@')) {
				label = account.email;
			} else {
				label = t('developers:secretKeyDrawer.serviceAccountFallback', { index: index + 1 });
			}

			return {
				label: label,
				value: account.id,
				key_input: [account.email || account.id],
			};
		});
	}, [serviceAccounts, t]);

	const accountTypeOptions: SelectOption[] = useMemo(
		() => [
			{ label: t('developers:secretKeyDrawer.accountTypes.user'), value: 'user' },
			{ label: t('developers:secretKeyDrawer.accountTypes.service'), value: 'service_account' },
		],
		[t],
	);

	const expirationOptions = useMemo(
		() => [
			{ label: t('developers:secretKeyDrawer.expiration.never'), value: 'never' },
			{ label: t('developers:secretKeyDrawer.expiration.oneHour'), value: '1_hour' },
			{ label: t('developers:secretKeyDrawer.expiration.oneDay'), value: '1_day' },
			{ label: t('developers:secretKeyDrawer.expiration.oneWeek'), value: '1_week' },
			{ label: t('developers:secretKeyDrawer.expiration.oneMonth'), value: '1_month' },
		],
		[t],
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

	const handleChange = (field: keyof typeof formData, value: string | string[]) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: '',
				accountType: 'user',
				serviceAccountId: '',
				selectedRoles: [],
				expirationType: 'never',
			});
		}
	}, [isOpen]);

	const {
		mutate: createApiKey,
		isPending,
		data,
	} = useMutation({
		mutationFn: async () => {
			const expirationFn = getExpirationDate[formData.expirationType as keyof typeof getExpirationDate];
			const expires_at = typeof expirationFn === 'function' ? expirationFn() : expirationFn;

			const payload: { name: string; expires_at?: string; type: string; service_account_id?: string; roles?: string[] } = {
				name: formData.name,
				expires_at,
				type: 'private_key',
			};

			if (formData.accountType === 'service_account') {
				payload.service_account_id = formData.serviceAccountId;
			}

			return SecretKeysApi.createSecretKey(payload);
		},
		onSuccess: () => {
			refetchQueries(['secret-keys']);
			setIsModalOpen(true);
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('developers:secretKeyDrawer.createFailed'));
		},
	});

	const isFormValid = useMemo(() => {
		if (!formData.name || !formData.accountType || !formData.expirationType) {
			return false;
		}
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

	const copyApiKey = () => {
		navigator.clipboard.writeText(data?.api_key || '');
		toast.success(t('common:toast.copySuccess'));
	};

	const toggleApiKeyVisibility = () => {
		setShowApiKey(!showApiKey);
	};

	const maskApiKey = (key: string) => {
		return '*'.repeat(key.length);
	};

	const selectedServiceAccount = useMemo(() => {
		if (!serviceAccounts?.items || !formData.serviceAccountId) return null;
		return serviceAccounts.items.find((account: User) => account.id === formData.serviceAccountId);
	}, [serviceAccounts, formData.serviceAccountId]);

	return (
		<div>
			<Sheet
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title={t('developers:secretKeyDrawer.title')}
				description={t('developers:secretKeyDrawer.description')}>
				<div className='space-y-4'>
					<Spacer className='!h-4' />
					<Input
						placeholder={t('developers:labels.placeholders.secretKeyName')}
						value={formData.name}
						label={t('developers:labels.name')}
						onChange={(value) => handleChange('name', value)}
					/>

					<Select
						label={t('developers:labels.accountType')}
						options={accountTypeOptions}
						onChange={(value) => handleChange('accountType', value as AccountType)}
						value={formData.accountType}
					/>

					{formData.accountType === 'user' && (
						<>
							<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
								<div className='flex items-start gap-2'>
									<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
									<div className='text-sm text-blue-800'>
										<p className='font-medium mb-1'>{t('developers:secretKeyDrawer.fullAccess.title')}</p>
										<p>{t('developers:secretKeyDrawer.fullAccess.body')}</p>
									</div>
								</div>
							</div>
						</>
					)}

					{formData.accountType === 'service_account' && (
						<>
							{isServiceAccountsError ? (
								<div className='bg-amber-50 border border-amber-200 rounded-md p-3'>
									<div className='flex items-start gap-2'>
										<AlertTriangle className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' />
										<div className='text-sm text-amber-800'>
											<p className='font-medium mb-1'>{t('developers:secretKeyDrawer.serviceAccountsUnavailable.title')}</p>
											<p>{t('developers:secretKeyDrawer.serviceAccountsUnavailable.body')}</p>
										</div>
									</div>
								</div>
							) : serviceAccountOptions.length === 0 && !isLoadingServiceAccounts ? (
								<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
									<div className='flex items-start gap-2'>
										<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
										<div className='text-sm text-blue-800'>
											<p className='font-medium mb-1'>{t('developers:secretKeyDrawer.noServiceAccounts.title')}</p>
											<p>{t('developers:secretKeyDrawer.noServiceAccounts.body')}</p>
										</div>
									</div>
								</div>
							) : (
								<>
									<Select
										label={t('developers:labels.mappedToIdentity')}
										options={serviceAccountOptions}
										onChange={(value) => handleChange('serviceAccountId', value)}
										value={formData.serviceAccountId}
										placeholder={t('developers:labels.placeholders.selectServiceAccount')}
										disabled={isLoadingServiceAccounts}
									/>

									{selectedServiceAccount && selectedServiceAccount.roles && selectedServiceAccount.roles.length > 0 && (
										<div className='space-y-2'>
											<label className='block text-sm font-medium text-gray-700'>{t('developers:labels.accountRolesPermissions')}</label>
											<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
												<div className='flex items-start gap-2'>
													<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
													<div className='text-sm text-blue-800'>
														<p className='font-medium mb-1'>{t('developers:secretKeyDrawer.inheritedPrefix')}</p>
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
						label={t('developers:labels.expiration')}
						options={expirationOptions}
						onChange={(value) => handleChange('expirationType', value)}
						value={formData.expirationType}
					/>

					<Spacer className='!h-0' />
					<Button isLoading={isPending} disabled={!isFormValid} onClick={() => createApiKey()}>
						{t('common:actions.create')}
					</Button>
				</div>
			</Sheet>

			<Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
				<div className='space-y-4 bg-white card p-5 max-w-md mx-auto'>
					<h1 className='text-xl font-semibold mb-4'>{t('developers:secretKeyDrawer.modal.title')}</h1>

					<div className='bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2'>
						<AlertTriangle className='w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5' />
						<p className='text-sm text-amber-800'>{t('developers:secretKeyDrawer.modal.warning')}</p>
					</div>

					<div className='mt-4'>
						<label className='block text-sm font-medium mb-1'>{t('developers:labels.apiKey')}</label>
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
						<Button onClick={() => setIsModalOpen(false)}>{t('common:actions.done')}</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default SecretKeyDrawer;
