import { AxiosClient } from '@/core/axios/verbs';
import { PaginationType } from '@/models/Pagination';

export interface Environment {
	id: string;
	name: string;
	slug: string;
	type: string;
	created_at: string;
	updated_at: string;
}

export interface CreateEnvironmentPayload {
	name: string;
	slug: string;
	type: string;
}

// Extended environment type with UI-specific properties
export interface ExtendedEnvironment extends Environment {
	isActive: boolean;
}

const STORAGE_KEY = 'flex_price_environments';

interface EnvironmentResponse extends PaginationType {
	environments: Environment[];
}

class EnvironmentApi {
	private static baseUrl = '/environments';

	// API Methods
	private static async getAllEnvironments(): Promise<EnvironmentResponse> {
		try {
			return await AxiosClient.get<EnvironmentResponse>(this.baseUrl);
		} catch (error) {
			console.error('Error fetching environments:', error);
			// Return empty environments to prevent UI crashes
			// Explicitly cast to match the expected type
			return { environments: [], total: 0 } as EnvironmentResponse;
		}
	}

	public static async getEnvironmentById(id: string): Promise<Environment | null> {
		try {
			return await AxiosClient.get<Environment>(`${this.baseUrl}/${id}`);
		} catch (error) {
			console.error(`Error fetching environment with ID ${id}:`, error);
			return null;
		}
	}

	public static async createEnvironment(payload: CreateEnvironmentPayload): Promise<Environment | null> {
		try {
			return await AxiosClient.post<Environment>(this.baseUrl, payload);
		} catch (error) {
			console.error('Error creating environment:', error);
			return null;
		}
	}

	// Helper Methods
	public static getStoredEnvironments(): ExtendedEnvironment[] {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('Error retrieving stored environments:', error);
			return [];
		}
	}

	public static setActiveEnvironment(environmentId: string): void {
		try {
			const environments = this.getStoredEnvironments();
			if (environments.length === 0) return;

			// Verify that the environment exists
			const environmentExists = environments.some((env) => env.id === environmentId);
			if (!environmentExists) {
				console.warn(`Environment with ID ${environmentId} does not exist.`);
				return;
			}

			const updatedEnvironments = environments.map((env) => ({
				...env,
				isActive: env.id === environmentId,
			}));
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEnvironments));
		} catch (error) {
			console.error('Error setting active environment:', error);
		}
	}

	public static getActiveEnvironment(): ExtendedEnvironment | null {
		return this.getStoredEnvironments().find((env) => env.isActive) || null;
	}

	public static saveEnvironments(environments: Environment[]): void {
		try {
			if (!environments || !Array.isArray(environments)) {
				console.warn('Invalid environments data provided to saveEnvironments');
				return;
			}

			const existingEnvironments = this.getStoredEnvironments();

			// Preserve active state when updating environments
			const updatedEnvironments = environments.map((env) => ({
				...env,
				isActive: existingEnvironments.find((e) => e.id === env.id)?.isActive || false,
			}));

			// If no environment is active, set the first one as active
			if (!updatedEnvironments.some((env) => env.isActive) && updatedEnvironments.length > 0) {
				updatedEnvironments[0].isActive = true;
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEnvironments));
		} catch (error) {
			console.error('Error saving environments:', error);
		}
	}

	public static sortEnvironments(environments: ExtendedEnvironment[]): ExtendedEnvironment[] {
		if (!environments || !Array.isArray(environments)) {
			return [];
		}

		return [...environments].sort((a, b) => {
			// Active environments first
			if (a.isActive && !b.isActive) return -1;
			if (!a.isActive && b.isActive) return 1;

			// Then sort by creation date (newest first)
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		});
	}

	public static async initializeEnvironments(): Promise<ExtendedEnvironment | null> {
		const environments = this.getStoredEnvironments();

		if (environments.length > 0) {
			return this.getActiveEnvironment();
		}

		try {
			const envData = await this.getAllEnvironments();
			if (envData.environments.length > 0) {
				let activeEnv = envData.environments.find((env) => (env as ExtendedEnvironment).isActive) as ExtendedEnvironment;

				if (!activeEnv) {
					activeEnv = (envData.environments.find((env) => env.type === 'development') as ExtendedEnvironment) || {
						...envData.environments[0],
						isActive: true,
					};
				}

				this.saveEnvironments(envData.environments);
				this.setActiveEnvironment(activeEnv.id);

				return activeEnv;
			}
		} catch (error) {
			console.error('Error initializing environments:', error);
		}

		return null;
	}

	public static async getLocalEnvironments(): Promise<ExtendedEnvironment[]> {
		return this.getStoredEnvironments();
	}
}

export default EnvironmentApi;
