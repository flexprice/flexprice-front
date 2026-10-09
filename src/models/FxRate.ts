export type FxRateScope = 'tenant' | 'customer' | 'subscription';
export type FxRateSource = 'fixed' | 'market';

/** An FX rate row from /forex. `to_amount = from_amount × rate`. */
export interface FxRate {
	readonly id: string;
	readonly environment_id: string;
	readonly scope: FxRateScope;
	readonly scope_id: string;
	readonly from_currency: string;
	readonly to_currency: string;
	readonly rate: string;
	readonly source: FxRateSource;
	readonly start_date?: string | null;
	readonly end_date?: string | null;
	readonly metadata?: Record<string, string> | null;
	readonly status: string;
	readonly created_at: string;
	readonly updated_at: string;
}
