import { describe, expect, it } from 'vitest';
import { ActivityItemSchema } from './ActivityLog';

const base = {
	id: 'act_1',
	entity_type: 'customer',
	entity_id: 'cust_1',
	entity_label: 'Acme',
	action: 'customer.updated',
	actor: { type: 'user', id: 'u1', label: 'Alice' },
	source: 'dashboard',
	occurred_at: '2026-10-03T10:00:00Z',
};

describe('ActivityItemSchema', () => {
	it('parses display.parts with only the sentence pieces', () => {
		const parsed = ActivityItemSchema.parse({
			...base,
			display: {
				summary: 'Alice updated customer Acme',
				entity_label: 'Acme',
				parts: { actor: 'Alice', verb: 'updated', entity_type: 'customer', entity: 'Acme' },
			},
		});
		expect(parsed.display.parts).toEqual({ actor: 'Alice', verb: 'updated', entity_type: 'customer', entity: 'Acme' });
	});
	it('still accepts a response from a backend that sends the old extra parts fields', () => {
		const parsed = ActivityItemSchema.parse({
			...base,
			display: {
				summary: 's',
				entity_label: 'Acme',
				parts: { actor: 'Alice', verb: 'updated', entity_type: 'customer', entity: 'Acme', field: null, from: null, to: null, count: 3 },
			},
		});
		expect(parsed.display.parts).not.toHaveProperty('count');
	});
});
