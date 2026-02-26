import { useMemo, useCallback } from 'react';

/** Raw parsed env config: tenant_id -> { environment_id -> ISO date or "suspended" } */
export type RestrictedEnvsConfig = Record<string, Record<string, string>>;

export enum EnvRestrictionState {
	Active = 'active',
	GracePeriod = 'grace_period',
	Suspended = 'suspended',
}

export interface EnvRestrictionResult {
	state: EnvRestrictionState;
	isRestricted: boolean;
	expiresAt?: string;
}

const SUSPENDED_VALUE = 'suspended';

/** Per-env value under a tenant (tenant context is the map key). */
interface FlatMapEntry {
	value: string;
}

function parseRestrictedEnvsConfig(): RestrictedEnvsConfig {
	try {
		const raw = import.meta.env.VITE_RESTRICTED_ENVS;
		if (raw == null || typeof raw !== 'string') return {};
		const parsed = JSON.parse(raw) as unknown;
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
		const acc: RestrictedEnvsConfig = {};
		for (const [tenantId, inner] of Object.entries(parsed as Record<string, unknown>)) {
			if (inner !== null && typeof inner === 'object' && !Array.isArray(inner)) {
				const envMap: Record<string, string> = {};
				for (const [envId, val] of Object.entries(inner as Record<string, unknown>)) {
					if (typeof val === 'string') envMap[envId] = val;
				}
				acc[tenantId] = envMap;
			}
		}
		return acc;
	} catch {
		return {};
	}
}

/** Tenant-scoped map: tenantId -> envId -> entry. Avoids envId collisions across tenants. */
function buildTenantScopedMap(config: RestrictedEnvsConfig): Record<string, Record<string, FlatMapEntry>> {
	const map: Record<string, Record<string, FlatMapEntry>> = {};
	for (const [tenantId, tenantEnvs] of Object.entries(config)) {
		if (tenantEnvs && typeof tenantEnvs === 'object' && !Array.isArray(tenantEnvs)) {
			const inner: Record<string, FlatMapEntry> = {};
			for (const [envId, value] of Object.entries(tenantEnvs)) {
				if (typeof value === 'string') {
					inner[envId] = { value };
				}
			}
			if (Object.keys(inner).length > 0) {
				map[tenantId] = inner;
			}
		}
	}
	return map;
}

/** envId -> tenantId for fallback when getEnvRestriction(envId) is called without tenantId. */
function buildEnvIdToTenant(config: RestrictedEnvsConfig): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [tenantId, tenantEnvs] of Object.entries(config)) {
		if (tenantEnvs && typeof tenantEnvs === 'object' && !Array.isArray(tenantEnvs)) {
			for (const envId of Object.keys(tenantEnvs)) {
				if (typeof tenantEnvs[envId] === 'string' && !(envId in out)) {
					out[envId] = tenantId;
				}
			}
		}
	}
	return out;
}

const PARSED_CONFIG = parseRestrictedEnvsConfig();
const FLAT_MAP = buildTenantScopedMap(PARSED_CONFIG);
const ENV_ID_TO_TENANT = buildEnvIdToTenant(PARSED_CONFIG);

function resolveRestrictionState(value: string): EnvRestrictionResult {
	if (value === SUSPENDED_VALUE) {
		return { state: EnvRestrictionState.Suspended, isRestricted: true };
	}
	const expiresAtDate = new Date(value);
	if (Number.isNaN(expiresAtDate.getTime())) {
		return { state: EnvRestrictionState.Active, isRestricted: false };
	}
	const now = Date.now();
	if (now > expiresAtDate.getTime()) {
		return { state: EnvRestrictionState.Suspended, isRestricted: true };
	}
	return {
		state: EnvRestrictionState.GracePeriod,
		isRestricted: true,
		expiresAt: value,
	};
}

/**
 * Returns true if the tenant is in the restricted list (strip should show).
 */
