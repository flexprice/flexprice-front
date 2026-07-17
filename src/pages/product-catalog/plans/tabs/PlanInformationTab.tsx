import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Spacer, Divider, Chip } from '@/components/atoms';
import { Pencil } from 'lucide-react';
import { MetadataModal, DetailsCard, PlanDrawer, IntegrationMappingCard } from '@/components/molecules';
import { ENTITY_STATUS, Plan } from '@/models';
import formatDate from '@/utils/common/format_date';
import { formatEntityStatus } from '@/utils/common/format_chips';
import { getTypographyClass } from '@/lib/typography';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { PlanApi } from '@/api';
import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/utils/common/Logger';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PlanInformationTab = () => {
	const { t } = useTranslation(['catalog', 'common']);
	const { planId } = useParams<{ planId: string }>();
	const [showMetadataModal, setShowMetadataModal] = useState(false);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			return await PlanApi.getPlanById(planId!);
		},
		enabled: !!planId,
	});

	const [localMetadata, setLocalMetadata] = useState<Record<string, string>>({});

	useEffect(() => {
		if (planData?.metadata) {
			setLocalMetadata(planData.metadata);
		} else {
			setLocalMetadata({});
		}
	}, [planData?.metadata]);

	const na = t('common:labels.na');

	const planDetails = useMemo(
		() => [
			{ label: t('catalog:plans.information.name'), value: planData?.name },
			{ label: t('catalog:plans.information.lookupKey'), value: planData?.lookup_key || na },
			{ label: t('catalog:plans.information.description'), value: planData?.description || na },
			{ label: t('catalog:plans.information.createdDate'), value: formatDate(planData?.created_at ?? '') },
			{
				label: t('catalog:plans.information.status'),
				value: (
					<Chip
						label={formatEntityStatus(planData?.status || '', t)}
						variant={planData?.status === ENTITY_STATUS.PUBLISHED ? 'success' : 'default'}
					/>
				),
			},
		],
		[planData, t, na],
	);

	const handleSaveMetadata = async (newMetadata: Record<string, string>) => {
		if (!planId) return;
		try {
			await PlanApi.updatePlan(planId, { metadata: newMetadata });
			setLocalMetadata(newMetadata);
			setShowMetadataModal(false);
			refetchQueries(['fetchPlan', planId]);
			toast.success(t('catalog:plans.information.toast.metadataUpdated'));
		} catch (e) {
			logger.error('Failed to update metadata', e);
			toast.error(t('catalog:plans.information.toast.metadataUpdateFailed'));
		}
	};

	const isArchived = planData?.status !== ENTITY_STATUS.PUBLISHED;

	if (isLoading) {
		return (
			<div className='py-6 px-4 rounded-xl border border-gray-300'>
				<p className='text-gray-600'>{t('catalog:plans.information.loading')}</p>
			</div>
		);
	}

	if (isError || !planData) {
		toast.error(t('catalog:plans.information.toast.loadError'));
		return null;
	}

	return (
		<div>
			{planDetails.filter((detail) => detail.value !== na).length > 0 && (
				<div>
					<Spacer className='!h-4' />
					<div className='flex justify-between items-center'>
						<h3 className={getTypographyClass('card-header') + '!text-[16px]'}>{t('catalog:plans.information.planDetails')}</h3>
						<div className='flex gap-2'>
							{!isArchived && (
								<PlanDrawer
									trigger={
										<Button variant={'outline'} size={'icon'}>
											<Pencil />
										</Button>
									}
									open={planDrawerOpen}
									onOpenChange={setPlanDrawerOpen}
									data={planData as Plan}
									refetchQueryKeys={['fetchPlan', planId!]}
								/>
							)}
						</div>
					</div>
					<Spacer className='!h-4' />
					<DetailsCard variant='stacked' data={planDetails} childrenAtTop cardStyle='borderless' />

					{/* Metadata Section Below Plan Details */}
					<Divider className='my-4' />
					<div className='mt-8'>
						<div className='flex justify-between items-center mb-2'>
							<h3 className={getTypographyClass('card-header') + '!text-[16px]'}>{t('catalog:plans.information.metadata')}</h3>
							{!isArchived && (
								<Button variant='outline' size='icon' onClick={() => setShowMetadataModal(true)}>
									<Pencil className='size-5' />
								</Button>
							)}
						</div>
						<DetailsCard
							variant='stacked'
							data={
								localMetadata && Object.keys(localMetadata).length > 0
									? Object.entries(localMetadata).map(([key, value]) => ({ label: key, value }))
									: [{ label: t('catalog:plans.information.noMetadataAvailable'), value: '' }]
							}
							cardStyle='borderless'
						/>
					</div>

					{/* Metadata Modal for Editing */}
					<MetadataModal
						open={showMetadataModal}
						data={localMetadata}
						onSave={handleSaveMetadata}
						onClose={() => setShowMetadataModal(false)}
					/>

					{/* third-party integration mappings (e.g. AWS Marketplace product_code) */}
					{planId && (
						<div className='mt-8'>
							<IntegrationMappingCard entityType='plan' entityId={planId} />
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PlanInformationTab;
