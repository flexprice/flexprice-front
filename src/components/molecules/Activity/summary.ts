import type { TFunction } from 'i18next';
import { ActivityItem } from '@/types/dto/ActivityLog';
import { shortId } from './entityRegistry';

/** Entity text for a title: the label, or the short id when the label is missing or is the raw id. */
export const entityTitle = (it: Pick<ActivityItem, 'entity_id' | 'entity_label' | 'display'>): string => {
	const label = it.display.parts.entity || it.entity_label;
	return !label || label === it.entity_id ? shortId(it.entity_id) : label;
};

/** The backend falls back to the actor type when it has no label; show the translated type instead. */
export const actorName = (it: Pick<ActivityItem, 'actor' | 'display'>, t: TFunction): string => {
	const fromParts = it.display.parts.actor;
	if (fromParts && fromParts !== it.actor.type) return fromParts;
	return it.actor.label || t(`actor.${it.actor.type}`, { defaultValue: it.actor.type.replace(/_/g, ' ') });
};

export const summaryOf = (it: ActivityItem, t: TFunction): string => {
	const p = it.display.parts;
	const entityType = t(`entity.${p.entity_type}`, { defaultValue: p.entity_type.replace(/_/g, ' ') });
	const actor = actorName(it, t);
	const entity = entityTitle(it);
	return t(`verb.${p.verb}`, {
		actor,
		entity,
		entityType,
		defaultValue: `${actor} ${p.verb.replace(/_/g, ' ')} ${entityType} ${entity}`,
	});
};

export type RowDetail = { kind: 'changes'; count: number } | { kind: 'created' } | { kind: 'deleted' };

/** The one-line "what happened" under a row's title: a change count, or Created / Deleted. Detail lives in the sheet. */
export const rowDetail = (it: Pick<ActivityItem, 'action' | 'changes'>): RowDetail | null => {
	const count = Object.keys(it.changes ?? {}).length;
	if (count > 0) return { kind: 'changes', count };
	const verb = it.action.slice(it.action.lastIndexOf('.') + 1);
	if (verb === 'created') return { kind: 'created' };
	if (verb === 'deleted') return { kind: 'deleted' };
	return null;
};