export function isTenantRestricted(tenantId: string): boolean {
	if (!tenantId) return false;
	return tenantId in PARSED_CONFIG;
}

export interface TenantRestrictionEntry {
	envId: string;
	result: EnvRestrictionResult;
}

/**
 * Returns restriction result for each env under the tenant (for picking which env to show in the banner).
 */
export function getRestrictionResultsForTenant(tenantId: string): TenantRestrictionEntry[] {
	if (!tenantId) return [];
	const tenantEnvs = PARSED_CONFIG[tenantId];
	if (!tenantEnvs || typeof tenantEnvs !== 'object') return [];
	return Object.keys(tenantEnvs).map((envId) => ({
		envId,
		result: getEnvRestriction(envId, tenantId),
	}));
}

/**
 * Resolves restriction state for an environment id (tenant-scoped lookup when tenantId provided).
 * Pure function: no side effects.
 * @param envId - environment id
 * @param tenantId - optional; when provided, lookup is tenant-local. When omitted, resolves via envId→tenant map (first match).
 */
export function getEnvRestriction(envId: string, tenantId?: string): EnvRestrictionResult {
	if (!envId) return { state: EnvRestrictionState.Active, isRestricted: false };

	const resolvedTenantId = tenantId ?? ENV_ID_TO_TENANT[envId];
	if (!resolvedTenantId) return { state: EnvRestrictionState.Active, isRestricted: false };

	const entry = FLAT_MAP[resolvedTenantId]?.[envId];
	if (entry == null) return { state: EnvRestrictionState.Active, isRestricted: false };

	const { value } = entry;
	if (value == null || value === '') return { state: EnvRestrictionState.Active, isRestricted: false };

	return resolveRestrictionState(value);
}

export interface UseRestrictedEnvsReturn {
	/** Map of env id -> restriction result for every env in VITE_RESTRICTED_ENVS */
	restrictedEnvs: Record<string, EnvRestrictionResult>;
	/** Get restriction (and expiry) for a given env id; pass tenantId for tenant-local lookup when available */
	getRestriction: (envId: string, tenantId?: string) => EnvRestrictionResult;
	/** True if the tenant is in the restricted list (show strip regardless of env) */
	isTenantRestricted: (tenantId: string) => boolean;
	/** Restriction result per env under the tenant (for banner: show the env that is closed/closing) */
	getRestrictionResultsForTenant: (tenantId: string) => TenantRestrictionEntry[];
}

/**
 * Hook for FE-only restricted environments (tenant-scoped).
 * Reads VITE_RESTRICTED_ENVS: { [tenant_id]: { [environment_id]: ISO date | "suspended" } }.
 * If tenant is in the list, the strip is shown for that tenant regardless of selected env.
 */
export function useRestrictedEnvs(): UseRestrictedEnvsReturn {
	const restrictedEnvs = useMemo(() => {
		const acc: Record<string, EnvRestrictionResult> = {};
		for (const [resolvedTenantId, tenantEnvs] of Object.entries(FLAT_MAP)) {
			for (const envId of Object.keys(tenantEnvs)) {
				acc[envId] = getEnvRestriction(envId, resolvedTenantId);
			}
		}
		return acc;
	}, []);

	const getRestriction = useCallback((envId: string, tenantId?: string) => {
		return getEnvRestriction(envId, tenantId);
	}, []);

	const isTenantRestrictedCallback = useCallback((tenantId: string) => {
		return isTenantRestricted(tenantId);
	}, []);

	const getRestrictionResultsForTenantCallback = useCallback((tenantId: string) => {
		return getRestrictionResultsForTenant(tenantId);
	}, []);

	return {
		restrictedEnvs,
		getRestriction,
		isTenantRestricted: isTenantRestrictedCallback,
		getRestrictionResultsForTenant: getRestrictionResultsForTenantCallback,
	};
}

export default useRestrictedEnvs;
