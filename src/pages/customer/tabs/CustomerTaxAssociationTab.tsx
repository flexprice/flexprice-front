import { useParams, useOutletContext } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardHeader, AddButton, Loader, NoDataCard, ShortPagination, Tooltip } from '@/components/atoms';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';
import { ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import TaxApi from '@/api/TaxApi';
import { ENTITY_STATUS, TAXRATE_ENTITY_TYPE } from '@/models';
import usePagination from '@/hooks/usePagination';
import toast from 'react-hot-toast';
import { TaxAssociationTable, TaxAssociationDialog } from '@/components/molecules';
import { CreateTaxAssociationRequest } from '@/types';
import { useState } from 'react';
import { EXPAND } from '@/models';
import { useTranslation } from 'react-i18next';

type ContextType = {
	isArchived: boolean;
};

const CustomerTaxAssociationTab = () => {
	const { t } = useTranslation('customers');
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();
	const { limit, offset, page } = usePagination();
	const [dialogOpen, setDialogOpen] = useState(false);
	const { can } = useCurrentUserPermissions();
	const canWriteTax = can('tax', 'write');

	const fetchTaxAssociations = async () => {
		return await TaxApi.listTaxAssociations({
			entity_type: TAXRATE_ENTITY_TYPE.CUSTOMER,
			entity_id: customerId!,
			limit,
			offset,
			expand: EXPAND.TAX_RATE,
			status: ENTITY_STATUS.PUBLISHED,
		});
	};

	const {
		data: taxAssociationsData,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ['fetchTaxAssociations', customerId, page],
		queryFn: fetchTaxAssociations,
		enabled: !!customerId,
	});

	const createTaxAssociationMutation = useMutation({
		mutationFn: (payload: CreateTaxAssociationRequest) => TaxApi.createTaxAssociation(payload),
		onSuccess: () => {
			toast.success('Tax association created successfully');
			setDialogOpen(false);
			refetch();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create tax association. Please try again.');
		},
	});

	const handleAddTaxAssociation = () => {
		setDialogOpen(true);
	};

	const handleSaveTaxAssociation = (data: CreateTaxAssociationRequest) => {
		createTaxAssociationMutation.mutate(data);
	};

	const handleCancelTaxAssociation = () => {
		setDialogOpen(false);
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error fetching tax associations');
	}

	const addTaxAssociationCta =
		!isArchived &&
		(canWriteTax ? (
			<AddButton onClick={handleAddTaxAssociation} disabled={false} />
		) : (
			<Tooltip content={t('tabPanels.tax.writeDeniedTooltip')}>
				<span tabIndex={0} className='inline-block'>
					<AddButton disabled />
				</span>
			</Tooltip>
		));

	if (!taxAssociationsData?.items?.length) {
		return (
			<div>
				<ApiDocsContent tags={API_DOCS_TAGS.TaxAssociations} />
				<TaxAssociationDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					entityType={TAXRATE_ENTITY_TYPE.CUSTOMER}
					entityId={customerId!}
					onSave={handleSaveTaxAssociation}
					onCancel={handleCancelTaxAssociation}
				/>
				<NoDataCard title={t('tabPanels.tax.emptyTitle')} subtitle={t('tabPanels.tax.emptySubtitle')} cta={addTaxAssociationCta} />
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<ApiDocsContent tags={API_DOCS_TAGS.TaxAssociations} />
			<Card variant='notched'>
				<CardHeader title={t('tabPanels.tax.associationsTitle')} cta={addTaxAssociationCta} />
				{/* TaxAssociationTable applies its own canWriteTax disabled+tooltip to the delete
				    action — pass only the archived-state condition here so a denied user still sees
				    the (disabled, explained) action instead of it disappearing outright. */}
				<TaxAssociationTable data={taxAssociationsData.items} showDelete={!isArchived} />
				<ShortPagination unit={t('tabPanels.tax.associationsPaginationUnit')} totalItems={taxAssociationsData.pagination.total ?? 0} />
			</Card>

			<TaxAssociationDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				entityType={TAXRATE_ENTITY_TYPE.CUSTOMER}
				entityId={customerId!}
				onSave={handleSaveTaxAssociation}
				onCancel={handleCancelTaxAssociation}
			/>
		</div>
	);
};

export default CustomerTaxAssociationTab;
