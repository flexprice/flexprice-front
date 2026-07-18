import type { EventTypeOut } from 'svix';

export interface EventTypeGroup {
	name: string;
	eventTypes: EventTypeOut[];
}

/** Groups event types by the prefix before the first `.` (e.g. "checkout.session.completed" -> "checkout.session"). */
export const groupEventTypesByPrefix = (eventTypes: EventTypeOut[]): EventTypeGroup[] => {
	const byGroup = new Map<string, EventTypeOut[]>();
	for (const eventType of eventTypes) {
		const group = eventType.name.split('.').slice(0, -1).join('.') || eventType.name;
		if (!byGroup.has(group)) byGroup.set(group, []);
		byGroup.get(group)!.push(eventType);
	}
	return Array.from(byGroup.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, types]) => ({ name, eventTypes: types }));
};
