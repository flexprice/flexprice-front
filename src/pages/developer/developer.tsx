import { Button, Page, ShortPagination } from '@/components/atoms';
import { ColumnData, DropdownMenu, FlexpriceTable, SecretKeyDrawer, ApiDocsContent } from '@/components/molecules';
import SecretKeysApi from '@/utils/api_requests/SecretKeysApi';
import { useMutation, useQuery } from '@tanstack/react-query';
import { SecretKey } from '@/models/SecretKey';
import usePagination from '@/hooks/usePagination';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Plus, Eye, Pencil, EyeOff, LucideIcon, ShieldCheck, Key, Trash2, Loader } from 'lucide-react';
import { useState } from 'react';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';
import { toast } from 'react-hot-toast';
import { EmptyPage } from '@/components/organisms';
import GUIDES from '@/core/constants/guides';
// Utility function to format permissions for display
export const formatPermissionDisplay = (permissions: readonly string[]): string => {
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return 'full access';
	} else if (hasRead) {
		return 'read';
	} else if (hasWrite) {
		return 'write';
	} else {
		return 'none';
	}
};

// Utility function to get permission icon based on permission level
export const getPermissionIcon = (permissions: readonly string[]): LucideIcon => {
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return ShieldCheck; // Full access icon
	} else if (hasRead) {
		return Eye; // Read only icon
	} else if (hasWrite) {
		return Pencil; // Write only icon
	} else {
		return EyeOff; // No access icon
	}
};

// Utility function to get color based on permission level
export const getPermissionColor = (permissions: readonly string[]): string => {
	const hasRead = permissions.includes('read');
	const hasWrite = permissions.includes('write');

	if (hasRead && hasWrite) {
		return 'text-green-600'; // Full access color
	} else if (hasRead) {
		return 'text-blue-600'; // Read only color
	} else if (hasWrite) {
		return 'text-amber-600'; // Write only color
	} else {
		return 'text-gray-500'; // No access color
	}
};

const baseColumns: ColumnData<SecretKey>[] = [
	{
		title: 'Name',
		render(rowData: SecretKey) {
			return (
				<div className='flex items-center gap-2 font-medium'>
					<span>{rowData.name}</span>
				</div>
			);
		},
		fieldVariant: 'title',
	},
	{
		title: 'Token',
		render(rowData: SecretKey) {
			return (
				<div className='flex items-center gap-2'>
					<div className='bg-gray-100 px-3 py-1 rounded-md font-mono text-sm flex items-center'>
						<Key size={14} className='mr-2 text-gray-600' />
						<span className='text-gray-700'>{rowData.display_id}</span>
					</div>
				</div>
			);
		},
	},
	{
		title: 'Permissions',
		render(rowData) {
			const permissionText = formatPermissionDisplay(rowData.permissions);
			const PermissionIcon = getPermissionIcon(rowData.permissions);
			const colorClass = getPermissionColor(rowData.permissions);

			return (
				<div className={`flex items-center gap-2 ${colorClass}`}>
					<PermissionIcon size={16} />
					<span className='capitalize font-medium'>{permissionText}</span>
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

	const { mutate: deleteSecretKey, isPending: isDeletingSecretKey } = useMutation({
		mutationFn: (id: string) => SecretKeysApi.deleteSecretKey(id),
		onSuccess: () => {
			refetchQueries(['secret-keys']);
			toast.success('Api key deleted successfully');
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to delete secret key');
		},
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
						<DropdownMenu
							options={[
								{
									label: 'Delete',
									onSelect: () => deleteSecretKey(rowData.id),
									disabled: isDeletingSecretKey,
									icon: <Trash2 size={16} />,
								},
							]}
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

	// if (secretKeys?.items.length === 0) {
	// 	return (
	// 		<>
	// 			<EmptyPage tutorials={GUIDES.secrets.tutorials} heading='Secret Keys' tags={['secrets']} onAddClick={handleAddSecretKey} />
	// 			<SecretKeyDrawer isOpen={isSecretKeyDrawerOpen} onOpenChange={setIsSecretKeyDrawerOpen} />
	// 		</>
	// 	);
	// }
	return (
		<div>
			<ApiDocsContent tags={['secrets']} />
			<SecretKeyDrawer isOpen={isSecretKeyDrawerOpen} onOpenChange={setIsSecretKeyDrawerOpen} />
			{secretKeys?.items.length === 0 && (
				<EmptyPage tutorials={GUIDES.secrets.tutorials} heading='Secret Keys' tags={['secrets']} onAddClick={handleAddSecretKey} />
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
