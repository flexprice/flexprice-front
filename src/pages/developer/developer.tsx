import { Button, Page, ShortPagination, SectionHeader } from '@/components/atoms';
import { ColumnData, FlexpriceTable, SecretKeyDrawer, ApiDocsContent } from '@/components/molecules';
import SecretKeysApi from '@/api/SecretKeysApi';
import { useQuery } from '@tanstack/react-query';
import { SecretKey } from '@/models/SecretKey';
import usePagination from '@/hooks/usePagination';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Plus, Loader, TrashIcon, User2, Bot, LucideIcon, Eye, ShieldCheck, EyeOff, PencilIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { EmptyPage } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import ActionButton from '@/components/atoms/ActionButton/ActionButton';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

// Utility function to format permissions for display
export const formatPermissionDisplay = (permissions: readonly string[]): string => {
	const t = i18n.getFixedT(i18n.language ?? 'en', 'developers');
	if (!permissions || permissions.length === 0) {
		return t('apiKeys.permissionDisplay.none');
	}

	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return t('apiKeys.permissionDisplay.fullAccess');
	} else if (hasRead) {
		return t('apiKeys.permissionDisplay.read');
	} else if (hasWrite) {
		return t('apiKeys.permissionDisplay.write');
	} else {
		return t('apiKeys.permissionDisplay.none');
	}
};

export const getPermissionIcon = (permissions: readonly string[]): LucideIcon => {
	if (!permissions || permissions.length === 0) {
		return EyeOff;
	}
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return ShieldCheck; // Full access icon
	} else if (hasRead) {
		return Eye; // Read only icon
	} else if (hasWrite) {
		return PencilIcon; // Write only icon
	} else {
		return EyeOff; // No access icon
	}
};

// Utility function to get color based on permission level
export const getPermissionColor = (permissions: readonly string[]): string => {
	if (!permissions || permissions.length === 0) {
		return 'text-content-muted';
	}
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return 'text-success'; // Full access color
	} else if (hasRead) {
		return 'text-info'; // Read only color
	} else if (hasWrite) {
		return 'text-warning'; // Write only color
	} else {
		return 'text-content-muted'; // No access color
	}
};

const DeveloperPage = () => {
	const { t } = useTranslation(['developers', 'common']);
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const { page, limit, offset } = usePagination();
	const [isSecretKeyDrawerOpen, setIsSecretKeyDrawerOpen] = useState(false);

	const {
		data: secretKeys,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['secret-keys', page, limit, offset],
		queryFn: () => SecretKeysApi.getAllSecretKeys({ limit, offset }),
	});

	const handleAddSecretKey = () => {
		setIsSecretKeyDrawerOpen(true);
	};

	const baseColumns: ColumnData<SecretKey>[] = useMemo(
		() => [
			{
				title: t('labels.name'),
				render(rowData: SecretKey) {
					return (
						<div className='flex flex-col gap-0.5'>
							<span className='font-medium text-sm text-content'>{rowData.name}</span>
							{rowData.user_type === 'service_account' && rowData.service_account_name && (
								<span className='text-xs text-content-subtle'>{rowData.service_account_name}</span>
							)}
						</div>
					);
				},
			},
			{
				title: t('labels.token'),
				render(rowData: SecretKey) {
					const prefix = rowData.display_id.slice(0, 6);
					const suffix = rowData.display_id.slice(-4);
					const masked = `${prefix}••••${suffix}`;

					return (
						<div className='flex gap-2 items-center'>
							<code className='px-2 py-1 text-sm bg-surface-shell rounded font-mono'>{masked}</code>
						</div>
					);
				},
			},
			{
				title: t('labels.type'),
				render(rowData: SecretKey) {
					const isServiceAccount = rowData.user_type === 'service_account';
					return (
						<div className='flex gap-2 items-center'>
							{isServiceAccount ? (
								<div className='flex items-center gap-1.5 text-accent-purple'>
									<Bot size={16} />
									<span className='text-sm font-medium'>{t('apiKeys.accountTypes.serviceAccount')}</span>
								</div>
							) : (
								<div className='flex items-center gap-1.5 text-info'>
									<User2 size={16} />
									<span className='text-sm font-medium'>{t('apiKeys.accountTypes.userAccount')}</span>
								</div>
							)}
						</div>
					);
				},
			},
			{
				title: t('labels.roles'),
				render(rowData: SecretKey) {
					if (!rowData.roles || rowData.roles.length === 0) {
						return <span className='text-sm text-content-muted'>{t('apiKeys.roles.fullAccess')}</span>;
					}
					return (
						<div className='flex flex-wrap gap-1'>
							{rowData.roles.map((role) => (
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
				render(rowData) {
					return <span className='text-content-tertiary'>{formatDateShort(rowData.created_at)}</span>;
				},
			},
		],
		[t],
	);

	const columns: ColumnData<SecretKey>[] = useMemo(
		() => [
			...baseColumns,
			{
				fieldVariant: 'interactive',
				render(rowData: SecretKey) {
					return (
						<div className='flex justify-end'>
							<ActionButton
								id={rowData.id}
								copyId={{ entityType: 'Secret Key' }}
								deleteMutationFn={async (id: string) => {
									await SecretKeysApi.deleteSecretKey(id);
								}}
								refetchQueryKey='secret-keys'
								entityName={rowData?.name}
								// edit={{
								// 	enabled: true,
								// 	onClick: () => {},
								// }}
								edit={{ enabled: false }}
								archive={{
									text: t('common:actions.delete'),
									icon: <TrashIcon />,
								}}
							/>
						</div>
					);
				},
			},
		],
		[baseColumns, t],
	);

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('apiKeys.toastFetchError'));
	}

	return (
		<div>
			<ApiDocsContent tags={API_DOCS_TAGS.Secrets} />
			<SecretKeyDrawer isOpen={isSecretKeyDrawerOpen} onOpenChange={setIsSecretKeyDrawerOpen} />

			{/* API Keys Section */}
			{secretKeys?.items.length === 0 && (
				<EmptyPage
					heading={t('common:nav.apiKeys')}
					onAddClick={handleAddSecretKey}
					emptyStateCard={{
						heading: t('apiKeys.emptyCard.heading'),
						description: t('apiKeys.emptyCard.description'),
						buttonLabel: t('apiKeys.emptyCard.button'),
						buttonAction: handleAddSecretKey,
					}}
					tutorials={guides.secrets.tutorials}
					tags={API_DOCS_TAGS.Secrets}
				/>
			)}
			{(secretKeys?.items.length || 0) > 0 && (
				<Page>
					<SectionHeader title={t('common:nav.apiKeys')} titleClassName='text-3xl font-medium'>
						<Button prefixIcon={<Plus />} onClick={handleAddSecretKey}>
							{t('common:actions.add')}
						</Button>
					</SectionHeader>
					<div className='pb-12 mt-2'>
						<FlexpriceTable showEmptyRow columns={columns} data={secretKeys?.items || []} />
						<ShortPagination unit={t('apiKeys.paginationUnit')} totalItems={secretKeys?.pagination.total || 0} />
					</div>
				</Page>
			)}
		</div>
	);
};

export default DeveloperPage;
