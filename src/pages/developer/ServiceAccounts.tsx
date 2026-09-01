import { Button, Page, ShortPagination, SectionHeader, ActionButton, CopyIdButton, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ColumnData, FlexpriceTable, ApiDocsContent } from '@/components/molecules';
import { UserApi } from '@/api/UserApi';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/models';
import usePagination from '@/hooks/usePagination';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Plus, Loader, Bot, Trash2 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
// import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { EmptyPage } from '@/components/organisms';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import ServiceAccountDrawer from '@/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer';
import { useTranslation } from 'react-i18next';

const ServiceAccountsPage = () => {
	const { t } = useTranslation(['developers', 'common']);
	const { page, limit, offset } = usePagination();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
	const { can, isLoading: permissionsLoading } = useCurrentUserPermissions();
	const canWriteUser = can('user', 'write');

	const {
		data: serviceAccountsResponse,
		isLoading: isLoadingServiceAccounts,
		isError: isServiceAccountsError,
	} = useQuery({
		queryKey: ['service-accounts', page],
		queryFn: async () => UserApi.getServiceAccounts({ limit, offset }),
	});

	const handleAdd = () => {
		setSelectedAccount(null);
		setIsDrawerOpen(true);
	};

	const handleEdit = useCallback((account: User) => {
		setSelectedAccount(account);
		setIsDrawerOpen(true);
	}, []);

	const serviceAccountColumns: ColumnData<User>[] = useMemo(
		() => [
			{
				title: t('labels.account'),
				render: (row: User) => {
					const displayName = row.name || null;
					const maskedId = `${row.id.slice(0, 8)}••••${row.id.slice(-4)}`;

					return (
						<div className='flex items-center gap-1.5 group'>
							{displayName ? (
								<span className='text-sm font-medium text-content-heading'>{displayName}</span>
							) : (
								<code className='px-2 py-0.5 text-sm bg-surface-shell rounded font-mono text-content-muted'>{maskedId}</code>
							)}
							<span className='opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity'>
								<CopyIdButton id={row.id} entityType='Service Account' />
							</span>
						</div>
					);
				},
			},
			{
				title: t('labels.type'),
				render: () => (
					<div className='flex items-center gap-1.5 text-accent-purple'>
						<Bot size={16} />
						<span className='text-sm font-medium'>{t('apiKeys.accountTypes.serviceAccount')}</span>
					</div>
				),
			},
			{
				title: t('labels.roles'),
				render: (row: User) => {
					if (!row.roles || row.roles.length === 0) {
						return <span className='text-content-muted text-sm'>{t('serviceAccounts.noRoles')}</span>;
					}
					return (
						<div className='flex flex-wrap gap-1'>
							{row.roles.map((role) => (
								<span
									key={role}
									className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-muted-strong text-info-deep'>
									{role}
								</span>
							))}
						</div>
					);
				},
			},
			{
				title: t('labels.createdAt'),
				width: 150,
				align: 'right',
				render: (row) => (
					<span className='text-content-tertiary'>{formatDateShort(row.tenant?.created_at || row.tenant?.updated_at || '')}</span>
				),
			},
			{
				fieldVariant: 'interactive',
				render: (row: User) => (
					<ActionButton
						id={row.id}
						copyId={{ entityType: 'Service Account' }}
						entityName={row.name || row.id}
						deleteMutationFn={async () => UserApi.deleteUser(row.id)}
						refetchQueryKey='service-accounts'
						edit={{
							enabled: true,
							onClick: () => handleEdit(row),
							disabled: !canWriteUser,
							disabledReason: canWriteUser ? undefined : t('serviceAccounts.writeDeniedTooltip'),
						}}
						// edit={{ enabled: false }}
						archive={{
							enabled: true,
							text: t('common:actions.delete'),
							icon: <Trash2 className='h-4 w-4' />,
							disabled: !canWriteUser,
							disabledReason: canWriteUser ? undefined : t('serviceAccounts.writeDeniedTooltip'),
						}}
					/>
				),
			},
		],
		// [t],
		[t, handleEdit, canWriteUser],
	);

	if (isLoadingServiceAccounts || permissionsLoading) {
		return <Loader />;
	}

	if (isServiceAccountsError) {
		toast.error(t('serviceAccounts.toastFetchError'));
	}

	return (
		<div>
			<ApiDocsContent tags={API_DOCS_TAGS.Users} />
			<ServiceAccountDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} data={selectedAccount} />

			{serviceAccountsResponse?.items.length === 0 && (
				<EmptyPage
					heading={t('common:nav.serviceAccounts')}
					onAddClick={handleAdd}
					emptyStateCard={{
						heading: t('serviceAccounts.emptyCard.heading'),
						description: t('serviceAccounts.emptyCard.description'),
						buttonLabel: t('serviceAccounts.emptyCard.button'),
						buttonAction: handleAdd,
					}}
					tags={API_DOCS_TAGS.Users}
					addDisabled={!canWriteUser}
					addDisabledReason={canWriteUser ? undefined : t('serviceAccounts.writeDeniedTooltip')}
				/>
			)}
			{(serviceAccountsResponse?.items.length || 0) > 0 && (
				<Page>
					<SectionHeader title={t('common:nav.serviceAccounts')} titleClassName='text-3xl font-medium'>
						{canWriteUser ? (
							<Button prefixIcon={<Plus />} onClick={handleAdd}>
								{t('common:actions.add')}
							</Button>
						) : (
							<Tooltip content={t('serviceAccounts.writeDeniedTooltip')}>
								<span tabIndex={0} className='inline-block'>
									<Button disabled prefixIcon={<Plus />}>
										{t('common:actions.add')}
									</Button>
								</span>
							</Tooltip>
						)}
					</SectionHeader>
					<div className='pb-12 mt-2'>
						<FlexpriceTable showEmptyRow columns={serviceAccountColumns} data={serviceAccountsResponse?.items || []} />
						<ShortPagination unit={t('serviceAccounts.paginationUnit')} totalItems={serviceAccountsResponse?.pagination?.total || 0} />
					</div>
				</Page>
			)}
		</div>
	);
};

export default ServiceAccountsPage;
