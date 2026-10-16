import { describe, expect, it } from 'vitest';
import { parentRef, snapshotRows } from './snapshot';

describe('snapshotRows', () => {
	it('drops empty, internal and nested values and formats the rest', () => {
		const rows = snapshotRows({
			id: 'cust_1',
			tenant_id: 't',
			environment_id: 'e',
			metadata: { a: 1 },
			address: { city: 'Pune' },
			tags: [],
			email: '',
			phone: null,
			name: 'Acme',
			auto_pay: true,
			trial_end: '2026-10-03T10:00:00Z',
			tax_id: '[redacted]',
			parent_customer_id: 'cust_01HXPARENT01',
		});
		expect(rows.map((r) => r.key)).toEqual(['auto_pay', 'name', 'parent_customer_id', 'tax_id', 'trial_end']);
		expect(rows.find((r) => r.key === 'auto_pay')?.format).toBe('boolean');
		expect(rows.find((r) => r.key === 'trial_end')?.format).toBe('date');
		expect(rows.find((r) => r.key === 'tax_id')?.format).toBe('redacted');
		expect(rows.find((r) => r.key === 'parent_customer_id')?.format).toBe('ref:customer');
		expect(rows.find((r) => r.key === 'name')?.label).toBe('Name');
	});
	it('handles a missing snapshot', () => {
		expect(snapshotRows(undefined)).toEqual([]);
	});
});

describe('parent reference', () => {
	const price = { id: 'price_1', display_name: 'Storage', entity_type: 'PLAN', entity_id: 'plan_01M3VTT21J6F', amount: '20' };
	it('reads the owning entity from the snapshot', () => {
		expect(parentRef(price)).toEqual({ type: 'plan', id: 'plan_01M3VTT21J6F' });
	});
	it('ignores a missing, empty or unknown owner', () => {
		expect(parentRef(undefined)).toBeNull();
		expect(parentRef({ entity_type: 'PLAN', entity_id: '' })).toBeNull();
		expect(parentRef({ entity_type: 'SOMETHING_NEW', entity_id: 'x_1' })).toBeNull();
	});
	it('shows the owner as a linked Plan row instead of raw entity_type/entity_id text', () => {
		const rows = snapshotRows(price);
		expect(rows.map((r) => r.key)).not.toContain('entity_type');
		const plan = rows.find((r) => r.key === 'entity_id');
		expect(plan).toMatchObject({ label: 'Plan', format: 'ref:plan', value: 'plan_01M3VTT21J6F' });
	});
});
