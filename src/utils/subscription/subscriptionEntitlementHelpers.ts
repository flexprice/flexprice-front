import { EntitlementResponse } from '@/types/dto/Entitlement';
import { SubscriptionEntitlementFeature, SubscriptionEntitlementSource } from '@/types/dto/Subscription';
import { JsonObject } from '@/types/common';

export interface EnrichedSubscriptionEntitlement {
	feature: SubscriptionEntitlementFeature['feature'];
	feature_id: string;
	feature_type: string;
	entitlement: SubscriptionEntitlementFeature['entitlement'];
	sources: SubscriptionEntitlementSource[];
	/** Subscription-scoped entitlement row id, when one exists */
	subscriptionEntitlementId?: string;
	/** Parent plan/addon entitlement id used when creating an override */
	parentEntitlementIdForOverride?: string;
	/** True when a subscription-scoped row overrides or adds to effective limits */
	hasSubscriptionOverride: boolean;
	/** True when subscription row has parent_entitlement_id (override, not net-new) */
	isOverrideOfParent: boolean;
	/** Original values from plan/addon before override */
	originalUsageLimit?: number | null;
	originalStaticValue?: string;
	originalIsEnabled?: boolean;
	usage_reset_period?: string;
}

const normalizeEntityType = (entityType?: string) => entityType?.toLowerCase() ?? '';

export const getSubscriptionSource = (sources: SubscriptionEntitlementSource[] = []) =>
	sources.find((source) => normalizeEntityType(source.entity_type) === 'subscription');

export const getParentSource = (sources: SubscriptionEntitlementSource[] = []) =>
	sources.find((source) => {
		const type = normalizeEntityType(source.entity_type);
		return type === 'plan' || type === 'addon';
	});

export const getPrimarySourceLabel = (sources: SubscriptionEntitlementSource[] = []): string => {
	const subscriptionSource = getSubscriptionSource(sources);
	const parentSource = getParentSource(sources);

	if (subscriptionSource && !parentSource) {
		return 'subscription';
	}
	if (subscriptionSource && parentSource) {
		return 'subscription';
	}
	if (parentSource) {
		return normalizeEntityType(parentSource.entity_type);
	}
	return 'unknown';
};

export const enrichSubscriptionEntitlements = (
	features: SubscriptionEntitlementFeature[] = [],
	rawSubscriptionEntitlements: EntitlementResponse[] = [],
	planEntitlements: EntitlementResponse[] = [],
): EnrichedSubscriptionEntitlement[] => {
	const rawByFeatureId = new Map(rawSubscriptionEntitlements.map((ent) => [ent.feature_id, ent]));
	const planByFeatureId = new Map(planEntitlements.map((ent) => [ent.feature_id, ent]));

	return features.map((item) => {
		const featureId = item.feature?.id ?? '';
		const rawSubscriptionEnt = rawByFeatureId.get(featureId);
		const subscriptionSource = getSubscriptionSource(item.sources);
		const parentSource = getParentSource(item.sources);
		const planEnt = planByFeatureId.get(featureId);

		const parentEntitlementIdForOverride = rawSubscriptionEnt?.parent_entitlement_id ?? parentSource?.entitlement_id ?? planEnt?.id;
		const isOverrideOfParent = !!rawSubscriptionEnt?.parent_entitlement_id;

		const originalFromPlan = planEnt ?? (parentSource ? undefined : undefined);
		const originalUsageLimit = parentSource?.usage_limit ?? originalFromPlan?.usage_limit;
		const originalStaticValue = parentSource?.static_value ?? originalFromPlan?.static_value;
		const originalIsEnabled = parentSource?.is_enabled ?? originalFromPlan?.is_enabled;

		// When parent is hidden by override, fall back to plan entitlements for original values
		const resolvedOriginalUsageLimit = isOverrideOfParent && parentSource == null ? originalFromPlan?.usage_limit : originalUsageLimit;
		const resolvedOriginalStaticValue = isOverrideOfParent && parentSource == null ? originalFromPlan?.static_value : originalStaticValue;
		const resolvedOriginalIsEnabled = isOverrideOfParent && parentSource == null ? originalFromPlan?.is_enabled : originalIsEnabled;

		return {
			feature: item.feature,
			feature_id: featureId,
			feature_type: item.feature?.type ?? '',
			entitlement: item.entitlement,
			sources: item.sources ?? [],
			subscriptionEntitlementId: subscriptionSource?.entitlement_id ?? rawSubscriptionEnt?.id,
			parentEntitlementIdForOverride,
			hasSubscriptionOverride: !!subscriptionSource || !!rawSubscriptionEnt,
			isOverrideOfParent,
			originalUsageLimit: resolvedOriginalUsageLimit,
			originalStaticValue: resolvedOriginalStaticValue,
			originalIsEnabled: resolvedOriginalIsEnabled,
			usage_reset_period: item.entitlement?.usage_reset_period,
		};
	});
};

export interface SubscriptionEntitlementOverrideValues {
	usage_limit?: number | null;
	static_value?: string;
	is_enabled?: boolean;
	config_value?: JsonObject;
}

/** Read effective static value from aggregated subscription entitlement payload. */
export const getEffectiveStaticValue = (entitlement?: { static_values?: string[]; static_value?: string }): string | undefined => {
	if (entitlement?.static_values?.length) {
		return entitlement.static_values[0];
	}
	return entitlement?.static_value;
};

/**
 * Read the effective config value for a CONFIG entitlement.
 * Prefers the subscription-scoped source (override) over the plan source.
 */
export const getEffectiveConfigValue = (sources?: SubscriptionEntitlementSource[]): JsonObject | null => {
	if (!sources?.length) return null;
	const subSource = sources.find((s) => s.entity_type === 'subscription');
	if (subSource?.config_value) return subSource.config_value;
	const planSource = sources.find((s) => s.entity_type === 'plan');
	return planSource?.config_value ?? null;
};
