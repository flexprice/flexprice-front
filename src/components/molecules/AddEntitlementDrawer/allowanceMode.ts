import {
	Entitlement,
	ENTITLEMENT_AGGREGATION_MODE,
	ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR,
	ENTITLEMENT_GRANT_DURATION_UNIT,
	ENTITLEMENT_GRANT_MEASURE,
	isUnlimitedGrant,
} from '@/models/Entitlement';

/**
 * How much of a metered feature is included. Every option produces a grant
 * config — a non-recurring allowance is simply one whose window is the billing
 * period. The legacy `usage_limit` / `usage_reset_period` pair is never sent.
 */
export type AllowanceMode = 'recurring' | 'period' | 'unlimited';

/**
 * Turn a saved entitlement into a form draft.
 *
 * The API omits `grant_quota` on an unlimited allowance, but within the form an
 * absent quota means "not typed yet". Normalising on the way in lets the draft
 * use `null` for unlimited without the two readings contradicting each other —
 * the table would say "Unlimited" while the drawer showed an empty
 * billing-period field it then refused to submit.
 */
export const toAllowanceDraft = (entitlement: Partial<Entitlement>): Partial<Entitlement> => ({
	grant_measure: entitlement.grant_measure,
	grant_quota: isUnlimitedGrant(entitlement) ? null : entitlement.grant_quota,
	grant_duration_value: entitlement.grant_duration_value,
	grant_duration_unit: entitlement.grant_duration_unit,
	grant_allocation_behavior: entitlement.grant_allocation_behavior,
	aggregation_mode: entitlement.aggregation_mode,
});

/** True when the draft asks for no ceiling. */
export const isUnlimitedDraft = (value: Partial<Entitlement>): boolean => value.grant_quota === null;

/**
 * Turning "no limit" on clears the quota and pins the window to the billing
 * cycle — an unlimited hourly window would open hundreds of rows a month to
 * track a balance that can never run out, and the API rejects it.
 */
export const setUnlimited = (
	unlimited: boolean,
	restoreUnit: ENTITLEMENT_GRANT_DURATION_UNIT = ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
): Partial<Entitlement> =>
	unlimited
		? {
				grant_quota: null,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
				grant_duration_value: undefined,
				grant_allocation_behavior: undefined,
			}
		: {
				grant_quota: undefined,
				grant_duration_unit: restoreUnit,
				grant_duration_value: restoreUnit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD ? undefined : 1,
				grant_allocation_behavior:
					restoreUnit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD
						? undefined
						: ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE,
			};

/**
 * Changing the refresh period. A cycle-length window carries neither a duration
 * value nor an anchor, so both are cleared rather than left half-set.
 */
export const setPeriod = (value: Partial<Entitlement>, unit: ENTITLEMENT_GRANT_DURATION_UNIT): Partial<Entitlement> =>
	unit === ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD
		? { grant_duration_unit: unit, grant_duration_value: undefined, grant_allocation_behavior: undefined }
		: {
				grant_duration_unit: unit,
				// The form offers a cadence, not a multiple of one: a window is always a
				// single hour/day/week. Multi-unit windows stay an API-only shape.
				grant_duration_value: 1,
				grant_allocation_behavior: value.grant_allocation_behavior ?? ENTITLEMENT_GRANT_ALLOCATION_BEHAVIOR.FIRST_USAGE,
			};

/**
 * Unlimited is the absence of a ceiling. Within a draft, `null` means
 * deliberately unlimited and `undefined` means the field is simply empty — an
 * ordinary billing-period allowance not filled in yet. Loaded entities must pass
 * through toAllowanceDraft first.
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
				// Keep a unit the user already chose; only a cycle-length window has
				// no hour/day/week equivalent to carry back.
				grant_duration_unit:
					value.grant_duration_unit && value.grant_duration_unit !== ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD
						? value.grant_duration_unit
						: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
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
