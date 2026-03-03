import { Price } from './Price';
import { Meter, METER_AGGREGATION_TYPE } from './Meter';
import { Feature } from './Feature';
import { LineItem as SubscriptionLineItem } from './Subscription';
import { Plan } from './Plan';
import Addon from './Addon';

// WindowSize enum matching backend types
export enum WindowSize {
	MINUTE = 'MINUTE',
	FIFTEEN_MIN = '15MIN',
	THIRTY_MIN = '30MIN',
	HOUR = 'HOUR',
	THREE_HOUR = '3HOUR',
	SIX_HOUR = '6HOUR',
	TWELVE_HOUR = '12HOUR',
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
}

// UsageAnalyticPoint represents a point in the time series data
export interface UsageAnalyticPoint {
	timestamp: string;
	usage: number;
	cost: number;
	event_count: number;
}

// UsageAnalyticItem represents a single analytic item in the response
export interface UsageAnalyticItem {
	feature_id: string;
	price_id?: string;
	meter_id?: string;
	sub_line_item_id?: string;
	subscription_id?: string;
	price?: Price;
	meter?: Meter;
	feature?: Feature;
	subscription_line_item?: SubscriptionLineItem;
	plan?: Plan;
	addon?: Addon;
	name?: string;
	event_name?: string;
	source?: string;
	unit?: string;
	unit_plural?: string;
	aggregation_type?: METER_AGGREGATION_TYPE;
	total_usage: number;
	/** When set (and reporting_unit is not null), display this instead of formatted total_usage + unit */
	total_usage_display?: string;
	reporting_unit?: { unit_singular?: string; unit_plural?: string; conversion_rate?: string } | null;
	total_cost: number;
	currency?: string;
	event_count: number;
	properties?: Record<string, string>;
	points?: UsageAnalyticPoint[];
	add_on_id?: string;
	plan_id?: string;
}
