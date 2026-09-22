import { Event } from '@/models/Event';
import { EventLookupItem } from '@/types/dto';

export function toEventLookupItem(event: Event): EventLookupItem {
	return {
		id: event.id,
		external_customer_id: event.external_customer_id,
		customer_id: event.customer_id,
		event_name: event.event_name,
		timestamp: event.timestamp,
		ingested_at: event.ingested_at,
		properties: event.properties ?? {},
		source: event.source,
		environment_id: event.environment_id,
	};
}

/**
 * Prefer `events[]` from lookup. Fall back to the legacy top-level `event`
 * when the array is missing or empty (old API / old backend).
 */
export function getEventLookupVersions(events: EventLookupItem[] | undefined, fallbackEvent: Event | null | undefined): EventLookupItem[] {
	if (events && events.length > 0) {
		return events;
	}
	if (fallbackEvent) {
		return [toEventLookupItem(fallbackEvent)];
	}
	return [];
}
