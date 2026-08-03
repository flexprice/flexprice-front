import { GroupApi } from '@/api/GroupApi';
import { useQuery } from '@tanstack/react-query';
import { CopyIdButton, Loader } from '@/components/atoms';

interface GroupHeaderProps {
	groupId: string;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ groupId }) => {
	const { data: group, isLoading } = useQuery({
		queryKey: ['fetchGroupDetails', groupId],
		queryFn: () => GroupApi.getGroupById(groupId),
		enabled: !!groupId,
	});

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className='items-center justify-center'>
			<div className='flex place-items-center space-x-3'>
				<span className='size-9 bg-contain rounded-md bg-surface-heavy flex items-center justify-center text-white text-lg'>
					{group?.name?.charAt(0)?.toUpperCase() ?? 'G'}
				</span>
				<div className='flex flex-col'>
					<div className='flex items-center gap-2'>
						<div className='text-xl font-normal text-content-heading'>{group?.name}</div>
						{group?.id && <CopyIdButton id={group.id} entityType='Group' />}
					</div>
				</div>
			</div>
		</div>
	);
};

export default GroupHeader;
