import { useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
	DropdownMenu as ShadcnMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
	children?: DropdownMenuOption[];
	className?: string;
	group?: string;
}

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

	const renderMenuItem = (option: DropdownMenuOption) => (
		<DropdownMenuItem
			className={cn(
				'w-full px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 focus:bg-accent/50 focus:text-accent-foreground',
				option.disabled && 'opacity-50 cursor-not-allowed',
				option.className,
			)}
			disabled={option.disabled}
			key={option.label}
			onSelect={(e) => {
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
						<div className='flex justify-between gap-2 items-center w-full'>
							<div className='flex gap-2 items-center w-full'>
								{option.icon && <span className='text-muted-foreground'>{option.icon}</span>}
								<span className='font-medium'>{option.label}</span>
							</div>
							<span className='text-muted-foreground'>
								<ChevronRight className='h-4 w-4' />
							</span>
						</div>
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

	return (
		<div className={cn('', className)} onClick={handleClick} data-interactive='true'>
			<ShadcnMenu dir={dir} onOpenChange={handleOpenChange} open={isMenuOpen}>
				<DropdownMenuTrigger className='w-full focus:outline-none rounded-md'>
					{trigger || <BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />}
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
