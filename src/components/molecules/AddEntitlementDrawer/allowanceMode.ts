import {
	Entitlement,
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
} from '@/models/Entitlement';

/**
 * How much of a metered feature is included. Every option produces a grant
 * config — a non-recurring allowance is simply one whose window is the billing
 * period. The legacy `usage_limit` / `usage_reset_period` pair is never sent.
 */
export type AllowanceMode = 'recurring' | 'period' | 'unlimited';

/**
 * Unlimited is the absence of a ceiling. `null` means deliberately unlimited;
 * `undefined` means the field is simply empty, which is an ordinary
 * billing-period allowance the user has not filled in yet. Conflating the two
 * makes the radio jump to Unlimited the moment "Once per billing period" is
 * picked, and submits an unlimited entitlement.
 */
export const deriveAllowanceMode = (value: Partial<Entitlement>): AllowanceMode => {
	if (value.grant_duration_unit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD) {
		return value.grant_quota === null ? 'unlimited' : 'period';
	}
	return 'recurring';
};

/**
 * Field values for a mode. Switching modes rewrites the whole grant config, so a
 * half-set combination — an hourly window with no duration, say — can never be
 * submitted.
 */
export const patchForMode = (mode: AllowanceMode, value: Partial<Entitlement>): Partial<Entitlement> => {
	const measure = value.grant_measure ?? ENTITLEMENT_GRANT_MEASURE.QUANTITY;
	const aggregation = value.aggregation_mode ?? ENTITLEMENT_AGGREGATION_MODE.ADDITIVE;
	const legacyCleared = { usage_limit: undefined, usage_reset_period: undefined };

	switch (mode) {
		case 'recurring':
			return {
				...legacyCleared,
				grant_measure: measure,
				grant_quota: value.grant_quota ?? undefined,
				grant_duration_value: value.grant_duration_value ?? 1,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
				grant_allocation_behavior: value.grant_allocation_behavior ?? ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE,
				aggregation_mode: aggregation,
			};
		case 'period':
			return {
				...legacyCleared,
				grant_measure: measure,
				grant_quota: value.grant_quota ?? undefined,
				// A cycle-length window has no duration value and no anchor to choose.
				grant_duration_value: undefined,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
				grant_allocation_behavior: undefined,
				aggregation_mode: aggregation,
			};
		case 'unlimited':
			return {
				...legacyCleared,
				grant_measure: measure,
				grant_quota: null,
				grant_duration_value: undefined,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
				grant_allocation_behavior: undefined,
				aggregation_mode: aggregation,
			};
	}
};
