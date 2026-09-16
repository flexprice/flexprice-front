import { BaseModel } from './base';

export interface Event extends BaseModel {
	readonly timestamp: string;
	readonly customer_id: string;
	readonly event_name: string;
	readonly external_customer_id: string;
	readonly idempotency_key?: string;
	readonly properties: Record<string, any>;
	readonly source: string;
	/** When this raw row was ingested. Same-second rows can share the same second string. */
	readonly ingested_at?: string;
}
