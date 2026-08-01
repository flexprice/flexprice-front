// src/store/useThemeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

/**
 * localStorage key. Intentional persistence: theme is a per-device user preference, so it must
 * survive reloads and be readable synchronously before React mounts (see `initTheme` below).
 */
const STORAGE_KEY = 'flexprice_theme';

export const DEFAULT_THEME: ThemeMode = 'light';

/**
 * Public, tenant-facing routes that must always render light.
 *
 * These sit outside MainLayout and AuthMiddleware and are seen by the tenant's *customers*, not by
 * Flexprice users. They carry their own per-tenant theming (`--portal-*`, see PortalConfigContext),
 * which already derives its own dark/light treatment from the tenant's configured background.
 *
 * Dark mode is a Flexprice user's preference for the internal app. Letting it reach these routes
 * means an employee's toggle restyles customer-facing, tenant-branded UI — and because these pages
 * compose shared atoms that ARE tokenized, the result is dark buttons and tables inside an
 * otherwise white page.
 */
const PUBLIC_LIGHT_ROUTES = ['/customer-portal', '/checkout'];

export const isPublicLightRoute = (pathname: string = window.location.pathname): boolean =>
	PUBLIC_LIGHT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

/**
 * Tailwind is configured with `darkMode: ['class']`, so the `.dark` class on <html> is the single
 * switch that re-points every `--fp-*` token at its Midnight value.
 */
const applyThemeClass = (theme: ThemeMode) => {
	const effective = isPublicLightRoute() ? 'light' : theme;
	document.documentElement.classList.toggle('dark', effective === 'dark');
};

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

interface ThemeState {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			theme: DEFAULT_THEME,
			setTheme: (theme) => {
				applyThemeClass(theme);
				set({ theme });
			},
			toggleTheme: () => {
				const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
				applyThemeClass(next);
				set({ theme: next });
			},
		}),
		{
			name: STORAGE_KEY,
			partialize: (state) => ({ theme: state.theme }),
			onRehydrateStorage: () => (state) => {
				if (state) applyThemeClass(state.theme);
			},
		},
	),
);

/**
 * Apply the persisted theme before React paints, so a dark-mode user never sees a light flash.
 *
 * Reads localStorage directly rather than importing the store: this runs at the top of main.tsx,
 * and going through Zustand would couple the no-flash guarantee to module import order. Any
 * unreadable or unrecognised value falls back to light — the default must never be dark by
 * accident.
 */
export const initTheme = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return applyThemeClass(DEFAULT_THEME);

		const parsed: unknown = JSON.parse(raw);
		const stored = (parsed as { state?: { theme?: unknown } })?.state?.theme;
		applyThemeClass(isThemeMode(stored) ? stored : DEFAULT_THEME);
	} catch {
		applyThemeClass(DEFAULT_THEME);
	}
};
