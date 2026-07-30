import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@/components/atoms';
import Card, { CardHeader } from '@/components/atoms/Card/Card';
import { GroupApi } from '@/api/GroupApi';
import { getGroupEntityTypeLabel } from '@/models/Group';
import { useTranslation } from 'react-i18next';

const GroupInformationTab = () => {
	const { id: groupId } = useParams();
	const { t } = useTranslation(['catalog', 'common']);

	const { data: group, isLoading } = useQuery({
		queryKey: ['fetchGroupDetails', groupId],
		queryFn: () => GroupApi.getGroupById(groupId!),
		enabled: !!groupId,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (!group) {
		return (
			<div className='flex items-center justify-center h-64'>
				<p className='text-muted-foreground'>{t('catalog:groups.profile.notFound')}</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<Card variant='notched'>
				<CardHeader title={t('catalog:groups.information.title')} />
				<div className='grid grid-cols-2 gap-x-12 gap-y-4 text-sm'>
					<div>
						<div className='font-medium text-gray-900'>{t('catalog:groups.information.name')}</div>
						<div className='text-gray-600 mt-0.5'>{group.name || t('common:labels.na')}</div>
					</div>
					<div>
						<div className='font-medium text-gray-900'>{t('catalog:groups.information.entityType')}</div>
						<div className='text-gray-600 mt-0.5'>{getGroupEntityTypeLabel(group.entity_type ?? '') || t('common:labels.na')}</div>
					</div>
					<div>
						<div className='font-medium text-gray-900'>{t('catalog:groups.information.externalId')}</div>
						<div className='text-gray-600 mt-0.5'>{group.lookup_key || t('common:labels.na')}</div>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default GroupInformationTab;
