import { describe, it, expect } from 'vitest';
import { findNavItem, removeNavItems, navIds } from './navHelpers';
import { findActiveNav, type AppNavItem } from '@/core/navigation/useAppNav';

const nav: AppNavItem[] = [
	{ id: 'home', title: 'Home', url: '/home' },
	{
		id: 'catalog',
		title: 'Catalog',
		url: '/product-catalog',
		children: [
			{ id: 'catalog.plans', title: 'Plans', url: '/product-catalog/plan' },
			{ id: 'catalog.pricing', title: 'Pricing', url: '/product-catalog/plan/pricing' },
		],
	},
];

describe('nav helpers', () => {
	it('finds nested entries', () => {
		expect(findNavItem(nav, 'catalog.plans')?.url).toBe('/product-catalog/plan');
	});

	it('removes entries at any depth', () => {
		expect(navIds(removeNavItems(nav, ['catalog.plans']))).toEqual(['home', 'catalog', 'catalog.pricing']);
	});
});

describe('findActiveNav', () => {
	it('prefers the longest matching url', () => {
		expect(findActiveNav(nav, '/product-catalog/plan/pricing/x').child?.id).toBe('catalog.pricing');
		expect(findActiveNav(nav, '/product-catalog/plan/123').child?.id).toBe('catalog.plans');
	});

	it('lights the section on its own url', () => {
		const active = findActiveNav(nav, '/product-catalog');
		expect(active.section?.id).toBe('catalog');
		expect(active.child).toBeUndefined();
	});

	it('does not match a url that only shares a prefix', () => {
		expect(findActiveNav(nav, '/homework').section).toBeUndefined();
	});
});
