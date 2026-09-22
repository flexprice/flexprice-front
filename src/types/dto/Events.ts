import { Event, WindowSize, UsageAnalyticItem } from '@/models';

export type EventDebugStatus = 'processed' | 'processing' | 'failed';
export type DebugTrackerStatus = 'unprocessed' | 'found' | 'not_found' | 'error' | 'processing' | 'attributed';

export interface EventDebugErrorDetail {
	message: string;
	internal_error?: string;
	details?: Record<string, any>;
}

export interface EventDebugErrorResponse {
	success: boolean;
	error: EventDebugErrorDetail;
}

export interface EventProcessedEvent {
	customer_id: string;
	subscription_id: string;
	sub_line_item_id: string;
	price_id: string;
	meter_id: string;
	feature_id: string;
	qty_total: string;
	processed_at?: string;
}

/** One raw `events` row from GET /events/lookup. Newest `ingested_at` first. */
export interface EventLookupItem {
	id: string;
	external_customer_id: string;
	customer_id: string;
	event_name: string;
	timestamp: string;
	ingested_at?: string;
	properties: Record<string, unknown>;
	source: string;
	environment_id: string;
	idempotency_key?: string;
}

export interface EventDebugCustomerLookupResult {
	status: DebugTrackerStatus;
	customer?: {
		id: string;
		external_customer_id: string;
	};
	error?: EventDebugErrorResponse;
}

export interface EventDebugMeterMatchingResult {
	status: DebugTrackerStatus;
	matched_meters?: Array<{
		meter_id: string;
		event_name: string;
		meter?: Record<string, any>;
		filters?: Array<Record<string, any>>;
	}>;
	error?: EventDebugErrorResponse;
}

export interface EventDebugPriceLookupResult {
	status: DebugTrackerStatus;
	matched_prices?: Array<{
		price_id: string;
		meter_id: string;
		status?: string;
		price?: Record<string, any>;
	}>;
	error?: EventDebugErrorResponse;
}

export interface EventDebugSubscriptionLineItemLookupResult {
	status: DebugTrackerStatus;
	matched_line_items?: Array<{
		sub_line_item_id: string;
		subscription_id: string;
		price_id: string;
		start_date?: string;
		end_date?: string;
		is_active_for_event?: boolean;
		timestamp_within_range?: boolean;
		subscription_line_item?: Record<string, any>;
	}>;
	error?: EventDebugErrorResponse;
}

export interface MeterUsageAttribution {
	meter_id: string;
	external_customer_id: string;
	qty_total: string;
}

export interface EventDebugAttributedToCustomerResult {
	status: DebugTrackerStatus;
	meter_usage?: MeterUsageAttribution;
	error?: EventDebugErrorResponse;
}

export interface EventDebugFailurePoint {
	failure_point_type:
		| 'customer_lookup'
		| 'meter_lookup'
		| 'price_lookup'
		| 'subscription_line_item_lookup'
		| 'attributed_to_customer'
		| null;
	error?: EventDebugErrorResponse;
}

export interface EventDebugTracker {
	customer_lookup: EventDebugCustomerLookupResult;
	meter_matching: EventDebugMeterMatchingResult;
	price_lookup: EventDebugPriceLookupResult;
	subscription_line_item_lookup: EventDebugSubscriptionLineItemLookupResult;
	attributed_to_customer?: EventDebugAttributedToCustomerResult;
	failure_point?: EventDebugFailurePoint;
}

export interface GetEventDebugResponse {
	/** Newest raw row. Compat only — prefer `events[]` for the details pane. */
	event: Event;
	/** All raw `events` rows for this id, max 50, newest `ingested_at` first. */
	events?: EventLookupItem[];
	status: EventDebugStatus;
	processed_events?: EventProcessedEvent[];
	debug_tracker?: EventDebugTracker;
}

