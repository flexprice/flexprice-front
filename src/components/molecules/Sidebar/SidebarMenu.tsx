'use client';

import { FC, useState, useEffect } from 'react';
import { SidebarGroup, SidebarMenu, useSidebar } from '@/components/ui/sidebar';
import SidebarItem from './SidebarItem';
import { useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavItem = {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	disabled?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
	isOpen?: boolean;
	onToggle?: (isOpen: boolean) => void;
};

const SidebarNav: FC<{ items: NavItem[] }> = ({ items }) => {
	const location = useLocation();
	const { state } = useSidebar();
	const isCollapsed = state === 'collapsed';
	const [openItemTitle, setOpenItemTitle] = useState<string | null>(null);

	// Determine which item should be open based on current route
	useEffect(() => {
		// First, check if we're on a standalone item (items without children)
		// If so, close any open accordions
		const standaloneItems = items.filter((item) => !item.items || item.items.length === 0);
		const isOnStandaloneItem = standaloneItems.some((item) => location.pathname.startsWith(item.url) && item.url !== '#');

		if (isOnStandaloneItem) {
			setOpenItemTitle(null);
			return;
		}

		// Then, check items with children (accordion items)
		for (const item of items) {
			if (item.items && item.items.length > 0) {
				const isMainItemActive = location.pathname.startsWith(item.url) && item.url !== '#';
				const isSubItemActive = item.items?.some((subItem) => location.pathname.startsWith(subItem.url));
				const isActive = isMainItemActive || isSubItemActive;

				// Special case: If we're on any product catalog route, open Product Catalog section
				// But exclude standalone items that might share the same prefix
				const isProductCatalogRoute = location.pathname.startsWith('/product-catalog');
				const isProductCatalog = item.title === 'Product Catalog';
				// Only apply special case if we're not on a standalone item
				const shouldOpen = isActive || (isProductCatalogRoute && isProductCatalog && !isOnStandaloneItem);

				if (shouldOpen) {
					setOpenItemTitle(item.title);
					return;
				}
			}
		}
	}, [location.pathname, items]);

	const handleToggle = (itemTitle: string, isOpen: boolean) => {
		// Use requestAnimationFrame for smoother state updates
		requestAnimationFrame(() => {
			if (isOpen) {
				// If opening, set this as the open item (closing others)
				setOpenItemTitle(itemTitle);
			} else {
				// If closing, clear the open item
				setOpenItemTitle(null);
			}
		});
	};

	return (
		<SidebarGroup className='mb-0'>
			<SidebarMenu className={cn('gap-0', isCollapsed && 'gap-4')}>
				{items.map((item) => {
					// Check if current path matches the main item URL or any of its sub-items
					const isMainItemActive = location.pathname.startsWith(item.url) && item.url !== '#';
					const isSubItemActive = item.items?.some((subItem) => location.pathname.startsWith(subItem.url));
					const isActive = isMainItemActive || isSubItemActive;

					item.isActive = isActive;

					const isOpen = openItemTitle === item.title;
					const hasChildren = item.items && item.items.length > 0;

					return (
						<SidebarItem
							key={item.title}
							{...item}
							isOpen={hasChildren ? isOpen : undefined}
							onToggle={hasChildren ? (open) => handleToggle(item.title, open) : undefined}
						/>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
};

export default SidebarNav;
