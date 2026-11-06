import { METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';
import { CreateMeterRequest, MeterFilter } from '@/types/dto';

/**
 * Trims event filter keys and values, and drops any filter that has no
 * meaningful key or no remaining values once trimmed. Used when building the
 * meter payload so stray leading/trailing whitespace typed into the UI never
 * reaches the API.
 */
export const sanitizeMeterFilters = (filters?: Array<{ key: string; values: string[] }>): MeterFilter[] => {
	return (filters || [])
		.map((filter) => ({
			key: (filter.key ?? '').trim(),
			values: (filter.values ?? []).map((value) => value.trim()).filter((value) => value !== ''),
		}))
		.filter((filter) => filter.key !== '' && filter.values.length > 0);
};

/**
 * Builds the CreateMeterRequest payload sent to the API from the in-progress
 * feature form state, trimming leading/trailing whitespace from the event
 * name, aggregation field, custom expression, and event filter keys/values so
 * no accidental whitespace is persisted server-side.
 */
export const buildMeterRequest = (meter: Partial<CreateMeterRequest> | undefined, fallbackName: string): CreateMeterRequest | undefined => {
	if (!meter) return undefined;

	const trimmedExpression = meter.aggregation?.expression?.trim();

	return {
		name: meter.name || fallbackName || '',
		event_name: meter.event_name?.trim() || '',
		aggregation: {
			type: meter.aggregation?.type || METER_AGGREGATION_TYPE.SUM,
			// XOR with field — the toggle handler clears the inactive side,
			// so at most one of these is populated at submit time.
			...(trimmedExpression ? { expression: trimmedExpression } : { field: meter.aggregation?.field?.trim() || '' }),
			multiplier: meter.aggregation?.multiplier,
			group_by: meter.aggregation?.group_by,
		},
		reset_usage: meter.reset_usage || METER_USAGE_RESET_PERIOD.BILLING_PERIOD,
		filters: sanitizeMeterFilters(meter.filters),
	};
};
