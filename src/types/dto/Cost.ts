import { Meter, Price, Pagination } from '@/models';

export interface GetCostAnalyticsRequest {
	// Time range fields (optional - defaults to last 7 days if not provided)
	start_time?: string;
	end_time?: string;

	// Optional filters
	external_customer_id?: string; // Optional - for specific customer

	// Additional filters
	feature_ids?: string[];

	// Expand options - specify which entities to expand
	expand?: string[]; // "meter", "price"

	/** When true, aggregates cost from child customers linked via subscription hierarchy. */
	include_children?: boolean;

	// Pagination
	limit?: number;
	offset?: number;
}

export interface CostPoint {
	timestamp: string;
	cost: string; // decimal.Decimal represented as string
	quantity: string; // decimal.Decimal represented as string
	event_count: number;
}

export interface CostAnalyticItem {
	meter_id: string;
	meter_name?: string;
	source?: string;
	customer_id?: string;
	external_customer_id?: string;
	properties?: Record<string, string>;

	// Aggregated metrics
	total_cost: string; // decimal.Decimal represented as string
	total_quantity: string; // decimal.Decimal represented as string
	total_events: number;

	// Breakdown
	cost_by_period?: CostPoint[]; // Time-series

	// Metadata
	currency: string;
	price_id?: string;
	costsheet_id?: string;

	// Expanded data (populated when expand options are specified)
	meter?: Meter;
	price?: Price;
}

export interface GetCostAnalyticsResponse {
	customer_id?: string;
	external_customer_id?: string;
	costsheet_id?: string;
	start_time: string;
	end_time: string;
	currency: string;

	// Summary
	total_cost: string; // decimal.Decimal represented as string
	total_quantity: string; // decimal.Decimal represented as string
	total_events: number;

	// Detailed breakdown
	cost_analytics: CostAnalyticItem[];

	// Time-series (if requested)
	cost_time_series?: CostPoint[];

	// Pagination
	pagination?: Pagination;
}

// GetDetailedCostAnalyticsResponse represents the response for combined cost and revenue analytics
export interface GetDetailedCostAnalyticsResponse {
	// Cost analytics array (flattened from nested structure)
	cost_analytics: CostAnalyticItem[];

	// Derived metrics
	total_revenue: string; // decimal.Decimal represented as string
	total_cost: string; // decimal.Decimal represented as string
	margin: string; // decimal.Decimal represented as string (Revenue - Cost)
	margin_percent: string; // decimal.Decimal represented as string ((Margin / Revenue) * 100)
	roi: string; // decimal.Decimal represented as string ((Revenue - Cost) / Cost)
	roi_percent: string; // decimal.Decimal represented as string (ROI * 100)

	// Set when cost could not be computed; cost, margin and ROI are then zero placeholders
	cost_unavailable_reason?: string;

	currency: string;
	start_time: string;
	end_time: string;
}
