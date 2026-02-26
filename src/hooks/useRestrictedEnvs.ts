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

interface FlatMapEntry {
	value: string;
	tenantId: string;
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

function buildFlatMap(config: RestrictedEnvsConfig): Record<string, FlatMapEntry> {
	const flat: Record<string, FlatMapEntry> = {};
	for (const [tenantId, tenantEnvs] of Object.entries(config)) {
		if (tenantEnvs && typeof tenantEnvs === 'object' && !Array.isArray(tenantEnvs)) {
			for (const [envId, value] of Object.entries(tenantEnvs)) {
				if (typeof value === 'string') {
					flat[envId] = { value, tenantId };
				}
			}
		}
	}
	return flat;
}

const PARSED_CONFIG = parseRestrictedEnvsConfig();
const FLAT_MAP = buildFlatMap(PARSED_CONFIG);

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
		result: getEnvRestriction(envId),
	}));
}

/**
 * Resolves restriction state for an environment id (uses flat map from nested config).
 * Pure function: no side effects.
 */
export function getEnvRestriction(envId: string): EnvRestrictionResult {
	if (!envId) return { state: EnvRestrictionState.Active, isRestricted: false };

	const entry = FLAT_MAP[envId];
	if (entry == null) return { state: EnvRestrictionState.Active, isRestricted: false };

	const { value } = entry;
	if (value == null || value === '') return { state: EnvRestrictionState.Active, isRestricted: false };

	return resolveRestrictionState(value);
}

export interface UseRestrictedEnvsReturn {
	/** Map of env id -> restriction result for every env in VITE_RESTRICTED_ENVS */
	restrictedEnvs: Record<string, EnvRestrictionResult>;
	/** Get restriction (and expiry) for a given env id */
	getRestriction: (envId: string) => EnvRestrictionResult;
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
		for (const envId of Object.keys(FLAT_MAP)) {
			acc[envId] = getEnvRestriction(envId);
		}
		return acc;
	}, []);

	const getRestriction = useCallback((envId: string) => {
		return getEnvRestriction(envId);
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
