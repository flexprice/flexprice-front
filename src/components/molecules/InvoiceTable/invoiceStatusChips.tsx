import { TFunction } from 'i18next';
import { Chip } from '@/components/atoms';
import { INVOICE_STATUS } from '@/models/Invoice';
import { PAYMENT_STATUS } from '@/constants';

export const getStatusChip = (status: string, t: TFunction) => {
	switch (status.toUpperCase()) {
		case INVOICE_STATUS.VOIDED:
			return <Chip variant='default' label={t('invoices.status.void')} />;
		case INVOICE_STATUS.FINALIZED:
			return <Chip variant='success' label={t('invoices.status.finalized')} />;
		case INVOICE_STATUS.DRAFT:
			return <Chip variant='default' label={t('common:status.draft')} />;
		case INVOICE_STATUS.SKIPPED:
			return <Chip variant='default' label={t('invoices.status.skipped')} />;
		default:
			return <Chip variant='default' label={status || t('invoices.status.unknown')} />;
	}
};

export const getPaymentStatusChip = (status: string, t: TFunction) => {
	switch (status.toUpperCase()) {
		case PAYMENT_STATUS.PENDING:
			return <Chip variant='warning' label={t('invoices.status.pending')} />;
		case PAYMENT_STATUS.INITIATED:
			return <Chip variant='warning' label={t('invoices.status.initiated')} />;
		case PAYMENT_STATUS.SUCCEEDED:
			return <Chip variant='success' label={t('invoices.status.succeeded')} />;
		case PAYMENT_STATUS.FAILED:
			return <Chip variant='failed' label={t('invoices.status.failed')} />;
		case PAYMENT_STATUS.REFUNDED:
			return <Chip variant='default' label={t('invoices.status.refunded')} />;
		case PAYMENT_STATUS.PARTIALLY_REFUNDED:
			return <Chip variant='default' label={t('invoices.status.partiallyRefunded')} />;
		case PAYMENT_STATUS.OVERPAID:
			return <Chip variant='warning' label={t('invoices.status.overpaid')} />;
		default:
			return <Chip variant='default' label={t('invoices.status.unknown')} />;
	}
};
