import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import EnvironmentApi from '@/api/EnvironmentApi';
import AuthService from '@/core/auth/AuthService';
import { config } from '@/config/config';
import { getApiErrorMessage } from '@/core/axios/types';

interface RuntimeCredentials {
	sessionToken: string;
}
let runtimeCredentials: RuntimeCredentials | null = null; // runtime credentials for customer dashboard

export const setRuntimeCredentials = (credentials: RuntimeCredentials) => {
	runtimeCredentials = credentials;
};

export const clearRuntimeCredentials = () => {
	runtimeCredentials = null;
};

const axiosClient: AxiosInstance = axios.create({
	baseURL: config.api.baseUrl,
	timeout: 600000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Endpoints reachable before an active environment can possibly be known — the environments
// list itself (fetching it is how an active one gets picked in the first place) and the
// current-user lookup (fetched to even determine which tenant's environments to list).
// Everything else needs to wait rather than fire with no X-Environment-ID: on a fresh login,
// getActiveEnvironmentId() is a synchronous localStorage read that's empty until
// useEnvironment()'s own fetch has resolved, and the backend 403s without the header.
const ENV_GATE_EXEMPT_PATHS = ['/environments', '/users/me'];

// Exact match on the pathname (ignoring any query string) - a substring check would also
// exempt nested environment endpoints like /environments/{id} or /environments/{id}/clone,
// which are reached after an active environment is already known and should still carry
// X-Environment-ID like any other request.
const isEnvGateExempt = (url?: string): boolean => {
	if (!url) return false;
	const path = url.split('?')[0];
	return ENV_GATE_EXEMPT_PATHS.includes(path);
};

axiosClient.interceptors.request.use(
	async (config: InternalAxiosRequestConfig) => {
		// Customer portal mode: only X-Session-Token needed
		if (runtimeCredentials) {
			config.headers['X-Session-Token'] = runtimeCredentials.sessionToken;
			return config;
		}

		// Normal app mode: use JWT token and environment ID
		const token = await AuthService.getAcessToken();
		// add active environment to the request
		let activeEnvId = EnvironmentApi.getActiveEnvironmentId();
		if (!activeEnvId && !isEnvGateExempt(config.url)) {
			await EnvironmentApi.waitForActiveEnvironment();
			activeEnvId = EnvironmentApi.getActiveEnvironmentId();
		}
		if (activeEnvId) {
			config.headers['X-Environment-ID'] = activeEnvId;
		}

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		const devToken = localStorage.getItem('x-api-key');
		if (devToken) {
			config.headers.Authorization = `Bearer ${devToken}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

axiosClient.interceptors.response.use(
	(response: AxiosResponse) => {
		return response.data;
	},
	async (error) => {
		if (error.response) {
			switch (error.response.status) {
				case 401:
					await AuthService.logout();
					// Redirect to login or show message
					break;
				case 403:
					// Handle forbidden access
					break;
				case 404:
					// Handle not found
					break;
				case 500:
					// Handle server error
					break;
				default:
					// Handle other errors
					break;
			}
			// Normalize to Error so callers can use err.message (body shape varies)
			const status = error.response.status;
			const errorData = error.response.data;
			const statusText =
				typeof error.response.statusText === 'string' && error.response.statusText.trim() ? error.response.statusText.trim() : '';
			const fallback = statusText ? `${statusText} (${status})` : `Request failed (${status})`;
			const msg = getApiErrorMessage(errorData, fallback);
			const rejection = new Error(msg);
			(rejection as Error & { cause?: unknown }).cause = errorData ?? error;
			return Promise.reject(rejection);
		} else if (error.request) {
			// Request was made but no response received
			console.error('No response received:', error.request);
			return Promise.reject(new Error('No response received from server'));
		} else {
			// Error in setting up the request
			console.error('Error:', error.message);
			return Promise.reject(error);
		}
	},
);

export default axiosClient;
