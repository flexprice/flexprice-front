import { FC, useEffect, useRef } from 'react';
import { NavItem } from './SidebarMenu';
import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	useSidebar,
} from '@/components/ui';
// import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

interface SidebarItemProps extends NavItem {
	isOpen?: boolean;
	onToggle?: (isOpen: boolean) => void;
}

const SidebarItem: FC<SidebarItemProps> = (item) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { state } = useSidebar();
	const isOpen = item.isOpen ?? false;
	const isCollapsed = state === 'collapsed';

	const hasChildren = item.items && item.items.length > 0;
	const Icon = item.icon;

	const isMainItemActive = item.isActive;
	const iconActive = isMainItemActive;

	const handleOpenChange = (open: boolean) => {
		item.onToggle?.(open);
	};

	// Delayed so the accordion's own opening animation isn't interrupted by an
	// immediate route change. Tracked in a ref (not fire-and-forget) so a child
	// link clicked before it fires - the expected next step once the section is
	// open - can cancel it; otherwise the stale default-page navigation lands
	// a beat after the child's own, silently overriding wherever the user (or a
	// fast automated click) actually asked to go.
	const pendingNavigateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (pendingNavigateRef.current) clearTimeout(pendingNavigateRef.current);
		},
		[],
	);

	const cancelPendingNavigate = () => {
		if (pendingNavigateRef.current) {
			clearTimeout(pendingNavigateRef.current);
			pendingNavigateRef.current = null;
		}
	};

	// Handle click for items with children - toggle accordion on regular click
	// but allow modifier keys (Cmd/Ctrl) to work naturally with Link
	const handleMainItemClick = (event: React.MouseEvent) => {
		// If modifier keys are pressed (Cmd/Ctrl/Cmd+Shift), let the browser handle it
		// This allows opening in new tab, new window, etc.
		// The browser will also handle middle-click and right-click naturally with Link
		if (event.metaKey || event.ctrlKey || event.shiftKey) {
			return; // Let Link handle it naturally - browser will show context menu, open in new tab, etc.
		}

		// For regular clicks on items with children, toggle accordion
		if (hasChildren) {
			event.preventDefault(); // Prevent navigation
			const willOpen = !isOpen;
			item.onToggle?.(willOpen);
			cancelPendingNavigate();

			// If opening and URL is not '#', navigate to it after a small delay
			if (willOpen && item.url && item.url !== '#') {
				pendingNavigateRef.current = setTimeout(() => {
					pendingNavigateRef.current = null;
					navigate(item.url);
				}, 100);
			}
		}
		// For items without children, let Link handle navigation naturally
	};

	const mainButtonContent = (
		<>
			{Icon && (
				<Icon
					absoluteStrokeWidth
					className={cn('!size-5 !stroke-[1.5px] me-1', iconActive ? 'text-info' : 'text-content-zinc-secondary')}
				/>
			)}
			<span className='text-[14px] select-none font-normal'>{item.title}</span>
		</>
	);

	// For items without children, use Link directly
	if (!hasChildren) {
		return (
			<SidebarMenuItem className={cn(isCollapsed && 'mb-3')}>
				<SidebarMenuButton
					asChild
					disabled={item.disabled}
					tooltip={item.title}
					isActive={isMainItemActive}
					className={cn(
						'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[6px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
						isMainItemActive ? 'bg-surface-selected border border-line-zinc-strong shadow-sm font-medium' : 'font-thin',
						item.disabled && 'cursor-not-allowed opacity-50',
					)}>
					<Link to={item.url || '#'} onClick={(e) => item.disabled && e.preventDefault()}>
						{mainButtonContent}
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	// For items with children, use Collapsible with Link
	return (
		<Collapsible key={item.title} open={isOpen && !isCollapsed} onOpenChange={handleOpenChange} className='group/collapsible'>
			<SidebarMenuItem className={cn(isCollapsed && 'mb-3')}>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						asChild
						disabled={item.disabled}
						tooltip={item.title}
						isActive={isMainItemActive}
						className={cn(
							'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[6px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
							isMainItemActive ? 'bg-surface-selected border border-line-zinc-strong shadow-sm font-medium' : 'font-thin',
							item.disabled && 'cursor-not-allowed opacity-50',
						)}>
						<Link to={item.url || '#'} onClick={handleMainItemClick}>
							{mainButtonContent}
						</Link>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				{hasChildren && (
					<CollapsibleContent
						className={cn(
							'overflow-hidden transition-all duration-300 ease-in-out',
							!isCollapsed && 'my-3',
							isCollapsed && '!hidden !my-0',
						)}>
						<SidebarMenuSub className='gap-0 transition-opacity duration-200'>
							{item.items?.map((subItem) => {
								const subActive = location.pathname.startsWith(subItem.url);
								const SubIcon = subItem.icon;
								return (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton
											asChild
											isActive={subActive}
											className={cn('w-full font-light text-content-black transition-colors duration-200')}>
											<Link to={subItem.url} className='flex items-center gap-2' onClick={cancelPendingNavigate}>
												{SubIcon && (
													<SubIcon
														absoluteStrokeWidth
														className={cn('!size-4 !stroke-[1.5px]', subActive ? 'text-info' : 'text-content-zinc-tertiary')}
													/>
												)}
												<span>{subItem.title}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								);
							})}
						</SidebarMenuSub>
					</CollapsibleContent>
				)}
			</SidebarMenuItem>
		</Collapsible>
	);
};

export default SidebarItem;
