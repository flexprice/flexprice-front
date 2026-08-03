import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const FILTER_OPTION_CLASS =
	'w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-surface-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-zinc';

export interface OptionFilterGroup<T extends string = string> {
	id: string;
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: ReadonlyArray<{ value: T; label: string }>;
}

export interface OptionFilterPopoverProps {
	ariaLabel: string;
	groups: ReadonlyArray<OptionFilterGroup>;
	activeFilterCount?: number;
	align?: 'start' | 'center' | 'end';
	contentClassName?: string;
}

const OptionFilterPopover = ({ ariaLabel, groups, activeFilterCount = 0, align = 'end', contentClassName }: OptionFilterPopoverProps) => {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant='outline' size='icon' aria-label={ariaLabel} className='relative h-9 w-9'>
					<SlidersHorizontal className='h-4 w-4' />
					{activeFilterCount > 0 ? (
						<span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-inverse-zinc px-1 text-[10px] font-medium text-content-inverse'>
							{activeFilterCount}
						</span>
					) : null}
				</Button>
			</PopoverTrigger>
			<PopoverContent align={align} className={cn('w-56 p-3', contentClassName)}>
				<div className='space-y-4'>
					{groups.map((group) => (
						<div key={group.id}>
							<p className='mb-2 text-xs font-medium uppercase tracking-wide text-content-zinc-muted'>{group.label}</p>
							<div className='space-y-1'>
								{group.options.map((option) => (
									<button
										key={option.value}
										type='button'
										aria-pressed={group.value === option.value}
										className={cn(
											FILTER_OPTION_CLASS,
											group.value === option.value && 'bg-surface-muted font-medium text-content-zinc-bold',
										)}
										onClick={() => group.onChange(option.value)}>
										{option.label}
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default OptionFilterPopover;
