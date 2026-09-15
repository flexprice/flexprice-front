import { Entitlement } from '@/models/Entitlement';
import { deriveAllowanceMode } from './allowanceMode';

/** The allowance fields an override request carries. */
export interface GrantOverrideFields {
	grant_measure?: Entitlement['grant_measure'];
	grant_unlimited?: boolean;
	grant_quota?: string;
	grant_duration_value?: number;
	grant_duration_unit?: Entitlement['grant_duration_unit'];
	grant_allocation_behavior?: Entitlement['grant_allocation_behavior'];
	aggregation_mode?: Entitlement['aggregation_mode'];
}

/**
 * Turn a form draft into the allowance half of an override request.
 *
 * Returns null when the draft is incomplete, so the caller can surface the error
 * rather than send a partial config — the server treats ANY grant field as
 * "this row is grant-backed", so a config missing only its quota would be
 * rejected outright, and one missing only its measure rejected for a different
 * reason again.
 */
export const toGrantOverrideFields = (draft: Partial<Entitlement>): GrantOverrideFields | null => {
	const unlimited = deriveAllowanceMode(draft) === 'unlimited';
	if (!unlimited && (draft.grant_quota == null || draft.grant_quota === '')) return null;

	return {
		grant_measure: draft.grant_measure ?? undefined,
		// null is the draft's "deliberately unlimited". The API wants the quota
		// absent AND the intent stated, so a dropped field cannot quietly create a
		// feature that never bills.
		grant_unlimited: unlimited || undefined,
		grant_quota: unlimited ? undefined : (draft.grant_quota ?? undefined),
		grant_duration_value: draft.grant_duration_value ?? undefined,
		grant_duration_unit: draft.grant_duration_unit,
		grant_allocation_behavior: draft.grant_allocation_behavior,
		aggregation_mode: draft.aggregation_mode,
	};
};
