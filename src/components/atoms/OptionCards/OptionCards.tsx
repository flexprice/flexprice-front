import { FC } from 'react';
import { cn } from '@/lib/utils';
import { InfoIcon } from '../InfoIcon';

export interface OptionCard<T extends string> {
	label: string;
	value: T;
	description?: string;
	/** Short text at the end of the label's line, for one attribute of the option (its type, say). */
	suffix?: string;
	disabled?: boolean;
}

interface Props<T extends string> {
	label?: string;
	/** Help text for the whole group, shown in the label's info tooltip. */
	info?: string;
	infoAriaLabel?: string;
	options: OptionCard<T>[];
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	size?: 'default' | 'compact';
	/** `vertical` stacks the cards into a list, for more options than fit side by side. */
	orientation?: 'horizontal' | 'vertical';
	className?: string;
}

/**
 * A row of selectable cards — the pattern CommitmentTypeSelect established for
 * "pick one of these, each needs a sentence of explanation". Generic so a second
 * such question does not fork the styling.
 */
function OptionCards<T extends string>({
	label,
	info,
	infoAriaLabel,
	options,
	value,
	onChange,
	disabled,
	size = 'default',
	orientation = 'horizontal',
	className,
}: Props<T>) {
	const isCompact = size === 'compact';
	const isVertical = orientation === 'vertical';

	return (
		<div className={cn('space-y-1.5', className)}>
			{label && (
				<div className='flex items-center gap-1.5'>
					<label className={cn('font-medium text-content-tertiary', isCompact ? 'text-xs' : 'text-sm text-content-secondary')}>
						{label}
					</label>
					{info && <InfoIcon description={info} ariaLabel={infoAriaLabel ?? label} disabled={disabled} />}
				</div>
			)}
			<div role='radiogroup' aria-label={label} className={cn('flex gap-2', isVertical && 'flex-col')}>
				{options.map((option) => {
					const isDisabled = disabled || option.disabled;
					const isSelected = value === option.value;
					return (
						<button
							key={option.value}
							type='button'
							role='radio'
							onClick={() => !isDisabled && onChange(option.value)}
							disabled={isDisabled}
							aria-checked={isSelected}
							className={cn(
								'flex items-start gap-2.5 rounded-lg border-2 text-start transition-all disabled:cursor-not-allowed disabled:opacity-50',
								// Side by side the cards share the row equally. Stacked, each is as tall as its own content.
								!isVertical && 'flex-1',
								isCompact ? 'px-3 py-2' : 'px-4 py-3',
								isSelected
									? 'border-brand-fill bg-brand-fill/[0.06] text-brand-fill'
									: 'border-line bg-surface text-content-secondary hover:border-line-strong hover:bg-surface-subtle',
								!isCompact && isSelected && 'font-medium',
							)}>
							{/* Near-black border alone read as a focused text input; the dot is what
							    says "one of these", and the brand fill says which one. */}
							<span
								aria-hidden
								className={cn(
									'mt-0.5 flex shrink-0 items-center justify-center rounded-full border transition-colors',
									isCompact ? 'size-3.5' : 'size-4',
									isSelected ? 'border-brand-fill' : 'border-line-strong',
								)}>
								{isSelected && <span className={cn('rounded-full bg-brand-fill', isCompact ? 'size-1.5' : 'size-2')} />}
							</span>
							{/* Baseline, here and on the suffix, so the suffix sits on the label's first line. */}
							<span className='min-w-0 flex-1 self-baseline'>
								<span className={cn('block font-medium', isCompact ? 'text-xs' : 'text-sm')}>{option.label}</span>
								{option.description && (
									<span className={cn('block text-content-muted', isCompact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs')}>
										{option.description}
									</span>
								)}
							</span>
							{option.suffix && (
								<span className={cn('shrink-0 self-baseline font-normal text-content-muted', isCompact ? 'text-[11px]' : 'text-xs')}>
									{option.suffix}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export default OptionCards as <T extends string>(props: Props<T>) => ReturnType<FC>;
