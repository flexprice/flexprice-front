import { BaseModel } from './base';

export interface Meter extends BaseModel {
	readonly aggregation: {
		field: string;
		expression?: string;
		type: METER_AGGREGATION_TYPE;
		multiplier?: number;
		bucket_size?: BUCKET_SIZE;
		group_by?: string;
	};
	readonly event_name: string;
	readonly filters: Array<{
		key: string;
		values: string[];
	}>;
	readonly name: string;
	readonly reset_usage: METER_USAGE_RESET_PERIOD;
}

export enum METER_USAGE_RESET_PERIOD {
	NEVER = 'NEVER',
	BILLING_PERIOD = 'BILLING_PERIOD',
}

export enum METER_AGGREGATION_TYPE {
	SUM = 'SUM',
	COUNT = 'COUNT',
	COUNT_UNIQUE = 'COUNT_UNIQUE',
	LATEST = 'LATEST',
	SUM_WITH_MULTIPLIER = 'SUM_WITH_MULTIPLIER',
	MAX = 'MAX',
	WEIGHTED_SUM = 'WEIGHTED_SUM',
	AVG = 'AVG',
}

export enum BUCKET_SIZE {
	WindowSizeMinute = 'MINUTE',
	WindowSize15Min = '15MIN',
	WindowSize30Min = '30MIN',
	WindowSizeHour = 'HOUR',
	WindowSize3Hour = '3HOUR',
	WindowSize6Hour = '6HOUR',
	WindowSize12Hour = '12HOUR',
	WindowSizeDay = 'DAY',
	WindowSizeWeek = 'WEEK',
	WindowSizeMonth = 'MONTH',
}

/**
 * BUCKET_SIZE restricted to the values the backend accepts for price.bucket_size - WEEK/MONTH are
 * meter-only historical values, never valid at the price level (matches priceBucketSizeOptions in
 * @/constants/constants). Use this instead of the full BUCKET_SIZE for price-level request/override
 * fields so invalid values are caught at compile time, not just filtered out of the UI.
 */
export type PriceBucketSize = Exclude<BUCKET_SIZE, BUCKET_SIZE.WindowSizeWeek | BUCKET_SIZE.WindowSizeMonth>;
