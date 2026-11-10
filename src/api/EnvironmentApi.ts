import { AxiosClient } from '@/core/axios/verbs';
import { ACTIVE_ENVIRONMENT_ID_KEY } from '@/hooks/useEnvironment';
import { Environment } from '@/models';
import {
	CloneEnvironmentPayload,
	CloneEnvironmentResponse,
	CreateEnvironmentPayload,
	ListEnvironmentResponse,
	UpdateEnvironmentPayload,
} from '@/types/dto';

// Resolved the first time an active environment ID is known — either because it was already
// in localStorage (e.g. on a refresh, from a prior session) or because useEnvironment() just
// picked a default after its own /environments fetch resolved. axiosClient's request
// interceptor awaits this (bounded by a timeout) before sending environment-scoped requests,
// so a fresh login doesn't fire them with no X-Environment-ID header — the backend 403s
// without one, and getActiveEnvironmentId() is a synchronous localStorage read that's simply
// empty until useEnvironment()'s own fetch has had a chance to run.
//
// Built lazily (not at module load) so importing this module never itself touches
// localStorage or the ACTIVE_ENVIRONMENT_ID_KEY export up front — tests that mock
// useEnvironment without re-exporting that constant would otherwise crash on import.
let resolveEnvReady: (() => void) | null = null;
let envReadyPromise: Promise<void> | null = null;
function getEnvReadyPromise(): Promise<void> {
	if (!envReadyPromise) {
		envReadyPromise = localStorage.getItem(ACTIVE_ENVIRONMENT_ID_KEY)
			? Promise.resolve()
			: new Promise((resolve) => {
					resolveEnvReady = resolve;
				});
	}
	return envReadyPromise;
}

class EnvironmentApi {
	private static baseUrl = '/environments';

	// API Methods
	public static async getAllEnvironments(): Promise<ListEnvironmentResponse> {
		try {
			return await AxiosClient.get<ListEnvironmentResponse>(this.baseUrl);
		} catch {
			return { environments: [], total: 0 } as ListEnvironmentResponse;
		}
	}

	public static async getEnvironmentById(id: string): Promise<Environment | null> {
		try {
			return await AxiosClient.get<Environment>(`${this.baseUrl}/${id}`);
		} catch {
			return null;
		}
	}

	public static async createEnvironment(payload: CreateEnvironmentPayload): Promise<Environment | null> {
		return await AxiosClient.post<Environment>(this.baseUrl, payload);
	}

	public static async cloneEnvironment(sourceEnvironmentId: string, payload: CloneEnvironmentPayload): Promise<CloneEnvironmentResponse> {
		return await AxiosClient.post<CloneEnvironmentResponse>(`${this.baseUrl}/${sourceEnvironmentId}/clone`, payload);
	}

	public static async updateEnvironment(id: string, payload: UpdateEnvironmentPayload): Promise<Environment | null> {
		return await AxiosClient.put<Environment>(`${this.baseUrl}/${id}`, payload);
	}

	public static getActiveEnvironmentId(): string | null {
		return localStorage.getItem(ACTIVE_ENVIRONMENT_ID_KEY);
	}

	public static setActiveEnvironmentId(environmentId: string): void {
		localStorage.setItem(ACTIVE_ENVIRONMENT_ID_KEY, environmentId);
		resolveEnvReady?.();
		resolveEnvReady = null;
	}

	/** Resolves once an active environment ID is known, or after `timeoutMs` — whichever
	 *  comes first, so a tenant with zero environments (or a slow/failed fetch) doesn't
	 *  block every request indefinitely. */
	public static waitForActiveEnvironment(timeoutMs = 5000): Promise<void> {
		return Promise.race([getEnvReadyPromise(), new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
	}
}

export default EnvironmentApi;
