import { FC } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isPast } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { UserApi } from '@/api/UserApi';
import { Button, Dialog, Loader } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { SecretKey, User } from '@/models';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	account: User | null;
}

const maskDisplayId = (displayId: string): string => {
	const prefix = displayId.slice(0, 6);
	const suffix = displayId.slice(-4);
	return `${prefix}••••${suffix}`;
};

const getEnvironmentLabel = (key: SecretKey): string => {
	return key.environment_name || key.environment_id || '—';
};

const ServiceAccountDeleteDialog: FC<Props> = ({ isOpen, onOpenChange, account }) => {
	const { t } = useTranslation(['developers', 'common']);
	const accountId = account?.id;
	const accountName = account?.name || account?.id || '';

	const {
		data: previewUser,
		isLoading: isLoadingPreview,
		isError: isPreviewError,
		error: previewError,
	} = useQuery({
		queryKey: ['service-account-delete-preview', accountId],
		queryFn: () => UserApi.getUserById(accountId!),
		enabled: isOpen && !!accountId,
		retry: false,
	});

	const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
		mutationFn: () => UserApi.deleteUser(accountId!),
		onSuccess: async () => {
			toast.success(t('developers:serviceAccounts.deleteDialog.deleteSuccess'));
			await refetchQueries('service-accounts');
			await refetchQueries('secret-keys');
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('developers:serviceAccounts.deleteDialog.deleteFailed'));
		},
	});

	const apiKeys = previewUser?.api_keys ?? [];
	const hasApiKeys = apiKeys.length > 0;
	const previewErrorMessage =
		previewError instanceof Error && previewError.message
			? previewError.message
			: t('developers:serviceAccounts.deleteDialog.previewFailed');

	const handleConfirm = () => {
		if (!accountId || isLoadingPreview || isPreviewError) return;
		deleteAccount();
	};

	return (
		<Dialog
			title={t('developers:serviceAccounts.deleteDialog.title')}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			showCloseButton={false}
			className='max-w-lg'>
			{isLoadingPreview || isPreviewError ? (
				<div className='flex flex-col items-center justify-center gap-3 py-8'>
					{isLoadingPreview ? (
						<>
							<Loader />
							<p className='text-sm text-gray-500'>{t('developers:serviceAccounts.deleteDialog.loading')}</p>
						</>
					) : (
						<>
							<p className='text-sm text-red-600'>{previewErrorMessage}</p>
							<Button variant='outline' onClick={() => onOpenChange(false)} className='mt-2'>
								{t('common:actions.cancel')}
							</Button>
						</>
					)}
				</div>
			) : (
				<div className='flex flex-col gap-4'>
					<p className='text-sm text-gray-600'>{t('developers:serviceAccounts.deleteDialog.archiveMessage', { name: accountName })}</p>

					{hasApiKeys && (
						<>
							<div className='flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3'>
								<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
								<p className='text-sm font-medium text-amber-800'>{t('developers:serviceAccounts.deleteDialog.keysWarning')}</p>
							</div>

							<div className='flex flex-col gap-2'>
								<p className='text-sm font-medium text-gray-700'>{t('developers:serviceAccounts.deleteDialog.keysListTitle')}</p>
								<ul className='max-h-48 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100'>
									{apiKeys.map((key) => {
										const isExpired = key.expires_at ? isPast(new Date(key.expires_at)) : false;
										return (
											<li key={key.id} className='flex flex-col gap-0.5 px-3 py-2 text-sm'>
												<div className='flex items-center justify-between gap-2'>
													<span className='font-medium text-gray-900'>{key.name}</span>
													{isExpired && (
														<span className='shrink-0 rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600'>
															{t('developers:serviceAccounts.deleteDialog.expired')}
														</span>
													)}
												</div>
												<div className='flex items-center gap-2 text-xs text-gray-500'>
													<span>{getEnvironmentLabel(key)}</span>
													<span>·</span>
													<code className='font-mono'>{maskDisplayId(key.display_id)}</code>
												</div>
											</li>
										);
									})}
								</ul>
							</div>
						</>
					)}

					<div className='flex justify-end gap-3 pt-2'>
						<Button variant='outline' onClick={() => onOpenChange(false)} disabled={isDeleting}>
							{t('common:actions.cancel')}
						</Button>
						<Button onClick={handleConfirm} isLoading={isDeleting} disabled={isLoadingPreview || isPreviewError}>
							{t('developers:serviceAccounts.deleteDialog.confirmDelete')}
						</Button>
					</div>
				</div>
			)}
		</Dialog>
	);
};

export default ServiceAccountDeleteDialog;
