import { CreditNote } from '@/models';
import { CREDIT_NOTE_STATUS, CREDIT_NOTE_TYPE } from '@/types/dto';
import { FC, ReactNode } from 'react';
import FlexpriceTable, { ColumnData, RedirectCell } from '../Table';
import { formatDateShort, getCurrencySymbol } from '@/utils/common/helper_functions';
import { Chip } from '@/components/atoms';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export interface Props {
	data: CreditNote[];
	footer?: ReactNode;
}

const getStatusChip = (status: CREDIT_NOTE_STATUS, t: TFunction) => {
	switch (status) {
		case CREDIT_NOTE_STATUS.VOIDED:
			return <Chip variant='default' label={t('creditNotes.status.voided')} />;
		case CREDIT_NOTE_STATUS.FINALIZED:
			return <Chip variant='success' label={t('invoices.status.finalized')} />;
		case CREDIT_NOTE_STATUS.DRAFT:
			return <Chip variant='default' label={t('common:status.draft')} />;
		default:
			return <Chip variant='default' label={t('common:status.draft')} />;
	}
};

const getTypeChip = (type: CREDIT_NOTE_TYPE, t: TFunction) => {
	switch (type) {
		case CREDIT_NOTE_TYPE.REFUND:
			return <Chip variant='default' label={t('creditNotes.status.refund')} />;
		case CREDIT_NOTE_TYPE.ADJUSTMENT:
			return <Chip variant='info' label={t('creditNotes.status.adjustment')} />;
		default:
			return <Chip variant='default' label={t('invoices.status.unknown')} />;
	}
};

const CreditNoteTable: FC<Props> = ({ data, footer }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('billing');

	const columns: ColumnData<CreditNote>[] = [
		{
			title: t('creditNotes.table.creditNoteId'),
			fieldVariant: 'title',

			render: (row: CreditNote) => row.credit_note_number || row.id.slice(0, 8),
		},
		{
			title: t('creditNotes.table.amount'),
			render: (row: CreditNote) => <span>{`${getCurrencySymbol(row.currency)}${row.total_amount}`}</span>,
		},
		{
			title: t('creditNotes.table.status'),
			render: (row: CreditNote) => getStatusChip(row.credit_note_status, t),
		},
		{
			title: t('creditNotes.table.type'),
			render: (row: CreditNote) => getTypeChip(row.credit_note_type, t),
		},
		{
			title: t('creditNotes.table.invoice'),
			render: (row: CreditNote) => {
				if (!row.invoice_id) return '—';

				return (
					<RedirectCell redirectUrl={`${RouteNames.invoices}/${row.invoice_id}`}>
						{row.invoice?.invoice_number || row.invoice_id.slice(0, 8)}
					</RedirectCell>
				);
			},
		},
		{
			title: t('creditNotes.table.customer'),
			render: (row: CreditNote) => {
				if (!row.customer?.id) return '—';

				return (
					<RedirectCell redirectUrl={`${RouteNames.customers}/${row.customer?.id}`}>
						{row.customer?.name || row.customer?.external_id}
					</RedirectCell>
				);
			},
		},
		{
			title: t('creditNotes.table.createdDate'),
			render: (row: CreditNote) => <span>{formatDateShort(row.created_at)}</span>,
		},
	];

	return (
		<FlexpriceTable
			variant='card'
			tableClassName='table-fixed'
			showEmptyRow={true}
			hideBottomBorder={false}
			onRowClick={(row) => {
				navigate(`${RouteNames.creditNotes}/${row.id}`);
			}}
			columns={columns}
			data={data}
			footer={footer}
		/>
	);
};

export default CreditNoteTable;
