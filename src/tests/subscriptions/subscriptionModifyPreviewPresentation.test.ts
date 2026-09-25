import { describe, expect, test } from 'vitest';
import type { Invoice } from '@/models/Invoice';
import { SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION, SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION } from '@/models';
import type { ChangedInvoice, ChangedLineItem } from '@/types/dto/Subscription';
import {
	buildBillingImpactBullets,
	buildBillingImpactRows,
	buildLineItemChangeRows,
	formatCompactLineItemPeriod,
	formatLineItemRowPrice,
	resolveInvoiceAmountSource,
} from '@/utils/subscription/subscriptionModifyPreviewPresentation';

describe('subscriptionModifyPreviewPresentation', () => {
	describe('formatLineItemRowPrice', () => {
		const ctx = {
			lineItemDisplayName: 'Seats',
			previousQuantity: '1',
			newQuantity: '3',
			currency: 'USD',
			previousAmount: '60',
			newAmount: '80',
		};

		test('ended line shows old price, new line shows new price', () => {
			expect(formatLineItemRowPrice('ended', ctx)).toMatch(/60/);
			expect(formatLineItemRowPrice('created', ctx)).toMatch(/80/);
		});

		test('keeps small prices exact instead of exponent form', () => {
			expect(formatLineItemRowPrice('created', { ...ctx, newAmount: '0.0000001' })).toBe('$0.0000001');
		});

		test('null without price context', () => {
			expect(formatLineItemRowPrice('created', { ...ctx, previousAmount: undefined, newAmount: undefined })).toBeNull();
		});
	});

	describe('resolveInvoiceAmountSource', () => {
		const inv = (id: string): Invoice =>
			({
				id,
				total: 99.5,
				amount_due: 99.5,
				currency: 'USD',
			}) as Invoice;

		test('matches by id', () => {
			const changed: ChangedInvoice[] = [{ id: 'inv_a', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' }];
			expect(resolveInvoiceAmountSource(changed, inv('inv_a'))?.id).toBe('inv_a');
		});

		test('no match when multiple and ids differ', () => {
			const changed: ChangedInvoice[] = [
				{ id: 'inv_1', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' },
				{ id: 'inv_2', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' },
			];
			expect(resolveInvoiceAmountSource(changed, inv('inv_x'))).toBeNull();
		});

		test('single changed invoice uses latest without id match (heuristic)', () => {
			const changed: ChangedInvoice[] = [{ id: 'inv_new', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' }];
			expect(resolveInvoiceAmountSource(changed, inv('inv_old'))?.id).toBe('inv_old');
		});
	});

	describe('buildBillingImpactBullets', () => {
		test('includes amount when source resolves', () => {
			const changed: ChangedInvoice[] = [{ id: 'inv_1', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' }];
			const latest = {
				id: 'inv_1',
				total: 42,
				amount_due: 42,
				currency: 'USD',
			} as Invoice;
			const bullets = buildBillingImpactBullets(changed, latest);
			expect(bullets).toHaveLength(1);
			expect(bullets[0].primary).toContain('proration invoice');
			expect(bullets[0].secondary).toMatch(/Estimated invoice total:/);
		});

		test('omits amount when latest does not resolve', () => {
			const changed: ChangedInvoice[] = [
				{ id: 'a', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' },
				{ id: 'b', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' },
			];
			const latest = { id: 'x', total: 10, currency: 'USD' } as Invoice;
			const bullets = buildBillingImpactBullets(changed, latest);
			expect(bullets.every((b) => !b.secondary)).toBe(true);
		});

		test('wallet credit copy', () => {
			const changed: ChangedInvoice[] = [{ id: 'w1', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.WALLET_CREDIT, status: 'posted' }];
			const bullets = buildBillingImpactBullets(changed, null);
			expect(bullets[0].primary).toContain('wallet');
			expect(bullets[0].secondary).toBeUndefined();
		});
	});

	describe('buildBillingImpactRows', () => {
		test('compact title and amount when source resolves', () => {
			const changed: ChangedInvoice[] = [{ id: 'inv_1', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED, status: 'draft' }];
			const latest = {
				id: 'inv_1',
				total: 42,
				amount_due: 42,
				currency: 'USD',
			} as Invoice;
			const rows = buildBillingImpactRows(changed, latest);
			expect(rows).toHaveLength(1);
			expect(rows[0].title).toBe('Proration invoice');
			expect(rows[0].amountText).toMatch(/42/);
		});

		test('wallet credit row title without amount when latest missing', () => {
			const changed: ChangedInvoice[] = [{ id: 'w1', action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.WALLET_CREDIT, status: 'posted' }];
			const rows = buildBillingImpactRows(changed, null);
			expect(rows[0].title).toBe('Wallet credit');
			expect(rows[0].amountText).toBeUndefined();
		});
	});

	describe('embedded change amounts', () => {
		test('wallet credit reads wallet_transaction.amount over latest_invoice', () => {
			const changed = [
				{
					id: '',
					action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.WALLET_CREDIT,
					status: 'preview',
					wallet_transaction: { amount: 25 },
				},
			] as ChangedInvoice[];
			const latest = { id: 'inv_old', total: 999, currency: 'USD' } as Invoice;
			const rows = buildBillingImpactRows(changed, latest);
			expect(rows[0].amountText).toMatch(/25/);
			expect(rows[0].amountText).not.toMatch(/999/);
		});

		test('created invoice reads the embedded invoice', () => {
			const changed = [
				{
					id: '',
					action: SUBSCRIPTION_MODIFY_INVOICE_RESOURCE_ACTION.CREATED,
					status: 'preview',
					invoice: { total: 12, amount_due: 12, currency: 'USD' },
				},
			] as ChangedInvoice[];
			const rows = buildBillingImpactRows(changed, null);
			expect(rows[0].amountText).toMatch(/12/);
		});
	});

	describe('formatCompactLineItemPeriod', () => {
		test('joins start and end with en dash', () => {
			const li = {
				id: 'x',
				price_id: 'p',
				quantity: '1',
				start_date: '2026-04-01T00:00:00.000Z',
				end_date: '2026-05-01T00:00:00.000Z',
				change_action: SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.CREATED,
			} satisfies ChangedLineItem;
			const s = formatCompactLineItemPeriod(li);
			expect(s).toContain('–');
			expect(s).toMatch(/2026/);
		});
	});

	describe('buildLineItemChangeRows', () => {
		test('maps ended and created with labels and qty', () => {
			const items: ChangedLineItem[] = [
				{
					id: 'a',
					price_id: 'p',
					quantity: '1',
					start_date: '2026-04-01T00:00:00.000Z',
					end_date: '2026-04-01T00:00:00.000Z',
					change_action: SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.ENDED,
				},
				{
					id: 'b',
					price_id: 'p',
					quantity: '45',
					start_date: '2026-04-01T00:00:00.000Z',
					end_date: '2026-05-01T00:00:00.000Z',
					change_action: SUBSCRIPTION_MODIFY_LINE_ITEM_ACTION.CREATED,
				},
			];
			const rows = buildLineItemChangeRows(items);
			expect(rows).toHaveLength(2);
			expect(rows[0].kind).toBe('ended');
			expect(rows[0].label).toBe('Ending line');
			expect(rows[0].quantityDisplay).toBe('1');
			expect(rows[1].kind).toBe('created');
			expect(rows[1].label).toBe('New line');
			expect(rows[1].quantityDisplay).toBe('45');
		});
	});
});