export interface GetEventsPayload {
	external_customer_id?: string;
	event_name?: string;
	start_time?: string;
	end_time?: string;
	iter_first_key?: string;
	iter_last_key?: string;
	page_size?: number;
	event_id?: string;
	source?: string;
	/** Semicolon-separated key:value list for GET, e.g. "gpu_type:nvidia-h100;gpu_mins:1;" */
	property_filters?: string;
}

// Request for POST /events/query
export interface GetEventsRequest {
	external_customer_id?: string;
	event_name?: string;
	event_id?: string;
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	iter_first_key?: string;
	iter_last_key?: string;
	property_filters?: Record<string, string[]>;
	page_size?: number;
	offset?: number;
	source?: string;
	sort?: string; // "timestamp" | "event_name"
	order?: string; // "asc" | "desc"
}

export interface GetEventsResponse {
	events: Event[];
	has_more: boolean;
	iter_first_key?: string;
	iter_last_key?: string;
	total_count?: number;
	offset?: number;
}

export interface GetUsageByMeterPayload {
	meter_id: string;
	end_time?: string;
	start_time?: string;
	external_customer_id?: string;
	filters?: Record<string, string[]>;
	window_size?: string;
}

export interface GetUsageByMeterResponse {
	type: string;
	event_name: string;
	results: {
		window_size: string;
		value: number;
	}[];
}

export interface FireEventsPayload {
	customer_id?: string;
	subscription_id?: string;
	feature_id?: string;
	duration?: number;
	amount?: number;
}

// Analytics DTOs
export interface GetUsageAnalyticsRequest {
	/** Single customer; use with include_children or as the only selector (backend merges with external_customer_ids when both set). */
	external_customer_id?: string;
	feature_ids?: string[];
	sources?: string[];
	start_time?: string;
	end_time?: string;
	group_by?: string[]; // allowed values: "source", "feature_id", "properties.<field_name>"
	window_size?: WindowSize;
	expand?: string[]; // allowed values: "price", "meter", "feature", "subscription_line_item","plan","addon"
	property_filters?: Record<string, string[]>;
	/** When true, aggregates usage from child customers linked via subscription hierarchy (V2 analytics pipeline). */
	include_children?: boolean;
}

export interface CustomAnalyticItem {
	id: string;
	name: string;
	feature_name: string;
	value: string;
	type: string;
}

export interface GetUsageAnalyticsResponse {
	total_cost: number;
	currency: string;
	items: UsageAnalyticItem[];
	custom_analytics?: CustomAnalyticItem[];
}

// Monitoring DTOs
export interface GetMonitoringDataRequest {
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	window_size?: WindowSize;
}

export interface EventCountPoint {
	timestamp: string; // ISO 8601 format
	event_count: number;
}

export interface GetMonitoringDataResponse {
	total_count: number;
	consumption_lag: number;
	post_processing_lag: number;
	points?: EventCountPoint[];
}

// Usage DTOs for POST /events/usage
export interface GetUsageRequest {
	external_customer_id?: string;
	customer_id?: string;
	event_name: string;
	property_name?: string; // will be empty/ignored in case of COUNT
	aggregation_type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	window_size?: WindowSize;
	bucket_size?: WindowSize; // Optional, only used for MAX aggregation with windowing
	filters?: Record<string, string[]>;
	multiplier?: string; // Decimal as string
	billing_anchor?: string; // ISO 8601 format - for custom monthly billing periods
}

export interface UsageResult {
	window_size: string; // ISO 8601 format
	value: number;
}

export interface GetUsageResponse {
	results?: UsageResult[];
	value?: number;
	event_name: string;
	type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

// HuggingFace Billing DTOs
export interface GetHuggingFaceBillingDataRequest {
	requestIds: string[]; // Array of event IDs
}

export interface EventCostInfo {
	requestId: string;
	costNanoUsd: string; // Decimal as string
}

export interface GetHuggingFaceBillingDataResponse {
	requests: EventCostInfo[];
}
