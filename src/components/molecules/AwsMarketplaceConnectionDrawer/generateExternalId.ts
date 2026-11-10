/**
 * Deterministic STS ExternalId scoped to the current tenant + environment.
 * Replaces a random UUID so the same org/env always gets a stable AssumeRole condition.
 */
export const generateExternalId = (tenantId: string, environmentId: string): string => {
	return `${tenantId}_${environmentId}`;
};
