import { Entitlement, ENTITLEMENT_AGGREGATION_MODE, ENTITLEMENT_ENTITY_TYPE, ENTITLEMENT_GRANT_MEASURE } from '@/models/Entitlement';
import { FEATURE_TYPE } from '@/models/Feature';
import { CreateEntitlementRequest } from '@/types/dto/Entitlement';

interface Target {
	planId?: string;
	entityType: ENTITLEMENT_ENTITY_TYPE;
	entityId: string;
}

/**
 * Build the API payload for one drafted entitlement.
 *
 * Metered features send grant config and nothing else — the legacy
 * `usage_limit` / `usage_reset_period` / `is_soft_limit` trio is never sent for
 * them. Omitting `grant_quota` is what makes an allowance unlimited, so a
 * bounded allowance whose quota failed to reach this function is silently
 * created as unlimited; that is why the mapping lives here with tests.
 */
export const toCreateEntitlementRequest = (entitlement: Partial<Entitlement>, target: Target): CreateEntitlementRequest => {
	const base: CreateEntitlementRequest = {
		plan_id: target.planId,
		feature_id: entitlement.feature_id!,
		feature_type: entitlement.feature_type! as FEATURE_TYPE,
		is_enabled: entitlement.is_enabled,
		static_value: entitlement.static_value,
		config_value: entitlement.config_value ?? undefined,
		entity_type: target.entityType,
		entity_id: target.entityId,
	};

	if (entitlement.feature_type !== FEATURE_TYPE.METERED) return base;

	return {
		...base,
		// HasGrantConfig() on the server trips on ANY grant field, so a config
		// missing only its measure is rejected outright. Default the two fields the
		// form shows but the user may never touch.
		grant_measure: entitlement.grant_measure ?? ENTITLEMENT_GRANT_MEASURE.QUANTITY,
		// null means "deliberately unlimited" and must reach the API as an absent
		// field; undefined means the user never filled it in and validation stops
		// the submit before this point.
		grant_quota: entitlement.grant_quota ?? undefined,
		grant_duration_value: entitlement.grant_duration_value ?? undefined,
		grant_duration_unit: entitlement.grant_duration_unit,
		grant_allocation_behavior: entitlement.grant_allocation_behavior,
		aggregation_mode: entitlement.aggregation_mode ?? ENTITLEMENT_AGGREGATION_MODE.ADDITIVE,
	};
};
