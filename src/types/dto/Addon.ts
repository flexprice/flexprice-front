import { Pagination, Addon, Metadata, Price, Entitlement } from '@/models';
import type { OverrideLineItemRequest } from './Subscription';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { QueryFilter, TimeRangeFilter } from './base';
import { FilterCondition } from '../common/QueryBuilder';
import { SortOption } from '../common/QueryBuilder';
import { LineItemCommitmentsMap } from './LineItemCommitmentConfig';

export enum ADDON_CADENCE {
	ONETIME = 'onetime',
	RECURRING = 'recurring',
}

export enum ADDON_PRORATION_BEHAVIOR {
	CREATE_PRORATIONS = 'create_prorations',
	NONE = 'none',
}

/** When an addon attach takes effect (request `change_at`). Mutually exclusive with `start_date`. */
export enum ADDON_CHANGE_AT {
	IMMEDIATE = 'immediate',
	END_OF_PERIOD = 'end_of_period',
}

/** UI-only timing for an addon attach or removal: a named `change_at`, or a custom date (`start_date` / `effective_date`). */
export enum ADDON_CHANGE_TIMING {
	IMMEDIATE = 'immediate',
	END_OF_PERIOD = 'end_of_period',
	CUSTOM = 'custom',
}

export interface ExtendedAddon extends Addon {
	prices: Price[];
	entitlements: Entitlement[];
}

export interface CreateAddonRequest {
	name: string;
	lookup_key: string;
	description?: string;
	metadata?: Metadata;
}

export interface AddonResponse extends Addon {
	prices: Price[];
	entitlements: Entitlement[];
}

export interface UpdateAddonRequest {
	name?: string;
	description?: string;
	metadata?: Metadata;
}

export interface AddAddonToSubscriptionRequest {
	addon_id: string;
	start_date?: string;
	cadence?: ADDON_CADENCE;
	proration_behavior?: ADDON_PRORATION_BEHAVIOR;
	metadata?: Metadata;
	line_item_commitments?: LineItemCommitmentsMap;
	// Per-price overrides for this addon's prices (price_id must belong to the addon).
	override_line_items?: OverrideLineItemRequest[];
}

export interface GetAddonsPayload {
	end_time?: string;
	expand?: string;
	addon_ids?: string[];
	limit?: number;
	lookup_key?: string;
	offset?: number;
	order?: string;
	sort?: string;
	start_time?: string;
	status?: string;
	lookup_keys?: string[];
}

export interface GetAddonsResponse extends Pagination {
	items: AddonResponse[];
	pagination: Pagination;
}

export interface GetAddonByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

export interface AddonFilter extends Omit<QueryFilter, 'sort'>, TimeRangeFilter {
	filters?: FilterCondition[];
	sort?: SortOption[];
	addon_ids?: string[];
	lookup_keys?: string[];
}
