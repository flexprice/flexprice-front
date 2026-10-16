// src/brand/modules.tsx
import { Suspense, type ComponentType, type ReactNode } from 'react';
import type { RouteObject } from 'react-router';
import extensions from '@brand/extensions';
// Direct path, not the atoms barrel: the router imports this file, and the barrel imports the router.
import Loader from '@/components/atoms/Loader';
import type { AppNavItem } from './types';

const modules = extensions.modules ?? [];
const pages = extensions.pages ?? {};

/** Id of the signed-in layout route in the router; brand routes are mounted under it. */
export const APP_ROUTE_ID = 'app';

/** Packs usually lazy-load pages; give each its own boundary. */
const suspend = (element: ReactNode) => <Suspense fallback={<Loader />}>{element}</Suspense>;
const render = (Page: ComponentType) => suspend(<Page />);

const withSuspense = (route: RouteObject): RouteObject => (route.element ? { ...route, element: suspend(route.element) } : route);

/** Routes contributed by the brand pack's modules. */
export const brandRoutes: RouteObject[] = modules.flatMap((m) => m.routes.map(withSuspense));

const joinPath = (base: string, path: string) =>
	path.startsWith('/') ? path : `${base.replace(/\/$/, '')}/${path}`.replace(/\/$/, '') || '/';

/**
 * Applies the brand pack to the router: swaps the pages it overrides, then mounts its module routes
 * and any page it adds under the signed-in layout. With the default pack this returns the routes as given.
 */
export function applyBrandRoutes(routes: RouteObject[]): RouteObject[] {
	const placed = new Set<string>();

	const walk = (list: RouteObject[], base: string): RouteObject[] =>
		list.map((route) => {
			const full = route.index || route.path === undefined ? base : joinPath(base, route.path);
			let next: RouteObject = route;
			const Page = pages[full];
			if (Page && !placed.has(full)) {
				if (route.element !== undefined) {
					placed.add(full);
					next = { ...route, element: render(Page) };
				} else if (route.children && !route.children.some((child) => child.index)) {
					// A section with no page of its own (e.g. /product-catalog): give it an index page.
					placed.add(full);
					next = { ...route, children: [{ index: true, element: render(Page) }, ...route.children] };
				}
			}
			return next.children && !next.index ? ({ ...next, children: walk(next.children, full) } as RouteObject) : next;
		});

	const walked = walk(routes, '');
	const added: RouteObject[] = Object.entries(pages)
		.filter(([path]) => !placed.has(path))
		.map(([path, Page]) => ({ path, element: render(Page) }));
	const extra = [...brandRoutes, ...added];
	if (extra.length === 0) return walked;

	return walked.map((route) =>
		route.id === APP_ROUTE_ID ? ({ ...route, children: [...(route.children ?? []), ...extra] } as RouteObject) : route,
	);
}

/** Navigation entries contributed by the brand pack. The module list is fixed per build, so hook order is stable. */
export function useBrandNavItems(): AppNavItem[] {
	return modules.map((m) => m.useNavItem?.() ?? null).filter((item): item is AppNavItem => item !== null);
}
