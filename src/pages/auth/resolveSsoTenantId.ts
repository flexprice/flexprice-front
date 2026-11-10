/**
 * Resolves which tenant the login-page SSO button should target. The URL param wins
 * (per-tenant links on a multi-tenant deployment); otherwise a build-time tenant lets
 * a single-tenant deployment show the button without a ?sso= URL param. Empty/whitespace
 * on both → undefined (no button).
 */
export function resolveSsoTenantId(paramValue: string | null | undefined, envTenantId: string | undefined): string | undefined {
	return paramValue?.trim() || envTenantId?.trim() || undefined;
}
