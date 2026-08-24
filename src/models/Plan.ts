import { BaseModel, Metadata } from './base';

// Present when the plan was fetched with `expand=price_sync_status`.
// unsynced_subscription_count is 0, and synced is true, once every eligible
// subscription has caught up with this plan's current prices.
export interface PlanPriceSyncStatus {
	readonly current_sequence: number;
	readonly unsynced_subscription_count: number;
	readonly synced: boolean;
}

export interface Plan extends BaseModel {
	readonly description: string;
	readonly lookup_key: string;
	readonly name: string;
	readonly metadata?: Metadata;
	readonly display_order?: number;
	readonly price_sync_status?: PlanPriceSyncStatus;
}
