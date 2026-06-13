import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Environment, { ENVIRONMENT_TYPE } from '@/models/Environment';
import EnvironmentApi from '@/api/EnvironmentApi';
import { config } from '@/config/config';

export const ACTIVE_ENVIRONMENT_ID_KEY = 'active_environment_id';

export interface ExtendedEnvironment extends Environment {
	isActive: boolean;
}

interface UseEnvironment {
	environments: ExtendedEnvironment[];
	activeEnvironment: ExtendedEnvironment | null;
	changeActiveEnvironment: (environmentId: string) => void;
	isDevelopment: boolean;
	isProduction: boolean;
	isLoading: boolean;
	isError: boolean;
	refetchEnvironments: () => void;
}

export const useEnvironment = (pollingInterval: number = 1000): UseEnvironment => {
	// Fetch environments from API
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['environments'],
		queryFn: async () => {
			const res = await EnvironmentApi.getAllEnvironments();
			const allowed = config.restrictions.allowedEnvTypes;
			if (allowed.length === 0) return res.environments;
			return res.environments.filter((env) => allowed.includes(env.type));
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// Get/set active environment ID from localStorage
	const getActiveEnvId = () => localStorage.getItem(ACTIVE_ENVIRONMENT_ID_KEY);
	const setActiveEnvId = (id: string) => localStorage.setItem(ACTIVE_ENVIRONMENT_ID_KEY, id);

	// State for active environment ID
	const [activeEnvId, setActiveEnvIdState] = useState<string | null>(getActiveEnvId());

	// Ref to track the last known localStorage value for polling
	const lastKnownEnvId = useRef<string | null>(getActiveEnvId());

	// Ref to store the polling interval ID
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Polling function to check localStorage changes
	const checkLocalStorageChanges = useCallback(() => {
		const currentEnvId = getActiveEnvId();

		// If the environment ID has changed in localStorage
		if (currentEnvId !== lastKnownEnvId.current) {
			lastKnownEnvId.current = currentEnvId;
			setActiveEnvIdState(currentEnvId);

			// Optionally refetch environments if needed
			if (data && currentEnvId && !data.some((env) => env.id === currentEnvId)) {
				refetch();
			}
		}
	}, [data, refetch]);

	// Set up polling interval
	useEffect(() => {
		// Clear any existing interval
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
		}

		// Set up new polling interval
		pollingIntervalRef.current = setInterval(checkLocalStorageChanges, pollingInterval);

		// Cleanup function
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [checkLocalStorageChanges, pollingInterval]);

	// Sync state with localStorage changes (cross-tab) - keep this for immediate response
	useEffect(() => {
		const handler = (e: StorageEvent) => {
			if (e.key === ACTIVE_ENVIRONMENT_ID_KEY) {
				lastKnownEnvId.current = e.newValue;
				setActiveEnvIdState(e.newValue);
			}
		};
		window.addEventListener('storage', handler);
		return () => window.removeEventListener('storage', handler);
	}, []);

	// When environments load, ensure activeEnvId is valid
	useEffect(() => {
		if (!data || data.length === 0) return;
		if (!activeEnvId || !data.some((env) => env.id === activeEnvId)) {
			// Default to first environment
			const firstId = data[0].id;
			setActiveEnvId(firstId);
			setActiveEnvIdState(firstId);
			lastKnownEnvId.current = firstId;
		}
	}, [data, activeEnvId]);

	// Compose extended environments with isActive
	const environments: ExtendedEnvironment[] = (data || []).map((env) => ({
		...env,
		isActive: env.id === activeEnvId,
	}));

	const activeEnvironment = environments.find((env) => env.isActive) || null;

	// Change active environment
	const changeActiveEnvironment = useCallback((environmentId: string) => {
		setActiveEnvId(environmentId);
		setActiveEnvIdState(environmentId);
		lastKnownEnvId.current = environmentId;
	}, []);

	return {
		environments,
		activeEnvironment,
		changeActiveEnvironment,
		refetchEnvironments: refetch,
		isDevelopment: activeEnvironment?.type === ENVIRONMENT_TYPE.DEVELOPMENT,
		isProduction: activeEnvironment?.type === ENVIRONMENT_TYPE.PRODUCTION,
		isLoading,
		isError,
	};
};

export default useEnvironment;
