import { Button, Page, ShortPagination } from '@/components/atoms';
import { ColumnData, FlexpriceTable, SecretKeyDrawer, ApiDocsContent } from '@/components/molecules';
import SecretKeysApi from '@/api/SecretKeysApi';
import { useQuery } from '@tanstack/react-query';
import { SecretKey } from '@/models/SecretKey';
import usePagination from '@/hooks/usePagination';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Plus, Loader, TrashIcon, User2, Bot } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import ActionButton from '@/components/atoms/ActionButton/ActionButton';

const baseColumns: ColumnData<SecretKey>[] = [
	{
		title: 'Name',
		render(rowData: SecretKey) {
			return (
				<div className='flex gap-2 items-center font-medium'>
					<span>{rowData.name}</span>
				</div>
			);
		},
	},
	{
		title: 'Token',
		render(rowData: SecretKey) {
			const prefix = rowData.display_id.slice(0, 6);
			const suffix = rowData.display_id.slice(-4);
			const masked = `${prefix}••••${suffix}`;

			return (
				<div className='flex gap-2 items-center'>
					<code className='px-2 py-1 text-sm bg-gray-100 rounded font-mono'>{masked}</code>
				</div>
			);
		},
	},
	{
		title: 'Type',
		render(rowData: SecretKey) {
			const isServiceAccount = rowData.user_type === 'service_account';
			return (
				<div className='flex gap-2 items-center'>
					{isServiceAccount ? (
						<div className='flex items-center gap-1.5 text-purple-600'>
							<Bot size={16} />
							<span className='text-sm font-medium'>Service Account</span>
						</div>
					) : (
						<div className='flex items-center gap-1.5 text-blue-600'>
							<User2 size={16} />
							<span className='text-sm font-medium'>User Account</span>
						</div>
					)}
				</div>
			);
		},
	},
	{
		title: 'Roles',
		render(rowData: SecretKey) {
			if (!rowData.roles || rowData.roles.length === 0) {
				return <span className='text-gray-500 text-sm'>Full Access</span>;
			}

			return (
				<div className='flex flex-wrap gap-1'>
					{rowData.roles.map((role) => (
						<span key={role} className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
							{role}
						</span>
					))}
				</div>
			);
		},
	},
	{
		title: 'Created At',
		width: 150,
		align: 'right',
		render(rowData) {
			return <span className='text-gray-600'>{formatDateShort(rowData.created_at)}</span>;
		},
	},
];

const DeveloperPage = () => {
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

	const columns: ColumnData<SecretKey>[] = [
		...baseColumns,
		{
			width: '30px',
			align: 'right',
			hideOnEmpty: true,
			render(rowData: SecretKey) {
				return (
					<div className='flex justify-end'>
						<ActionButton
							id={rowData.id}
							deleteMutationFn={async (id: string) => {
								await SecretKeysApi.deleteSecretKey(id);
							}}
							refetchQueryKey={'secret-keys'}
							entityName={'API key'}
							archiveText={'Delete'}
							isEditDisabled
							archiveIcon={<TrashIcon />}
						/>
					</div>
				);
			},
		},
	];

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching secret keys');
	}

	return (
		<div>
			<ApiDocsContent tags={['secrets']} />
			<SecretKeyDrawer isOpen={isSecretKeyDrawerOpen} onOpenChange={setIsSecretKeyDrawerOpen} />

			{secretKeys?.items.length === 0 && (
				<EmptyPage
					onAddClick={handleAddSecretKey}
					emptyStateCard={{
						heading: 'Generate a secret key',
						description: 'Generate a secret key to authenticate API requests and secure access.',
						buttonLabel: 'Create Secret Key',
						buttonAction: handleAddSecretKey,
					}}
					tutorials={GUIDES.secrets.tutorials}
					heading='Secret Keys'
					tags={['secrets']}
				/>
			)}
			{(secretKeys?.items.length || 0) > 0 && (
				<Page
					heading='API Keys'
					headingCTA={
						<Button prefixIcon={<Plus />} onClick={handleAddSecretKey}>
							Add
						</Button>
					}>
					<div>
						<FlexpriceTable showEmptyRow columns={columns} data={secretKeys?.items || []} />
						<ShortPagination unit='Secret Keys' totalItems={secretKeys?.pagination.total || 0} />
					</div>
				</Page>
			)}
		</div>
	);
};

export default DeveloperPage;
