import { useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import {
	DropdownMenu as ShadcnMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TFunction } from 'i18next';
import { copyToClipboard } from '@/utils/common/helper_functions';
import { Tooltip } from '@/components/atoms';

interface DropdownMenuProps {
	options: DropdownMenuOption[];
	trigger?: React.ReactNode;
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	dir?: 'ltr' | 'rtl';
	className?: string;
	align?: 'start' | 'end';
}

export interface DropdownMenuOption {
	label: string;
	icon?: React.ReactNode;
	onSelect?: (e: Event) => void;
	disabled?: boolean;
	/** Tooltip shown on hover/focus when `disabled` is true — e.g. explaining a missing RBAC permission. */
	disabledReason?: string;
	children?: DropdownMenuOption[];
	className?: string;
	group?: string;
}

/**
 * Builds a "Copy ID" DropdownMenuOption backed by the shared copyToClipboard util.
 * Pass `entityType` (e.g. "Plan") once labels are ready to move off the generic "Copy ID" text.
 */
export const getCopyIdOption = (id: string, t: TFunction, opts?: { entityType?: string; label?: string }): DropdownMenuOption => ({
	label: opts?.label ?? t('copyId.genericLabel'),
	icon: <Copy className='w-4 h-4' />,
	onSelect: (e: Event) => {
		e.preventDefault();
		void copyToClipboard(id, opts?.entityType ? t('copyId.toastWithType', { type: opts.entityType }) : t('copyId.toastFallback'));
	},
});

const DropdownMenu: React.FC<DropdownMenuProps> = ({ options, trigger, isOpen, onOpenChange, dir = 'ltr', className, align = 'end' }) => {
	// Internal state for uncontrolled mode
	const [internalOpen, setInternalOpen] = useState(false);

	// Determine if component is controlled or uncontrolled
	const isControlled = isOpen !== undefined;
	const isMenuOpen = isControlled ? isOpen : internalOpen;

	// Combined handler for both controlled and uncontrolled modes
	const handleOpenChange = (open: boolean) => {
		if (isControlled) {
			onOpenChange?.(open);
		} else {
			setInternalOpen(open);
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	// Group options by their group property
	const groupedOptions = options.reduce(
		(acc, option) => {
			const group = option.group || 'default';
			if (!acc[group]) {
				acc[group] = [];
			}
			acc[group].push(option);
			return acc;
		},
		{} as Record<string, DropdownMenuOption[]>,
	);

	const renderMenuItem = (option: DropdownMenuOption) => {
		const item = (
			<DropdownMenuItem
				className={cn(
					'w-full px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 focus:bg-accent/50 focus:text-accent-foreground',
					option.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent focus:bg-transparent',
					option.className,
				)}
				aria-disabled={option.disabled}
				key={option.label}
				onSelect={(e) => {
					if (option.disabled) {
						e.preventDefault();
						return;
					}
					if (option.onSelect && !option.children?.length) {
						e.preventDefault();
						e.stopPropagation();
						option.onSelect(e);
						// Always close the menu after onSelect is called
						handleOpenChange(false);
					}
				}}>
				{option.children && option.children.length > 0 ? (
					<DropdownMenu
						className={cn('w-full', className)}
						trigger={
							<button
								type='button'
								className='flex justify-between gap-2 items-center w-full bg-transparent p-0 text-left cursor-pointer'>
								<div className='flex gap-2 items-center w-full'>
									{option.icon && <span className='text-muted-foreground'>{option.icon}</span>}
									<span className='font-medium'>{option.label}</span>
								</div>
								<span className='text-muted-foreground'>
									<ChevronRight className='h-4 w-4' />
								</span>
							</button>
						}
						options={option.children || []}
					/>
				) : (
					<div className={cn('flex gap-2 items-center w-full', option.className)}>
						{option.icon && <span className='text-muted-foreground'>{option.icon}</span>}
						<span className='font-medium'>{option.label}</span>
					</div>
				)}
			</DropdownMenuItem>
		);

		if (!option.disabled || !option.disabledReason) return item;

		// Tooltip wraps the item directly (asChild merges its trigger props into it) rather than
		// adding a wrapping <span> — the item keeps `disabled` off Radix's own prop so it stays in
		// the menu's roving-focus/collection structure and remains reachable by arrow-key nav,
		// with the select itself blocked in onSelect above instead of via Radix's disabled state.
		return (
			<Tooltip key={option.label} content={option.disabledReason}>
				{item}
			</Tooltip>
		);
	};

	return (
		<div className={cn('', className)} onClick={handleClick} data-interactive='true'>
			<ShadcnMenu dir={dir} onOpenChange={handleOpenChange} open={isMenuOpen}>
				<DropdownMenuTrigger asChild={!!trigger} className={trigger ? undefined : 'w-full focus:outline-none rounded-md'}>
					{trigger || <BsThreeDots className='text-base text-muted-foreground hover:text-foreground transition-colors' />}
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className={cn(
						'min-w-[8rem] p-1 rounded-md border shadow-xl',
						'bg-popover text-popover-foreground',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
						'data-[side=bottom]:slide-in-from-top-2',
						'data-[side=left]:slide-in-from-right-2',
						'data-[side=right]:slide-in-from-left-2',
						'data-[side=top]:slide-in-from-bottom-2',
					)}
					align={align}>
					{Object.entries(groupedOptions).map(([group, groupOptions], groupIndex) => (
						<DropdownMenuGroup key={group} className='px-1'>
							{group !== 'default' && (
								<>
									<DropdownMenuLabel className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>{group}</DropdownMenuLabel>
									{groupIndex > 0 && <DropdownMenuSeparator className='my-1' />}
								</>
							)}
							{groupOptions.map((option) => renderMenuItem(option))}
						</DropdownMenuGroup>
					))}
				</DropdownMenuContent>
			</ShadcnMenu>
		</div>
	);
};

export default DropdownMenu;
