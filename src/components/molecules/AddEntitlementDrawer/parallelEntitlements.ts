import { Entitlement, ENTITLEMENT_AGGREGATION_MODE } from '@/models/Entitlement';

/**
 * Whether an existing entitlement stops another being added for the same feature.
 * Uniqueness excludes parallel rows (entitlement_uniq_v2), so only a pooled one does.
 */
export const blocksAnotherEntitlement = (ent: Partial<Entitlement>): boolean =>
	ent.aggregation_mode !== ENTITLEMENT_AGGREGATION_MODE.PARALLEL;
