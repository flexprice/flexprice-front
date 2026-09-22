import { cn } from '@/lib/utils';

export interface SegmentedControlOption<T extends string> {
	label: string;
	value: T;
}

export interface SegmentedControlProps<T extends string> {
	options: SegmentedControlOption<T>[];
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	className?: string;
	'aria-label'?: string;
}

/**
 * A compact, always-visible exclusive choice between a small number of options — for a
 * persistent mode setting, not a value picked from a menu (use Select for that instead).
 * Renders as one bordered container with adjacent segments, not independent pill buttons.
 */
const SegmentedControl = <T extends string>({ options, value, onChange, disabled, className, ...rest }: SegmentedControlProps<T>) => {
	return (
		<div
			role='group'
			aria-label={rest['aria-label']}
			className={cn('inline-flex items-center gap-0.5 rounded-[7px] border border-input bg-background p-0.5', className)}>
			{options.map((option) => {
				const isActive = option.value === value;
				return (
					<button
						key={option.value}
						type='button'
						aria-pressed={isActive}
						disabled={disabled}
						onClick={() => {
							if (!disabled && !isActive) onChange(option.value);
						}}
						className={cn(
							'h-7 rounded-[5px] px-3 text-sm font-normal text-content-secondary transition-colors',
							'disabled:cursor-not-allowed disabled:opacity-50',
							isActive && 'bg-surface-selected font-medium text-content',
							!disabled && !isActive && 'hover:text-content',
						)}>
						{option.label}
					</button>
				);
			})}
		</div>
	);
};

export default SegmentedControl;
