/**
 * Entity-creation outcomes and conflict policy. Mirrors internal/types/entity.go.
 *
 * A create call that collides with an entity already in flight does not fail with
 * an HTTP error — it answers 200 carrying `failed_already_exists` and the entity
 * that blocked it. A client that only checks for a thrown error therefore reads a
 * conflict as a success, so `entity_creation_result` has to be read explicitly.
 */

export type EntityCreationStatus = 'created' | 'superseded' | 'failed_already_exists';

export interface EntityCreationResult {
	status: EntityCreationStatus;
	/**
	 * On `failed_already_exists` this is the pre-existing entity that blocked the
	 * request, not one this call produced; on every other status it is the entity
	 * the call created.
	 */
	entity_id: string;
}

/** `supersede` cancels the entity already in flight; `reject` (the server default) keeps it. */
export type OnExistingEntityPolicy = 'reject' | 'supersede';

export interface EntityCreationConflictPolicies {
	on_existing_entity?: OnExistingEntityPolicy;
}

export interface EntityCreationOptions {
	entity_creation_conflict_policies?: EntityCreationConflictPolicies;
}
