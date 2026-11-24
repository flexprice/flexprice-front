import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { ActivityItem } from '@/types/dto/ActivityLog';
import { actorName, entityTitle, rowDetail, summaryOf } from './summary';

const t = ((key: string, o?: Record<string, unknown>) => {
	if (key === 'verb.created') return `${o?.actor} created ${o?.entityType} ${o?.entity}`;
	if (key === 'entity.invoice') return 'Invoice';
	if (key === 'actor.system') return 'System';
	return typeof o?.defaultValue === 'string' ? o.defaultValue : key;
}) as unknown as TFunction;

const mk = (over: Partial<ActivityItem['display']['parts']> = {}, item: Partial<ActivityItem> = {}): ActivityItem => ({
	id: 'act_1',
	entity_type: 'invoice',
	entity_id: 'inv_01HX7KQ2M9RQ',
	entity_label: 'inv_01HX7KQ2M9RQ',
	action: 'invoice.created',
	actor: { type: 'user', id: 'u1', label: 'Alice' },
	source: 'dashboard',
	occurred_at: '2026-10-03T10:00:00Z',
	display: {
		summary: 'Alice created invoice inv_01HX7KQ2M9RQ',
		entity_label: 'inv_01HX7KQ2M9RQ',
		parts: { actor: 'Alice', verb: 'created', entity_type: 'invoice', entity: 'inv_01HX7KQ2M9RQ', ...over },
	},
	...item,
});

describe('summary', () => {
	it('shortens a label that is just the raw id', () => {
		expect(entityTitle(mk())).toBe('inv_…Q2M9RQ');
		expect(summaryOf(mk(), t)).toBe('Alice created Invoice inv_…Q2M9RQ');
	});
	it('keeps a real label', () => {
		expect(entityTitle(mk({ entity: 'INV-00417' }))).toBe('INV-00417');
	});
	it('falls back to the short id when the label is empty', () => {
		expect(entityTitle(mk({ entity: '' }, { entity_label: '' }))).toBe('inv_…Q2M9RQ');
	});
	it('uses a readable actor name when the backend sent only the actor type', () => {
		expect(actorName(mk({ actor: 'system' }, { actor: { type: 'system', id: 'sys', label: '' } }), t)).toBe('System');
	});
	it('builds a sentence without a template and without the raw id', () => {
		const s = summaryOf(mk({ verb: 'voided' }), t);
		expect(s).toBe('Alice voided Invoice inv_…Q2M9RQ');
		expect(s).not.toContain('inv_01HX7KQ2M9RQ');
	});
});

describe('rowDetail', () => {
	const ch = (label: string) => ({ label, from: 1, to: 2, format: 'text' });
	const withChanges = (changes: ActivityItem['changes'], action = 'invoice.updated') => mk({}, { changes, action });

	it('counts the changes on an update, one or many', () => {
		expect(rowDetail(withChanges({ status: ch('Status') }))).toEqual({ kind: 'changes', count: 1 });
		expect(rowDetail(withChanges({ a: ch('A'), b: ch('B'), c: ch('C') }))).toEqual({ kind: 'changes', count: 3 });
	});
	it('counts changes on semantic actions too', () => {
		expect(rowDetail(withChanges({ status: ch('Status') }, 'subscription.paused'))).toEqual({ kind: 'changes', count: 1 });
	});
	it('says created and deleted, with no field detail', () => {
		expect(rowDetail(mk({}, { action: 'invoice.created', snapshot: { name: 'x' } }))).toEqual({ kind: 'created' });
		expect(rowDetail(mk({}, { action: 'invoice.deleted' }))).toEqual({ kind: 'deleted' });
	});
	it('shows nothing when there is nothing to say', () => {
		expect(rowDetail(mk({}, { action: 'invoice.updated' }))).toBeNull();
		expect(rowDetail(mk({}, { action: 'invoice.finalized' }))).toBeNull();
	});
});
