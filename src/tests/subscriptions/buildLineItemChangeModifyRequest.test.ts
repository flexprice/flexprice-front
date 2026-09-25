import { describe, expect, test } from 'vitest';
import { SUBSCRIPTION_MODIFY_TYPE } from '@/models';
import { buildLineItemChangeModifyRequest } from '@/utils/subscription/buildLineItemChangeModifyRequest';

describe('buildLineItemChangeModifyRequest', () => {
	test('builds line_item_change payload with line item id and quantity string', () => {
		const req = buildLineItemChangeModifyRequest({
			lineItemId: 'li_123',
			quantity: '12.5',
		});
		expect(req.type).toBe(SUBSCRIPTION_MODIFY_TYPE.LINE_ITEM_CHANGE);
		expect(req.line_item_change_params?.line_items).toHaveLength(1);
		expect(req.line_item_change_params?.line_items[0]).toEqual({
			id: 'li_123',
			quantity: '12.5',
		});
		expect(req.inheritance_params).toBeUndefined();
	});

	test('sends amount alone when only the price changes', () => {
		const req = buildLineItemChangeModifyRequest({ lineItemId: 'li_1', amount: '20.00' });
		expect(req.line_item_change_params?.line_items[0]).toEqual({ id: 'li_1', amount: '20.00' });
	});

	test('sends quantity, amount and effective_date together', () => {
		const iso = '2026-04-15T12:00:00.000Z';
		const req = buildLineItemChangeModifyRequest({
			lineItemId: 'li_abc',
			quantity: '1',
			amount: '5',
			effectiveDateIso: iso,
		});
		expect(req.line_item_change_params?.line_items[0]).toEqual({
			id: 'li_abc',
			quantity: '1',
			amount: '5',
			effective_date: iso,
		});
	});
});
