import { FC, useEffect, useMemo, useState } from 'react';
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
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const VISIBLE_SUB_ITEMS = 2;

interface SidebarItemProps extends NavItem {
	isOpen?: boolean;
	onToggle?: (isOpen: boolean) => void;
}

const SidebarItem: FC<SidebarItemProps> = (item) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation('common');
	const { state } = useSidebar();
	const isOpen = item.isOpen ?? false;
	const isCollapsed = state === 'collapsed';
	const [showAllSubItems, setShowAllSubItems] = useState(false);

	const hasChildren = item.items && item.items.length > 0;
	const Icon = item.icon;

	const isMainItemActive = item.isActive;
	const iconActive = isMainItemActive;

	const subItems = item.items ?? [];
	const hasOverflowSubItems = subItems.length > VISIBLE_SUB_ITEMS;

	useEffect(() => {
		if (!isOpen) {
			setShowAllSubItems(false);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!hasOverflowSubItems) return;
		const activeHiddenItem = subItems.some((subItem, index) => index >= VISIBLE_SUB_ITEMS && location.pathname.startsWith(subItem.url));
		if (activeHiddenItem) {
			setShowAllSubItems(true);
		}
	}, [hasOverflowSubItems, location.pathname, subItems]);

	const visibleSubItems = useMemo(() => {
		if (!hasOverflowSubItems || showAllSubItems) return subItems;
		return subItems.slice(0, VISIBLE_SUB_ITEMS);
	}, [hasOverflowSubItems, showAllSubItems, subItems]);

	const handleOpenChange = (open: boolean) => {
		item.onToggle?.(open);
	};

	const handleMainItemClick = (event: React.MouseEvent) => {
		if (event.metaKey || event.ctrlKey || event.shiftKey) {
			return;
		}

		if (hasChildren) {
			event.preventDefault();
			const willOpen = !isOpen;
			item.onToggle?.(willOpen);

			if (willOpen && item.url && item.url !== '#') {
				navigate(item.url);
			}
		}
	};

	const mainButtonContent = (
		<>
			{Icon && (
				<HugeIcon
					icon={Icon}
					size={20}
					className={cn('!size-5 shrink-0', !isCollapsed && 'me-1', iconActive ? 'text-info' : 'text-content-zinc-secondary')}
				/>
			)}
			<span className={cn('text-[14px] select-none font-normal', isCollapsed && 'hidden')}>{item.title}</span>
		</>
	);

	const menuButtonClassName = cn(
		'flex items-center gap-2 h-10 px-2 py-[10px] rounded-[var(--fp-radius-md)] text-[14px] cursor-pointer font-normal transition-all duration-200 ease-in-out',
		'border',
		isMainItemActive
			? 'border-line-zinc-strong bg-surface font-medium shadow-sm data-[active=true]:bg-surface'
			: 'border-transparent font-thin',
		isCollapsed && 'justify-center',
		item.disabled && 'cursor-not-allowed opacity-50',
	);

	if (!hasChildren) {
		return (
			<SidebarMenuItem className={cn(isCollapsed && 'mb-3')}>
				<SidebarMenuButton
					asChild
					disabled={item.disabled}
					tooltip={item.title}
					isActive={isMainItemActive}
					className={menuButtonClassName}>
					<Link to={item.url || '#'} onClick={(e) => item.disabled && e.preventDefault()}>
						{mainButtonContent}
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<Collapsible key={item.title} open={isOpen && !isCollapsed} onOpenChange={handleOpenChange} className='group/collapsible'>
			<SidebarMenuItem className={cn(isCollapsed && 'mb-3')}>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						asChild
						disabled={item.disabled}
						tooltip={item.title}
						isActive={isMainItemActive}
						className={menuButtonClassName}>
						<Link to={item.url || '#'} onClick={handleMainItemClick}>
							{mainButtonContent}
						</Link>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				{hasChildren && (
					<CollapsibleContent className={cn(isCollapsed && '!hidden')}>
						<SidebarMenuSub className='gap-0 py-2'>
							{visibleSubItems.map((subItem) => {
								const subActive = location.pathname.startsWith(subItem.url);
								const SubIcon = subItem.icon;
								return (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton
											asChild
											isActive={subActive}
											className={cn('w-full font-light text-content-black transition-colors duration-200')}>
											<Link to={subItem.url} className='flex items-center gap-2'>
												{SubIcon && (
													<HugeIcon icon={SubIcon} size={16} className={cn(subActive ? 'text-info' : 'text-content-zinc-tertiary')} />
												)}
												<span>{subItem.title}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								);
							})}
							{hasOverflowSubItems && !showAllSubItems && (
								<SidebarMenuSubItem>
									<button
										type='button'
										onClick={() => setShowAllSubItems(true)}
										className='flex h-8 w-full items-center gap-1 rounded-[var(--fp-radius-md)] px-3 text-[13px] font-normal text-content-muted transition-colors hover:bg-surface-muted hover:text-content-zinc-secondary'>
										<span>{t('sidebar.nav.more')}</span>
										<HugeIcon icon={ArrowRight01Icon} size={14} className='!size-3.5 shrink-0' />
									</button>
								</SidebarMenuSubItem>
							)}
						</SidebarMenuSub>
					</CollapsibleContent>
				)}
			</SidebarMenuItem>
		</Collapsible>
	);
};

export default SidebarItem;
