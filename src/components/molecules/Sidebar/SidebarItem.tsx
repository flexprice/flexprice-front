import { FC } from 'react';
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
} from '@/components/ui';
// import { ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarItemProps extends NavItem {
	isOpen?: boolean;
	onToggle?: (isOpen: boolean) => void;
}

const SidebarItem: FC<SidebarItemProps> = (item) => {
	const location = useLocation();
	const navigate = useNavigate();
	const isOpen = item.isOpen ?? false;

	const hasChildren = item.items && item.items.length > 0;
	const Icon = item.icon;

	const isMainItemActive = item.isActive;
	const iconActive = isMainItemActive;

	const handleOpenChange = (open: boolean) => {
		item.onToggle?.(open);
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

			// If opening and URL is not '#', navigate to it after a small delay
			if (willOpen && item.url && item.url !== '#') {
				setTimeout(() => {
					navigate(item.url);
				}, 100);
			}
		}
		// For items without children, let Link handle navigation naturally
	};

	const mainButtonContent = (
		<>
			{Icon && (
				<Icon absoluteStrokeWidth className={cn('!size-5 !stroke-[1.5px] mr-1', iconActive ? 'text-[#3C87D2]' : 'text-[#3F3F46]')} />
			)}
			<span className='text-[14px] select-none font-normal'>{item.title}</span>
		</>
	);

	// For items without children, use Link directly
	if (!hasChildren) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					disabled={item.disabled}
					tooltip={item.title}
					isActive={isMainItemActive}
					className={cn(
						'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[10px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
						isMainItemActive ? 'bg-white shadow-sm font-medium' : 'font-thin',
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
		<Collapsible key={item.title} open={isOpen} onOpenChange={handleOpenChange} className='group/collapsible'>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						asChild
						disabled={item.disabled}
						tooltip={item.title}
						isActive={isMainItemActive}
						className={cn(
							'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[10px] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
							isMainItemActive ? 'bg-white shadow-sm font-medium' : 'font-thin',
							item.disabled && 'cursor-not-allowed opacity-50',
						)}>
						<Link to={item.url || '#'} onClick={handleMainItemClick}>
							{mainButtonContent}
						</Link>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent className='my-3 overflow-hidden transition-all duration-300 ease-in-out'>
					<SidebarMenuSub className='gap-0 transition-opacity duration-200'>
						{item.items?.map((subItem) => {
							const subActive = location.pathname.startsWith(subItem.url);
							return (
								<SidebarMenuSubItem key={subItem.title}>
									<SidebarMenuSubButton
										asChild
										isActive={subActive}
										className={cn('w-full font-light text-black transition-colors duration-200')}>
										<Link to={subItem.url}>{subItem.title}</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							);
						})}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	);
};

export default SidebarItem;
