import { ACTIVITY_ACTIONS } from '@/constants/activity';
import { ActivityQuery } from '@/types/dto/ActivityLog';

export interface ActivityFilterState {
	entityType: string;
	entityId: string;
	actorType: string;
	action: string;
	start?: Date;
	end?: Date;
	customerId: string;
	requestId: string;
}

/** Radix Select forbids '' as an item value; "Any" uses this sentinel and maps to ''. */
export const ANY = '__any';
export const SEARCHABLE_ENTITY_TYPES = ['customer', 'plan'] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export const defaultFilters = (
	seed: { customerId?: string | null; requestId?: string | null } = {},
	now: Date = new Date(),
): ActivityFilterState => ({
	entityType: '',
	entityId: '',
	actorType: '',
	action: '',
	start: new Date(now.getTime() - 30 * DAY_MS),
	end: undefined,
	customerId: seed.customerId ?? '',
	requestId: seed.requestId ?? '',
});

export const withEntityType = (f: ActivityFilterState, entityType: string): ActivityFilterState => ({
	...f,
	entityType,
	entityId: '',
	action: f.action && entityType && !f.action.startsWith(`${entityType}.`) ? '' : f.action,
});

export const withRange = (f: ActivityFilterState, start?: Date, end?: Date): ActivityFilterState => ({
	...f,
	start,
	end: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : undefined,
});

export const actionsFor = (entityType: string, all: readonly string[]): string[] =>
	entityType ? all.filter((a) => a.startsWith(`${entityType}.`)) : [...all];

/** The query for "this entity type, any record": the API rejects entity_type alone, so it filters by the type's actions. */
export const entityTypeQuery = (entityType: string): Partial<ActivityQuery> => {
	const actions = entityType ? actionsFor(entityType, ACTIVITY_ACTIONS) : [];
	return actions.length ? { actions } : {};
};

/** A type with no known actions can't be filtered type-only (the API needs entity_type + entity_id together). */
export const needsEntity = (f: ActivityFilterState): boolean =>
	!!f.entityType && !f.entityId && !f.action && actionsFor(f.entityType, ACTIVITY_ACTIONS).length === 0;

export const filtersToQuery = (f: ActivityFilterState): Partial<ActivityQuery> => {
	const q: Partial<ActivityQuery> = {};
	// The API rejects entity_type without entity_id (400), so a type-only filter becomes that type's actions.
	if (f.entityType && f.entityId) {
		q.entity_type = f.entityType;
		q.entity_id = f.entityId;
	}
	if (f.actorType) q.actor_type = f.actorType;
	if (f.action) q.actions = [f.action];
	else if (f.entityType && !f.entityId) Object.assign(q, entityTypeQuery(f.entityType));
	if (f.start) q.start_time = f.start.toISOString();
	if (f.end) q.end_time = f.end.toISOString();
	if (f.customerId) q.customer_id = f.customerId;
	if (f.requestId) q.request_id = f.requestId;
	return q;
};
