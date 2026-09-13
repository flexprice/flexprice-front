import type { EntityCreationOptions, EntityCreationResult } from '@/types/dto/EntityCreation';

/**
 * True when the call created nothing because an entity was already in flight.
 *
 * Deliberately not inferred from an absent id or a missing session: the blocked
 * response carries a complete, valid entity — the pre-existing one — so status is
 * the only field that distinguishes it from a success.
 */
export const isBlockedByExistingEntity = (result?: EntityCreationResult | null): boolean => result?.status === 'failed_already_exists';

/** Retry options that cancel the in-flight entity instead of being rejected by it. */
export const supersedeExistingEntity: EntityCreationOptions = {
	entity_creation_conflict_policies: { on_existing_entity: 'supersede' },
};
