import { BaseModel, Metadata } from './base';

// Present when the addon was fetched with `expand=price_sync_status`.
// unsynced_association_count is 0, and synced is true, once every active
// recurring association has caught up with this addon's current usage prices.
export interface AddonPriceSyncStatus {
	readonly current_sequence: number;
	readonly unsynced_association_count: number;
	readonly synced: boolean;
}

interface Addon extends BaseModel {
	readonly name: string;
	readonly description: string;
	readonly lookup_key: string;
	readonly metadata: Metadata;
	readonly price_sync_status?: AddonPriceSyncStatus;
}

export default Addon;
