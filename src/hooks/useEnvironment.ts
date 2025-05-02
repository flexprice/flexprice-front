import { useState, useEffect, useCallback, useRef } from 'react';
import { ExtendedEnvironment } from '@/api/EnvironmentApi';

const STORAGE_KEY = 'flex_price_environments';
const POLL_INTERVAL = 1000; // Check every second

export const useEnvironment = () => {
	const [environments, setEnvironments] = useState<ExtendedEnvironment[]>([]);
	const [activeEnvironment, setActiveEnvironment] = useState<ExtendedEnvironment | null>(null);
	const lastStoredValue = useRef<string | null>(null);

	// Load environments from localStorage with change detection
	const loadEnvironments = useCallback(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);

			// Only update if the value has changed
			if (stored !== lastStoredValue.current) {
				lastStoredValue.current = stored;
				const envs: ExtendedEnvironment[] = stored ? JSON.parse(stored) : [];
				setEnvironments(envs);
				const active = envs.find((env) => env.isActive) || null;
				setActiveEnvironment(active);
			}
		} catch (error) {
			console.error('Error loading environments:', error);
			setEnvironments([]);
			setActiveEnvironment(null);
		}
	}, []);

	// Initialize on mount and set up polling
	useEffect(() => {
		// Initial load
		loadEnvironments();

		// Set up polling interval
		const pollInterval = setInterval(loadEnvironments, POLL_INTERVAL);

		// Set up storage event listener for cross-tab synchronization
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) {
				loadEnvironments();
			}
		};
		window.addEventListener('storage', handleStorageChange);

		// Cleanup
		return () => {
			clearInterval(pollInterval);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [loadEnvironments]);

	// Change active environment
	const changeEnvironment = useCallback(
		(environmentId: string) => {
			try {
				const updatedEnvironments = environments.map((env) => ({
					...env,
					isActive: env.id === environmentId,
				}));
				const updatedJson = JSON.stringify(updatedEnvironments);
				localStorage.setItem(STORAGE_KEY, updatedJson);
				lastStoredValue.current = updatedJson;
				setEnvironments(updatedEnvironments);
				setActiveEnvironment(updatedEnvironments.find((env) => env.isActive) || null);
			} catch (error) {
				console.error('Error changing environment:', error);
			}
		},
		[environments],
	);

	// Save environments
	const saveEnvironments = useCallback((newEnvironments: ExtendedEnvironment[]) => {
		try {
			// Ensure at least one environment is active
			const hasActiveEnv = newEnvironments.some((env) => env.isActive);
			const envsToSave = hasActiveEnv ? newEnvironments : [{ ...newEnvironments[0], isActive: true }, ...newEnvironments.slice(1)];

			const savedJson = JSON.stringify(envsToSave);
			localStorage.setItem(STORAGE_KEY, savedJson);
			lastStoredValue.current = savedJson;
			setEnvironments(envsToSave);
			setActiveEnvironment(envsToSave.find((env) => env.isActive) || null);
		} catch (error) {
			console.error('Error saving environments:', error);
		}
	}, []);

	return {
		environments,
		activeEnvironment,
		changeEnvironment,
		saveEnvironments,
		// Helper methods
		isDevelopment: activeEnvironment?.type === 'development',
		isProduction: activeEnvironment?.type === 'production',
		isStaging: activeEnvironment?.type === 'staging',
	};
};

export default useEnvironment;
