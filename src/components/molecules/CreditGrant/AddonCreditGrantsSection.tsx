import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, NoDataCard, Loader, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { Plus } from 'lucide-react';
import { uniqueId } from 'lodash';
import CreditGrantApi from '@/api/CreditGrantApi';
import { CreditGrantsTable, CreditGrantModal } from '@/components/molecules';
import { refetchQueries } from '@/core/services/tanstack/queryClient';
import toast from 'react-hot-toast';
import {
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_SCOPE,
	ENTITY_STATUS,
} from '@/models';
import { InternalCreditGrantRequest, CreateCreditGrantRequest } from '@/types/dto/CreditGrant';
import { useTranslation } from 'react-i18next';

interface Props {
	addonId: string;
}

/**
 * AddonCreditGrantsSection renders the credit-grants section on the addon detail page.
 * Mirrors the plan credit-grants tab, but scoped to ADDON and rendered inline (addons have no tabs).
 */
const AddonCreditGrantsSection = ({ addonId }: Props) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [creditGrantModalOpen, setCreditGrantModalOpen] = useState(false);
	const { can, isLoading: permissionsLoading } = useCurrentUserPermissions();
	const canWriteCreditGrant = can('creditgrant', 'write');

	const {
		data: creditGrantsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['addonCreditGrants', addonId],
		queryFn: async () => {
			return await CreditGrantApi.list({
				addon_ids: [addonId],
				scope: CREDIT_GRANT_SCOPE.ADDON,
				status: ENTITY_STATUS.PUBLISHED,
			});
		},
		enabled: !!addonId,
	});

	const { mutate: createAddonCreditGrant, isPending: isCreatingCreditGrant } = useMutation({
		mutationFn: async (data: CreateCreditGrantRequest) => {
			const grantWithAddonId = {
				...data,
				addon_id: addonId,
			};
			return await CreditGrantApi.create(grantWithAddonId);
		},
		onSuccess: () => {
			toast.success('Credit grant added successfully');
			setCreditGrantModalOpen(false);
			refetchQueries(['addonCreditGrants', addonId]);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to add credit grant');
		},
	});

	const getEmptyCreditGrant = (): InternalCreditGrantRequest => {
		return {
			id: uniqueId('credit-grant-'),
			credits: 0,
			period: CREDIT_GRANT_PERIOD.MONTHLY,
			name: 'Free Credits',
			scope: CREDIT_GRANT_SCOPE.ADDON,
			cadence: CREDIT_GRANT_CADENCE.ONETIME,
			period_count: 1,
			addon_id: addonId,
			expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
			expiration_duration_unit: CREDIT_GRANT_PERIOD_UNIT.DAYS,
			priority: 0,
			metadata: {},
		};
	};

	const handleSaveCreditGrant = (data: InternalCreditGrantRequest) => {
		const { id, ...createRequest } = data;
		createAddonCreditGrant(createRequest);
	};

	const handleCancelCreditGrant = () => {
		setCreditGrantModalOpen(false);
	};

	useEffect(() => {
		if (isError) {
			toast.error('Error loading credit grants');
		}
	}, [isError]);

	if (isLoading || permissionsLoading) {
		return <Loader />;
	}

	if (isError) {
		return null;
	}

	const creditGrants = creditGrantsData?.items || [];

	const addButton = canWriteCreditGrant ? (
		<Button prefixIcon={<Plus />} onClick={() => setCreditGrantModalOpen(true)} disabled={isCreatingCreditGrant}>
			{isCreatingCreditGrant ? t('common:actions.adding') : t('common:actions.add')}
		</Button>
	) : (
		<Tooltip content={t('catalog:plans.creditGrantsTab.writeDeniedTooltip')}>
			<span tabIndex={0} className='inline-block'>
				<Button disabled prefixIcon={<Plus />}>
					{t('common:actions.add')}
				</Button>
			</span>
		</Tooltip>
	);

	return (
		<>
			<CreditGrantModal
				data={undefined}
				isOpen={creditGrantModalOpen}
				onOpenChange={setCreditGrantModalOpen}
				onSave={handleSaveCreditGrant}
				onCancel={handleCancelCreditGrant}
				getEmptyCreditGrant={getEmptyCreditGrant}
			/>
			{creditGrants.length > 0 ? (
				<Card variant='notched'>
					<CardHeader title={t('catalog:addons.details.creditGrants')} cta={addButton} />
					<CreditGrantsTable
						data={creditGrants}
						onDelete={() => {
							refetchQueries(['addonCreditGrants', addonId]);
						}}
						showEmptyRow
					/>
				</Card>
			) : (
				<NoDataCard title={t('catalog:addons.details.creditGrants')} subtitle='No credit grants added to the addon yet' cta={addButton} />
			)}
		</>
	);
};

export default AddonCreditGrantsSection;
