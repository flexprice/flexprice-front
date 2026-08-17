import type { StatusChipStatus } from '@/components/atoms/StatusChip';
import { PAYMENT_STATUS } from '@/constants';
import { BILLING_PERIOD } from '@/constants/constants';
import { Invoice, INVOICE_STATUS, INVOICE_TYPE } from '@/models/Invoice';

export type InvoiceListStatusKind = 'paid' | 'pending' | 'overdue' | 'draft' | 'void' | 'refunded' | 'failed';

export interface InvoiceListStatus {
	status: StatusChipStatus;
	kind: InvoiceListStatusKind;
}

export function getInvoiceListStatus(invoice: Pick<Invoice, 'invoice_status' | 'payment_status' | 'due_date'>): InvoiceListStatus {
	const invoiceStatus = invoice.invoice_status?.toUpperCase();
	if (invoiceStatus === INVOICE_STATUS.VOIDED) {
		return { status: 'Cancelled', kind: 'void' };
	}
	if (invoiceStatus === INVOICE_STATUS.DRAFT) {
		return { status: 'Draft', kind: 'draft' };
	}

	const payment = invoice.payment_status?.toUpperCase();
	if (payment === PAYMENT_STATUS.SUCCEEDED || payment === PAYMENT_STATUS.OVERPAID) {
		return { status: 'Paid', kind: 'paid' };
	}
	if (payment === PAYMENT_STATUS.REFUNDED || payment === PAYMENT_STATUS.PARTIALLY_REFUNDED) {
		return { status: 'Cancelled', kind: 'refunded' };
	}

	const due = invoice.due_date ? new Date(invoice.due_date) : undefined;
	const isPastDue = Boolean(due && !Number.isNaN(due.getTime()) && due.getTime() < Date.now());
	if (isPastDue || payment === PAYMENT_STATUS.FAILED) {
		return { status: 'Overdue', kind: payment === PAYMENT_STATUS.FAILED && !isPastDue ? 'failed' : 'overdue' };
	}

	return { status: 'Pending', kind: 'pending' };
}

export function getInvoicePlanLabel(
	invoice: Pick<Invoice, 'subscription' | 'invoice_type'>,
	periodLabel: (period: BILLING_PERIOD) => string,
	typeLabel: (type: INVOICE_TYPE) => string,
): string {
	const planName = invoice.subscription?.plan?.name?.trim();
	if (planName) {
		const period = invoice.subscription?.billing_period;
		if (!period) return planName;
		return `${planName} · ${periodLabel(period)}`;
	}
	return typeLabel(invoice.invoice_type);
}

export function getInvoiceIssuedAt(invoice: Pick<Invoice, 'issue_date' | 'finalized_at' | 'created_at'>): string | undefined {
	return invoice.issue_date || invoice.finalized_at || invoice.created_at;
}
