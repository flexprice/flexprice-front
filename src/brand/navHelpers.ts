// src/brand/navHelpers.ts — pure helpers for `extensions.nav`. No app imports: a pack's nav
// transform loads while the router is still being built.
import type { AppNavItem } from '@/core/navigation/useAppNav';

/** Finds an entry by id anywhere in the tree. */
export function findNavItem(nav: AppNavItem[], id: string): AppNavItem | undefined {
	for (const item of nav) {
		if (item.id === id) return item;
		const child = item.children && findNavItem(item.children, id);
		if (child) return child;
	}
	return undefined;
}

/** The tree without the given ids (at any depth). */
export function removeNavItems(nav: AppNavItem[], ids: string[]): AppNavItem[] {
	const drop = new Set(ids);
	return nav
		.filter((item) => !drop.has(item.id))
		.map((item) => (item.children ? { ...item, children: removeNavItems(item.children, ids) } : item));
}

/** Every id in the tree, parents and children. */
export function navIds(nav: AppNavItem[]): string[] {
	return nav.flatMap((item) => [item.id, ...(item.children ? navIds(item.children) : [])]);
}
