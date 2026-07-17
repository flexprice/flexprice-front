import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { TaxAssociationResponse } from '@/types/dto/tax';
import { Chip, ActionButton, Card, CardHeader, AddButton, NoDataCard } from '@/components/atoms';
import { DropdownMenu, getCopyIdOption } from '@/components/molecules';
import { formatDateShort } from '@/utils/common/helper_functions';
import TaxApi from '@/api/TaxApi';
import { RouteNames } from '@/core/routes/Routes';
import { TrashIcon } from 'lucide-react';

interface Props {
	data: TaxAssociationResponse[];
	onAdd?: () => void;
	showDelete?: boolean;
	refetchQueryKey?: string;
	onRemove?: (association: TaxAssociationResponse) => void;
}

interface RowActionsProps {
	row: TaxAssociationResponse;
	onRemove: (row: TaxAssociationResponse) => void;
}

const RowActions: FC<RowActionsProps> = ({ row, onRemove }) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(false);
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen((v) => !v);
	};
	return (
		<div data-interactive='true' onClick={handleClick}>
			<DropdownMenu
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				options={[
					getCopyIdOption(row.id, t, { entityType: 'Tax Association' }),
					{
						label: t('form.remove'),
						icon: <TrashIcon />,
						onSelect: (e: Event) => {
							e.preventDefault();
							setIsOpen(false);
							onRemove(row);
						},
					},
				]}
			/>
		</div>
	);
};

const TaxAssociationTable: FC<Props> = ({ data, onAdd, showDelete = true, refetchQueryKey = 'fetchTaxAssociations', onRemove }) => {
	const { t } = useTranslation('common');

	const rows = useMemo(() => {
		const now = new Date();
		return data.filter((a) => !a.valid_to || new Date(a.valid_to) > now);
	}, [data]);

	const addButton = onAdd ? <AddButton onClick={onAdd} /> : undefined;
	const title = t('subscriptionEdit.taxAssociations', 'Tax Associations');

	const columns: ColumnData<TaxAssociationResponse>[] = [
		{
			title: t('tableColumns.taxId'),
			render: (row) => (
				<RedirectCell redirectUrl={`${RouteNames.taxes}/${row.tax_rate_id}`}>{row.tax_rate?.name || row.tax_rate_id}</RedirectCell>
			),
		},
		{
			title: t('tableColumns.priority'),
			render: (row) => row.priority,
		},
		{
			title: t('tableColumns.autoApply'),
			render: (row) => <Chip variant={row.auto_apply ? 'success' : 'default'} label={row.auto_apply ? t('labels.yes') : t('labels.no')} />,
		},
		{
			title: t('tableColumns.validFrom', 'Valid From'),
			render: (row) => (row.valid_from ? formatDateShort(row.valid_from) : '—'),
		},
		{
			title: t('tableColumns.validTo', 'Valid To'),
			render: (row) => (row.valid_to ? formatDateShort(row.valid_to) : t('labels.forever', 'Forever')),
		},
		{
			fieldVariant: 'interactive',
			width: '48px',
			render(row) {
				if (onRemove) {
					return <RowActions row={row} onRemove={onRemove} />;
				}
				return (
					<ActionButton
						id={row?.id}
						copyId={{ entityType: 'Tax Association' }}
						deleteMutationFn={async () => {
							return await TaxApi.deleteTaxAssociation(row?.id);
						}}
						refetchQueryKey={refetchQueryKey}
						entityName={`${row?.tax_rate?.name} Tax for ${row?.entity_type}`}
						edit={{ enabled: false }}
						archive={{
							enabled: showDelete,
							icon: <TrashIcon className='h-4 w-4' />,
							text: t('actions.delete'),
						}}
					/>
				);
			},
		},
	];

	if (rows.length === 0) {
		return <NoDataCard title={title} subtitle={t('tax.noAssociations', 'No taxes applied to this subscription yet')} cta={addButton} />;
	}

	return (
		<Card variant='notched'>
			<CardHeader title={title} cta={addButton} />
			<FlexpriceTable columns={columns} data={rows} variant='no-bordered' />
		</Card>
	);
};

export default TaxAssociationTable;
