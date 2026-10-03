import { describe, expect, it } from 'vitest';
import { ACTIVITY_ACTIONS, ACTIVITY_CUSTOMER_ENTITY_TYPES, ACTIVITY_ENTITY_TYPES } from './activity';

describe('activity constants', () => {
	it('only offers entity types the v1 filter can narrow by their actions', () => {
		for (const type of ACTIVITY_ENTITY_TYPES) {
			expect(
				ACTIVITY_ACTIONS.some((a) => a.startsWith(`${type}.`)),
				type,
			).toBe(true);
		}
	});
	it('offers checkout sessions, filterable by their created and updated actions', () => {
		expect(ACTIVITY_ENTITY_TYPES).toContain('checkout_session');
		expect(ACTIVITY_ACTIONS).toEqual(expect.arrayContaining(['checkout_session.created', 'checkout_session.updated']));
	});
	it('does not offer the child and association types', () => {
		expect(ACTIVITY_ENTITY_TYPES).not.toContain('addon_association');
		expect(ACTIVITY_ENTITY_TYPES).not.toContain('invoice_line_item');
	});
	it('limits the customer timeline to types that belong to a customer', () => {
		expect(ACTIVITY_CUSTOMER_ENTITY_TYPES).toContain('subscription');
		expect(ACTIVITY_CUSTOMER_ENTITY_TYPES).not.toContain('plan');
		expect(ACTIVITY_CUSTOMER_ENTITY_TYPES).not.toContain('price');
		for (const type of ACTIVITY_CUSTOMER_ENTITY_TYPES) expect(ACTIVITY_ENTITY_TYPES).toContain(type);
	});
});
