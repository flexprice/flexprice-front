/**
 * Customer Portal Constants
 * Shared constants and utilities for customer portal components
 */

import type { UsageGraphConfig } from '@/types/dto/PortalConfig';

export enum CustomerPortalTimePeriod {
	ONE_DAY = '1d',
	SEVEN_DAYS = '7d',
	THIRTY_DAYS = '30d',
}

export type TimePeriod = CustomerPortalTimePeriod;

/**
 * Maps time period enum values to number of days
 */
export const TIME_PERIOD_DAYS_MAP: Record<CustomerPortalTimePeriod, number> = {
	[CustomerPortalTimePeriod.ONE_DAY]: 1,
	[CustomerPortalTimePeriod.SEVEN_DAYS]: 7,
	[CustomerPortalTimePeriod.THIRTY_DAYS]: 30,
};

/**
 * Array of all available time periods for iteration
 */
export const TIME_PERIODS: CustomerPortalTimePeriod[] = [
	CustomerPortalTimePeriod.ONE_DAY,
	CustomerPortalTimePeriod.SEVEN_DAYS,
	CustomerPortalTimePeriod.THIRTY_DAYS,
];

/**
 * Default time period for customer portal components
 */
export const DEFAULT_TIME_PERIOD: CustomerPortalTimePeriod = CustomerPortalTimePeriod.SEVEN_DAYS;

/**
 * Calculates the date range based on a time period
 * @param period - The time period enum value
 * @returns Object with start_time and end_time as ISO strings
 */
export const calculateTimeRange = (period: CustomerPortalTimePeriod): { start_time: string; end_time: string } => {
	const endDate = new Date();
	const startDate = new Date();
	const days = TIME_PERIOD_DAYS_MAP[period];

	startDate.setDate(startDate.getDate() - days);

	return {
		start_time: startDate.toISOString(),
		end_time: endDate.toISOString(),
	};
};

// Shared by TabRenderer and SectionContent: SectionContent falls back to the same defaults when a section has a
// metric_cards tab but no usage_graph tab to source date-filter config from.
export const DEFAULT_USAGE_GRAPH_CONFIG: UsageGraphConfig = {
	date_presets: ['last_7_days', 'last_30_days'],
	default_preset: 'last_7_days',
	allow_custom_date_range: false,
	feature_filter_mode: 'all',
};
