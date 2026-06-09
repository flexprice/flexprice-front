import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'flexprice_theme';

const applyThemeClass = (theme: ThemeMode) => {
	document.documentElement.classList.toggle('dark', theme === 'dark');
};

interface ThemeState {
	theme: ThemeMode;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			theme: 'light',
			setTheme: (theme) => {
				applyThemeClass(theme);
				set({ theme });
			},
			toggleTheme: () => {
				const next = get().theme === 'dark' ? 'light' : 'dark';
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

/** Apply persisted theme before React paints to avoid a flash. */
export const initTheme = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			applyThemeClass('light');
			return;
		}
		const parsed = JSON.parse(raw) as { state?: { theme?: ThemeMode } };
		applyThemeClass(parsed?.state?.theme === 'dark' ? 'dark' : 'light');
	} catch {
		applyThemeClass('light');
	}
};
