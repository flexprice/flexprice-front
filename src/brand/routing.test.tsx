import { describe, it, expect, vi } from 'vitest';
import type { RouteObject } from 'react-router';

const Fake = () => null;

vi.mock('@brand/extensions', () => ({
	default: {
		pages: { '/home': Fake, '/catalog': Fake, '/brand-only': Fake },
		modules: [{ id: 'mod', routes: [{ path: '/mod', element: <Fake /> }] }],
	},
}));

const { applyBrandRoutes, APP_ROUTE_ID } = await import('./modules');

const routes: RouteObject[] = [
	{ path: '/login', element: <span /> },
	{
		id: APP_ROUTE_ID,
		path: '/',
		element: <span />,
		children: [
			{ path: '/home', element: <span>home</span>, handle: { guard: 'keep-me' } },
			{ path: '/catalog', children: [{ path: '/catalog/plans', element: <span /> }] },
		],
	},
];

describe('applyBrandRoutes', () => {
	const result = applyBrandRoutes(routes);
	const app = result.find((r) => r.id === APP_ROUTE_ID)!;
	const children = app.children!;

	it('swaps an existing page and keeps its handle (permission guard)', () => {
		const home = children.find((r) => r.path === '/home')!;
		expect(home.handle).toEqual({ guard: 'keep-me' });
		expect(home.element).not.toEqual(routes[1].children![0].element);
	});

	it('gives a section without a page of its own an index page', () => {
		const catalog = children.find((r) => r.path === '/catalog')!;
		expect(catalog.children![0].index).toBe(true);
		expect(catalog.children).toHaveLength(2);
	});

	it('mounts module routes and brand-only pages under the signed-in layout', () => {
		const paths = children.map((r) => r.path);
		expect(paths).toContain('/mod');
		expect(paths).toContain('/brand-only');
	});

	it('leaves routes outside the layout alone', () => {
		expect(result[0]).toBe(routes[0]);
	});
});
