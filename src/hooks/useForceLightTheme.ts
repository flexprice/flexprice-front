import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

/**
 * Pins the current route to light mode for as long as it is mounted.
 *
 * `initTheme()` already skips the public tenant-facing routes on first paint, but react-router can
 * navigate into them from inside the app without a reload, so the `.dark` class would simply carry
 * over. This removes it on mount and restores the user's persisted preference on unmount.
 *
 * Used by the customer portal and checkout — pages seen by the tenant's customers, which carry their
 * own per-tenant theming and must not inherit a Flexprice user's dark-mode preference.
 */
export function useForceLightTheme(): void {
	const theme = useThemeStore((state) => state.theme);

	useEffect(() => {
		const root = document.documentElement;
		const had = root.classList.contains('dark');
		root.classList.remove('dark');

		return () => {
			// Restore only if dark is still the persisted preference; the user may have changed it.
			if (had && useThemeStore.getState().theme === 'dark') root.classList.add('dark');
		};
	}, [theme]);
}

export default useForceLightTheme;
