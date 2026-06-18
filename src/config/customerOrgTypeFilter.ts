/**
 * Tenant allowlist for customer list Parent/Child metadata quick filters.
 *
 * Set `VITE_TENANT_FEATURE_ALLOWLIST` to enable for specific tenants only:
 * - Comma-separated: `tenant-id-1,tenant-id-2`
 * - JSON array: `["tenant-id-1","tenant-id-2"]`
 *
 * When unset or empty, the buttons are hidden for everyone (opt-in).
 */
export function parseTenantAllowlist(raw: string | undefined): Set<string> {
	const trimmed = raw?.trim() ?? '';
	if (!trimmed) return new Set();

	if (trimmed.startsWith('[')) {
		try {
			const parsed: unknown = JSON.parse(trimmed);
			if (!Array.isArray(parsed)) return new Set();
			return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map((id) => id.trim()));
		} catch {
			return new Set();
		}
	}

	return new Set(
		trimmed
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean),
	);
}

const TENANT_ALLOWLIST = parseTenantAllowlist(import.meta.env.VITE_TENANT_FEATURE_ALLOWLIST);

export function isCustomerOrgTypeFilterEnabled(tenantId?: string | null): boolean {
	if (TENANT_ALLOWLIST.size === 0 || !tenantId?.trim()) return false;
	return TENANT_ALLOWLIST.has(tenantId.trim());
}
