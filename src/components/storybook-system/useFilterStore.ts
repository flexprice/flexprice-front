import { useEffect } from 'react';
import { create } from 'zustand';
import { shallowFingerprint } from './utils';

export type FilterValue = string | number | boolean | string[] | { from?: string; to?: string } | null | undefined;
export type FilterState = Record<string, FilterValue>;

interface FilterStoreState {
	filtersByRoute: Record<string, FilterState>;
	hydrateRoute: (route: string) => void;
	getFilters: (route: string) => FilterState;
	setFilter: (route: string, key: string, value: FilterValue) => void;
	resetFilters: (route: string) => void;
}

const EMPTY_FILTERS: FilterState = {};

const storageKey = (route: string) => `filters:${route.replace(/^\/+/, '').replace(/\//g, ':') || 'home'}`;

const readRouteFilters = (route: string): FilterState => {
	if (typeof window === 'undefined') return {};

	try {
		const stored = window.sessionStorage.getItem(storageKey(route));
		return stored ? (JSON.parse(stored) as FilterState) : {};
	} catch {
		return {};
	}
};

const writeRouteFilters = (route: string, filters: FilterState) => {
	if (typeof window === 'undefined') return;

	try {
		window.sessionStorage.setItem(storageKey(route), JSON.stringify(filters));
	} catch {
		// sessionStorage may be unavailable (private mode, quota exceeded)
	}

	try {
		const url = new URL(window.location.href);
		const fingerprint = shallowFingerprint(filters);

		if (fingerprint.startsWith('0-')) {
			url.searchParams.delete('ff');
		} else {
			url.searchParams.set('ff', fingerprint);
		}

		window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
	} catch {
		// history.replaceState may be restricted in sandboxed environments
	}
};

const useRawFilterStore = create<FilterStoreState>((set, get) => ({
	filtersByRoute: {},
	hydrateRoute: (route) => {
		if (get().filtersByRoute[route]) return;

		set((state) => ({
			filtersByRoute: {
				...state.filtersByRoute,
				[route]: readRouteFilters(route),
			},
		}));
	},
	getFilters: (route) => get().filtersByRoute[route] ?? EMPTY_FILTERS,
	setFilter: (route, key, value) => {
		const current = get().filtersByRoute[route] ?? readRouteFilters(route);
		const next = { ...current, [key]: value };
		writeRouteFilters(route, next);
		set((state) => ({
			filtersByRoute: {
				...state.filtersByRoute,
				[route]: next,
			},
		}));
	},
	resetFilters: (route) => {
		// Remove from sessionStorage and clear the URL fingerprint without re-writing {}
		if (typeof window !== 'undefined') {
			try {
				window.sessionStorage.removeItem(storageKey(route));
			} catch {
				// sessionStorage may be unavailable
			}
			try {
				const url = new URL(window.location.href);
				url.searchParams.delete('ff');
				window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
			} catch {
				// history.replaceState may be restricted in sandboxed environments
			}
		}
		set((state) => ({
			filtersByRoute: {
				...state.filtersByRoute,
				[route]: {},
			},
		}));
	},
}));

export const useFilterStore = (route = typeof window !== 'undefined' ? window.location.pathname : 'storybook') => {
	const hydrateRoute = useRawFilterStore((state) => state.hydrateRoute);
	const filters = useRawFilterStore((state) => state.filtersByRoute[route] ?? EMPTY_FILTERS);
	const setFilterRaw = useRawFilterStore((state) => state.setFilter);
	const resetFiltersRaw = useRawFilterStore((state) => state.resetFilters);
	const getFiltersRaw = useRawFilterStore((state) => state.getFilters);

	useEffect(() => {
		hydrateRoute(route);
	}, [hydrateRoute, route]);

	return {
		filters,
		setFilter: (key: string, value: FilterValue) => setFilterRaw(route, key, value),
		resetFilters: () => resetFiltersRaw(route),
		getFilters: () => getFiltersRaw(route),
	};
};

export const filterStoreInternals = {
	storageKey,
	readRouteFilters,
};
