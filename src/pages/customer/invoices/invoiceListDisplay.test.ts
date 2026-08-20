import { describe, expect, it } from 'vitest';
import { PAYMENT_STATUS } from '@/constants';
import { BILLING_PERIOD } from '@/constants/constants';
import { INVOICE_STATUS, INVOICE_TYPE, Invoice } from '@/models/Invoice';
import { getInvoiceIssuedAt, getInvoiceListStatus, getInvoicePlanLabel } from './invoiceListDisplay';

const invoice = (overrides: Partial<Invoice> = {}): Invoice =>
	({
		invoice_status: INVOICE_STATUS.FINALIZED,
		payment_status: PAYMENT_STATUS.PENDING,
		due_date: '',
		issue_date: '',
		finalized_at: '',
		created_at: '2026-01-02T00:00:00Z',
		...overrides,
	}) as Invoice;

describe('invoiceListDisplay', () => {
	it('maps succeeded payments to Paid', () => {
		expect(getInvoiceListStatus(invoice({ payment_status: PAYMENT_STATUS.SUCCEEDED }))).toEqual({ status: 'Paid', kind: 'paid' });
	});

	it('maps past-due unpaid invoices to Overdue', () => {
		expect(getInvoiceListStatus(invoice({ due_date: '2020-01-01T00:00:00Z' }))).toEqual({ status: 'Overdue', kind: 'overdue' });
	});

	it('maps draft invoices to Draft', () => {
		expect(getInvoiceListStatus(invoice({ invoice_status: INVOICE_STATUS.DRAFT }))).toEqual({ status: 'Draft', kind: 'draft' });
	});

	it('joins plan name and billing period with a middle dot', () => {
		expect(
			getInvoicePlanLabel(
				invoice({
					subscription: { plan: { name: 'Enterprise' }, billing_period: BILLING_PERIOD.ANNUAL } as Invoice['subscription'],
				}),
				() => 'Annual',
				() => 'One Off',
			),
		).toBe('Enterprise · Annual');
	});

	it('falls back to invoice type when the plan is missing', () => {
		expect(
			getInvoicePlanLabel(
				invoice({ invoice_type: INVOICE_TYPE.ONE_OFF }),
				() => 'Monthly',
				(type) => (type === INVOICE_TYPE.ONE_OFF ? 'One Off' : 'Subscription'),
			),
		).toBe('One Off');
	});

	it('prefers issue_date, then finalized_at, then created_at', () => {
		expect(getInvoiceIssuedAt(invoice({ issue_date: '2026-03-01', finalized_at: '2026-02-01', created_at: '2026-01-01' }))).toBe(
			'2026-03-01',
		);
		expect(getInvoiceIssuedAt(invoice({ issue_date: undefined, finalized_at: '2026-02-01' }))).toBe('2026-02-01');
		expect(getInvoiceIssuedAt(invoice({ issue_date: undefined, finalized_at: '' }))).toBe('2026-01-02T00:00:00Z');
	});
});
